# Configuration des Règles Firestore

## Problème Actuel

L'application web affiche l'erreur:
```
❌ Erreur chargement métadonnées Firebase: FirebaseError: Missing or insufficient permissions.
```

Cela signifie que les règles Firestore ne permettent pas la lecture de la collection `sync_metadata`.

## Solution: Mettre à Jour les Règles Firestore

### 1. Accéder aux Règles Firestore

1. Aller sur https://console.firebase.google.com
2. Sélectionner votre projet: `r-gistre-terrain-contamin`
3. Dans le menu de gauche: **Firestore Database**
4. Onglet **Rules** (Règles)

### 2. Règles Actuelles (Probablement)

Vos règles actuelles ressemblent probablement à ceci:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
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

### 3. Règles Mises à Jour (À Appliquer)

Ajoutez la collection `sync_metadata`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Données municipales
    match /municipal_data/{document=**} {
      allow read: if true;
      allow write: if true;
    }
    
    // Données gouvernementales
    match /government_data/{document=**} {
      allow read: if true;
      allow write: if true;  // Permettre l'écriture pour la migration initiale
    }
    
    // Validations
    match /validations/{document=**} {
      allow read: if true;
      allow write: if true;
    }
    
    // État de l'application
    match /app_state/{document=**} {
      allow read: if true;
      allow write: if true;
    }
    
    // Métadonnées de synchronisation (NOUVEAU)
    match /sync_metadata/{document=**} {
      allow read: if true;  // Lecture publique
      allow write: if false; // Écriture uniquement par le backend
    }
  }
}
```

### 4. Publier les Règles

1. Copier les règles ci-dessus
2. Coller dans l'éditeur de règles Firestore
3. Cliquer sur **Publish** (Publier)

### 5. Vérifier

Après avoir publié les règles:

1. Recharger votre application web
2. Ouvrir la console du navigateur (F12)
3. Vérifier qu'il n'y a plus d'erreur de permissions
4. La vérification des mises à jour devrait fonctionner

## Explication des Règles

### Lecture Publique, Écriture Restreinte

```javascript
match /sync_metadata/{document=**} {
  allow read: if true;   // Tout le monde peut lire
  allow write: if false; // Personne ne peut écrire depuis le frontend
}
```

**Pourquoi?**
- **Lecture publique**: L'application web doit pouvoir lire les métadonnées pour afficher les notifications de mise à jour
- **Écriture restreinte**: Seul le script Python (via Service Account) peut écrire les métadonnées

Le Service Account utilisé par le script Python a des permissions administrateur et peut écrire malgré la règle `write: if false`.

## Règles de Sécurité Recommandées (Production)

Pour une meilleure sécurité en production, vous pourriez utiliser:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Données en lecture seule pour le public
    match /municipal_data/{document=**} {
      allow read: if true;
      allow write: if request.auth != null; // Nécessite authentification
    }
    
    match /government_data/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /validations/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /app_state/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /sync_metadata/{document=**} {
      allow read: if true;
      allow write: if false; // Uniquement via Service Account
    }
  }
}
```

Mais pour l'instant, gardez les règles simples avec `if true` pour faciliter le développement.

## Dépannage

### L'erreur persiste après publication

1. **Vider le cache du navigateur**: Ctrl+Shift+R (Windows/Linux) ou Cmd+Shift+R (Mac)
2. **Vérifier les règles**: Assurez-vous qu'elles sont bien publiées
3. **Vérifier la console**: F12 → Console pour voir les erreurs détaillées

### Tester les règles

Dans la console Firestore, vous pouvez tester les règles:

1. Onglet **Rules**
2. Cliquer sur **Rules Playground**
3. Tester la lecture de `/sync_metadata/current`

---

**Date**: 24 octobre 2024
**Action requise**: Publier les nouvelles règles Firestore
**Temps estimé**: 2 minutes