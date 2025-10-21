# 🚀 Guide de Déploiement GitHub Pages

## 📍 URL de votre application

**URL publique** : https://ahoken50.github.io/R-gistre-terrain-contamin-/

## ✅ Vérifications effectuées

### 1. Fichiers de données présents
- ✅ `public/data/government-data.json` (13 KB, 35 enregistrements)
- ✅ `public/data/municipal-data.json` (1.1 KB, 4 enregistrements)
- ✅ Les deux fichiers sont trackés par Git
- ✅ Les fichiers sont synchronisés avec origin/main

### 2. Build local fonctionne
```bash
npm run build
# ✅ Build réussi
# ✅ Les données sont copiées dans dist/data/
```

### 3. Workflow GitHub Actions
- ✅ Fichier `.github/workflows/deploy-pages.yml` configuré
- ✅ Se déclenche sur push vers main
- ✅ Se déclenche manuellement (workflow_dispatch)

## 🔧 Étapes pour vérifier le déploiement

### Étape 1 : Vérifier GitHub Pages est activé

1. Allez sur : https://github.com/ahoken50/R-gistre-terrain-contamin-/settings/pages
2. Vérifiez que **Source** est configuré sur **GitHub Actions**
3. Si c'est "Deploy from a branch", changez pour "GitHub Actions"

### Étape 2 : Vérifier le dernier workflow

1. Allez sur : https://github.com/ahoken50/R-gistre-terrain-contamin-/actions
2. Vérifiez le dernier workflow "Déploiement GitHub Pages"
3. Si en erreur, cliquez dessus pour voir les logs

### Étape 3 : Déclencher manuellement le déploiement

1. Allez sur : https://github.com/ahoken50/R-gistre-terrain-contamin-/actions
2. Cliquez sur "Déploiement GitHub Pages" dans la liste de gauche
3. Cliquez sur "Run workflow" → Sélectionnez "main" → "Run workflow"
4. Attendez ~2-3 minutes que le workflow se termine
5. Accédez à l'URL : https://ahoken50.github.io/R-gistre-terrain-contamin-/

## 🐛 Problèmes courants et solutions

### Problème 1 : Page 404 Not Found

**Cause** : GitHub Pages n'est pas activé ou mal configuré

**Solution** :
1. Settings → Pages
2. Source : "GitHub Actions"
3. Sauvegarder et relancer le workflow

### Problème 2 : Données ne s'affichent pas (statistiques à 0)

**Causes possibles** :
1. Les fichiers JSON ne sont pas dans le build
2. Le chemin d'accès aux données est incorrect
3. Problème CORS avec GitHub Pages

**Solutions** :

#### Solution A : Vérifier que les données sont dans le build
```bash
# Vérifier localement
npm run build
ls -la dist/data/
# Doit afficher government-data.json et municipal-data.json
```

#### Solution B : Vérifier les chemins dans le code
Les chemins doivent être relatifs :
- ✅ `/data/government-data.json`
- ❌ `http://localhost:5173/data/government-data.json`
- ❌ `/public/data/government-data.json`

#### Solution C : Vérifier la configuration Vite
Le fichier `vite.config.js` doit avoir :
```javascript
base: process.env.NODE_ENV === 'production' ? "/R-gistre-terrain-contamin-/" : "/"
```

### Problème 3 : Erreur 404 sur les fichiers JSON en production

**Cause** : Le base path n'est pas correct ou les fichiers ne sont pas copiés

**Solution** : Vérifier que `public/` est bien copié vers `dist/`

Vite copie automatiquement tout le contenu de `public/` vers `dist/` lors du build.

### Problème 4 : Le workflow échoue

**Vérifier** :
1. Les permissions du workflow (déjà configurées ✅)
2. Les secrets GitHub (non nécessaires pour GitHub Pages)
3. Les logs d'erreur dans Actions

## 📊 Structure du déploiement

```
Repository GitHub
├── .github/workflows/deploy-pages.yml  ← Workflow de déploiement
├── public/
│   └── data/
│       ├── government-data.json        ← 35 enregistrements ✅
│       └── municipal-data.json         ← 4 enregistrements ✅
├── src/
│   ├── app.js                          ← Charge depuis /data/*.json
│   └── upload.js
└── vite.config.js                      ← base path configuré ✅

Lors du build (npm run build) :
dist/
├── index.html
├── upload-data.html
├── assets/
│   ├── main-*.js
│   └── upload-*.js
└── data/                               ← Copié depuis public/data/
    ├── government-data.json            ← Les données sont là ! ✅
    └── municipal-data.json
```

## 🔍 Diagnostic en ligne

### Test 1 : Vérifier que le site est accessible
```bash
curl -I https://ahoken50.github.io/R-gistre-terrain-contamin-/
# Doit retourner 200 OK
```

### Test 2 : Vérifier que les données sont accessibles
```bash
curl https://ahoken50.github.io/R-gistre-terrain-contamin-/data/government-data.json
# Doit retourner le JSON avec 35 enregistrements
```

### Test 3 : Ouvrir la console du navigateur
1. Ouvrez https://ahoken50.github.io/R-gistre-terrain-contamin-/
2. Appuyez sur F12 (ouvrir les outils de développement)
3. Allez dans l'onglet "Console"
4. Regardez s'il y a des erreurs rouges
5. Regardez s'il y a des logs comme "✅ X enregistrements chargés"

### Test 4 : Vérifier l'onglet Network
1. Ouvrez F12 → Network
2. Rechargez la page
3. Cherchez les requêtes vers `government-data.json` et `municipal-data.json`
4. Vérifiez le statut : doit être 200 OK
5. Cliquez sur la requête pour voir le contenu

## 🚀 Commandes utiles

### Déclencher un nouveau déploiement
```bash
# Faire un commit vide pour déclencher le workflow
git commit --allow-empty -m "trigger: Redéploiement GitHub Pages"
git push origin main
```

### Vérifier le statut du déploiement
```bash
# Voir les workflows récents
gh run list --workflow="Déploiement GitHub Pages" --limit 5

# Voir les logs du dernier workflow
gh run view --log
```

### Forcer un rebuild local
```bash
# Nettoyer et rebuilder
rm -rf dist node_modules/.vite
npm install
npm run build
```

## 📞 Support

Si le problème persiste :

1. **Partagez les logs du workflow GitHub Actions**
   - Allez dans Actions → Cliquez sur le workflow en échec
   - Copiez les logs d'erreur

2. **Vérifiez la console du navigateur**
   - F12 → Console
   - Copiez les erreurs affichées en rouge

3. **Testez localement**
   - `npm run build`
   - `npm run preview`
   - Vérifiez si les données s'affichent

## ✅ Checklist de déploiement

- [ ] GitHub Pages est activé (Source: GitHub Actions)
- [ ] Le workflow "Déploiement GitHub Pages" existe
- [ ] Les fichiers de données sont dans `public/data/`
- [ ] Les fichiers sont committés sur la branche main
- [ ] Le workflow a été exécuté avec succès
- [ ] L'URL https://ahoken50.github.io/R-gistre-terrain-contamin-/ est accessible
- [ ] Les données JSON sont accessibles à `/data/*.json`
- [ ] Les statistiques affichent les bons nombres (35 et 4)
- [ ] Aucune erreur dans la console du navigateur

---

**Date de création** : 21 octobre 2025  
**Dernière mise à jour** : 21 octobre 2025
