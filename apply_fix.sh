#!/bin/bash
# Fix pour les chemins GitHub Pages

# Ajouter BASE_URL après les imports
sed -i '/import "jspdf-autotable";/a\\n// Base URL pour les chemins (fonctionne en dev et prod avec GitHub Pages)\nconst BASE_URL = import.meta.env.BASE_URL;' src/app.js

# Remplacer les chemins fetch
sed -i "s|fetch('./data/municipal-data.json')|fetch(BASE_URL + 'data/municipal-data.json')|g" src/app.js
sed -i "s|fetch('./data/government-data.json')|fetch(BASE_URL + 'data/government-data.json')|g" src/app.js

echo "✅ Patch appliqué"
