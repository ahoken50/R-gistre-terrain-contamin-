# Configuration des Secrets GitHub - Instructions Importantes

## ⚠️ Attention: Deux Types de Credentials Firebase

Votre projet utilise **deux types différents** de credentials Firebase:

### 1. API Key Frontend (Déjà Configuré) ✅
- **Secret GitHub**: `VITE_FIREBASE_API_KEY`
- **Utilisation**: Application web frontend (JavaScript)
- **Contenu**: Juste l'API key (ex: "AIzaSyCXkuOEHJ8RFz4st6ilEtxGWk5UtuWn8Gk")
- **Statut**: ✅ Déjà configuré et fonctionnel

### 2. Service Account (À Configurer) ⚠️
- **Secret GitHub**: `FIREBASE_SERVICE_ACCOUNT` (nouveau)
- **Utilisation**: Script Python de synchronisation automatique
- **Contenu**: Fichier JSON complet avec clé privée
- **Statut**: ⚠️ À CONFIGURER

## 🔧 Configuration Requise

### Étape 1: Obtenir le Service Account JSON

1. **Aller dans Firebase Console**
   - URL: https://console.firebase.google.com
   - Sélectionner le projet: `r-gistre-terrain-contamin`

2. **Accéder aux Service Accounts**
   - Cliquer sur l'icône ⚙️ (Settings)
   - Aller dans **Project Settings**
   - Onglet **Service Accounts**

3. **Générer une Nouvelle Clé**
   - Cliquer sur **Generate New Private Key**
   - Confirmer en cliquant sur **Generate Key**
   - Un fichier JSON sera téléchargé (ex: `r-gistre-terrain-contamin-firebase-adminsdk-xxxxx.json`)

4. **Vérifier le Contenu**
   Le fichier JSON doit ressembler à ceci:
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

### Étape 2: Configurer le Secret GitHub

1. **Aller dans votre Repository GitHub**
   - URL: https://github.com/ahoken50/R-gistre-terrain-contamin-

2. **Accéder aux Secrets**
   - Cliquer sur **Settings** (onglet en haut)
   - Dans le menu de gauche: **Secrets and variables** → **Actions**

3. **Créer le Nouveau Secret**
   - Cliquer sur **New repository secret**
   - **Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Secret**: Coller **tout le contenu** du fichier JSON (de `{` à `}`)
   - Cliquer sur **Add secret**

### Étape 3: Vérifier la Configuration

Après avoir configuré le secret, vous devriez avoir:

| Secret Name | Type | Utilisation |
|-------------|------|-------------|
| `VITE_FIREBASE_API_KEY` | API Key | Frontend (déjà configuré) ✅ |
| `FIREBASE_SERVICE_ACCOUNT` | Service Account JSON | Backend Python (nouveau) ⚠️ |

## 🧪 Tester la Configuration

### Test 1: Exécution Manuelle du Workflow

1. Aller dans **Actions** → **Synchronisation Mensuelle du Registre Gouvernemental**
2. Cliquer sur **Run workflow**
3. Sélectionner la branche `main`
4. Cliquer sur **Run workflow**

### Test 2: Vérifier les Logs

Si la configuration est correcte, vous verrez dans les logs:
```
✅ Firebase initialisé avec succès
📥 Téléchargement du fichier GPKG depuis ...
✅ Fichier téléchargé
🔍 Lecture du fichier GPKG
✅ Enregistrements pour Val-d'Or: XX
💾 Mise à jour de Firebase...
✅ Synchronisation terminée avec succès!
```

### Test 3: Vérifier Firebase

1. Aller dans Firebase Console → Firestore Database
2. Vérifier la collection `government_data`
3. Vérifier la collection `sync_metadata`

## ❌ Erreurs Courantes

### Erreur: "FIREBASE_CREDENTIALS environment variable not set"
**Cause**: Le secret `FIREBASE_SERVICE_ACCOUNT` n'est pas configuré
**Solution**: Suivre les étapes ci-dessus pour créer le secret

### Erreur: "Error initializing Firebase"
**Cause**: Le JSON du service account est invalide ou incomplet
**Solution**: 
- Vérifier que vous avez copié **tout** le contenu du fichier JSON
- Régénérer une nouvelle clé si nécessaire

### Erreur: "Permission denied"
**Cause**: Le service account n'a pas les permissions nécessaires
**Solution**: 
- Vérifier les permissions dans Firebase Console
- Le service account doit avoir le rôle "Firebase Admin SDK Administrator"

## 🔒 Sécurité

### ⚠️ IMPORTANT - Ne JAMAIS:
- ❌ Commiter le fichier JSON dans le repository
- ❌ Partager le fichier JSON publiquement
- ❌ Copier le JSON dans le code source
- ❌ Envoyer le JSON par email non chiffré

### ✅ TOUJOURS:
- ✅ Utiliser les secrets GitHub
- ✅ Garder le fichier JSON en lieu sûr
- ✅ Régénérer les clés tous les 6-12 mois
- ✅ Supprimer les anciennes clés après rotation

## 📅 Calendrier de Synchronisation

Une fois configuré, le système fonctionnera automatiquement:

- **Fréquence**: Le 1er de chaque mois à 2h00 AM (UTC)
- **Prochaine exécution**: 1er novembre 2024
- **Exécution manuelle**: Disponible à tout moment via GitHub Actions

## 📞 Support

Si vous rencontrez des problèmes:

1. **Vérifier les logs GitHub Actions**
   - Actions → Dernière exécution → Logs détaillés

2. **Consulter la documentation**
   - `Documentation/GUIDE_CONFIGURATION_SYNC.md`
   - `Documentation/SYNCHRONISATION_AUTOMATIQUE.md`

3. **Vérifier Firebase Console**
   - Firestore Database → Collections
   - Service Accounts → Permissions

4. **Créer une issue GitHub**
   - Inclure les logs d'erreur (sans les secrets!)
   - Décrire les étapes effectuées

---

**Date**: 24 octobre 2024
**Version**: 2.0.0
**Statut**: Configuration requise avant première utilisation