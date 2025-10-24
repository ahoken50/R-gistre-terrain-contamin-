# 🗂️ Registre des Terrains Contaminés - Val-d'Or

Application web moderne pour la gestion et la visualisation du registre des terrains contaminés de la Ville de Val-d'Or.

## 🌐 Application en Ligne

**URL** : https://ahoken50.github.io/R-gistre-terrain-contamin-/

## ✨ Fonctionnalités Principales

### 📊 Visualisation des Données
- **Données Municipales** : Registre complet des 27 terrains contaminés de Val-d'Or
- **Données Gouvernementales** : Intégration avec le registre provincial (MELCCFP)
- **Terrains Décontaminés** : Suivi des terrains ayant complété leur réhabilitation avec validation

### 🔍 Recherche et Filtres
- Filtrage par adresse, lot, référence
- Recherche en temps réel
- Tri des colonnes

### 📄 Exports et Rapports
- Export PDF pour chaque catégorie
- Génération de rapports complets
- Statistiques détaillées

### 🔥 Gestion des Données
- **Interface de chargement** : Upload de fichiers CSV/Excel directement dans Firebase
- **Diagnostic Firebase** : Outils de test et vérification de connexion
- **Synchronisation** : Mise à jour automatique des données

## 🚀 Démarrage Rapide

### Pour les Utilisateurs

