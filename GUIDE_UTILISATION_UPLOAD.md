# Guide d'Utilisation - Page de Chargement des Données Municipales

## 🎯 Objectif
Cette page permet de charger facilement les données municipales des terrains contaminés directement dans Firebase, sans avoir besoin de manipuler des fichiers JSON ou de faire des commits Git.

## 📋 Prérequis
- Un fichier CSV ou Excel contenant les données municipales
- Les colonnes requises : `adresse`, `lot`, `reference`, `avis_decontamination`, `bureau_publicite`, `commentaires`
- Une connexion Internet pour accéder à Firebase

## 🚀 Étapes d'Utilisation

### Étape 1 : Accéder à la Page
1. Ouvrir le fichier `upload-data.html` dans votre navigateur
2. Vérifier que l'indicateur en haut à droite affiche : **🟢 Firebase connecté**

### Étape 2 : Préparer vos Données

#### Option A : Utiliser le Modèle
1. Cliquer sur le bouton **"📥 Télécharger le modèle CSV"**
2. Ouvrir le fichier téléchargé dans Excel ou un éditeur de texte
3. Remplacer les données d'exemple par vos données réelles
4. Sauvegarder le fichier

#### Option B : Préparer votre Propre Fichier
Créer un fichier CSV ou Excel avec les colonnes suivantes (dans cet ordre) :

| adresse | lot | reference | avis_decontamination | bureau_publicite | commentaires |
|---------|-----|-----------|---------------------|------------------|--------------|
| 1185, des Foreurs | 2299001 | 7610-08-01-17124-06 | | 12223243 | Terrain commercial |
| 1075, 3e Avenue | 2297678 | 7610-08-01-12049-06 | | | Ancien garage |

**Notes importantes** :
- Les colonnes vides sont permises
- Les adresses doivent être entre guillemets si elles contiennent des virgules
- Le format CSV doit utiliser la virgule comme séparateur

### Étape 3 : Charger le Fichier

#### Méthode 1 : Glisser-Déposer
1. Glisser votre fichier CSV ou Excel depuis l'explorateur de fichiers
2. Déposer le fichier dans la zone bleue avec le texte "📁 Glissez-déposez votre fichier..."

#### Méthode 2 : Sélection Manuelle
1. Cliquer sur la zone bleue
2. Sélectionner votre fichier dans la fenêtre qui s'ouvre
3. Cliquer sur "Ouvrir"

### Étape 4 : Vérifier l'Aperçu
Après le chargement du fichier, vous verrez :
- **Le nombre d'enregistrements** chargés (affiché en grand)
- **Un tableau d'aperçu** montrant les 10 premiers enregistrements
- **Les colonnes détectées** dans votre fichier

**Vérifications à faire** :
- ✅ Le nombre d'enregistrements correspond à vos attentes
- ✅ Les données s'affichent correctement dans le tableau
- ✅ Toutes les colonnes requises sont présentes
- ✅ Pas de message d'erreur rouge

### Étape 5 : Charger dans Firebase
1. Cliquer sur le bouton **"🔥 Charger dans Firebase"**
2. Attendre l'animation de chargement (quelques secondes)
3. Un message de succès vert apparaîtra : **"✅ Données chargées avec succès dans Firebase !"**

### Étape 6 : Vérifier dans l'Application
1. Cliquer sur le bouton **"🚀 Voir dans l'application"**
2. L'application principale s'ouvrira
3. Vérifier l'onglet **"Données Municipales"** pour voir vos données

## 💾 Sauvegarde (Optionnel mais Recommandé)

### Télécharger un Backup JSON
1. Après avoir chargé vos données, cliquer sur **"💾 Télécharger JSON (backup)"**
2. Un fichier `municipal-data.json` sera téléchargé
3. Conserver ce fichier comme sauvegarde

**Utilité du backup** :
- Restauration en cas de problème
- Partage avec d'autres utilisateurs
- Historique des versions
- Migration vers un autre système

## 🔄 Mettre à Jour les Données

Pour mettre à jour les données existantes :
1. Préparer un nouveau fichier avec les données mises à jour
2. Suivre les mêmes étapes que pour le chargement initial
3. Les nouvelles données **remplaceront complètement** les anciennes

**⚠️ Important** : Le chargement remplace toutes les données existantes. Assurez-vous que votre nouveau fichier contient TOUTES les données, pas seulement les modifications.

## ❌ Annuler un Chargement

