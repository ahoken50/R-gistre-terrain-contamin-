# Plan d'Améliorations - Application Registre Terrains Contaminés

## Tâches à Accomplir

### 1. Vérification et Correction des Filtres ✅
**Objectif** : S'assurer que tous les filtres fonctionnent dans tous les onglets

**Onglets à vérifier** :
- [ ] Onglet Données Municipales (adresse, lot, référence)
- [ ] Onglet Données Gouvernementales (adresse, lot, référence)
- [ ] Onglet Terrains Décontaminés (adresse, année, statut)

**Actions** :
- Vérifier le code des filtres dans src/app.js
- Tester chaque filtre individuellement
- Corriger les bugs identifiés

### 2. Synchronisation Automatique Mensuelle ⏳
**Objectif** : Mettre en place une synchronisation automatique du registre gouvernemental

**Source de données** :
- URL : https://www.donneesquebec.ca/recherche/dataset/repertoire-des-terrains-contamines-gtc/resource/09afbfb6-eeac-44fb-86ef-d8b6ce4b739a
- Format : GeoPackage (GPKG)

**Approche** :
- Créer un script Python pour télécharger et traiter le GPKG
- Utiliser GitHub Actions pour exécution mensuelle
- Sauvegarder les données dans Firebase
- Filtrer les données pour Val-d'Or uniquement

**Fichiers à créer** :
- `.github/workflows/monthly-sync.yml` (GitHub Actions)
- `scripts/sync_government_data.py` (Script de synchronisation)

### 3. Notifications de Mise à Jour 📢
**Objectif** : Informer les utilisateurs des mises à jour mensuelles

**Approche** :
- Stocker la date de dernière mise à jour dans Firebase
- Afficher une notification toast lors de la détection d'une nouvelle mise à jour
- Afficher la date de dernière mise à jour dans l'interface

**Modifications** :
- Ajouter un champ `last_sync_date` dans Firebase
- Créer une fonction de notification dans src/app.js
- Ajouter un badge "Nouveau" si mise à jour récente

### 4. Synchronisation Manuelle avec Notification 🔄
**Objectif** : Permettre une mise à jour manuelle avec feedback utilisateur

**Fonctionnalités** :
- Bouton "Synchroniser" dans l'onglet gouvernemental
- Vérification si mise à jour nécessaire
- Notification de succès avec détails :
  - "Registre déjà à jour" (si aucun changement)
  - "X nouveaux terrains ajoutés, Y modifiés" (si changements)
- Mise à jour de Firebase après synchronisation

**Modifications** :
- Améliorer la fonction de synchronisation existante
- Ajouter la détection de changements
- Créer des notifications détaillées

## Ordre d'Exécution

1. **Tâche 1** : Vérification des filtres (rapide)
2. **Tâche 3** : Système de notifications (base pour tâches 2 et 4)
3. **Tâche 4** : Synchronisation manuelle (test du système)
4. **Tâche 2** : Synchronisation automatique (utilise le code de la tâche 4)

## Technologies Utilisées

- **Frontend** : JavaScript (notifications toast)
- **Backend** : Python (traitement GPKG)
- **Automation** : GitHub Actions (cron job mensuel)
- **Base de données** : Firebase Firestore
- **Bibliothèques** :
  - `geopandas` (lecture GPKG)
  - `requests` (téléchargement)
  - `firebase-admin` (mise à jour Firebase)

## Estimation

- Tâche 1 : 1-2 heures
- Tâche 2 : 3-4 heures
- Tâche 3 : 1-2 heures
- Tâche 4 : 2-3 heures

**Total** : 7-11 heures de développement