# Guide de Chargement des Données Complètes

## 📋 Fichier Généré

Un nouveau fichier CSV a été créé : **`donnees-municipales-completes.csv`**

Ce fichier contient **35 enregistrements** avec toutes les informations disponibles du registre gouvernemental, converties au format municipal.

## 📊 Contenu du Fichier

### Colonnes Remplies Automatiquement

1. **adresse** : Adresse complète du terrain (depuis ADR_CIV_LIEU)
   - Exemple : "1185, rue des Foreurs, Val-d'Or (Québec)"

2. **reference** : Numéro de référence gouvernemental (depuis NO_MEF_LIEU)
   - Exemple : "X2059220"

3. **avis_decontamination** : Statut de décontamination (depuis ETAT_REHAB)
   - "Décontamination terminée" (pour les terrains réhabilités)
   - "Décontamination en cours" (pour les terrains en cours de réhabilitation)
   - "Décontamination requise" (pour les terrains non débutés)
   - "Décontamination non nécessaire" (pour les terrains sans besoin)

4. **commentaires** : Informations détaillées incluant :
   - Référence gouvernementale
   - État de réhabilitation avec année
   - Liste des contaminants détectés
   - Qualité des sols

### Colonnes Vides (À Remplir Manuellement si Disponible)

5. **lot** : Numéro de lot cadastral
   - Actuellement vide
   - À remplir si vous avez cette information dans vos registres municipaux

6. **bureau_publicite** : Numéro au bureau de la publicité des droits
   - Actuellement vide
   - À remplir si vous avez cette information dans vos registres municipaux

## 🚀 Comment Charger les Données

### Option 1 : Charger Directement (Recommandé)

Si vous n'avez pas besoin de remplir les colonnes "lot" et "bureau_publicite" :

1. **Aller sur la page de chargement** :
   - Ouvrir : https://ahoken50.github.io/R-gistre-terrain-contamin-/upload-data.html

2. **Charger le fichier** :
   - Glisser-déposer `donnees-municipales-completes.csv`
   - OU cliquer sur la zone et sélectionner le fichier

3. **Vérifier l'aperçu** :
   - Vérifier que les 35 enregistrements sont affichés
   - Vérifier que les colonnes sont correctes

4. **Charger dans Firebase** :
   - Cliquer sur "🔥 Charger dans Firebase"
   - Attendre la confirmation de succès

5. **Télécharger le backup** (recommandé) :
   - Cliquer sur "💾 Télécharger JSON (backup)"
   - Conserver ce fichier comme sauvegarde

6. **Vérifier dans l'application** :
   - Cliquer sur "🚀 Voir dans l'application"
   - Vérifier l'onglet "Données Municipales"

### Option 2 : Compléter les Données Avant Chargement

Si vous voulez remplir les colonnes "lot" et "bureau_publicite" :

1. **Ouvrir le fichier dans Excel** :
   - Ouvrir `donnees-municipales-completes.csv` dans Excel ou LibreOffice

2. **Remplir les colonnes manquantes** :
   - Colonne B (lot) : Ajouter les numéros de lot cadastral
   - Colonne E (bureau_publicite) : Ajouter les numéros de bureau de publicité

3. **Sauvegarder** :
   - Sauvegarder le fichier en format CSV (UTF-8)

4. **Charger dans l'application** :
   - Suivre les étapes de l'Option 1

## 📊 Exemple de Données

Voici un aperçu des premières lignes du fichier :

| adresse | lot | reference | avis_decontamination | bureau_publicite | commentaires |
|---------|-----|-----------|---------------------|------------------|--------------|
| 1, rue des Panneaux, Val-d'Or (Québec) | | 55326326 | Décontamination terminée | | Réf. gouv: 55326326 \| État: Terminée en 2001 \| Contaminants: Produits pétroliers*, Xylènes (o,m,p) (pot) \| Qualité sols: Plage B-C |
| 1000, boul. Barrette, Val-d'Or (Québec) | | 90531229 | Décontamination terminée | | Réf. gouv: 90531229 \| État: Terminée en 2001 \| Contaminants: Hydrocarbures pétroliers C10 à C50 \| Qualité sols: Plage B-C |
| 1075, 3e Avenue Ouest, Val-d'Or (Québec) | | X2050458 | Décontamination en cours | | Réf. gouv: X2050458 \| État: Initiée \| Contaminants: Benzène (pot), Éthylbenzène (pot), Hydrocarbures pétroliers C10 à C50... |

## ✅ Avantages de ce Fichier

1. **Données Complètes** :
   - Toutes les adresses du registre gouvernemental
   - Statut de décontamination pour chaque terrain
   - Informations détaillées sur les contaminants

2. **Format Correct** :
   - Colonnes dans le bon ordre
   - Données nettoyées (pas de caractères spéciaux)
   - Prêt à charger dans Firebase

3. **Informations Riches** :
   - Avis de décontamination clair
   - Commentaires détaillés avec toutes les informations pertinentes
   - Référence gouvernementale pour traçabilité

## 🔄 Mise à Jour des Données

Pour mettre à jour les données à l'avenir :

1. **Télécharger le nouveau fichier Excel** du registre gouvernemental
2. **Remplacer** `Registre-des-terrains-contamines-Valdor.xlsx`
3. **Exécuter le script** :
   ```bash
   python3 convert_to_municipal_format.py
   ```
4. **Charger le nouveau fichier** dans l'application

## 📝 Notes Importantes

1. **Colonnes Vides** :
   - Les colonnes "lot" et "bureau_publicite" sont vides car ces informations ne sont pas dans le registre gouvernemental
   - Vous pouvez les remplir manuellement si vous avez ces informations dans vos registres municipaux

2. **Commentaires Détaillés** :
   - Les commentaires contiennent beaucoup d'informations utiles
   - Ils incluent la référence gouvernementale, l'état de réhabilitation, et les contaminants
   - Ces informations sont importantes pour la traçabilité

3. **Avis de Décontamination** :
   - Basé sur l'état de réhabilitation du registre gouvernemental
   - Permet de filtrer facilement les terrains par statut

## 🎯 Résultat Attendu

Après le chargement, vous devriez voir dans l'application :

- **35 enregistrements** dans l'onglet "Données Municipales"
- **Toutes les colonnes remplies** sauf "lot" et "bureau_publicite" (si non remplies manuellement)
- **Informations détaillées** dans la colonne "Commentaires"
- **Statut de décontamination** clair pour chaque terrain

## 🆘 Support

Si vous rencontrez des problèmes :

1. **Vérifier le format du fichier** : Doit être CSV avec virgules comme séparateur
2. **Vérifier l'encodage** : Doit être UTF-8
3. **Consulter la page de test** : https://ahoken50.github.io/R-gistre-terrain-contamin-/test-firebase-connection.html
4. **Consulter les guides** : GUIDE_UTILISATION_UPLOAD.md et DIAGNOSTIC_FIREBASE.md

---

**Fichier créé** : `donnees-municipales-completes.csv`
**Enregistrements** : 35
**Prêt à charger** : ✅ Oui