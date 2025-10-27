# Documentation: Extraction des données GPKG

## Vue d'ensemble

Ce document explique en détail comment le script `scripts/sync_government_data.py` extrait et filtre les données depuis le fichier GPKG du gouvernement du Québec.

## Source des données

**URL officielle**: https://www.donneesquebec.ca/recherche/dataset/repertoire-des-terrains-contamines-gtc/resource/09afbfb6-eeac-44fb-86ef-d8b6ce4b739a/download/gtc.gpkg

Le fichier est distribué sous forme d'archive ZIP contenant un fichier GeoPackage (GPKG) avec plusieurs couches de données géospatiales.

## Couches utilisées

### 1. Couche `point`
Contient les informations de localisation des terrains contaminés.

**Champs extraits**:
- `NO_MEF_LIEU` - Numéro d'identification unique du terrain
- `LATITUDE` - Coordonnée latitude
- `LONGITUDE` - Coordonnée longitude
- `ADR_CIV_LIEU` - Adresse civique du terrain
- `CODE_POST_LIEU` - Code postal
- `LST_MRC_REG_ADM` - MRC et région administrative
- `DESC_MILIEU_RECEPT` - Description du milieu récepteur
- `NB_FICHES` - Nombre de fiches de réhabilitation associées

### 2. Couche `detailsFiches`
Contient les détails des fiches de réhabilitation pour chaque terrain.

**Champs extraits et agrégés**:
- `NO_SEQ_DOSSIER` - Numéros de dossiers (concaténés avec ", ")
- `ETAT_REHAB` - États de réhabilitation (concaténés avec " | ")
- `QUAL_SOLS_AV` - Qualité des sols avant travaux (concaténés avec ", ")
- `QUAL_SOLS` - Qualité des sols après travaux (concaténés avec ", ")
- `CONTAM_SOL_EXTRA` - Contaminants du sol extraits (concaténés avec "; ")
- `CONTAM_EAU_EXTRA` - Contaminants de l'eau extraits (concaténés avec "; ")
- `DATE_CRE_MAJ` - Date la plus récente parmi toutes les fiches

## Filtrage pour Val-d'Or

Le script utilise la fonction `belongs_to_valdor()` qui applique deux critères:

### Critère 1: Adresse contient Val-d'Or
L'adresse civique (`ADR_CIV_LIEU`) contient l'un des mots-clés suivants (insensible à la casse):
- "VAL-D'OR"
- "VAL D'OR"
- "VALDOR"

### Critère 2: MRC + "VAL" dans l'adresse
- Le champ `LST_MRC_REG_ADM` contient "LA VALLÉE-DE-L'OR"
- ET l'adresse contient le mot "VAL"

**Note**: Un terrain est inclus si l'un OU l'autre de ces critères est satisfait.

## Agrégation des données

Pour chaque terrain identifié dans Val-d'Or:

1. **Informations de base** (depuis la couche `point`):
   - Localisation (latitude, longitude)
   - Adresse complète
   - Numéro d'identification

2. **Agrégation des fiches** (depuis `detailsFiches`):
   - Toutes les fiches associées au même `NO_MEF_LIEU` sont regroupées
   - Les valeurs multiples sont concaténées selon leur type
   - Les dates sont comparées et la plus récente est conservée

3. **Calculs dérivés**:
   - `FICHES_URLS`: Liste d'URLs vers les fiches officielles
     - Format: `https://www.environnement.gouv.qc.ca/sol/terrains/terrains-contamines/fiche.asp?no={NO_SEQ_DOSSIER}`
   - `IS_DECONTAMINATED`: Booléen (true si au moins un état contient "Terminée")

## Exemple de transformation

### Données brutes dans le GPKG

**Couche point**:
```
NO_MEF_LIEU: 123456
ADR_CIV_LIEU: "123 RUE PRINCIPALE VAL-D'OR"
LATITUDE: 48.0977
LONGITUDE: -77.7973
NB_FICHES: 2
```

**Couche detailsFiches** (2 entrées pour NO_MEF_LIEU=123456):
```
Fiche 1:
  NO_SEQ_DOSSIER: D001
  ETAT_REHAB: "En cours"
  QUAL_SOLS_AV: "C"
  CONTAM_SOL_EXTRA: "Hydrocarbures"
  DATE_CRE_MAJ: "2023-01-15"

Fiche 2:
  NO_SEQ_DOSSIER: D002
  ETAT_REHAB: "Terminée"
  QUAL_SOLS: "A"
  CONTAM_SOL_EXTRA: "Métaux lourds"
  DATE_CRE_MAJ: "2023-06-20"
```

