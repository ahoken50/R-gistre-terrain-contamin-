# 🎯 Guide d'utilisation complet - Application Terrains Contaminés

## ✅ Ce qui est maintenant disponible

### 1. 📊 Application web fonctionnelle
- **URL (après déploiement)** : `https://ahoken50.github.io/R-gistre-terrain-contamin-/`
- Interface Bootstrap moderne et responsive
- 4 onglets : Municipal, Gouvernemental, Non officiels, Décontaminés
- Filtres de recherche par adresse, lot, référence
- Export PDF pour chaque catégorie
- Statistiques en temps réel

### 2. 🌐 Données gouvernementales chargées
- ✅ **65 enregistrements** du registre officiel du Québec
- Téléchargés automatiquement depuis données.québec.ca
- Format JSON prêt à l'emploi
- Fichier : `public/data/government-data.json`

### 3. 📤 Interface de chargement des données municipales
- **URL** : `upload-data.html`
- Glissez-déposez votre fichier CSV
- Aperçu des données avant téléchargement
- Génère automatiquement le fichier JSON
- Modèle CSV téléchargeable

### 4. 🔧 Scripts automatisés
- `download_gov_data.py` : Télécharge et convertit les données GPKG
- `load_municipal_data.py` : Convertit vos CSV en JSON
- `convert_excel_to_json.py` : Convertit Excel en JSON
- Tous les scripts sont prêts à l'emploi

---

## 🚀 Comment utiliser l'application

### Option A : Via l'interface web (Plus simple)

1. **Aller sur la page de chargement**
   - Ouvrir `https://votre-site.github.io/upload-data.html`
   - Ou cliquer sur "📤 Charger vos données municipales" dans l'application

2. **Préparer votre fichier CSV**
   ```csv
   adresse,lot,reference,avis_decontamination,bureau_publicite,commentaires
   "1185, des Foreurs","2299001","7610-08-01-17124-06","","12223243","Description"
   ```
   - Téléchargez le modèle depuis l'interface
   - Remplacez avec vos vraies données

3. **Charger le fichier**
   - Glissez-déposez votre CSV dans la zone prévue
   - Vérifiez l'aperçu des données
   - Cliquez sur "💾 Télécharger municipal-data.json"

4. **Déployer**
   ```bash
   # Placez le fichier téléchargé dans public/data/
   cp ~/Downloads/municipal-data.json public/data/
   
   # Commitez et poussez
   git add public/data/municipal-data.json
   git commit -m "chore: Mise à jour données municipales"
   git push origin main
   ```

### Option B : Via les scripts Python (Pour automatisation)

1. **Créer votre fichier CSV**
   ```bash
   cp template-donnees-municipales.csv donnees-municipales.csv
   nano donnees-municipales.csv  # Éditez avec vos données
   ```

2. **Convertir en JSON**
   ```bash
   python3 load_municipal_data.py
   ```

3. **Déployer**
   ```bash
   git add public/data/municipal-data.json
   git commit -m "chore: Mise à jour données municipales"
   git push origin main
   ```

---

## 📋 Format des données municipales

### Colonnes requises (dans cet ordre)

| Colonne | Description | Exemple | Obligatoire |
|---------|-------------|---------|-------------|
| `adresse` | Adresse du terrain | "1185, des Foreurs" | ✅ Oui |
| `lot` | Numéro de lot cadastral | "2299001" | ✅ Oui |
| `reference` | Référence au registre gouvernemental | "7610-08-01-17124-06" | ⚠️ Non (vide si non officiel) |
| `avis_decontamination` | Date d'avis si décontaminé | "2024-01-15" ou vide | ⚠️ Non |
| `bureau_publicite` | Numéro d'inscription | "12223243" | ⚠️ Non |
| `commentaires` | Notes additionnelles | "Ancien garage" | ⚠️ Non |

### Exemple de fichier CSV complet

```csv
adresse,lot,reference,avis_decontamination,bureau_publicite,commentaires
"1185, des Foreurs","2299001","7610-08-01-17124-06","","12223243","Terrain commercial"
"1075, 3e Avenue","2297678","7610-08-01-12049-06","","","Ancien garage"
"912, 3e Avenue","2297604","","","12343867","Station-service - Non au registre officiel"
"725, 3e Avenue","2297570","7610-08-01-12059-08","","","Zone industrielle"
"500, rue Principale","1234567","7610-08-01-12345-01","2024-01-15","9876543","Terrain décontaminé"
```

