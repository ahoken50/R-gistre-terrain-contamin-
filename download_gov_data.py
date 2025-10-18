#!/usr/bin/env python3
"""
Script amélioré pour télécharger et convertir les données gouvernementales
Télécharge directement depuis données.québec.ca et convertit en JSON
"""

import pandas as pd
import geopandas as gpd
import requests
import json
from io import BytesIO
from datetime import datetime
from pathlib import Path

# URL du fichier GPKG officiel
GPKG_URL = "https://www.donneesquebec.ca/recherche/dataset/repertoire-des-terrains-contamines-gtc/resource/09afbfb6-eeac-44fb-86ef-d8b6ce4b739a/download/gtc.gpkg"

# Fichiers de sortie
EXCEL_PATH = "Registre-des-terrains-contamines-Valdor.xlsx"
JSON_OUTPUT = "public/data/government-data.json"
CITY_FILTER = "VALLÉE-DE-L'OR"  # MRC de Val-d'Or
CITY_FILTER_ALT = ["VAL-D'OR", "VALDOR", "VAL D'OR", "VAL-D OR"]  # Variantes

def download_gpkg(url):
    """Télécharge le fichier GPKG"""
    print(f"📥 Téléchargement depuis : {url}")
    print("⏳ Cela peut prendre quelques minutes...")
    resp = requests.get(url, timeout=300)
    resp.raise_for_status()
    print("✅ Téléchargement terminé")
    return BytesIO(resp.content)

def find_city_column(gdf):
    """Trouve la colonne qui contient la ville"""
    possible_names = ['ville', 'Ville', 'VILLE', 'city', 'City', 'CITY', 'municipalite', 'Municipalite']
    for col in gdf.columns:
        if col in possible_names:
            return col
        # Vérifier si le nom contient 'ville' ou 'city'
        if 'ville' in col.lower() or 'city' in col.lower():
            return col
    return None

def main():
    print("="*70)
    print("🔄 Téléchargement et conversion des données gouvernementales")
    print("="*70)
    print(f"⏰ Début : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    try:
        # Télécharger le fichier GPKG
        with download_gpkg(GPKG_URL) as file:
            print("📂 Lecture du fichier GPKG...")
            gdf = gpd.read_file(file, layer=0)
        
        print(f"✅ Fichier chargé : {len(gdf)} enregistrements")
        
        # Afficher les colonnes disponibles
        print("\n📋 Colonnes disponibles dans le fichier GPKG :")
        for i, col in enumerate(gdf.columns, 1):
            print(f"  {i:2d}. {col}")
        
        # Trouver la colonne ville
        city_col = find_city_column(gdf)
        
        if city_col:
            print(f"\n🔍 Filtrage sur la colonne : '{city_col}'")
            print(f"🎯 Recherche de : {CITY_FILTER}")
            
            # Filtrer pour Val-d'Or
            gdf_ville = gdf[gdf[city_col].str.upper().str.contains(CITY_FILTER, na=False)]
            print(f"✅ {len(gdf_ville)} terrains trouvés pour {CITY_FILTER}")
        else:
            # Essayer de filtrer par adresse ou MRC
            print("⚠️  Colonne 'ville' introuvable")
            print("🔍 Tentative de filtrage par adresse ou MRC...")
            
            # Chercher dans toutes les colonnes textuelles
            text_columns = gdf.select_dtypes(include=['object']).columns
            gdf_ville = gpd.GeoDataFrame()  # DataFrame vide
            
            # Essayer avec toutes les variantes
            all_filters = [CITY_FILTER] + CITY_FILTER_ALT
            
            for col in text_columns:
                if col != 'geometry':
                    for filter_term in all_filters:
                        # Recherche simple avec regex=False
                        try:
                            mask = gdf[col].astype(str).str.upper().str.contains(
                                filter_term.upper(), 
                                na=False,
                                regex=False
                            )
                            if mask.any():
                                gdf_ville = pd.concat([gdf_ville, gdf[mask]]).drop_duplicates()
                                print(f"  ✓ Trouvé dans '{col}' avec '{filter_term}': {mask.sum()} enregistrements")
                        except:
                            pass
            
            if len(gdf_ville) > 0:
                print(f"✅ {len(gdf_ville)} terrains trouvés pour {CITY_FILTER}")
            else:
                print(f"⚠️  Aucun terrain trouvé pour {CITY_FILTER}")
                print("💡 Utilisation de tous les enregistrements")
                gdf_ville = gdf
        
        if len(gdf_ville) == 0:
            print(f"❌ Aucun terrain trouvé pour {CITY_FILTER}")
            print("💡 Vérifiez que le nom de la ville est correct")
            return False
        
        # Supprimer la colonne géométrie pour la conversion
        df_result = pd.DataFrame(gdf_ville)
        if 'geometry' in df_result.columns:
            df_result = df_result.drop(columns=['geometry'])
        
        # Sauvegarder en Excel
        print(f"\n💾 Sauvegarde Excel : {EXCEL_PATH}")
        df_result.to_excel(EXCEL_PATH, index=False)
        print(f"✅ Excel créé : {EXCEL_PATH}")
        
        # Convertir en JSON pour l'application web
        print(f"\n🔄 Conversion en JSON...")
        
        # Convertir les dates
        for col in df_result.columns:
            if df_result[col].dtype == 'datetime64[ns]':
                df_result[col] = df_result[col].dt.strftime('%Y-%m-%d')
        
        # Remplacer NaN par chaînes vides
        df_result = df_result.fillna('')
        
        # Convertir en dictionnaire
        data = df_result.to_dict(orient='records')
        
        # Créer le dossier de sortie
        Path(JSON_OUTPUT).parent.mkdir(parents=True, exist_ok=True)
        
        # Créer le JSON avec métadonnées
        output_data = {
            'data': data,
            'metadata': {
                'source': 'Registre des terrains contaminés - Gouvernement du Québec',
                'source_url': GPKG_URL,
                'city': CITY_FILTER,
                'total_records': len(data),
                'last_update': datetime.now().isoformat(),
                'generated_by': 'download_gov_data.py',
                'columns': list(df_result.columns)
            }
        }
        
        # Sauvegarder le JSON
        with open(JSON_OUTPUT, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ JSON créé : {JSON_OUTPUT}")
        print(f"📊 {len(data)} enregistrements exportés")
        
        # Afficher un aperçu
        if len(data) > 0:
            print("\n📄 Aperçu (premier enregistrement) :")
            print(json.dumps(data[0], indent=2, ensure_ascii=False))
        
        print("\n" + "="*70)
        print("✅ TRAITEMENT TERMINÉ AVEC SUCCÈS")
        print("="*70)
        print(f"⏰ Fin : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("\n💡 Prochaines étapes :")
        print("1. Vérifiez le fichier JSON : public/data/government-data.json")
        print("2. Commitez et poussez vers GitHub")
        print("3. L'application affichera automatiquement ces données")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Erreur de téléchargement : {e}")
        print("💡 Vérifiez votre connexion internet et l'URL")
        return False
    except Exception as e:
        print(f"\n❌ Erreur lors du traitement : {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
