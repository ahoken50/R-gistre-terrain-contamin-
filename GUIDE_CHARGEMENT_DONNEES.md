# 📊 Guide de chargement des données

## 🎯 Objectif

Ce guide explique comment charger les **vraies données** dans l'application au lieu d'utiliser les données de démonstration.

---

## 📋 Vue d'ensemble

L'application nécessite deux types de données :

1. **Données gouvernementales** : Provenant du registre officiel du Québec (GPKG)
2. **Données municipales** : Votre registre local de la ville de Val-d'Or

---

## 🔄 Processus complet

### Étape 1 : Obtenir les données gouvernementales

#### 1.1 Télécharger les données GPKG et générer l'Excel

```bash
# Exécuter le script de téléchargement et filtrage
python automate_registre_valdor.py
```

**Ce script va :**
- ✅ Télécharger le fichier GPKG officiel
- ✅ Filtrer les données pour Val-d'Or
- ✅ Générer `Registre-des-terrains-contamines-Valdor.xlsx`

#### 1.2 Convertir l'Excel en JSON pour l'application web

```bash
# Convertir le fichier Excel en JSON
python convert_excel_to_json.py
```

**Ce script va :**
- ✅ Lire le fichier Excel
- ✅ Convertir en format JSON
- ✅ Créer `public/data/government-data.json`

### Étape 2 : Charger les données municipales

#### 2.1 Préparer votre fichier de données municipales

**Option A : Utiliser un fichier CSV**

1. Créez un fichier `donnees-municipales.csv` avec vos données :

```csv
adresse,lot,reference,avis_decontamination,bureau_publicite,commentaires
"1185, des Foreurs","2299001","7610-08-01-17124-06","","12223243","Terrain commercial"
"1075, 3e Avenue","2297678","7610-08-01-12049-06","","","Ancien garage"
```

2. Utilisez le modèle fourni comme référence :
   - Copiez `template-donnees-municipales.csv`
   - Renommez en `donnees-municipales.csv`
   - Ajoutez vos données

#### 2.2 Convertir les données municipales en JSON

```bash
# Convertir le CSV en JSON
python load_municipal_data.py
```

**Ce script va :**
- ✅ Lire votre fichier CSV
- ✅ Valider les données
- ✅ Créer `public/data/municipal-data.json`

### Étape 3 : Activer le chargement des données dans l'application

#### 3.1 Remplacer le fichier JavaScript

```bash
# Sauvegarder l'ancien fichier
cp src/app.js src/app-old.js

# Utiliser la nouvelle version avec chargement de données
cp src/app-with-data-loading.js src/app.js
```

#### 3.2 Vérifier que les fichiers JSON existent

```bash
ls -la public/data/
# Vous devez voir :
# - municipal-data.json
# - government-data.json
```

### Étape 4 : Tester localement

```bash
# Démarrer le serveur local
npm start

# Ouvrir dans le navigateur : http://localhost:3000
```

**Vérifications :**
- ✅ Les statistiques affichent les vrais nombres
- ✅ Les tableaux contiennent vos données
- ✅ La date de dernière mise à jour est affichée
- ✅ Les filtres fonctionnent
- ✅ L'export PDF fonctionne

### Étape 5 : Déployer sur GitHub Pages

```bash
# Ajouter tous les fichiers
git add public/data/*.json src/app.js

# Committer
git commit -m "feat: Charger les vraies données dans l'application"

# Pousser vers GitHub
git push origin main
```

---

## 📁 Structure des fichiers

```
votre-projet/
├── public/
│   ├── data/
│   │   ├── municipal-data.json          ✅ Données municipales
│   │   └── government-data.json         ✅ Données gouvernementales
│   └── index.html
├── src/
│   ├── app.js                           ✅ Application avec chargement de données
│   ├── app-old.js                       📦 Sauvegarde (données simulées)
│   └── app-with-data-loading.js         📝 Version avec chargement
├── automate_registre_valdor.py          🔧 Script 1: GPKG → Excel
├── convert_excel_to_json.py             🔧 Script 2: Excel → JSON
├── load_municipal_data.py               🔧 Script 3: CSV → JSON
├── donnees-municipales.csv              📊 Vos données municipales
├── template-donnees-municipales.csv     📋 Modèle CSV
└── Registre-des-terrains-contamines-Valdor.xlsx  📄 Données Excel
```

---

## 🔄 Workflow de mise à jour des données

### Mise à jour hebdomadaire automatique (Données gouvernementales)

Le workflow GitHub Actions `auto-weekly.yml` s'exécute automatiquement chaque vendredi :

1. ✅ Télécharge les dernières données GPKG
2. ✅ Génère le fichier Excel
3. ✅ Crée un artefact téléchargeable

**Pour intégrer à l'application :**

