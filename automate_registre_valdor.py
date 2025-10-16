import pandas as pd
import geopandas as gpd
import requests
from io import BytesIO
from datetime import datetime

GPKG_URL = "https://www.donneesquebec.ca/recherche/dataset/repertoire-des-terrains-contamines-gtc/resource/09afbfb6-eeac-44fb-86ef-d8b6ce4b739a/download/gtc.gpkg"
EXCEL_PATH = "Registre-des-terrains-contamines-Valdor.xlsx"
CITY_FILTER = "VAL-D'OR"

CHAMPS_CIBLES = {
    'gid': 'ID',
    'adresse': 'Adresse',
    'ville': 'Ville',
    'mrc': 'MRC',
    'region': 'Région',
    'code_postal': 'Code postal',
    'superficie': 'Superficie',
    'etat_contamination': 'État de contamination',
    'nature_contamination': 'Nature de la contamination',
    'date_creation': 'Date création',
    'date_maj': 'Date MAJ'
}

def download_gpkg(url):
    resp = requests.get(url)
    resp.raise_for_status()
    return BytesIO(resp.content)

def main():
    print("Début du traitement :", datetime.now())
    with download_gpkg(GPKG_URL) as file:
        gdf = gpd.read_file(file, layer=0)
    gdf_ville = gdf[gdf['ville'].str.upper().str.contains(CITY_FILTER)]
    champs_present = {k: v for k, v in CHAMPS_CIBLES.items() if k in gdf_ville.columns}
    df_result = gdf_ville[list(champs_present.keys())]
    df_result = df_result.rename(columns=champs_present)
    df_result.to_excel(EXCEL_PATH, index=False)
    print("Export terminé:", EXCEL_PATH)

if __name__ == "__main__":
    main()
