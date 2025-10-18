#!/usr/bin/env python3
"""Download the official contaminated lands register, filter Val-d'Or data,
convert it to JSON/Excel and store it for the web application."""

from __future__ import annotations

import json
import sys
import unicodedata
import zipfile
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

import geopandas as gpd
import pandas as pd
import requests
import warnings

warnings.filterwarnings(
    "ignore",
    message="File /vsimem/pyogrio_.* has GPKG application_id, but non conformant file extension",
    category=RuntimeWarning,
)

# Constants -----------------------------------------------------------------
GPKG_ZIP_URL = (
    "https://stqc380donopppdtce01.blob.core.windows.net/donnees-ouvertes/"
    "Repertoire_terrains_contamines/RepertoireTerrainsContamines.gpkg.zip"
)
OUTPUT_JSON = Path("public/data/government-data.json")
OUTPUT_EXCEL = Path("Registre-des-terrains-contamines-Valdor.xlsx")
LAYER_NAME = "point"

ADDRESS_KEYWORDS = ["VAL-D'OR", "VAL D'OR", "VALDOR"]
MRC_KEYWORD = "LA VALLÉE-DE-L'OR"

# Utility functions ---------------------------------------------------------

def log(message: str) -> None:
    print(message)


def normalize_text(value: object) -> str:
    if value is None:
        return ""
    text = str(value).replace("\n", " ").replace("’", "'")
    text = unicodedata.normalize("NFKD", text)
    text = "".join(char for char in text if not unicodedata.combining(char))
    return text.upper()


def download_zip(url: str) -> BytesIO:
    log(f"📥 Téléchargement du registre gouvernemental…\n   → {url}")
    response = requests.get(url, timeout=600)
    response.raise_for_status()
    log(f"✅ Téléchargé ({len(response.content) / (1024 * 1024):.2f} Mo)")
    return BytesIO(response.content)


def extract_gpkg(zip_bytes: BytesIO) -> BytesIO:
    with zipfile.ZipFile(zip_bytes) as archive:
        gpkg_files = [name for name in archive.namelist() if name.endswith(".gpkg")]
        if not gpkg_files:
            raise RuntimeError("Aucun fichier GPKG trouvé dans l'archive")
        gpkg_name = gpkg_files[0]
        log(f"📦 Extraction du fichier {gpkg_name}")
        return BytesIO(archive.read(gpkg_name))


def filter_valdor(gdf: gpd.GeoDataFrame) -> pd.DataFrame:
    log("🔍 Filtrage des données pour la ville de Val-d'Or…")

    def belongs_to_valdor(row) -> bool:
        address = normalize_text(row.get("ADR_CIV_LIEU"))
        mrc = normalize_text(row.get("LST_MRC_REG_ADM"))

        if any(keyword in address for keyword in ADDRESS_KEYWORDS):
            return True

        # Certains enregistrements n'ont pas explicitement Val-d'Or dans l'adresse
        # mais appartiennent à la MRC de La Vallée-de-l'Or.
        if MRC_KEYWORD in mrc and "VAL" in address:
            return True

        return False

    filtered = gdf[gdf.apply(belongs_to_valdor, axis=1)].copy()

    if filtered.empty:
        raise RuntimeError(
            "Aucun enregistrement correspondant à Val-d'Or n'a été trouvé dans le fichier GPKG."
        )

    log(f"✅ {len(filtered)} enregistrements retenus pour Val-d'Or")

    # Nettoyer les colonnes inutiles
    for column in ["geometry"]:
        if column in filtered.columns:
            filtered = filtered.drop(columns=column)

    # Trier pour une lecture cohérente
    sort_columns = [col for col in ["ADR_CIV_LIEU", "NO_MEF_LIEU"] if col in filtered.columns]
    if sort_columns:
        filtered = filtered.sort_values(by=sort_columns)

    return pd.DataFrame(filtered)


def convert_dates(df: pd.DataFrame) -> pd.DataFrame:
    for column in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[column]):
            df[column] = df[column].dt.strftime("%Y-%m-%d")
    return df


def save_outputs(df: pd.DataFrame) -> None:
    df = df.fillna("")

    log(f"💾 Sauvegarde Excel → {OUTPUT_EXCEL}")
    df.to_excel(OUTPUT_EXCEL, index=False)

    data_records = df.to_dict(orient="records")
    metadata = {
        "source": "Registre des terrains contaminés - Gouvernement du Québec",
        "source_url": GPKG_ZIP_URL,
        "city": "Val-d'Or",
        "layer": LAYER_NAME,
        "total_records": len(data_records),
        "last_update": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "generated_by": "download_gov_data.py",
    }

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    payload = {"data": data_records, "metadata": metadata}

    log(f"📝 Sauvegarde JSON → {OUTPUT_JSON}")
    OUTPUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), "utf-8")

    if data_records:
        log("\n📄 Aperçu du premier enregistrement:")
        log(json.dumps(data_records[0], ensure_ascii=False, indent=2))


# Main ----------------------------------------------------------------------

def main() -> int:
    log("=" * 78)
    log("🔄 Actualisation des données gouvernementales")
    log("=" * 78)
    log(f"⏰ Début : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    try:
        zip_bytes = download_zip(GPKG_ZIP_URL)
        gpkg_bytes = extract_gpkg(zip_bytes)

        log(f"📂 Lecture du layer '{LAYER_NAME}' avec GeoPandas…")
        gdf = gpd.read_file(gpkg_bytes, layer=LAYER_NAME)
        log(f"✅ Fichier chargé : {len(gdf)} enregistrements")

        filtered_df = filter_valdor(gdf)
        filtered_df = convert_dates(filtered_df)
        save_outputs(filtered_df)

        log("\n✅ Traitement terminé avec succès")
        log("=" * 78)
        log(f"⏰ Fin : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        return 0

    except requests.RequestException as error:
        log(f"❌ Erreur réseau: {error}")
        return 1
    except Exception as error:  # pylint: disable=broad-except
        log(f"❌ Erreur: {error}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