1. **Accéder à l'application** : https://ahoken50.github.io/R-gistre-terrain-contamin-/
2. **Charger des données** : Utiliser [upload-data.html](https://ahoken50.github.io/R-gistre-terrain-contamin-/upload-data.html)
3. **Tester Firebase** : Utiliser [test-firebase-connection.html](https://ahoken50.github.io/R-gistre-terrain-contamin-/test-firebase-connection.html)

### Pour les Développeurs

```bash
# Cloner le repository
git clone https://github.com/ahoken50/R-gistre-terrain-contamin-.git
cd R-gistre-terrain-contamin-

# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Build pour production
npm run build
```

## 📚 Documentation

### Guides Utilisateurs
- **[Guide d'Utilisation Complet](GUIDE_UTILISATION_COMPLET.md)** - Guide complet de l'application
- **[Guide de Chargement des Données](GUIDE_UTILISATION_UPLOAD.md)** - Comment charger des données dans Firebase
- **[Guide des Données Complètes](GUIDE_CHARGEMENT_DONNEES_COMPLETES.md)** - Utilisation des fichiers CSV

### Documentation Technique
- **[Configuration Firebase](FIREBASE_SETUP.md)** - Configuration de Firebase Firestore
- **[Diagnostic Firebase](DIAGNOSTIC_FIREBASE.md)** - Résolution des problèmes Firebase
- **[Changements Firebase](CHANGEMENTS_FIREBASE.md)** - Historique des modifications
- **[Instructions Finales](INSTRUCTIONS_FINALES.md)** - Instructions de déploiement

### Résumés
- **[Résumé de la Solution](RESUME_SOLUTION.md)** - Vue d'ensemble des solutions implémentées

## 🛠️ Structure du Projet

```
R-gistre-terrain-contamin-/
├── index.html                          # Application principale
├── upload-data.html                    # Interface de chargement des données
├── test-firebase-connection.html       # Page de diagnostic Firebase
├── src/
│   ├── app.js                         # Logique principale de l'application
│   ├── firebase.js                    # Configuration et fonctions Firebase
│   └── upload.js                      # Logique de chargement des données
├── public/
│   ├── assets/                        # Images et ressources
│   └── data/                          # Fichiers de données JSON (fallback)
├── convert_municipal_register.py      # Script de conversion du registre municipal
├── convert_to_municipal_format.py     # Script de conversion du registre gouvernemental
├── Registre des terrains contamines.xls  # Registre municipal officiel
└── donnees-municipales-valdor.csv     # Données municipales au format CSV

Documentation/
├── GUIDE_UTILISATION_COMPLET.md
├── GUIDE_UTILISATION_UPLOAD.md
├── GUIDE_CHARGEMENT_DONNEES_COMPLETES.md
├── FIREBASE_SETUP.md
├── DIAGNOSTIC_FIREBASE.md
├── CHANGEMENTS_FIREBASE.md
├── INSTRUCTIONS_FINALES.md
└── RESUME_SOLUTION.md
```

## 📦 Technologies Utilisées

- **Frontend** : HTML5, CSS3, JavaScript (ES6+)
- **Base de données** : Firebase Firestore
- **Build Tool** : Vite
- **Déploiement** : GitHub Pages
- **Bibliothèques** :
  - jsPDF (génération de PDF)
  - PapaParse (parsing CSV)
  - XLSX (lecture Excel)

## 🔧 Scripts Disponibles

### Conversion de Données

```bash
# Convertir le registre municipal Excel en CSV
python3 convert_municipal_register.py

# Convertir le registre gouvernemental Excel en CSV
python3 convert_to_municipal_format.py
```

### Développement

```bash
# Démarrer le serveur de développement
npm run dev

# Build pour production
npm run build

# Prévisualiser le build
npm run preview
```

## 🔥 Configuration Firebase

### Variables d'Environnement

Créer un fichier `.env.local` avec :

```env
VITE_FIREBASE_API_KEY=votre_api_key
```

### Règles Firestore (Développement)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Règles Firestore (Production - Recommandé)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 📊 Données

### Registre Municipal
- **Fichier source** : `Registre des terrains contamines.xls`
- **Fichier CSV** : `donnees-municipales-valdor.csv`
- **Nombre de terrains** : 27
- **Colonnes** : adresse, lot, reference, avis_decontamination, bureau_publicite, commentaires

### Registre Gouvernemental
- **Source** : MELCCFP (Ministère de l'Environnement)
- **Mise à jour** : Automatique via l'application
- **Nombre de terrains** : ~35 pour Val-d'Or

## 🚀 Déploiement

L'application est déployée automatiquement sur GitHub Pages à chaque push sur la branche `main`.

### Processus de Déploiement

1. Push vers `main`
2. GitHub Actions build l'application
3. Déploiement sur GitHub Pages
4. Application disponible à : https://ahoken50.github.io/R-gistre-terrain-contamin-/

## 🐛 Résolution des Problèmes

### Problèmes de Connexion Firebase
1. Utiliser [test-firebase-connection.html](https://ahoken50.github.io/R-gistre-terrain-contamin-/test-firebase-connection.html)
2. Vérifier les règles Firestore
3. Consulter [DIAGNOSTIC_FIREBASE.md](DIAGNOSTIC_FIREBASE.md)

### Problèmes de Chargement de Données
1. Vérifier le format du fichier CSV
2. Consulter [GUIDE_UTILISATION_UPLOAD.md](GUIDE_UTILISATION_UPLOAD.md)
3. Utiliser le modèle CSV fourni dans l'interface

### Problèmes d'Affichage
1. Vider le cache du navigateur (Ctrl+Shift+Delete)
2. Rafraîchir la page (F5)
3. Vérifier la console du navigateur (F12)

## 🤝 Contribution

Pour contribuer au projet :

1. Fork le repository
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📝 Licence

© 2024 Ville de Val-d'Or. Tous droits réservés.

## 📞 Support

Pour toute question ou problème :
- Consulter la [documentation](GUIDE_UTILISATION_COMPLET.md)
- Créer une [issue](https://github.com/ahoken50/R-gistre-terrain-contamin-/issues)
- Contacter l'administrateur système de la Ville de Val-d'Or

## 🎯 Roadmap

- [ ] Authentification utilisateur
- [ ] Historique des modifications
- [ ] Notifications automatiques
- [ ] Export Excel
- [ ] API REST
- [ ] Application mobile

---

**Version** : 2.0.0  
**Dernière mise à jour** : Octobre 2024  
**Statut** : ✅ Production