---

## 🔄 Mise à jour des données gouvernementales

### Automatique (recommandé)

Le workflow GitHub Actions télécharge automatiquement les données **chaque vendredi** :

1. Le workflow exécute `automate_registre_valdor.py`
2. Un artefact Excel est généré
3. **Vous devez** :
   - Télécharger l'artefact depuis GitHub Actions
   - Exécuter : `python3 convert_excel_to_json.py`
   - Committer le JSON mis à jour

### Manuelle

```bash
# Télécharger les dernières données
python3 download_gov_data.py

# Le script :
# - Télécharge le GPKG depuis données.québec.ca
# - Filtre pour votre région (ou tout le Québec)
# - Convertit automatiquement en JSON
# - Place le fichier dans public/data/government-data.json

# Committer
git add public/data/government-data.json
git commit -m "chore: Mise à jour données gouvernementales"
git push origin main
```

---

## 📊 Structure des données

### Données gouvernementales (government-data.json)

```json
{
  "data": [
    {
      "NO_MEF_LIEU": "90492539",
      "LATITUDE": 45.5751271636,
      "LONGITUDE": -73.6992551634,
      "ADR_CIV_LIEU": "1060, boulevard des Laurentides...",
      "CODE_POST_LIEU": "H7G 2W1",
      "LST_MRC_REG_ADM": "650 - Ville de Laval, 13 - Laval",
      "DESC_MILIEU_RECEPT": "Sol",
      "NB_FICHES": 1.0
    }
  ],
  "metadata": {
    "source": "Registre des terrains contaminés - Gouvernement du Québec",
    "total_records": 65,
    "last_update": "2024-10-17T10:30:00"
  }
}
```

### Données municipales (municipal-data.json)

```json
{
  "data": [
    {
      "adresse": "1185, des Foreurs",
      "lot": "2299001",
      "reference": "7610-08-01-17124-06",
      "avis_decontamination": "",
      "bureau_publicite": "12223243",
      "commentaires": "Terrain commercial"
    }
  ],
  "metadata": {
    "source": "Registre municipal - Ville de Val-d'Or",
    "total_records": 125,
    "last_update": "2024-10-17T10:30:00"
  }
}
```

---

## 🎯 Fonctionnalités de l'application

### 1. Visualisation des données

- **Onglet Municipal** : Tous vos terrains municipaux
- **Onglet Gouvernemental** : Registre officiel du Québec
- **Onglet Non officiels** : Terrains municipaux absents du registre officiel
- **Onglet Décontaminés** : Terrains avec date d'avis de décontamination

### 2. Recherche et filtrage

- Filtrer par **adresse**
- Filtrer par **lot cadastral**
- Filtrer par **référence**
- Filtres en temps réel

### 3. Statistiques

- Nombre total de terrains municipaux
- Nombre total de terrains gouvernementaux
- Nombre de terrains non officiels
- Nombre de terrains décontaminés

### 4. Export

- **Export PDF** : Pour chaque catégorie
- **Rapport d'accès à l'information** : Rapport complet formaté

### 5. Comparaison automatique

