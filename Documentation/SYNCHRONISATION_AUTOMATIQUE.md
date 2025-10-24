# Synchronisation Automatique des Données Gouvernementales

## Vue d'ensemble

Le système de synchronisation automatique télécharge mensuellement les données du registre gouvernemental des terrains contaminés depuis Données Québec, filtre les données pour Val-d'Or, détecte les changements et met à jour Firebase.

## Architecture

### Composants

1. **Script Python** (`scripts/sync_government_data.py`)
   - Télécharge le fichier GeoPackage (GPKG)
   - Filtre les données pour Val-d'Or
   - Détecte les changements (nouveaux, modifiés, retirés)
   - Met à jour Firebase

2. **GitHub Actions** (`.github/workflows/monthly-sync.yml`)
   - Exécution automatique le 1er de chaque mois à 2h00 AM
   - Possibilité d'exécution manuelle
   - Gestion des erreurs et logs

3. **Firebase Collections**
   - `government_data`: Données du registre
   - `sync_metadata`: Métadonnées de synchronisation

## Configuration

### 1. Secrets GitHub

Vous devez configurer le secret suivant dans votre repository GitHub:

**FIREBASE_CREDENTIALS**
- Aller dans Settings → Secrets and variables → Actions
- Créer un nouveau secret nommé `FIREBASE_CREDENTIALS`
- Valeur: Le contenu complet du fichier JSON de service account Firebase

Pour obtenir le fichier de service account:
1. Aller dans Firebase Console
2. Project Settings → Service Accounts
3. Generate New Private Key
4. Copier tout le contenu du fichier JSON

### 2. Dépendances Python

Les dépendances sont listées dans `requirements.txt`:
```
pandas>=2.1.0
geopandas>=0.14.0
openpyxl>=3.1.0
requests>=2.31.0
firebase-admin>=6.2.0
```

## Fonctionnement

### Workflow Automatique

1. **Déclenchement**: Le 1er de chaque mois à 2h00 AM (UTC)
2. **Téléchargement**: Récupération du fichier GPKG depuis Données Québec
3. **Filtrage**: Extraction des données pour Val-d'Or uniquement
4. **Détection**: Comparaison avec les données existantes
5. **Mise à jour**: Sauvegarde dans Firebase
6. **Notification**: Les utilisateurs verront une notification au prochain chargement

### Exécution Manuelle

Vous pouvez déclencher manuellement la synchronisation:

1. Aller dans l'onglet "Actions" de votre repository GitHub
2. Sélectionner "Synchronisation Mensuelle du Registre Gouvernemental"
3. Cliquer sur "Run workflow"
4. Sélectionner la branche (main)
5. Cliquer sur "Run workflow"

## Détection des Changements

Le script détecte trois types de changements:

### 1. Nouveaux Terrains
- Terrains présents dans les nouvelles données mais absents des anciennes
- Identifiés par `NO_MEF_LIEU` (référence unique)

### 2. Terrains Modifiés
- Terrains présents dans les deux ensembles mais avec des données différentes
- Comparaison JSON complète de tous les champs

### 3. Terrains Retirés
- Terrains présents dans les anciennes données mais absents des nouvelles
- Peuvent indiquer une décontamination complète ou une correction

## Métadonnées de Synchronisation

Après chaque synchronisation, les métadonnées suivantes sont sauvegardées:

```json
{
  "last_sync_date": "2024-10-24T02:00:00Z",
  "last_sync_status": "success",
  "changes": {
    "new": 5,
    "modified": 3,
    "removed": 1
  },
  "total_records": 35,
  "lastUpdate": "2024-10-24T02:00:00Z"
}
```

## Notifications Utilisateur

Les utilisateurs sont informés des mises à jour de deux façons:

### 1. Au Chargement de l'Application
- Vérification automatique des nouvelles mises à jour
- Notification toast avec détails des changements
- Affichage de la date de dernière mise à jour

### 2. Synchronisation Manuelle
- Bouton "🔄 Synchroniser les données" dans l'onglet gouvernemental
- Notification détaillée après synchronisation
- Mise à jour immédiate de l'affichage

## Gestion des Erreurs

### Erreurs de Téléchargement
- Timeout après 5 minutes
- Retry automatique (géré par GitHub Actions)
- Logs détaillés disponibles

### Erreurs de Traitement
- Validation des données GPKG
- Gestion des champs manquants
- Logs d'erreur sauvegardés

### Erreurs Firebase
- Tentative de sauvegarde des métadonnées d'erreur
- Status 'error' dans sync_metadata
- Message d'erreur enregistré

## Monitoring

### Logs GitHub Actions
- Accès via l'onglet "Actions" du repository
- Historique de toutes les exécutions
- Logs détaillés de chaque étape

### Logs d'Erreur
- Sauvegardés comme artifacts en cas d'échec
- Rétention de 30 jours
- Téléchargeables depuis l'interface GitHub

### Vérification Manuelle
```python
# Vérifier la dernière synchronisation
python scripts/sync_government_data.py
```

## Source des Données

**URL**: https://www.donneesquebec.ca/recherche/dataset/repertoire-des-terrains-contamines-gtc

**Format**: GeoPackage (GPKG)

**Mise à jour**: Mensuelle par le gouvernement du Québec

**Contenu**: Répertoire complet des terrains contaminés du Québec

## Dépannage

### La synchronisation échoue

1. **Vérifier les secrets GitHub**
   - Le secret FIREBASE_CREDENTIALS est-il configuré?
   - Le JSON est-il valide?

2. **Vérifier les logs**
   - Aller dans Actions → Dernière exécution
   - Consulter les logs détaillés

3. **Tester localement**
   ```bash
   export FIREBASE_CREDENTIALS='{"type":"service_account",...}'
   python scripts/sync_government_data.py
   ```

### Les données ne se mettent pas à jour

1. **Vérifier Firebase**
   - Les données sont-elles dans la collection `government_data`?
   - Les métadonnées sont-elles dans `sync_metadata`?

2. **Vider le cache du navigateur**
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

3. **Vérifier la console du navigateur**
   - F12 → Console
   - Rechercher les erreurs Firebase

### Notifications non affichées

1. **Vérifier localStorage**
   - F12 → Application → Local Storage
   - Supprimer `last_update_check` pour forcer la notification

2. **Vérifier les métadonnées**
   - Console: `localStorage.getItem('sync_metadata')`

## Améliorations Futures

### Court Terme
- [ ] Notification par email en cas d'échec
- [ ] Dashboard de monitoring
- [ ] Historique des synchronisations

### Long Terme
- [ ] Migration vers Firebase Cloud Functions
- [ ] Synchronisation en temps réel
- [ ] API REST pour accès externe

## Support

Pour toute question ou problème:
1. Consulter les logs GitHub Actions
2. Vérifier la documentation Firebase
3. Créer une issue sur GitHub

---

**Dernière mise à jour**: 24 octobre 2024
**Version**: 1.0.0