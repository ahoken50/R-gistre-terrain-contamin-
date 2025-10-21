# Diagnostic de l'affichage du registre gouvernemental

## 🔍 Problème à diagnostiquer

Le registre gouvernemental ne s'affiche pas tel que prévu.

## ✅ Vérifications effectuées

### 1. Données présentes
```bash
curl -s http://localhost:5175/data/government-data.json | jq '.data | length'
# Résultat : 35 enregistrements ✅
```

### 2. Structure des données
Les données gouvernementales ont la structure suivante :
```json
{
  "NO_MEF_LIEU": "55326326",
  "LATITUDE": 48.1158666667,
  "LONGITUDE": -77.773175,
  "ADR_CIV_LIEU": "1, rue des Panneaux\r\nVal-d'Or (Québec)",
  "CODE_POST_LIEU": "J9P 7A1",
  "LST_MRC_REG_ADM": "890 - La Vallée-de-l'Or, 08 - Abitibi-Témiscamingue",
  "DESC_MILIEU_RECEPT": "Sol",
  "NB_FICHES": 1.0
}
```

### 3. Fonction d'affichage
La fonction `displayGovernmentData()` dans `src/app.js` :
- ✅ Sélectionne correctement le tbody
- ✅ Mappe les bonnes colonnes
- ✅ Crée les éléments DOM correctement

## 🐛 Problèmes potentiels identifiés

### Problème 1 : Caractères spéciaux dans les adresses
Les adresses contiennent `\r\n` (retour chariot + nouvelle ligne) :
```
"ADR_CIV_LIEU": "1, rue des Panneaux\r\nVal-d'Or (Québec)"
```

**Impact** : Cela peut causer un affichage sur plusieurs lignes dans les cellules du tableau.

**Solution** : Nettoyer les `\r\n` avant l'affichage.

### Problème 2 : Longueur des données
Certaines colonnes peuvent être très longues :
- `LST_MRC_REG_ADM` : "890 - La Vallée-de-l'Or, 08 - Abitibi-Témiscamingue"

**Impact** : Le tableau peut déborder horizontalement.

**Solution** : Ajouter des styles CSS pour limiter la largeur ou permettre le word-wrap.

### Problème 3 : Nombres décimaux
`NB_FICHES` est un nombre décimal (1.0) :

**Impact** : Affichage avec décimales inutiles.

**Solution** : Formater comme entier.

## 🔧 Solutions proposées

### Solution 1 : Nettoyer les données avant affichage
```javascript
function displayGovernmentData(table, data) {
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 6;
        cell.className = 'text-center text-muted';
        cell.textContent = 'Aucune donnée disponible';
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }
    
    data.forEach(item => {
        const row = document.createElement('tr');
        
        // Nettoyer et formater les données
        const columns = [
            item.NO_MEF_LIEU || '',
            cleanAddress(item.ADR_CIV_LIEU || ''),
            item.CODE_POST_LIEU || '',
            item.LST_MRC_REG_ADM || '',
            item.DESC_MILIEU_RECEPT || '',
            formatNumber(item.NB_FICHES || 0)
        ];
        
        columns.forEach(value => {
            const cell = document.createElement('td');
            cell.textContent = value;
            row.appendChild(cell);
        });
        
        tbody.appendChild(row);
    });
}

// Fonction pour nettoyer les adresses
function cleanAddress(address) {
    return address.replace(/\r\n/g, ', ').replace(/\n/g, ', ').trim();
}

// Fonction pour formater les nombres
function formatNumber(num) {
    return Math.round(num);
}
```

### Solution 2 : Améliorer les styles CSS
```css
/* Dans index.html ou un fichier CSS séparé */
#government-table td {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

#government-table td:nth-child(2) {
    /* Colonne adresse */
    max-width: 300px;
}

#government-table td:nth-child(4) {
    /* Colonne MRC / Région */
    max-width: 250px;
}
```

### Solution 3 : Ajouter des tooltips pour les textes longs
```javascript
columns.forEach(value => {
    const cell = document.createElement('td');
    cell.textContent = value;
    
    // Ajouter un tooltip si le texte est long
    if (value.length > 50) {
        cell.title = value;
    }
    
    row.appendChild(cell);
});
```

## 📋 Checklist de diagnostic

Pour identifier précisément le problème, vérifier :

- [ ] Les statistiques affichent-elles 35 enregistrements ?
- [ ] Le tableau est-il complètement vide ?
- [ ] Les données s'affichent-elles mais sont mal formatées ?
- [ ] Y a-t-il des erreurs dans la console du navigateur (F12) ?
- [ ] Les colonnes sont-elles alignées avec les en-têtes ?
- [ ] Les adresses s'affichent-elles sur plusieurs lignes ?
- [ ] Le tableau déborde-t-il de l'écran ?

## 🔗 URLs de test

- Application principale : https://5175-i80umuosz07i81y828wtv-b32ec7bb.sandbox.novita.ai/
- Page de test : https://5175-i80umuosz07i81y828wtv-b32ec7bb.sandbox.novita.ai/test-display.html
- Données JSON : https://5175-i80umuosz07i81y828wtv-b32ec7bb.sandbox.novita.ai/data/government-data.json

## 📸 Capture d'écran demandée

Pour mieux diagnostiquer, pourriez-vous :
1. Ouvrir l'application dans le navigateur
2. Aller dans l'onglet "Registre gouvernemental"
3. Ouvrir la console du navigateur (F12)
4. Me décrire précisément ce que vous voyez ou ne voyez pas
