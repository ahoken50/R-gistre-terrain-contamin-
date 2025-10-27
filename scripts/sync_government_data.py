#!/usr/bin/env python3
"""
Script de synchronisation automatique des données gouvernementales
Télécharge le fichier GPKG depuis données Québec, filtre pour Val-d'Or,
détecte les changements et met à jour Firebase.
"""

import os
import sys
import json
import requests
import geopandas as gpd
import pandas as pd
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore
import tempfile
import logging
import zipfile

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# URL du fichier GPKG
GPKG_URL = "https://www.donneesquebec.ca/recherche/dataset/repertoire-des-terrains-contamines-gtc/resource/09afbfb6-eeac-44fb-86ef-d8b6ce4b739a/download/gtc.gpkg"

# Nom de la municipalité à filtrer
MUNICIPALITY = "Val-d'Or"

# Collections Firebase
GOVERNMENT_DATA_COLLECTION = 'government_data'
SYNC_METADATA_COLLECTION = 'sync_metadata'


def initialize_firebase():
    """Initialiser Firebase Admin SDK"""
    try:
        cred_json = os.environ.get('FIREBASE_CREDENTIALS') or os.environ.get('FIREBASE_SERVICE_ACCOUNT')
        if not cred_json:
            raise ValueError("FIREBASE_SERVICE_ACCOUNT environment variable not set.")
        
        cred_dict = json.loads(cred_json)
        cred = credentials.Certificate(cred_dict)
        
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        
        logger.info("✅ Firebase initialisé avec succès")
        return db
    except Exception as e:
        logger.error(f"❌ Erreur initialisation Firebase: {e}")
        raise


