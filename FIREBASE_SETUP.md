# 🔥 Configuration Firebase pour Registre Terrains Contaminés

## ⚠️ ÉTAPES OBLIGATOIRES AVANT LE DÉPLOIEMENT

### 1. Mettre à jour les règles Firestore

**IMPORTANT:** Vous devez d'abord configurer les règles de sécurité Firebase!

1. Allez sur https://console.firebase.google.com/
2. Sélectionnez votre projet "r-gistre-terrain-contamin"
3. Dans le menu de gauche, cliquez sur "Firestore Database"
4. Cliquez sur l'onglet "Règles"
5. Remplacez les règles actuelles par:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Permettre accès complet aux collections de données
    match /municipal_data/{document=**} {
      allow read, write: if true;
    }
    match /government_data/{document=**} {
      allow read, write: if true;
    }
    match /validations/{document=**} {
      allow read, write: if true;
    }
    match /app_state/{document=**} {
      allow read, write: if true;
    }
  }
}
```

6. Cliquez sur "Publier"
7. Attendez quelques secondes que les règles soient actives

### 2. Configurer les GitHub Secrets (pour le déploiement)

1. Allez sur https://github.com/ahoken50/R-gistre-terrain-contamin-/settings/secrets/actions
2. Cliquez sur "New repository secret"
3. Nom: `VITE_FIREBASE_API_KEY`
4. Valeur: `AIzaSyCXkuOEHJ8RFz4st6ilEtxGWk5UtuWn8Gk`
5. Cliquez sur "Add secret"

### 3. Modifier le workflow GitHub Actions

Le fichier `.github/workflows/deploy.yml` doit inclure la variable d'environnement:

```yaml
- name: Build
  env:
    VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
  run: npm run build
```

## 🔄 Migration automatique localStorage → Firebase

L'application migrera automatiquement vos données locales vers Firebase lors de la première utilisation:

1. **Données municipales** stockées dans localStorage seront transférées dans Firebase
2. **Validations** (terrains validés/rejetés) seront transférées
3. Après migration réussie, localStorage sera nettoyé automatiquement

## ✅ Avantages de Firebase

- ✅ **Partage automatique** : Tous les utilisateurs voient les mêmes données en temps réel
- ✅ **Plus besoin d'exporter/importer** : Sauvegarde automatique à chaque action
- ✅ **Synchronisation instantanée** : Les validations sont partagées immédiatement
- ✅ **Historique préservé** : Toutes les modifications sont tracées
- ✅ **Accessible partout** : Les données suivent l'utilisateur sur tous les appareils

## 🗄️ Structure des données Firebase

### Collection: `municipal_data`
Document: `current`
```json
{
  "data": [...],  // Tableau des terrains municipaux
  "lastUpdate": "2025-10-23T14:00:00.000Z",
  "count": 4
}
```

### Collection: `government_data`
Document: `current`
```json
{
  "data": [...],  // Tableau des terrains gouvernementaux
  "lastUpdate": "2025-10-23T14:00:00.000Z",
  "count": 35
}
```

### Collection: `validations`
Document: `current`
```json
{
  "validated": ["id1", "id2", ...],  // IDs des terrains validés
  "rejected": ["id3", "id4", ...],    // IDs des terrains rejetés
  "lastUpdate": "2025-10-23T14:00:00.000Z"
}
```

## 🔧 Développement local

Pour le développement local, créez un fichier `.env.local`:

```env
VITE_FIREBASE_API_KEY=AIzaSyCXkuOEHJ8RFz4st6ilEtxGWk5UtuWn8Gk
```

Ce fichier est automatiquement ignoré par Git (dans `.gitignore`).

## 🐛 Dépannage

### Erreur: "Firebase permission denied"
→ Vérifiez que les règles Firestore sont correctement configurées (étape 1)

### Erreur: "Firebase not initialized"
→ Vérifiez que la variable d'environnement `VITE_FIREBASE_API_KEY` est configurée

### Les données ne se synchronisent pas
→ Ouvrez la console du navigateur (F12) et vérifiez les messages Firebase

### Migration ne fonctionne pas
→ Vérifiez que vous avez des données dans localStorage avant la migration
→ Consultez la console pour voir les messages de migration

## 📱 Tester la migration

1. Ouvrez l'application dans votre navigateur
2. Ouvrez la console (F12 → Console)
3. Vous devriez voir:
   ```
   🔄 Première utilisation de Firebase - Migration des données localStorage...
   ✅ Vos données locales ont été migrées vers Firebase!
   🧹 Nettoyage du localStorage...
   ```

4. Actualisez la page - les données devraient maintenant venir de Firebase

## 🎯 Prochaines étapes

Après avoir suivi toutes ces étapes:
1. Committez et poussez le code
2. GitHub Actions construira et déploiera automatiquement
3. Tous les utilisateurs verront les mêmes données
4. Les validations seront partagées automatiquement
