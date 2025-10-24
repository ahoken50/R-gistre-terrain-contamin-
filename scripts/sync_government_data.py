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


def download_gpkg(url):
    """Télécharger le fichier GPKG"""
    try:
        logger.info(f"📥 Téléchargement du fichier GPKG depuis {url}")
        
        response = requests.get(url, stream=True, timeout=300)
        response.raise_for_status()
        
        # Créer un fichier temporaire
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.gpkg')
        
        # Télécharger avec barre de progression
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        
        with open(temp_file.name, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        progress = (downloaded / total_size) * 100
                        logger.info(f"Téléchargement: {progress:.1f}%")
        
        logger.info(f"✅ Fichier téléchargé: {temp_file.name}")
        return temp_file.name
    except Exception as e:
        logger.error(f"❌ Erreur téléchargement GPKG: {e}")
        raise


def filter_valdor_data(gpkg_path):
    """Filtrer les données pour Val-d'Or"""
    try:
        logger.info(f"🔍 Lecture du fichier GPKG: {gpkg_path}")
        
        # Lire le GeoPackage
        gdf = gpd.read_file(gpkg_path)
        
        logger.info(f"📊 Total d'enregistrements: {len(gdf)}")
        
        # Filtrer pour Val-d'Or
        valdor_data = gdf[gdf['NOM_MUNIC'].str.contains(MUNICIPALITY, case=False, na=False)]
        
        logger.info(f"✅ Enregistrements pour {MUNICIPALITY}: {len(valdor_data)}")
        
        # Convertir en dictionnaire
        data_list = []
        for idx, row in valdor_data.iterrows():
            record = {}
            for col in valdor_data.columns:
                value = row[col]
                # Convertir les types non-JSON en string
                if hasattr(value, 'wkt'):  # Géométrie
                    continue  # Ignorer la géométrie
                elif pd.isna(value):
                    record[col] = None
                elif isinstance(value, (int, float, str, bool)):
                    record[col] = value
                else:
                    record[col] = str(value)
            data_list.append(record)
        
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


def cleanup_temp_file(file_path):
    """Nettoyer le fichier temporaire"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"🧹 Fichier temporaire supprimé: {file_path}")
    except Exception as e:
        logger.warning(f"⚠️ Erreur suppression fichier temporaire: {e}")


def main():
    """Fonction principale"""
    temp_file = None
    
    try:
        logger.info("🚀 Démarrage de la synchronisation automatique")
        logger.info(f"📅 Date: {datetime.now().isoformat()}")
        
        # 1. Initialiser Firebase
        db = initialize_firebase()
        
        # 2. Télécharger le fichier GPKG
        temp_file = download_gpkg(GPKG_URL)
        
        # 3. Filtrer les données pour Val-d'Or
        new_data = filter_valdor_data(temp_file)
        
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
        # Nettoyer le fichier temporaire
        if temp_file:
            cleanup_temp_file(temp_file)


if __name__ == '__main__':
    sys.exit(main())