#!/usr/bin/env python3
"""Download the official contaminated lands register with detailsFiches,
filter Val-d'Or data, convert it to JSON/Excel and store it for the web application.

This enhanced version includes rehabilitation status, soil quality, contaminants,
and clickable links to individual fiches.
"""

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
LAYER_POINT = "point"
LAYER_FICHES = "detailsFiches"
FICHE_URL_TEMPLATE = "https://www.environnement.gouv.qc.ca/sol/terrains/terrains-contamines/fiche.asp?no={}"

ADDRESS_KEYWORDS = ["VAL-D'OR", "VAL D'OR", "VALDOR"]
MRC_KEYWORD = "LA VALLÉE-DE-L'OR"

# Utility functions ---------------------------------------------------------

def log(message: str) -> None:
    print(message)


def normalize_text(value: object) -> str:
    if value is None:
        return ""
    text = str(value).replace("\n", " ").replace("'", "'")
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


def load_layers(gpkg_bytes: BytesIO) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Load both point and detailsFiches layers from GPKG."""
    log(f"📂 Lecture du layer '{LAYER_POINT}'…")
    gdf_point = gpd.read_file(gpkg_bytes, layer=LAYER_POINT)
    log(f"✅ {len(gdf_point)} enregistrements chargés (layer point)")
    
    # Reset BytesIO pour relire
    gpkg_bytes.seek(0)
    
    log(f"📂 Lecture du layer '{LAYER_FICHES}'…")
    gdf_fiches = gpd.read_file(gpkg_bytes, layer=LAYER_FICHES)
    log(f"✅ {len(gdf_fiches)} enregistrements chargés (layer detailsFiches)")
    
    # Supprimer la colonne geometry
    for col in ["geometry"]:
        if col in gdf_point.columns:
            gdf_point = gdf_point.drop(columns=col)
        if col in gdf_fiches.columns:
            gdf_fiches = gdf_fiches.drop(columns=col)
    
    return pd.DataFrame(gdf_point), pd.DataFrame(gdf_fiches)


def filter_valdor(points_df: pd.DataFrame) -> pd.DataFrame:
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

    filtered = points_df[points_df.apply(belongs_to_valdor, axis=1)].copy()

    if filtered.empty:
        raise RuntimeError(
            "Aucun enregistrement correspondant à Val-d'Or n'a été trouvé dans le fichier GPKG."
        )

    log(f"✅ {len(filtered)} enregistrements retenus pour Val-d'Or")

    # Trier pour une lecture cohérente
    sort_columns = [col for col in ["ADR_CIV_LIEU", "NO_MEF_LIEU"] if col in filtered.columns]
    if sort_columns:
        filtered = filtered.sort_values(by=sort_columns)

    return filtered


def merge_with_fiches(points_df: pd.DataFrame, fiches_df: pd.DataFrame) -> pd.DataFrame:
    """
    Merge point data with fiches data.
    Since a terrain can have multiple fiches, we'll aggregate fiche information.
    """
    log("🔗 Fusion des données avec les fiches…")
    
    # Group fiches by NO_MEF_LIEU
    fiches_grouped = fiches_df.groupby('NO_MEF_LIEU').agg({
        'NO_SEQ_DOSSIER': lambda x: list(x),  # Liste de tous les numéros de fiches
        'ETAT_REHAB': lambda x: list(x),  # Liste de tous les états
        'QUAL_SOLS_AV': lambda x: ', '.join([str(v) for v in x if pd.notna(v)]) or None,
        'QUAL_SOLS': lambda x: ', '.join([str(v) for v in x if pd.notna(v)]) or None,
        'CONTAM_SOL_EXTRA': lambda x: '; '.join([str(v) for v in x if pd.notna(v)]) or None,
        'CONTAM_EAU_EXTRA': lambda x: '; '.join([str(v) for v in x if pd.notna(v)]) or None,
        'DATE_CRE_MAJ': lambda x: max([v for v in x if pd.notna(v)], default=None)  # Date la plus récente
    }).reset_index()
    
    # Merge avec les points
    merged = points_df.merge(fiches_grouped, on='NO_MEF_LIEU', how='left')
    
    log(f"✅ {len(merged)} terrains avec leurs fiches")
    
    # Générer les URLs des fiches
    def generate_fiche_urls(no_seq_list):
        if no_seq_list is None:
            return []
        if isinstance(no_seq_list, (list, tuple)):
            return [FICHE_URL_TEMPLATE.format(no) for no in no_seq_list if pd.notna(no)]
        if pd.notna(no_seq_list):
            return [FICHE_URL_TEMPLATE.format(no_seq_list)]
        return []
    
    merged['FICHES_URLS'] = merged['NO_SEQ_DOSSIER'].apply(generate_fiche_urls)
    
    # Convertir les listes en strings pour JSON
    merged['NO_SEQ_DOSSIER_LIST'] = merged['NO_SEQ_DOSSIER'].apply(
        lambda x: ', '.join(map(str, x)) if isinstance(x, list) else str(x) if pd.notna(x) else ''
    )
    merged['ETAT_REHAB_LIST'] = merged['ETAT_REHAB'].apply(
        lambda x: ' | '.join(x) if isinstance(x, list) else str(x) if pd.notna(x) else ''
    )
    
    # Détecter si au moins une fiche est "Terminée"
    def has_terminated_rehab(etat_list):
        if etat_list is None:
            return False
        if isinstance(etat_list, (list, tuple)):
            return any('Terminée' in str(e) for e in etat_list if pd.notna(e))
        if pd.notna(etat_list):
            return 'Terminée' in str(etat_list)
        return False
    
    merged['IS_DECONTAMINATED'] = merged['ETAT_REHAB'].apply(has_terminated_rehab)
    
    # Drop les colonnes temporaires avec listes Python (incompatibles JSON)
    merged = merged.drop(columns=['NO_SEQ_DOSSIER', 'ETAT_REHAB'])
    
    # Renommer pour clarté
    merged = merged.rename(columns={
        'NO_SEQ_DOSSIER_LIST': 'NO_SEQ_DOSSIER',
        'ETAT_REHAB_LIST': 'ETAT_REHAB'
    })
    
    return merged


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
    
    # Statistiques sur les états de réhabilitation
    decontaminated_count = df['IS_DECONTAMINATED'].sum() if 'IS_DECONTAMINATED' in df.columns else 0
    
    metadata = {
        "source": "Registre des terrains contaminés - Gouvernement du Québec",
        "source_url": GPKG_ZIP_URL,
        "city": "Val-d'Or",
        "layers": [LAYER_POINT, LAYER_FICHES],
        "total_records": len(data_records),
        "decontaminated_count": int(decontaminated_count),
        "last_update": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "generated_by": "download_gov_data_with_fiches.py",
        "new_fields": [
            "ETAT_REHAB: État de la réhabilitation",
            "QUAL_SOLS_AV: Qualité des sols avant réhabilitation",
            "QUAL_SOLS: Qualité des sols après réhabilitation",
            "CONTAM_SOL_EXTRA: Contaminants dans le sol",
            "CONTAM_EAU_EXTRA: Contaminants dans l'eau",
            "NO_SEQ_DOSSIER: Numéros de fiches (séparés par virgule)",
            "FICHES_URLS: URLs des fiches consultables",
            "IS_DECONTAMINATED: True si au moins une fiche indique réhabilitation terminée",
            "DATE_CRE_MAJ: Date de dernière création/mise à jour"
        ]
    }

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    payload = {"data": data_records, "metadata": metadata}

    log(f"📝 Sauvegarde JSON → {OUTPUT_JSON}")
    OUTPUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), "utf-8")

    if data_records:
        log("\n📄 Aperçu du premier enregistrement:")
        log(json.dumps(data_records[0], ensure_ascii=False, indent=2))
        
        log(f"\n📊 Statistiques:")
        log(f"   Total de terrains: {len(data_records)}")
        log(f"   Terrains décontaminés: {decontaminated_count}")
        log(f"   Terrains encore contaminés: {len(data_records) - decontaminated_count}")


# Main ----------------------------------------------------------------------

def main() -> int:
    log("=" * 78)
    log("🔄 Actualisation des données gouvernementales (avec fiches détaillées)")
    log("=" * 78)
    log(f"⏰ Début : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    try:
        zip_bytes = download_zip(GPKG_ZIP_URL)
        gpkg_bytes = extract_gpkg(zip_bytes)

        points_df, fiches_df = load_layers(gpkg_bytes)
        
        filtered_points = filter_valdor(points_df)
        
        merged_df = merge_with_fiches(filtered_points, fiches_df)
        merged_df = convert_dates(merged_df)
        
        save_outputs(merged_df)

        log("\n✅ Traitement terminé avec succès")
        log("=" * 78)
        log(f"⏰ Fin : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        return 0

    except requests.RequestException as error:
        log(f"❌ Erreur réseau: {error}")
        return 1
    except Exception as error:  # pylint: disable=broad-except
        log(f"❌ Erreur: {error}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
