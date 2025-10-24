# Guide de Configuration de la Synchronisation Automatique

## Prérequis

- Compte GitHub avec accès au repository
- Projet Firebase configuré
- Accès administrateur au projet Firebase

## Étape 1: Obtenir les Credentials Firebase

### 1.1 Accéder à Firebase Console

1. Aller sur https://console.firebase.google.com
2. Sélectionner votre projet: `r-gistre-terrain-contamin`
3. Cliquer sur l'icône ⚙️ (Settings) → Project Settings

### 1.2 Générer une Clé de Service Account

1. Dans Project Settings, aller dans l'onglet **Service Accounts**
2. Cliquer sur **Generate New Private Key**
3. Confirmer en cliquant sur **Generate Key**
4. Un fichier JSON sera téléchargé (ex: `r-gistre-terrain-contamin-firebase-adminsdk-xxxxx.json`)

⚠️ **IMPORTANT**: Ce fichier contient des informations sensibles. Ne le partagez jamais publiquement!

### 1.3 Préparer le Contenu pour GitHub

1. Ouvrir le fichier JSON téléchargé avec un éditeur de texte
2. Copier **tout le contenu** du fichier (de `{` à `}`)
3. Le contenu ressemble à ceci:

```json
{
  "type": "service_account",
  "project_id": "r-gistre-terrain-contamin",
  "private_key_id": "xxxxxxxxxxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@r-gistre-terrain-contamin.iam.gserviceaccount.com",
  "client_id": "xxxxxxxxxxxxx",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

## Étape 2: Configurer le Secret GitHub

### 2.1 Accéder aux Secrets du Repository

1. Aller sur votre repository GitHub
2. Cliquer sur **Settings** (onglet en haut)
3. Dans le menu de gauche, aller dans **Secrets and variables** → **Actions**

### 2.2 Créer le Secret FIREBASE_CREDENTIALS

1. Cliquer sur **New repository secret**
2. Remplir les champs:
   - **Name**: `FIREBASE_CREDENTIALS`
   - **Secret**: Coller tout le contenu JSON copié à l'étape 1.3
3. Cliquer sur **Add secret**

✅ Le secret est maintenant configuré et sera disponible pour GitHub Actions

## Étape 3: Vérifier la Configuration

### 3.1 Vérifier les Fichiers

Assurez-vous que ces fichiers existent dans votre repository:

```
R-gistre-terrain-contamin-/
├── .github/
│   └── workflows/
│       └── monthly-sync.yml          ✓ Workflow GitHub Actions
├── scripts/
│   └── sync_government_data.py       ✓ Script de synchronisation
└── requirements.txt                   ✓ Dépendances Python
```

### 3.2 Vérifier le Workflow

1. Aller dans l'onglet **Actions** de votre repository
2. Vous devriez voir le workflow: "Synchronisation Mensuelle du Registre Gouvernemental"
3. Si vous ne le voyez pas, vérifiez que le fichier `.github/workflows/monthly-sync.yml` existe

## Étape 4: Tester la Synchronisation

### 4.1 Exécution Manuelle de Test

1. Aller dans **Actions** → **Synchronisation Mensuelle du Registre Gouvernemental**
2. Cliquer sur **Run workflow** (bouton à droite)
3. Sélectionner la branche `main`
4. Cliquer sur **Run workflow**

### 4.2 Surveiller l'Exécution

1. Un nouveau workflow apparaîtra dans la liste
2. Cliquer dessus pour voir les détails
3. Observer les étapes:
   - ✓ Checkout repository
   - ✓ Setup Python
   - ✓ Install system dependencies
   - ✓ Install Python dependencies
   - ✓ Run synchronization script

### 4.3 Vérifier les Résultats

Si tout fonctionne correctement, vous verrez dans les logs:

```
✅ Firebase initialisé avec succès
📥 Téléchargement du fichier GPKG depuis ...
✅ Fichier téléchargé: /tmp/...
🔍 Lecture du fichier GPKG: ...
📊 Total d'enregistrements: XXX
✅ Enregistrements pour Val-d'Or: XX
📥 Chargement des données existantes depuis Firebase
🔍 Détection des changements...
📊 Changements détectés:
   - Nouveaux: X
   - Modifiés: X
   - Retirés: X
