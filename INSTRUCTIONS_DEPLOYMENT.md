# 📋 Instructions de déploiement GitHub Pages

## ✅ Corrections effectuées

### 1. Structure des workflows corrigée
- ❌ **Supprimé** : `.github/workflow/` (nom incorrect sans 's')
- ✅ **Conservé** : `.github/workflows/` (nom correct avec 's')

### 2. Dossier public créé
- ✅ Créé `public/index.html` avec l'application web complète
- ✅ Interface Bootstrap avec statistiques et onglets
- ✅ Filtres de recherche et export PDF

### 3. Problème résolu
- ❌ **Avant** : Le README s'affichait au lieu de l'application
- ✅ **Après** : L'application web se charge depuis `public/`

---

## 🚀 Étapes pour activer le déploiement

### Étape 1 : Merger la Pull Request
1. Allez sur : https://github.com/ahoken50/R-gistre-terrain-contamin-/pull/2
2. Vérifiez les changements
3. Cliquez sur **Merge pull request**
4. Confirmez le merge

### Étape 2 : Configurer GitHub Pages
1. Allez dans **Settings** > **Pages** de votre dépôt
2. Dans **Build and deployment** :
   - **Source** : Sélectionnez `GitHub Actions`
3. Cliquez sur **Save**

### Étape 3 : Créer le workflow de déploiement
Vous devez créer manuellement le fichier `.github/workflows/deploy-pages.yml` car l'API GitHub App a des restrictions.

**Option A : Directement sur GitHub (Recommandé)**
1. Allez dans votre dépôt GitHub
2. Naviguez vers `.github/workflows/`
3. Cliquez sur **Add file** > **Create new file**
4. Nommez le fichier : `deploy-pages.yml`
5. Copiez-collez le contenu suivant :

```yaml
name: Déploiement GitHub Pages

on:
  push:
    branches:
      - main  # Déclenché uniquement sur la branche main
  workflow_dispatch:  # Permet le déclenchement manuel

# Définir les permissions nécessaires pour GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

# N'autoriser qu'un seul déploiement à la fois
concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  # Job de construction et déploiement
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          # Uploader le dossier public
          path: './public'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

6. Cliquez sur **Commit changes**
7. Commit directement vers `main`

**Option B : Via Git local**
Si vous préférez le faire en local :

```bash
# Retournez sur la branche main
git checkout main
git pull origin main

# Créez le fichier workflow
cp deploy-pages.yml.example .github/workflows/deploy-pages.yml

# Committez et poussez
git add .github/workflows/deploy-pages.yml
git commit -m "feat: Ajouter workflow de déploiement GitHub Pages"
git push origin main
```

### Étape 4 : Déclencher le déploiement
1. Le workflow se déclenchera automatiquement après le push vers `main`
2. Vous pouvez aussi le déclencher manuellement :
   - Allez dans **Actions**
   - Sélectionnez **Déploiement GitHub Pages**
   - Cliquez sur **Run workflow**

### Étape 5 : Vérifier le déploiement
1. Allez dans **Actions** pour voir le statut
2. Une fois terminé, votre site sera accessible à :
   ```
   https://ahoken50.github.io/R-gistre-terrain-contamin-/
   ```

---

## 🔍 Vérifications

### ✅ Checklist post-déploiement
- [ ] La Pull Request #2 est mergée
- [ ] GitHub Pages est configuré sur "GitHub Actions"
- [ ] Le workflow `deploy-pages.yml` est créé dans `.github/workflows/`
- [ ] Le workflow s'exécute sans erreur
- [ ] Le site web est accessible
- [ ] L'application se charge correctement (pas le README)
- [ ] Les onglets fonctionnent
- [ ] Le workflow `auto-weekly.yml` fonctionne toujours

---

## 🐛 Dépannage

### Le README s'affiche toujours
- Vérifiez que le dossier `public/` existe dans la branche `main`
- Vérifiez que le workflow utilise `path: './public'`
- Videz le cache de votre navigateur (Ctrl+Shift+R)

### Le workflow ne se déclenche pas
- Vérifiez que GitHub Pages est configuré sur "GitHub Actions"
- Vérifiez que le fichier est bien dans `.github/workflows/` (avec 's')
- Vérifiez les permissions dans Settings > Actions > General

### Erreur 404
- Le déploiement peut prendre 2-3 minutes
- Vérifiez l'URL : `https://ahoken50.github.io/R-gistre-terrain-contamin-/`
- Vérifiez que l'artifact contient bien `public/index.html`

---

## 📚 Structure finale attendue

```
R-gistre-terrain-contamin-/
├── .github/
│   └── workflows/
│       ├── auto-weekly.yml        # ✅ Workflow hebdomadaire (existant)
│       └── deploy-pages.yml       # ✅ Workflow de déploiement (à créer)
├── public/
│   └── index.html                 # ✅ Application web
├── src/
│   ├── app.js                     # ✅ Logique JavaScript
│   └── firebase.js                # ✅ Config Firebase
├── functions/
├── docs/
├── package.json
└── README.md
```

---

## 🎯 Résumé

1. ✅ **Merger la PR #2** : https://github.com/ahoken50/R-gistre-terrain-contamin-/pull/2
2. ✅ **Configurer GitHub Pages** : Settings > Pages > GitHub Actions
3. ✅ **Créer `deploy-pages.yml`** : Directement sur GitHub ou en local
4. ✅ **Vérifier le déploiement** : Actions > Déploiement GitHub Pages
5. ✅ **Accéder au site** : https://ahoken50.github.io/R-gistre-terrain-contamin-/

---

## 💡 Notes importantes

- La **branche main** est utilisée pour le déploiement (pas l'autre branche)
- Le workflow se déclenche **automatiquement** à chaque push vers main
- Vous pouvez aussi le déclencher **manuellement** depuis l'onglet Actions
- Le site se met à jour en **2-3 minutes** après chaque déploiement

---

**Besoin d'aide ?** Consultez la documentation GitHub Pages : https://docs.github.com/pages