def download_and_extract_gpkg(url):
    """Télécharger et extraire le fichier GPKG depuis le ZIP"""
    try:
        logger.info(f"📥 Téléchargement du fichier ZIP depuis {url}")
        
        response = requests.get(url, stream=True, timeout=300)
        response.raise_for_status()
        
        temp_zip = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
        
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        
        with open(temp_zip.name, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0 and downloaded % (1024 * 1024) == 0:
                        progress = (downloaded / total_size) * 100
                        logger.info(f"Téléchargement: {progress:.1f}%")
        
        logger.info(f"✅ Fichier ZIP téléchargé: {temp_zip.name}")
        logger.info("📦 Extraction du fichier ZIP...")
        
        temp_dir = tempfile.mkdtemp()
        
        with zipfile.ZipFile(temp_zip.name, 'r') as zip_ref:
            zip_ref.extractall(temp_dir)
        
        gpkg_file = None
        for root, dirs, files in os.walk(temp_dir):
            for file in files:
                if file.endswith('.gpkg'):
                    gpkg_file = os.path.join(root, file)
                    break
            if gpkg_file:
                break
        
        if not gpkg_file:
            raise FileNotFoundError("Aucun fichier .gpkg trouvé dans l'archive ZIP")
        
        logger.info(f"✅ Fichier GPKG extrait: {gpkg_file}")
        os.remove(temp_zip.name)
        
        return gpkg_file, temp_dir
    except Exception as e:
        logger.error(f"❌ Erreur téléchargement/extraction: {e}")
        raise


def normalize_text(text):
    """Normaliser le texte pour la comparaison"""
    if pd.isna(text) or text is None:
        return ""
    return str(text).upper().strip()


def belongs_to_valdor(row):
    """Vérifier si un terrain appartient à Val-d'Or"""
    address = normalize_text(row.get("ADR_CIV_LIEU", ""))
    mrc = normalize_text(row.get("LST_MRC_REG_ADM", ""))
    
    if any(keyword in address for keyword in ["VAL-D'OR", "VAL D'OR", "VALDOR"]):
        return True
    
    if "LA VALLÉE-DE-L'OR" in mrc and "VAL" in address:
        return True
    
    return False


def filter_valdor_data(gpkg_path):
    """Filtrer et agréger les données pour Val-d'Or"""
    
    def safe_int(value, default=None):
        """Convertir en int de manière sécurisée"""
        if value is None:
            return default
        try:
            # Vérifier si c'est pd.NA
            if hasattr(pd, 'NA') and value is pd.NA:
                return default
            # Vérifier avec pd.isna de manière sécurisée
            if not isinstance(value, (list, dict)) and pd.isna(value):
                return default
        except:
            pass
        
        try:
            return int(value)
        except (ValueError, TypeError):
            return str(value) if value else default
    
    def safe_float(value, default=0.0):
        """Convertir en float de manière sécurisée"""
        if value is None:
            return default
        try:
            if hasattr(pd, 'NA') and value is pd.NA:
                return default
            if not isinstance(value, (list, dict)) and pd.isna(value):
                return default
        except:
            pass
        
        try:
            return float(value)
        except (ValueError, TypeError):
            return default
    
    def extract_scalar(val):
        """Extraire une valeur scalaire depuis n'importe quel type"""
        if val is None:
            return None
        if isinstance(val, (str, int, float, bool)):
            return val
        if hasattr(val, 'item'):
            return val.item()
        if hasattr(val, '__iter__') and not isinstance(val, (str, dict)):
            try:
                val_list = list(val)
                if len(val_list) == 1:
                    return extract_scalar(val_list[0])
                elif len(val_list) > 1:
                    return str(val)
            except:
                pass
        return str(val) if val else None
    
    def get_clean_value(row_obj, key, default=''):
        """Obtenir une valeur nettoyée depuis la row"""
        val = row_obj.get(key)
        val = extract_scalar(val)
        if val is None:
            return default
        try:
            if hasattr(pd, 'NA') and val is pd.NA:
                return default
            if not isinstance(val, (list, dict)) and pd.isna(val):
                return default
        except:
            pass
        return val
    
    try:
        logger.info(f"🔍 Lecture du fichier GPKG: {gpkg_path}")
        
        import fiona
        layers = fiona.listlayers(gpkg_path)
        logger.info(f"📋 Couches disponibles: {layers}")
        
        if 'point' not in layers:
            raise ValueError("Couche 'point' non trouvée dans le GPKG")
        
        logger.info("📖 Lecture de la couche 'point'...")
        points_df = gpd.read_file(gpkg_path, layer='point')
        logger.info(f"📊 Total de points: {len(points_df)}")
        
        valdor_points = points_df[points_df.apply(belongs_to_valdor, axis=1)].copy()
        logger.info(f"✅ Points pour Val-d'Or: {len(valdor_points)}")
        
        if 'detailsFiches' not in layers:
            logger.warning("⚠️ Couche 'detailsFiches' non trouvée")
            fiches_df = pd.DataFrame()
        else:
            logger.info("📖 Lecture de la couche 'detailsFiches'...")
            fiches_df = gpd.read_file(gpkg_path, layer='detailsFiches')
            logger.info(f"📊 Total de fiches: {len(fiches_df)}")
        
        fiches_dict = {}
        if not fiches_df.empty and 'NO_MEF_LIEU' in fiches_df.columns:
            logger.info("🔗 Agrégation des fiches par terrain...")
            fiches_grouped = fiches_df.groupby('NO_MEF_LIEU').agg({
                'NO_SEQ_DOSSIER': lambda x: ', '.join(str(v) for v in x if pd.notna(v)),
                'ETAT_REHAB': lambda x: ' | '.join(str(v) for v in x if pd.notna(v) and v),
                'QUAL_SOLS_AV': lambda x: ', '.join(str(v) for v in x if pd.notna(v) and v),
                'QUAL_SOLS': lambda x: ', '.join(str(v) for v in x if pd.notna(v) and v),
                'CONTAM_SOL_EXTRA': lambda x: '; '.join(str(v) for v in x if pd.notna(v) and v),
                'CONTAM_EAU_EXTRA': lambda x: '; '.join(str(v) for v in x if pd.notna(v) and v),
                'DATE_CRE_MAJ': lambda x: max([v for v in x if pd.notna(v)], default=None)
            }).reset_index()
            
            for _, row in fiches_grouped.iterrows():
                no_mef_key = extract_scalar(row['NO_MEF_LIEU'])
                if no_mef_key is not None:
                    fiches_dict[str(no_mef_key)] = row.to_dict()
        
        data_list = []
        for idx, row in valdor_points.iterrows():
            no_mef_raw = row.get('NO_MEF_LIEU')
            no_mef = extract_scalar(no_mef_raw)
            no_mef_str = str(no_mef) if no_mef is not None else None
            
            record = {
                'NO_MEF_LIEU': safe_int(no_mef, no_mef),
                'LATITUDE': safe_float(get_clean_value(row, 'LATITUDE'), 0.0),
                'LONGITUDE': safe_float(get_clean_value(row, 'LONGITUDE'), 0.0),
                'ADR_CIV_LIEU': str(get_clean_value(row, 'ADR_CIV_LIEU', '')),
                'CODE_POST_LIEU': str(get_clean_value(row, 'CODE_POST_LIEU', '')),
                'LST_MRC_REG_ADM': str(get_clean_value(row, 'LST_MRC_REG_ADM', '')),
                'DESC_MILIEU_RECEPT': str(get_clean_value(row, 'DESC_MILIEU_RECEPT', '')),
                'NB_FICHES': safe_int(get_clean_value(row, 'NB_FICHES'), 0)
            }
            
            if no_mef_str and no_mef_str in fiches_dict:
                fiche_data = fiches_dict[no_mef_str]
                record['NO_SEQ_DOSSIER'] = str(fiche_data.get('NO_SEQ_DOSSIER', ''))
                record['ETAT_REHAB'] = str(fiche_data.get('ETAT_REHAB', ''))
                record['QUAL_SOLS_AV'] = str(fiche_data.get('QUAL_SOLS_AV', ''))
                record['QUAL_SOLS'] = str(fiche_data.get('QUAL_SOLS', ''))
                record['CONTAM_SOL_EXTRA'] = str(fiche_data.get('CONTAM_SOL_EXTRA', ''))
                record['CONTAM_EAU_EXTRA'] = str(fiche_data.get('CONTAM_EAU_EXTRA', ''))
                
                date_val = fiche_data.get('DATE_CRE_MAJ')
                if date_val:
                    try:
                        if not isinstance(date_val, (list, dict)) and pd.notna(date_val):
                            if hasattr(date_val, 'strftime'):
                                record['DATE_CRE_MAJ'] = date_val.strftime('%Y-%m-%d')
                            else:
                                record['DATE_CRE_MAJ'] = str(date_val)
                        else:
                            record['DATE_CRE_MAJ'] = ''
                    except:
                        record['DATE_CRE_MAJ'] = ''
                else:
                    record['DATE_CRE_MAJ'] = ''
                
                dossiers = record['NO_SEQ_DOSSIER'].split(', ')
                record['FICHES_URLS'] = [
                    f"https://www.environnement.gouv.qc.ca/sol/terrains/terrains-contamines/fiche.asp?no={d.strip()}"
                    for d in dossiers if d and d.strip() and d.strip() != 'nan'
                ]
                
                record['IS_DECONTAMINATED'] = 'Terminée' in record['ETAT_REHAB']
            else:
                record.update({
                    'NO_SEQ_DOSSIER': '',
                    'ETAT_REHAB': '',
                    'QUAL_SOLS_AV': '',
                    'QUAL_SOLS': '',
                    'CONTAM_SOL_EXTRA': '',
                    'CONTAM_EAU_EXTRA': '',
                    'DATE_CRE_MAJ': '',
                    'FICHES_URLS': [],
                    'IS_DECONTAMINATED': False
                })
            
            # Validation finale
            for key, value in list(record.items()):
                if not isinstance(value, (str, int, float, bool, list, dict, type(None))):
                    record[key] = str(value)
            
            data_list.append(record)
        
        logger.info(f"✅ {len(data_list)} enregistrements complets pour Val-d'Or")
        return data_list
        
    except Exception as e:
        logger.error(f"❌ Erreur filtrage données: {e}")
        import traceback
        traceback.print_exc()
        raise


def load_existing_data(db):
    """Charger les données existantes depuis Firebase"""
    try:
        logger.info("📥 Chargement des données existantes depuis Firebase")
        doc_ref = db.collection(GOVERNMENT_DATA_COLLECTION).document('current')
        doc = doc_ref.get()
        
        if doc.exists:
            data = doc.to_dict()
            existing_data = data.get('data', [])
            logger.info(f"✅ {len(existing_data)} enregistrements existants chargés")
            return existing_data
        else:
            logger.info("ℹ️ Aucune donnée existante dans Firebase")
            return []
    except Exception as e:
        logger.error(f"❌ Erreur chargement données existantes: {e}")
        return []


def detect_changes(old_data, new_data):
    """Détecter les changements"""
    try:
        logger.info("🔍 Détection des changements...")
        
        old_map = {str(item.get('NO_MEF_LIEU')): item for item in old_data if item.get('NO_MEF_LIEU')}
        new_map = {str(item.get('NO_MEF_LIEU')): item for item in new_data if item.get('NO_MEF_LIEU')}
        
        new_items = [item for item in new_data if str(item.get('NO_MEF_LIEU')) not in old_map]
        removed_items = [item for item in old_data if str(item.get('NO_MEF_LIEU')) not in new_map]
        
        modified_items = []
        for item in new_data:
            ref = str(item.get('NO_MEF_LIEU'))
            if ref in old_map:
                if json.dumps(old_map[ref], sort_keys=True) != json.dumps(item, sort_keys=True):
                    modified_items.append(item)
        
        changes = {
            'new': new_items,
            'modified': modified_items,
            'removed': removed_items
        }
        
        logger.info(f"📊 Changements détectés:")
        logger.info(f"   - Nouveaux: {len(new_items)}")
        logger.info(f"   - Modifiés: {len(modified_items)}")
        logger.info(f"   - Retirés: {len(removed_items)}")
        
        return changes
    except Exception as e:
        logger.error(f"❌ Erreur détection changements: {e}")
        raise


def update_firebase(db, data, changes):
    """Mettre à jour Firebase"""
    try:
        logger.info("💾 Mise à jour de Firebase...")
        
        doc_ref = db.collection(GOVERNMENT_DATA_COLLECTION).document('current')
        doc_ref.set({
            'data': data,
            'lastUpdate': datetime.now().isoformat(),
            'count': len(data)
        })
        
        logger.info(f"✅ {len(data)} enregistrements sauvegardés dans Firebase")
        
        sync_metadata = {
            'last_sync_date': datetime.now().isoformat(),
            'last_sync_status': 'success',
            'changes': {
                'new': len(changes['new']),
                'modified': len(changes['modified']),
                'removed': len(changes['removed'])
            },
            'total_records': len(data),
            'lastUpdate': datetime.now().isoformat()
        }
        
        metadata_ref = db.collection(SYNC_METADATA_COLLECTION).document('current')
        metadata_ref.set(sync_metadata)
        
        logger.info("✅ Métadonnées de synchronisation sauvegardées")
        return True
    except Exception as e:
        logger.error(f"❌ Erreur mise à jour Firebase: {e}")
        raise


def cleanup_temp_files(file_path, temp_dir=None):
    """Nettoyer les fichiers temporaires"""
    try:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"🧹 Fichier temporaire supprimé: {file_path}")
        
        if temp_dir and os.path.exists(temp_dir):
            import shutil
            shutil.rmtree(temp_dir)
            logger.info(f"🧹 Répertoire temporaire supprimé: {temp_dir}")
    except Exception as e:
        logger.warning(f"⚠️ Erreur suppression fichiers temporaires: {e}")


