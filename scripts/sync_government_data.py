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
        # Charger les credentials depuis la variable d'environnement
        cred_json = os.environ.get('FIREBASE_CREDENTIALS') or os.environ.get('FIREBASE_SERVICE_ACCOUNT')
        if not cred_json:
            raise ValueError("FIREBASE_SERVICE_ACCOUNT environment variable not set. Please configure the GitHub secret.")
        
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
        
        # Créer un fichier temporaire pour le ZIP
        temp_zip = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
        
        # Télécharger avec barre de progression
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        
        with open(temp_zip.name, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        progress = (downloaded / total_size) * 100
                        if downloaded % (1024 * 1024) == 0:  # Log every MB
                            logger.info(f"Téléchargement: {progress:.1f}%")
        
        logger.info(f"✅ Fichier ZIP téléchargé: {temp_zip.name}")
        
        # Extraire le ZIP
        logger.info("📦 Extraction du fichier ZIP...")
        temp_dir = tempfile.mkdtemp()
        
        with zipfile.ZipFile(temp_zip.name, 'r') as zip_ref:
            zip_ref.extractall(temp_dir)
        
        # Trouver le fichier GPKG dans le répertoire extrait
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
        
        # Nettoyer le fichier ZIP
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
    
    # Critère 1: L'adresse contient Val-d'Or
    if any(keyword in address for keyword in ["VAL-D'OR", "VAL D'OR", "VALDOR"]):
        return True
    
    # Critère 2: MRC La Vallée-de-l'Or ET "VAL" dans l'adresse
    if "LA VALLÉE-DE-L'OR" in mrc and "VAL" in address:
        return True
    
    return False

def filter_valdor_data(gpkg_path):
    """Filtrer et agréger les données pour Val-d'Or"""
    try:
        logger.info(f"🔍 Lecture du fichier GPKG: {gpkg_path}")
        
        # Lister les couches disponibles
        import fiona
        layers = fiona.listlayers(gpkg_path)
        logger.info(f"📋 Couches disponibles: {layers}")
        
        # 1. Lire la couche 'point' pour les localisations
        if 'point' not in layers:
            raise ValueError("Couche 'point' non trouvée dans le GPKG")
        
        logger.info("📖 Lecture de la couche 'point'...")
        points_df = gpd.read_file(gpkg_path, layer='point')
        logger.info(f"📊 Total de points: {len(points_df)}")
        
        # Filtrer pour Val-d'Or
        valdor_points = points_df[points_df.apply(belongs_to_valdor, axis=1)]
        logger.info(f"✅ Points pour Val-d'Or: {len(valdor_points)}")
        
        # 2. Lire la couche 'detailsFiches' pour les détails
        if 'detailsFiches' not in layers:
            logger.warning("⚠️ Couche 'detailsFiches' non trouvée, utilisation des données de base uniquement")
            fiches_df = pd.DataFrame()
        else:
            logger.info("📖 Lecture de la couche 'detailsFiches'...")
            fiches_df = gpd.read_file(gpkg_path, layer='detailsFiches')
            logger.info(f"📊 Total de fiches: {len(fiches_df)}")
        
        # 3. Agréger les fiches par NO_MEF_LIEU
        if not fiches_df.empty and 'NO_MEF_LIEU' in fiches_df.columns:
            logger.info("🔗 Agrégation des fiches par terrain...")
            fiches_grouped = fiches_df.groupby('NO_MEF_LIEU').agg({
                'NO_SEQ_DOSSIER': lambda x: ', '.join(map(str, x)),
                'ETAT_REHAB': lambda x: ' | '.join(filter(None, map(str, x))),
                'QUAL_SOLS_AV': lambda x: ', '.join(filter(None, map(str, x))),
                'QUAL_SOLS': lambda x: ', '.join(filter(None, map(str, x))),
                'CONTAM_SOL_EXTRA': lambda x: '; '.join(filter(None, map(str, x))),
                'CONTAM_EAU_EXTRA': lambda x: '; '.join(filter(None, map(str, x))),
                'DATE_CRE_MAJ': lambda x: max(x) if len(x) > 0 else None
            }).reset_index()
        else:
            fiches_grouped = pd.DataFrame()
        
        # 4. Fusionner les données
        data_list = []
        for idx, row in valdor_points.iterrows():
            no_mef = row.get('NO_MEF_LIEU')
            
            record = {
                'NO_MEF_LIEU': no_mef,
                'LATITUDE': row.get('LATITUDE'),
                'LONGITUDE': row.get('LONGITUDE'),
                'ADR_CIV_LIEU': row.get('ADR_CIV_LIEU'),
                'CODE_POST_LIEU': row.get('CODE_POST_LIEU'),
                'LST_MRC_REG_ADM': row.get('LST_MRC_REG_ADM'),
                'DESC_MILIEU_RECEPT': row.get('DESC_MILIEU_RECEPT'),
                'NB_FICHES': row.get('NB_FICHES', 0)
            }
            
            # Ajouter les détails des fiches si disponibles
            # Check if fiches_grouped is not empty and contains the NO_MEF_LIEU value
            fiche_match = None
            if not fiches_grouped.empty and 'NO_MEF_LIEU' in fiches_grouped.columns:
                # Use boolean indexing to find matching rows
                matching_rows = fiches_grouped[fiches_grouped['NO_MEF_LIEU'] == no_mef]
                if not matching_rows.empty:
                    fiche_match = matching_rows.iloc[0]
            
            if fiche_match is not None:
                record['NO_SEQ_DOSSIER'] = fiche_match.get('NO_SEQ_DOSSIER', '')
                record['ETAT_REHAB'] = fiche_match.get('ETAT_REHAB', '')
                record['QUAL_SOLS_AV'] = fiche_match.get('QUAL_SOLS_AV', '')
                record['QUAL_SOLS'] = fiche_match.get('QUAL_SOLS', '')
                record['CONTAM_SOL_EXTRA'] = fiche_match.get('CONTAM_SOL_EXTRA', '')
                record['CONTAM_EAU_EXTRA'] = fiche_match.get('CONTAM_EAU_EXTRA', '')
                record['DATE_CRE_MAJ'] = str(fiche_match.get('DATE_CRE_MAJ', ''))
                
                # Générer les URLs des fiches
                dossiers = str(record['NO_SEQ_DOSSIER']).split(', ')
                record['FICHES_URLS'] = [
                    f"https://www.environnement.gouv.qc.ca/sol/terrains/terrains-contamines/fiche.asp?no={d}"
                    for d in dossiers if d and d != 'nan'
                ]
                
                # Vérifier si décontaminé
                record['IS_DECONTAMINATED'] = 'Terminée' in str(record['ETAT_REHAB'])
            else:
                # Valeurs par défaut si pas de fiches
                record['NO_SEQ_DOSSIER'] = ''
                record['ETAT_REHAB'] = ''
                record['QUAL_SOLS_AV'] = ''
                record['QUAL_SOLS'] = ''
                record['CONTAM_SOL_EXTRA'] = ''
                record['CONTAM_EAU_EXTRA'] = ''
                record['DATE_CRE_MAJ'] = ''
                record['FICHES_URLS'] = []
                record['IS_DECONTAMINATED'] = False
            
            # Convertir les valeurs None en string vide et les types non-JSON
            for key, value in record.items():
                if pd.isna(value) or value is None:
                    record[key] = ''
                elif isinstance(value, (list, dict, bool)):
                    pass  # Garder tel quel
                elif not isinstance(value, (int, float, str)):
                    record[key] = str(value)
            
            data_list.append(record)
        
        logger.info(f"✅ {len(data_list)} enregistrements complets pour Val-d'Or")
        
        return data_list
    except Exception as e:
        logger.error(f"❌ Erreur filtrage données: {e}")
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
    """Détecter les changements entre anciennes et nouvelles données"""
    try:
        logger.info("🔍 Détection des changements...")
        
        # Créer des maps pour recherche rapide
        old_map = {item.get('NO_MEF_LIEU'): item for item in old_data if item.get('NO_MEF_LIEU')}
        new_map = {item.get('NO_MEF_LIEU'): item for item in new_data if item.get('NO_MEF_LIEU')}
        
        # Identifier les nouveaux éléments
        new_items = [item for item in new_data if item.get('NO_MEF_LIEU') not in old_map]
        
        # Identifier les éléments retirés
        removed_items = [item for item in old_data if item.get('NO_MEF_LIEU') not in new_map]
        
        # Identifier les éléments modifiés
        modified_items = []
        for item in new_data:
            ref = item.get('NO_MEF_LIEU')
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
    """Mettre à jour Firebase avec les nouvelles données"""
    try:
        logger.info("💾 Mise à jour de Firebase...")
        
        # Mettre à jour les données gouvernementales
        doc_ref = db.collection(GOVERNMENT_DATA_COLLECTION).document('current')
        doc_ref.set({
            'data': data,
            'lastUpdate': datetime.now().isoformat(),
            'count': len(data)
        })
        
        logger.info(f"✅ {len(data)} enregistrements sauvegardés dans Firebase")
        
        # Mettre à jour les métadonnées de synchronisation
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
        
        # 1. Initialiser Firebase
        db = initialize_firebase()
        
        # 2. Télécharger et extraire le fichier GPKG
        gpkg_file, temp_dir = download_and_extract_gpkg(GPKG_URL)
        
        # 3. Filtrer les données pour Val-d'Or
        new_data = filter_valdor_data(gpkg_file)
        
        # 4. Charger les données existantes
        old_data = load_existing_data(db)
        
        # 5. Détecter les changements
        changes = detect_changes(old_data, new_data)
        
        # 6. Mettre à jour Firebase
        update_firebase(db, new_data, changes)
        
        logger.info("✅ Synchronisation terminée avec succès!")
        
        # Afficher le résumé
        logger.info("\n📊 RÉSUMÉ DE LA SYNCHRONISATION:")
        logger.info(f"   Total d'enregistrements: {len(new_data)}")
        logger.info(f"   Nouveaux: {len(changes['new'])}")
        logger.info(f"   Modifiés: {len(changes['modified'])}")
        logger.info(f"   Retirés: {len(changes['removed'])}")
        
        return 0
        
    except Exception as e:
        logger.error(f"❌ Erreur lors de la synchronisation: {e}")
        
        # Enregistrer l'échec dans Firebase si possible
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
        # Nettoyer les fichiers temporaires
        cleanup_temp_files(gpkg_file, temp_dir)


if __name__ == '__main__':
    sys.exit(main())