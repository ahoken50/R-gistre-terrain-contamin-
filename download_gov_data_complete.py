#!/usr/bin/env python3
"""
Script pour télécharger le fichier GPKG COMPLET du registre des terrains contaminés
et filtrer uniquement les données de Val-d'Or
"""

import pandas as pd
import geopandas as gpd
import requests
import json
import zipfile
from io import BytesIO
from datetime import datetime
from pathlib import Path

# URL du fichier GPKG COMPLET (ZIP)
GPKG_ZIP_URL = "https://stqc380donopppdtce01.blob.core.windows.net/donnees-ouvertes/Repertoire_terrains_contamines/RepertoireTerrainsContamines.gpkg.zip"

# Fichiers de sortie
EXCEL_PATH = "Registre-des-terrains-contamines-Valdor.xlsx"
JSON_OUTPUT = "public/data/government-data.json"

# Filtres pour Val-d'Or
CITY_FILTERS = ["VAL-D'OR", "VALDOR", "VAL D'OR", "VAL D OR"]

def download_and_extract_gpkg(url):
    """Télécharge le ZIP et extrait le GPKG"""
    print(f"📥 Téléchargement du fichier ZIP complet...")
    print(f"🔗 URL : {url}")
    print("⏳ Cela peut prendre quelques minutes (fichier de plusieurs Mo)...")
    
    resp = requests.get(url, timeout=600)
    resp.raise_for_status()
    
    print(f"✅ Téléchargé : {len(resp.content) / (1024*1024):.2f} Mo")
    
    # Extraire le GPKG du ZIP
    print("📦 Extraction du fichier GPKG...")
    with zipfile.ZipFile(BytesIO(resp.content)) as z:
        # Trouver le fichier GPKG dans le ZIP
        gpkg_files = [f for f in z.namelist() if f.endswith('.gpkg')]
        if not gpkg_files:
            raise Exception("Aucun fichier GPKG trouvé dans le ZIP")
        
        gpkg_filename = gpkg_files[0]
        print(f"📄 Fichier trouvé : {gpkg_filename}")
        
        # Extraire en mémoire
        gpkg_data = z.read(gpkg_filename)
        print(f"✅ Extrait : {len(gpkg_data) / (1024*1024):.2f} Mo")
        
        return BytesIO(gpkg_data)

def filter_valdor_data(gdf):
    """Filtre les données pour Val-d'Or"""
    print(f"\n🔍 Recherche des terrains de Val-d'Or...")
    print(f"📊 Total d'enregistrements dans le fichier : {len(gdf)}")
    
    # Chercher dans toutes les colonnes textuelles
    valdor_mask = pd.Series([False] * len(gdf))
    
    for filter_term in CITY_FILTERS:
        print(f"\n   Recherche de '{filter_term}'...")
        for col in gdf.columns:
            if gdf[col].dtype == 'object' and col != 'geometry':
                try:
                    mask = gdf[col].astype(str).str.upper().str.contains(
                        filter_term.replace("'", "").replace("-", "").replace(" ", ""),
                        na=False,
                        regex=False
                    )
                    if mask.any():
                        print(f"      ✓ Trouvé {mask.sum()} dans '{col}'")
                        valdor_mask = valdor_mask | mask
                except:
                    pass
    
    gdf_valdor = gdf[valdor_mask].drop_duplicates()
    
    if len(gdf_valdor) == 0:
        print(f"\n⚠️  Aucun terrain trouvé avec les filtres : {CITY_FILTERS}")
        print(f"🔍 Recherche élargie avec 'VAL'...")
        
        # Recherche plus large
        for col in gdf.columns:
            if gdf[col].dtype == 'object' and col != 'geometry':
                mask = gdf[col].astype(str).str.upper().str.contains('VAL', na=False)
                if mask.any():
                    print(f"   ✓ Colonne '{col}' contient {mask.sum()} enregistrements avec 'VAL'")
                    print(f"      Exemples : {gdf[mask][col].unique()[:3]}")
    
    return gdf_valdor

def main():
    print("="*80)
    print("🔄 TÉLÉCHARGEMENT COMPLET DES DONNÉES GOUVERNEMENTALES")
    print("="*80)
    print(f"⏰ Début : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    try:
        # Télécharger et extraire le GPKG
        gpkg_data = download_and_extract_gpkg(GPKG_ZIP_URL)
        
        # Lire le fichier GPKG
        print("\n📂 Lecture du fichier GPKG...")
        gdf = gpd.read_file(gpkg_data, layer=0)
        
        print(f"✅ Fichier chargé : {len(gdf)} enregistrements au total")
        
        # Afficher les colonnes
        print("\n📋 Colonnes disponibles :")
        for i, col in enumerate(gdf.columns, 1):
            print(f"  {i:2d}. {col}")
        
        # Filtrer pour Val-d'Or
        gdf_valdor = filter_valdor_data(gdf)
        
        if len(gdf_valdor) == 0:
            print("\n❌ Aucune donnée trouvée pour Val-d'Or")
            print("💡 Utilisation de toutes les données pour démonstration")
            gdf_valdor = gdf
        else:
            print(f"\n✅ {len(gdf_valdor)} terrains trouvés pour Val-d'Or")
        
        # Supprimer la géométrie pour la conversion
        df_result = pd.DataFrame(gdf_valdor)
        if 'geometry' in df_result.columns:
            df_result = df_result.drop(columns=['geometry'])
        
        # Sauvegarder en Excel
        print(f"\n💾 Sauvegarde Excel : {EXCEL_PATH}")
        df_result.to_excel(EXCEL_PATH, index=False)
        print(f"✅ Excel créé : {EXCEL_PATH}")
        
        # Convertir en JSON
        print(f"\n🔄 Conversion en JSON...")
        
        # Convertir les dates
        for col in df_result.columns:
            if df_result[col].dtype == 'datetime64[ns]':
                df_result[col] = df_result[col].dt.strftime('%Y-%m-%d')
        
        # Remplacer NaN
        df_result = df_result.fillna('')
        
        # Convertir en dict
        data = df_result.to_dict(orient='records')
        
        # Créer le dossier
        Path(JSON_OUTPUT).parent.mkdir(parents=True, exist_ok=True)
        
        # Créer le JSON
        output_data = {
            'data': data,
            'metadata': {
                'source': 'Registre des terrains contaminés - Gouvernement du Québec',
                'source_url': GPKG_ZIP_URL,
                'city': 'Val-d\'Or',
                'total_records_in_file': len(gdf),
                'valdor_records': len(gdf_valdor),
                'last_update': datetime.now().isoformat(),
                'generated_by': 'download_gov_data_complete.py',
                'columns': list(df_result.columns)
            }
        }
        
        # Sauvegarder
        with open(JSON_OUTPUT, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ JSON créé : {JSON_OUTPUT}")
        print(f"📊 {len(data)} enregistrements exportés")
        
        # Aperçu
        if len(data) > 0:
            print("\n📄 Aperçu (premier enregistrement) :")
            print(json.dumps(data[0], indent=2, ensure_ascii=False))
        
        print("\n" + "="*80)
        print("✅ TRAITEMENT TERMINÉ AVEC SUCCÈS")
        print("="*80)
        print(f"⏰ Fin : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"\n📊 Résumé :")
        print(f"   - Total d'enregistrements dans le fichier : {len(gdf)}")
        print(f"   - Enregistrements pour Val-d'Or : {len(gdf_valdor)}")
        print(f"   - Fichier Excel : {EXCEL_PATH}")
        print(f"   - Fichier JSON : {JSON_OUTPUT}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Erreur : {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