```bash
# 1. Télécharger l'artefact depuis GitHub Actions
# 2. Convertir en JSON
python convert_excel_to_json.py

# 3. Committer et pousser
git add public/data/government-data.json
git commit -m "chore: Mise à jour des données gouvernementales"
git push origin main
```

### Mise à jour manuelle (Données municipales)

Quand vous ajoutez/modifiez des terrains municipaux :

```bash
# 1. Mettre à jour donnees-municipales.csv
# 2. Régénérer le JSON
python load_municipal_data.py

# 3. Committer et pousser
git add public/data/municipal-data.json
git commit -m "chore: Mise à jour des données municipales"
git push origin main
```

---

## 🔍 Format des données

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
      "commentaires": "Description du terrain"
    }
  ],
  "metadata": {
    "source": "Registre municipal - Ville de Val-d'Or",
    "total_records": 125,
    "last_update": "2024-10-17T10:30:00"
  }
}
```

### Données gouvernementales (government-data.json)

```json
{
  "data": [
    {
      "ID": "1",
      "Adresse": "1185, des Foreurs",
      "Ville": "Val-d'Or",
      "MRC": "La Vallée-de-l'Or",
      "Région": "Abitibi-Témiscamingue",
      "Code postal": "J9P 1K3",
      "Superficie": "5000",
      "État de contamination": "Actif",
      "Nature de la contamination": "Hydrocarbures",
      "Date création": "2020-01-15",
      "Date MAJ": "2024-10-15"
    }
  ],
  "metadata": {
    "source": "Registre des terrains contaminés - Gouvernement du Québec",
    "city": "Val-d'Or",
    "total_records": 89,
    "last_update": "2024-10-17T11:00:00"
  }
}
```

---

## ⚠️ Dépannage

### Problème : Les données ne s'affichent pas

**Solution 1 : Vérifier que les fichiers JSON existent**
```bash
ls -la public/data/
```

**Solution 2 : Vérifier le format JSON**
```bash
# Valider le JSON
python -m json.tool public/data/municipal-data.json
python -m json.tool public/data/government-data.json
```

**Solution 3 : Vérifier la console du navigateur**
- Ouvrez les outils de développement (F12)
- Regardez l'onglet Console pour les erreurs
- Vérifiez l'onglet Network pour voir si les fichiers sont chargés

### Problème : Erreur 404 sur les fichiers JSON

**Cause :** Les fichiers ne sont pas dans le bon dossier

**Solution :**
```bash
# Vérifier le chemin
cd public/data
ls -la

# Les fichiers doivent être là :
# municipal-data.json
# government-data.json
```

### Problème : Les statistiques affichent 0

**Cause :** Les données ne sont pas au bon format

**Solution :** Vérifiez que vos JSON ont la structure :
```json
{
  "data": [ ... ]
}
```

ou directement :
```json
[ ... ]
```

---

## 📝 Colonnes requises

### Données municipales (minimum)
- `adresse` : Adresse du terrain
- `lot` : Numéro de lot cadastral
- `reference` : Référence au registre gouvernemental
- `avis_decontamination` : Date d'avis (si décontaminé)
- `bureau_publicite` : Numéro d'inscription
- `commentaires` : Notes additionnelles

### Données gouvernementales (générées automatiquement)
- `ID` ou `gid` : Identifiant unique
- `Adresse` : Adresse complète
- `Ville` : Ville (Val-d'Or)
- `MRC` : MRC
- `Région` : Région administrative
- Autres champs selon le GPKG officiel

---

## 🎯 Checklist de déploiement

- [ ] Exécuter `python automate_registre_valdor.py`
- [ ] Exécuter `python convert_excel_to_json.py`
- [ ] Créer/mettre à jour `donnees-municipales.csv`
- [ ] Exécuter `python load_municipal_data.py`
- [ ] Copier `src/app-with-data-loading.js` vers `src/app.js`
- [ ] Vérifier que `public/data/` contient les 2 JSON
- [ ] Tester localement avec `npm start`
- [ ] Committer les fichiers JSON et app.js
- [ ] Pousser vers GitHub
- [ ] Vérifier le déploiement sur GitHub Pages

---

## 💡 Conseils

1. **Gardez vos données à jour** : Exécutez les scripts régulièrement
2. **Sauvegardez vos CSV** : Versionner `donnees-municipales.csv`
3. **Documentez vos changements** : Ajoutez des commentaires dans les commits
4. **Testez localement** : Toujours tester avant de déployer
5. **Automatisez** : Créez des scripts pour simplifier le workflow

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez ce guide en premier
2. Consultez la console du navigateur (F12)
3. Vérifiez les logs des scripts Python
4. Assurez-vous que tous les fichiers sont présents

---

**Date de création :** 2024-10-17  
**Version :** 1.0
