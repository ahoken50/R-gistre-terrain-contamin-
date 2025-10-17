// Fonction pour gérer les données municipales
// Cette fonction permet de charger le fichier Excel municipal et de le convertir pour Firebase

import { db } from '../src/firebase.js';
import { readFileSync } from 'fs';
import Papa from 'papaparse';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Fonction pour convertir le fichier Excel municipal en CSV
async function convertMunicipalExcelToCSV(excelFilePath) {
    try {
        // Convertir le fichier Excel en CSV
        const convertCommand = `libreoffice --headless --convert-to csv ${excelFilePath}`;
        await execPromise(convertCommand);
        
        // Déterminer le nom du fichier CSV généré
        const csvFilePath = excelFilePath.replace('.xls', '.csv');
        
        console.log(`Fichier Excel municipal converti en CSV: ${csvFilePath}`);
        return csvFilePath;
    } catch (error) {
        console.error("Erreur lors de la conversion du fichier Excel municipal:", error);
        return null;
    }
}

// Fonction pour charger les données municipales dans Firebase
async function loadMunicipalDataToFirebase(csvFilePath) {
    try {
        const csvData = readFileSync(csvFilePath, 'utf8');
        const parsedData = Papa.parse(csvData, {
            header: false,
            skipEmptyLines: true
        });
        
        // Déterminer les en-têtes à partir de la première ligne
        const headers = parsedData.data[0];
        const dataRows = parsedData.data.slice(1);
        
        // Créer un tableau d'objets avec les en-têtes comme clés
        const formattedData = dataRows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                // Nettoyer les noms d'en-têtes
                const cleanHeader = header
                    .replace(/\s+/g, '_')
                    .replace(/[^\w]/g, '')
                    .toLowerCase();
                obj[cleanHeader] = row[index] || '';
            });
            return obj;
        });
        
        // Supprimer les données existantes
        const existingDocs = await db.collection('municipal_lands').get();
        const batch = db.batch();
        
        existingDocs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        // Ajouter les nouvelles données
        const batch2 = db.batch();
        formattedData.forEach((row, index) => {
            const docRef = db.collection('municipal_lands').doc(`row_${index}`);
            batch2.set(docRef, row);
        });
        
        await batch2.commit();
        
        console.log("Données municipales chargées avec succès dans Firebase");
        return true;
    } catch (error) {
        console.error("Erreur lors du chargement des données municipales dans Firebase:", error);
        return false;
    }
}

// Fonction pour importer les données municipales
async function importMunicipalData(excelFilePath) {
    console.log("Importation des données municipales...");
    
    // 1. Convertir le fichier Excel en CSV
    const csvFilePath = await convertMunicipalExcelToCSV(excelFilePath);
    if (!csvFilePath) {
        console.error("Échec de la conversion du fichier Excel");
        return false;
    }
    
    // 2. Charger les données CSV dans Firebase
    const loadSuccess = await loadMunicipalDataToFirebase(csvFilePath);
    if (!loadSuccess) {
        console.error("Échec du chargement des données municipales");
        return false;
    }
    
    console.log("Importation des données municipales terminée avec succès");
    return true;
}

export { importMunicipalData };