# Fix pour les chemins GitHub Pages

## 🐛 Problème identifié

**Erreur** : `404 sur data/government-data.json`

**Cause** : Les chemins relatifs `./data/*.json` ne fonctionnent pas correctement avec le base path `/R-gistre-terrain-contamin-/` sur GitHub Pages.

## ✅ Solution

Il faut utiliser `import.meta.env.BASE_URL` de Vite pour construire les URLs correctement.

### Modification du code

Au lieu de :
```javascript
const response = await fetch('./data/government-data.json');
```

Utiliser :
```javascript
const response = await fetch(`${import.meta.env.BASE_URL}data/government-data.json`);
```

## 📝 Implémentation

Fichier : `src/app.js`

### Modification 1 : loadMunicipalData()
```javascript
// Ligne ~62
const response = await fetch(`${import.meta.env.BASE_URL}data/municipal-data.json`);
```

### Modification 2 : loadGovernmentData()
```javascript
// Ligne ~119
const response = await fetch(`${import.meta.env.BASE_URL}data/government-data.json`);
```

## 🔍 Explication

`import.meta.env.BASE_URL` est une variable Vite qui contient :
- En développement : `/`
- En production : `/R-gistre-terrain-contamin-/`

Donc le chemin devient :
- Dev : `/data/government-data.json`
- Prod : `/R-gistre-terrain-contamin-/data/government-data.json`

## 🚀 Test

Après modification :
1. `npm run build`
2. `npm run preview` pour tester localement
3. Commit et push vers GitHub
4. Le site devrait fonctionner sur GitHub Pages