L'application compare automatiquement :
- Références entre données municipales et gouvernementales
- Identifie les terrains municipaux non présents au registre officiel
- Détecte les terrains décontaminés (avec date d'avis)

---

## 📁 Architecture des fichiers

```
R-gistre-terrain-contamin-/
├── 📂 public/                          # Application web déployée
│   ├── index.html                      # Page principale
│   ├── upload-data.html                # Interface de chargement
│   └── data/
│       ├── municipal-data.json         # VOS données municipales
│       └── government-data.json        # Données gouvernementales
│
├── 📂 src/                             # Code source JavaScript
│   ├── app.js                          # Application (charge JSON)
│   ├── app-with-mock-data.js           # Sauvegarde (données simulées)
│   └── firebase.js                     # Configuration Firebase (future)
│
├── 🔧 Scripts Python
│   ├── download_gov_data.py            # ⭐ Télécharge données GPKG
│   ├── load_municipal_data.py          # Convertit CSV → JSON
│   ├── convert_excel_to_json.py        # Convertit Excel → JSON
│   └── automate_registre_valdor.py     # Script original GPKG
│
├── 📊 Données sources
│   ├── donnees-municipales.csv         # VOS données (à créer)
│   ├── template-donnees-municipales.csv # Modèle CSV
│   └── Registre-des-terrains-contamines-Valdor.xlsx
│
├── 📚 Documentation
│   ├── README.md                       # Documentation principale
│   ├── GUIDE_CHARGEMENT_DONNEES.md     # Guide de chargement
│   ├── GUIDE_UTILISATION_COMPLET.md    # Ce fichier
│   ├── INSTRUCTIONS_DEPLOYMENT.md      # Déploiement GitHub Pages
│   └── RESUME_MODIFICATIONS.md         # Résumé des modifications
│
└── 📂 .github/workflows/               # GitHub Actions
    ├── auto-weekly.yml                 # Mise à jour hebdomadaire
    └── deploy-pages.yml                # Déploiement (à créer)
```

---

## 🔗 Liens importants

- **Pull Request** : https://github.com/ahoken50/R-gistre-terrain-contamin-/pull/2
- **Application (après merge)** : https://ahoken50.github.io/R-gistre-terrain-contamin-/
- **Interface de chargement** : https://ahoken50.github.io/R-gistre-terrain-contamin-/upload-data.html
- **Données Québec** : https://www.donneesquebec.ca/recherche/dataset/repertoire-des-terrains-contamines-gtc

---

## ⚡ Actions rapides

### Charger vos données municipales maintenant

1. Téléchargez le modèle : https://votre-site/upload-data.html
2. Remplissez avec vos données
3. Uploadez et téléchargez le JSON
4. Commitez et push

### Mettre à jour les données gouvernementales

```bash
python3 download_gov_data.py
git add public/data/government-data.json
git commit -m "chore: Mise à jour données gouvernementales"
git push origin main
```

### Déployer l'application

1. Mergez la PR #2
2. Configurez GitHub Pages (Settings > Pages > GitHub Actions)
3. Créez le workflow `deploy-pages.yml` (voir INSTRUCTIONS_DEPLOYMENT.md)
4. Attendez le déploiement (2-3 minutes)
5. Accédez à votre site !

---

## 🆘 Support et dépannage

### Problème : Les données ne s'affichent pas

**Solution** :
1. Vérifiez que les fichiers JSON existent dans `public/data/`
2. Validez le format JSON : `python -m json.tool public/data/municipal-data.json`
3. Ouvrez la console du navigateur (F12) pour voir les erreurs

### Problème : Le CSV ne se charge pas dans l'interface

**Solution** :
1. Vérifiez que les colonnes sont dans le bon ordre
2. Assurez-vous que les valeurs avec virgules sont entre guillemets
3. Téléchargez et utilisez le modèle fourni

### Problème : GitHub Pages affiche toujours le README

**Solution** :
1. Vérifiez que la PR #2 est mergée
2. Vérifiez que `public/` existe dans la branche `main`
3. Configurez GitHub Pages sur "GitHub Actions"
4. Créez le workflow `deploy-pages.yml`

---

## 💡 Conseils et bonnes pratiques

1. **Sauvegardez toujours** votre CSV municipal avant de le modifier
2. **Testez localement** avant de déployer : `npm start`
3. **Commitez régulièrement** vos mises à jour de données
4. **Documentez vos modifications** dans les messages de commit
5. **Vérifiez les statistiques** après chaque mise à jour

---

## 🎉 C'est prêt !

Votre application est maintenant :
- ✅ Fonctionnelle avec vraies données gouvernementales
- ✅ Prête à recevoir vos données municipales
- ✅ Dotée d'une interface de chargement conviviale
- ✅ Automatisée pour les mises à jour
- ✅ Documentée complètement

**Prochaine étape** : Mergez la PR #2 et commencez à charger vos données municipales !

---

**Version** : 1.0  
**Date** : 2024-10-17  
**Statut** : Prêt pour production
