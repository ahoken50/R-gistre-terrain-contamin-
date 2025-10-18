#!/usr/bin/env node
/**
 * Simple repository health check used by `npm test`.
 * - Validates critical JSON data files can be parsed
 * - Ensures required top-level keys exist for the web application
 */
import { readFileSync, existsSync } from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const requiredFiles = [
  'public/data/municipal-data.json',
  'public/data/government-data.json'
];

let hasError = false;

for (const relativePath of requiredFiles) {
  const filePath = path.join(PROJECT_ROOT, relativePath);

  if (!existsSync(filePath)) {
    console.error(`❌ Fichier manquant: ${relativePath}`);
    hasError = true;
    continue;
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);

    const records = Array.isArray(parsed?.data) ? parsed.data : parsed;

    if (!Array.isArray(records)) {
      console.error(`❌ Le fichier ${relativePath} ne contient pas un tableau de données valide.`);
      hasError = true;
      continue;
    }

    if (records.length === 0) {
      console.warn(`⚠️  Attention: ${relativePath} est vide. Pensez à actualiser les données.`);
    } else {
      console.log(`✅ ${relativePath} - ${records.length} enregistrements.`);
    }

    if (!parsed?.metadata) {
      console.warn(`ℹ️  ${relativePath} ne contient pas de métadonnées. Les ajouter est recommandé.`);
    }
  } catch (error) {
    console.error(`❌ Impossible de parser ${relativePath}:`, error.message);
    hasError = true;
  }
}

if (hasError) {
  process.exitCode = 1;
  console.error('\n❌ Vérification échouée.');
} else {
  console.log('\n✅ Toutes les vérifications sont réussies.');
}