### Résultat agrégé

```json
{
  "NO_MEF_LIEU": 123456,
  "ADR_CIV_LIEU": "123 RUE PRINCIPALE VAL-D'OR",
  "LATITUDE": 48.0977,
  "LONGITUDE": -77.7973,
  "CODE_POST_LIEU": "",
  "LST_MRC_REG_ADM": "La Vallée-de-l'Or",
  "DESC_MILIEU_RECEPT": "",
  "NB_FICHES": 2,
  "NO_SEQ_DOSSIER": "D001, D002",
  "ETAT_REHAB": "En cours | Terminée",
  "QUAL_SOLS_AV": "C",
  "QUAL_SOLS": "A",
  "CONTAM_SOL_EXTRA": "Hydrocarbures; Métaux lourds",
  "CONTAM_EAU_EXTRA": "",
  "DATE_CRE_MAJ": "2023-06-20",
  "FICHES_URLS": [
    "https://www.environnement.gouv.qc.ca/sol/terrains/terrains-contamines/fiche.asp?no=D001",
    "https://www.environnement.gouv.qc.ca/sol/terrains/terrains-contamines/fiche.asp?no=D002"
  ],
  "IS_DECONTAMINATED": true
}
```

## Gestion des valeurs manquantes

Le script utilise des fonctions de sécurité pour gérer les valeurs manquantes ou invalides:

### `safe_int(value, default=None)`
Convertit une valeur en entier de manière sécurisée:
- Gère les valeurs `None`, `pd.NA`, et NaN
- Retourne `default` si la conversion échoue
- Gère les valeurs non numériques (ex: "X2050458")

### `safe_float(value, default=0.0)`
Convertit une valeur en float de manière sécurisée:
- Même logique que `safe_int` mais pour les nombres décimaux

### `extract_scalar(val)`
Extrait une valeur scalaire depuis n'importe quel type:
- Gère les tableaux pandas (arrays)
- Convertit les listes d'un seul élément en scalaire
- Utilise `.item()` pour les types numpy
- Retourne une chaîne si multiple valeurs

### `get_clean_value(row_obj, key, default='')`
Obtient une valeur nettoyée depuis un dictionnaire:
- Extrait d'abord le scalaire
- Vérifie les valeurs manquantes
- Retourne la valeur par défaut si nécessaire

## Validation finale

Avant d'enregistrer dans Firebase, chaque enregistrement passe par une validation finale:

```python
for key, value in list(record.items()):
    if not isinstance(value, (str, int, float, bool, list, dict, type(None))):
        record[key] = str(value)
```

Cela garantit que tous les champs sont JSON-serializable pour Firebase.

## Stockage dans Firebase

Les données filtrées et agrégées sont stockées dans Firestore:

**Collection**: `government_data`  
**Document**: `current`  
**Champ**: `data` (array contenant tous les terrains)

Chaque synchronisation:
1. Télécharge le GPKG le plus récent
2. Filtre et agrège les données pour Val-d'Or
3. Compare avec les données existantes dans Firebase
4. Enregistre les nouvelles données si changements détectés
5. Met à jour les métadonnées de synchronisation

## Métadonnées de synchronisation

**Collection**: `sync_metadata`  
**Document**: `last_sync`  
**Champs**:
- `timestamp`: Date et heure de la dernière synchronisation
- `record_count`: Nombre de terrains dans la mise à jour
- `has_changes`: Booléen indiquant si des changements ont été détectés
- `status`: "success" ou "error"
- `error_message`: Message d'erreur si applicable

## Fréquence de synchronisation

Le script s'exécute automatiquement:
- **Mensuel**: Le 1er de chaque mois à 2h00 UTC via GitHub Actions
- **Manuel**: Via workflow dispatch dans l'interface GitHub Actions

## Dépendances Python

```txt
geopandas
pandas
firebase-admin
requests
fiona
```

Ces bibliothèques sont installées automatiquement par le workflow GitHub Actions depuis `requirements.txt`.

## Code source

Le code complet se trouve dans:
- **Script principal**: `scripts/sync_government_data.py`
- **Workflow GitHub**: `.github/workflows/sync-government-data.yml`

## Logs et débogage

Le script produit des logs détaillés:
- `📥` Téléchargement
- `📦` Extraction
- `🔍` Lecture des données
- `📊` Statistiques
- `✅` Succès
- `⚠️` Avertissements
- `❌` Erreurs

Ces logs sont visibles dans l'onglet "Actions" du repository GitHub.

---

**Date de création**: 2025-10-27  
**Dernière mise à jour**: 2025-10-27  
**Version du script**: 1.2 (avec corrections pandas array)