Si vous avez chargé un fichier par erreur :
1. Cliquer sur le bouton **"❌ Annuler"**
2. L'aperçu sera effacé
3. Vous pouvez charger un nouveau fichier

**Note** : Si vous avez déjà cliqué sur "Charger dans Firebase", vous devrez recharger les bonnes données pour remplacer les mauvaises.

## 🐛 Résolution des Problèmes

### Erreur : "Colonnes manquantes"
**Cause** : Votre fichier ne contient pas toutes les colonnes requises

**Solution** :
1. Télécharger le modèle CSV
2. Vérifier l'orthographe exacte des en-têtes de colonnes
3. S'assurer que les colonnes sont dans le bon ordre

### Erreur : "Format non supporté"
**Cause** : Le fichier n'est pas au format CSV ou Excel

**Solution** :
- Utiliser uniquement les formats : `.csv`, `.xlsx`, `.xls`
- Si vous avez un fichier texte, le renommer en `.csv`

### Erreur : "Erreur lors du chargement dans Firebase"
**Cause** : Problème de connexion ou de permissions Firebase

**Solution** :
1. Vérifier votre connexion Internet
2. Rafraîchir la page (F5)
3. Vérifier que l'indicateur Firebase est vert
4. Contacter l'administrateur si le problème persiste

### Problème : Les données ne s'affichent pas dans l'application
**Solution** :
1. Rafraîchir la page de l'application (F5)
2. Vider le cache du navigateur (Ctrl+Shift+Delete)
3. Vérifier la console du navigateur (F12) pour les erreurs

### Problème : "🔴 Firebase non connecté"
**Solution** :
1. Vérifier votre connexion Internet
2. Rafraîchir la page
3. Vérifier que Firebase n'est pas bloqué par un pare-feu
4. Essayer avec un autre navigateur

## 📊 Exemple de Fichier CSV Complet

```csv
adresse,lot,reference,avis_decontamination,bureau_publicite,commentaires
"1185, des Foreurs","2299001","7610-08-01-17124-06","","12223243","Terrain commercial"
"1075, 3e Avenue","2297678","7610-08-01-12049-06","","","Ancien garage"
"912, 3e Avenue","2297604","","","12343867","Station-service désaffectée"
"725, 3e Avenue","2297570","7610-08-01-12059-08","","","Zone industrielle"
"500, rue Principale","2297500","7610-08-01-12060-09","Oui","12345678","Terrain résidentiel décontaminé"
```

## 🔐 Sécurité et Confidentialité

- Les données sont stockées dans Firebase Firestore
- La connexion est sécurisée (HTTPS)
- Seules les personnes ayant accès à l'URL peuvent charger des données
- Pour la production, il est recommandé d'ajouter une authentification

## 📞 Support

En cas de problème :
1. Consulter ce guide
2. Vérifier la section "Résolution des Problèmes"
3. Consulter le fichier `DIAGNOSTIC_FIREBASE.md` pour plus de détails techniques
4. Contacter l'administrateur système

## 🎓 Conseils et Bonnes Pratiques

1. **Toujours faire un backup** avant de charger de nouvelles données
2. **Vérifier l'aperçu** avant de charger dans Firebase
3. **Utiliser le modèle CSV** pour éviter les erreurs de format
4. **Documenter les changements** dans les commentaires
5. **Tester avec un petit fichier** avant de charger toutes les données
6. **Conserver les versions précédentes** des fichiers JSON

## 📈 Workflow Recommandé

```
1. Préparer les données dans Excel
   ↓
2. Exporter en CSV avec les bonnes colonnes
   ↓
3. Charger dans upload-data.html
   ↓
4. Vérifier l'aperçu
   ↓
5. Télécharger le backup JSON
   ↓
6. Charger dans Firebase
   ↓
7. Vérifier dans l'application
   ↓
8. Archiver le backup JSON avec la date
```

## ✅ Checklist de Chargement

Avant de charger vos données, vérifier :
- [ ] Le fichier contient toutes les colonnes requises
- [ ] Les données sont complètes et à jour
- [ ] L'indicateur Firebase est vert
- [ ] L'aperçu affiche correctement les données
- [ ] Un backup des données précédentes a été fait (si applicable)
- [ ] Le nombre d'enregistrements est correct

Après le chargement :
- [ ] Le message de succès est affiché
- [ ] Les données apparaissent dans l'application
- [ ] Un backup JSON a été téléchargé
- [ ] Les statistiques sont correctes dans l'application