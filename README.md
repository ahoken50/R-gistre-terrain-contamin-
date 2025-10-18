# Application de Gestion des Terrains Contaminés

Cette application permet de consulter et de comparer les terrains contaminés recensés par la Ville de Val-d'Or avec le registre officiel du gouvernement du Québec. Elle est optimisée pour un flux de travail 100 % statique : les données sont consolidées dans des fichiers JSON consommés directement par l'interface web.

## Fonctionnalités principales

- 🎯 Vue synthétique des terrains municipaux, du registre gouvernemental et des écarts
- 🔍 Filtres instantanés sur l'adresse, le lot ou la référence MENVIQ
- 📄 Export PDF des tableaux et génération d'un rapport prêt pour les demandes d'accès à l'information
- 🗂️ Interface de dépôt acceptant les fichiers **CSV** et **Excel** pour les données municipales
- 🔁 Script Python automatisé pour télécharger et filtrer le registre gouvernemental (mise à jour mensuelle)

## Structure du projet

```
contaminated-lands-app/
├── index.html                 # Application principale (entrée Vite)
├── upload-data.html           # Page d'import municipal (entrée Vite)
├── public/
│   └── data/
│       ├── government-data.json
│       └── municipal-data.json
├── src/
│   ├── app.js                 # Logique de l'application principale
│   └── upload.js              # Logique de l'interface d'import
├── scripts/
│   └── health-check.js        # Vérifications automatiques (npm test)
├── functions/
│   ├── monthly-sync.js        # Wrapper Node pour la synchro mensuelle
│   └── municipal-data.js      # Wrapper Node pour la génération municipale
├── download_gov_data.py       # Pipeline GPKG → JSON pour Val-d'Or
├── load_municipal_data.py     # Pipeline CSV → JSON (fallback CLI)
├── Registre-des-terrains-contamines-Valdor.xlsx  # Export Excel généré
├── vite.config.js             # Configuration Vite multi-pages
└── package.json
```

## Mise en route

```bash
npm install          # installe les dépendances front-end
npm run dev          # lance le serveur de développement (Vite)
# http://localhost:5173 pour l'application principale

npm run build        # génère la version de production dans dist/
npm run preview      # prévisualise le build localement
```

## Données municipales

### Option 1 : Interface web

1. Rendez-vous sur [`/upload-data.html`](./upload-data.html) (liens disponibles depuis l'application principale).
2. Déposez un fichier **CSV, XLS ou XLSX** contenant les colonnes suivantes (dans l'ordre) :
   `adresse, lot, reference, avis_decontamination, bureau_publicite, commentaires`
3. Vérifiez l'aperçu puis téléchargez `municipal-data.json`.
4. Remplacez `public/data/municipal-data.json` par le fichier téléchargé et déployez.

### Option 2 : Ligne de commande

1. Préparez un fichier `donnees-municipales.csv` (UTF-8, en-têtes identiques au modèle).
2. Exécutez :
   ```bash
   python load_municipal_data.py
   ```
3. Le script produit `public/data/municipal-data.json` et affiche un aperçu.

La commande `node functions/municipal-data.js` est un simple alias vers le script Python pour intégration dans des automatisations Node.

## Données gouvernementales (mise à jour mensuelle)

Le script Python `download_gov_data.py` :

1. Télécharge le fichier officiel GPKG (plus de 10 000 enregistrements).
2. Filtre automatiquement les enregistrements correspondant à la ville de **Val-d'Or** (35 entrées au 18/10/2025) en se basant sur l'adresse et la MRC « La Vallée-de-l'Or ».
3. Génère :
   - `public/data/government-data.json` (consommé par l'application)
   - `Registre-des-terrains-contamines-Valdor.xlsx` (export Excel complet)

```bash
python download_gov_data.py    # à exécuter une fois par mois
```

Pour une exécution planifiée côté Node (CI/CD, cron, etc.) :

```bash
node functions/monthly-sync.js
```

## Vérifications automatiques

Un test léger assure que les fichiers JSON critiques sont présents et correctement parsés :

```bash
npm test
```

La commande vérifie `public/data/municipal-data.json` et `public/data/government-data.json` et renvoie un code de sortie non nul en cas de problème.

## Technologies utilisées

- **Vite** + ES modules pour le développement front-end
- **Bootstrap 5** pour l'interface utilisateur
- **jsPDF** & **jspdf-autotable** pour les exports PDF
- **PapaParse** & **SheetJS (xlsx)** pour l'import CSV/Excel côté navigateur
- **GeoPandas / Pyogrio / Shapely** pour le traitement du GPKG gouvernemental
- **Pandas** pour la génération de JSON/Excel

## Bonnes pratiques de déploiement

1. `python download_gov_data.py`
2. Mettre à jour les données municipales via l'interface ou `load_municipal_data.py`
3. `npm test`
4. `npm run build`
5. Déployer le contenu de `dist/` (ou configurer votre pipeline CI/CD en conséquence)

## Licence

Précisez ici la licence retenue pour le projet (ex. MIT, Apache 2.0, etc.).
