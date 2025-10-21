# 🎯 Solution au problème 404 sur GitHub Pages

## 🐛 Problème

```
❌ Failed to load resource: the server responded with a status of 404
data/government-data.json:1
```

**Cause** : Les chemins `/data/*.json` ne fonctionnent pas sur GitHub Pages car l'application est sous `/R-gistre-terrain-contamin-/`

## ✅ Solution Appliquée

### Modification de `src/app.js`

1. **Ajout de la variable BASE_URL** (ligne ~6):
```javascript
const BASE_URL = import.meta.env.BASE_URL;
```

2. **Remplacement des chemins absolus par BASE_URL**:

**Avant** :
```javascript
const response = await fetch('/data/government-data.json');
```

**Après** :
```javascript
const response = await fetch(BASE_URL + 'data/government-data.json');
```

## 🔍 Pourquoi ça fonctionne

`import.meta.env.BASE_URL` est fourni par Vite et vaut :
- **En développement** : `/`
- **En production** : `/R-gistre-terrain-contamin-/`

Donc les URLs deviennent :
- Dev : `/data/government-data.json` ✅
- Prod : `/R-gistre-terrain-contamin-/data/government-data.json` ✅

## 📊 Résultat Attendu

Après déploiement, le site doit :
- ✅ Charger 35 enregistrements gouvernementaux
- ✅ Charger les données municipales
- ✅ Afficher les statistiques correctement
- ✅ Aucune erreur 404 dans la console

## 🚀 Déploiement

```bash
git add src/app.js FIX_CHEMINS_GITHUB_PAGES.md SOLUTION_404_GITHUB_PAGES.md
git commit -m "fix: Corriger les chemins 404 sur GitHub Pages en utilisant BASE_URL"
git push origin main
```

Puis attendre 2-3 minutes et vérifier :
https://ahoken50.github.io/R-gistre-terrain-contamin-/

## ✅ Vérification

1. Ouvrir la console (F12)
2. Regarder les logs :
   - `✅ 35 enregistrements gouvernementaux chargés`
   - `📊 Mise à jour des statistiques: {government: 35, ...}`
3. Vérifier l'onglet "Registre gouvernemental"
4. Le chiffre doit afficher **35** au lieu de **1**

---

**Date** : 21 octobre 2025  
**Status** : Fix appliqué, en attente de déploiement