def main():
    """Fonction principale"""
    gpkg_file = None
    temp_dir = None
    
    try:
        logger.info("🚀 Démarrage de la synchronisation automatique")
        logger.info(f"📅 Date: {datetime.now().isoformat()}")
        
        db = initialize_firebase()
        gpkg_file, temp_dir = download_and_extract_gpkg(GPKG_URL)
        new_data = filter_valdor_data(gpkg_file)
        old_data = load_existing_data(db)
        changes = detect_changes(old_data, new_data)
        update_firebase(db, new_data, changes)
        
        logger.info("✅ Synchronisation terminée avec succès!")
        logger.info("\n📊 RÉSUMÉ:")
        logger.info(f"   Total: {len(new_data)}")
        logger.info(f"   Nouveaux: {len(changes['new'])}")
        logger.info(f"   Modifiés: {len(changes['modified'])}")
        logger.info(f"   Retirés: {len(changes['removed'])}")
        
        return 0
        
    except Exception as e:
        logger.error(f"❌ Erreur lors de la synchronisation: {e}")
        
        try:
            if 'db' in locals():
                metadata_ref = db.collection(SYNC_METADATA_COLLECTION).document('current')
                metadata_ref.set({
                    'last_sync_date': datetime.now().isoformat(),
                    'last_sync_status': 'error',
                    'error_message': str(e),
                    'lastUpdate': datetime.now().isoformat()
                }, merge=True)
        except:
            pass
        
        return 1
        
    finally:
        cleanup_temp_files(gpkg_file, temp_dir)


if __name__ == '__main__':
    sys.exit(main())