💾 Mise à jour de Firebase...
✅ XX enregistrements sauvegardés dans Firebase
✅ Métadonnées de synchronisation sauvegardées
✅ Synchronisation terminée avec succès!
```

## Étape 5: Vérifier dans Firebase

### 5.1 Vérifier les Données

1. Aller dans Firebase Console → Firestore Database
2. Vérifier la collection `government_data`
3. Document `current` devrait contenir:
   - `data`: Array des terrains contaminés
   - `lastUpdate`: Date de la dernière mise à jour
   - `count`: Nombre d'enregistrements

### 5.2 Vérifier les Métadonnées

1. Vérifier la collection `sync_metadata`
2. Document `current` devrait contenir:
   - `last_sync_date`: Date de synchronisation
   - `last_sync_status`: "success"
   - `changes`: Statistiques des changements
   - `total_records`: Nombre total d'enregistrements

## Étape 6: Vérifier dans l'Application

### 6.1 Ouvrir l'Application

1. Aller sur votre application web
2. Ouvrir la console du navigateur (F12)

### 6.2 Vérifier le Chargement

Dans la console, vous devriez voir:

```
🚀 Initialisation de l'application...
📥 Chargement des données gouvernementales depuis Firebase...
✅ Données gouvernementales chargées depuis Firebase: XX enregistrements
🔍 Vérification des mises à jour...
```

### 6.3 Vérifier la Notification

Si c'est la première synchronisation après configuration, vous devriez voir une notification:

```
🔄 Mise à jour du registre gouvernemental
• X nouveau(x) terrain(s) ajouté(s)
• X terrain(s) modifié(s)
• X terrain(s) retiré(s)
Dernière mise à jour : [date et heure]
```

## Planification Automatique

### Calendrier d'Exécution

Le workflow est configuré pour s'exécuter automatiquement:

- **Fréquence**: Le 1er de chaque mois
- **Heure**: 2h00 AM (UTC) = 22h00 (heure de Montréal, heure d'été)
- **Cron**: `0 2 1 * *`

### Prochaines Exécutions

Les prochaines exécutions automatiques auront lieu:
- 1er novembre 2024 à 2h00 AM UTC
- 1er décembre 2024 à 2h00 AM UTC
- 1er janvier 2025 à 2h00 AM UTC
- etc.

## Dépannage

### Erreur: "FIREBASE_CREDENTIALS environment variable not set"

**Solution**: Le secret GitHub n'est pas configuré correctement
1. Vérifier que le secret `FIREBASE_CREDENTIALS` existe dans Settings → Secrets
2. Vérifier que le nom est exactement `FIREBASE_CREDENTIALS` (sensible à la casse)
3. Recréer le secret si nécessaire

### Erreur: "Error initializing Firebase"

**Solution**: Le JSON des credentials est invalide
1. Vérifier que vous avez copié **tout** le contenu du fichier JSON
2. Vérifier qu'il n'y a pas de caractères supplémentaires
3. Régénérer une nouvelle clé de service account

### Erreur: "Permission denied"

**Solution**: Le service account n'a pas les permissions nécessaires
1. Aller dans Firebase Console → Project Settings → Service Accounts
2. Vérifier que le service account a le rôle "Firebase Admin SDK Administrator Service Agent"
3. Si nécessaire, aller dans Google Cloud Console → IAM pour ajuster les permissions

### Erreur: "Failed to download GPKG"

**Solution**: Problème de connexion ou URL invalide
1. Vérifier que l'URL dans le script est correcte
2. Tester l'URL manuellement dans un navigateur
3. Vérifier la connexion internet de GitHub Actions

### Le workflow ne s'exécute pas automatiquement

**Solution**: Vérifier la configuration du cron
1. Le workflow doit être sur la branche `main` ou `master`
2. Vérifier que le fichier `.github/workflows/monthly-sync.yml` est bien commité
3. Attendre la prochaine date d'exécution planifiée

## Maintenance

### Mise à Jour des Dépendances

Périodiquement, mettre à jour les dépendances dans `requirements.txt`:

```bash
pip install --upgrade geopandas requests firebase-admin pandas
pip freeze > requirements.txt
```

### Rotation des Clés

Pour des raisons de sécurité, régénérer les clés de service account tous les 6-12 mois:

1. Générer une nouvelle clé dans Firebase Console
2. Mettre à jour le secret GitHub `FIREBASE_CREDENTIALS`
3. Supprimer l'ancienne clé dans Firebase Console

### Monitoring

Vérifier régulièrement:
- Les logs des exécutions dans GitHub Actions
- Les données dans Firebase Firestore
- Les notifications dans l'application

## Support

En cas de problème:
1. Consulter les logs détaillés dans GitHub Actions
2. Vérifier la documentation Firebase
3. Créer une issue sur GitHub avec les logs d'erreur

---

**Dernière mise à jour**: 24 octobre 2024
**Version**: 1.0.0