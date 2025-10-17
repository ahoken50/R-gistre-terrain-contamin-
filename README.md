# Application de Gestion des Terrains Contaminés

Cette application permet de consulter et gérer un répertoire de terrains contaminés en comparant les données municipales avec le registre officiel du gouvernement du Québec.

## Fonctionnalités

- Interface web avec plusieurs onglets pour différentes catégories de terrains
- Comparaison automatique des données municipales avec le registre gouvernemental
- Filtrage des données par différents critères
- Export des données en PDF
- Génération de rapports pour les demandes d'accès à l'information
- Synchronisation mensuelle avec le registre officiel

## Structure de l'application

```
contaminated-lands-app/
├── public/
│   └── index.html          # Page principale de l'application
├── src/
│   ├── app.js             # Logique principale de l'application
│   └── firebase.js       # Configuration Firebase
├── functions/
│   ├── monthly-sync.js    # Fonction de synchronisation mensuelle
│   └── municipal-data.js # Fonction de gestion des données municipales
├── package.json          # Dépendances et scripts npm
└── README.md             # Documentation du projet
```

## Installation locale

1. Clonez le dépôt :
   ```
   git clone [URL_DU_DEPOT]
   ```

2. Installez les dépendances :
   ```
   cd contaminated-lands-app
   npm install
   ```

3. Démarrez l'application :
   ```
   npm start
   ```

4. Accédez à l'application via votre navigateur à l'adresse `http://localhost:3000`

## Déploiement via GitHub

Cette application est conçue pour être déployée via GitHub Pages. Pour déployer :

1. Créez un nouveau dépôt sur GitHub
2. Poussez le code vers ce dépôt
3. Configurez GitHub Pages pour utiliser la branche `main` et le dossier `/public`

## Configuration Firebase

Pour utiliser Firebase, vous devez :

1. Créer un projet Firebase
2. Remplacer les informations de configuration dans `src/firebase.js` avec celles de votre projet
3. Activer Firestore et Storage dans la console Firebase

## Synchronisation mensuelle

La synchronisation mensuelle avec le registre gouvernemental est gérée par le fichier `functions/monthly-sync.js`. Dans un environnement de production, cette fonction devrait être exécutée via un service planifié comme Cloud Functions ou un cron job.

## Technologies utilisées

- HTML5, CSS3, JavaScript (ES6+)
- Bootstrap 5 pour l'interface
- Firebase pour le backend
- jsPDF pour l'export PDF
- PapaParse pour le traitement CSV
- GDAL pour le traitement des fichiers GPKG

## Auteur

[Votre nom ou le nom de votre entreprise]

## Licence

[Spécifiez la licence si applicable]