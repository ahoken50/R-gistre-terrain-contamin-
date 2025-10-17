// Fonction de synchronisation mensuelle des données
// Cette fonction sera exécutée une fois par mois pour mettre à jour le registre

import { db } from '../src/firebase.js';
import { readFileSync } from 'fs';
import Papa from 'papaparse';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Fonction pour télécharger et extraire le fichier GPKG gouvernemental
async function downloadAndExtractGPKG() {
    try {
        // Télécharger le fichier GPKG
        const downloadCommand = 'wget -O government_contaminated_lands.gpkg.zip "https://stqc380donopppdtce01.blob.core.windows.net/donnees-ouvertes/Repertoire_terrains_contamines/RepertoireTerrainsContamines.gpkg.zip"';
        await execPromise(downloadCommand);
        
        // Décompresser le fichier
        const unzipCommand = 'unzip government_contaminated_lands.gpkg.zip';
        await execPromise(unzipCommand);
        
        // Convertir le GPKG en CSV en filtrant pour Val-d'Or
        // Nous utilisons ogr2ogr avec une requête SQL pour filtrer les données
        const convertCommand = `ogr2ogr -f CSV government_data.csv RepertoireTerrainsContamines.gpkg -sql "SELECT * FROM multipoint WHERE LST_MRC_REG_ADM LIKE '%Val-d''Or%'"`;
        await execPromise(convertCommand);
        
        console.log("Fichier GPKG gouvernemental téléchargé et converti avec succès (filtré pour Val-d'Or)");
        return true;
    } catch (error) {
        console.error("Erreur lors du téléchargement ou de l'extraction du fichier GPKG:", error);
        return false;
    }
}

// Fonction pour charger les données CSV dans Firebase
async function loadCSVToFirebase(filePath, collectionName) {
    try {
        const csvData = readFileSync(filePath, 'utf8');
        const parsedData = Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true
        });
        
        // Supprimer les données existantes
        const existingDocs = await db.collection(collectionName).get();
        const batch = db.batch();
        
        existingDocs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        // Ajouter les nouvelles données
        const batch2 = db.batch();
        parsedData.data.forEach((row, index) => {
            const docRef = db.collection(collectionName).doc(`row_${index}`);
            batch2.set(docRef, row);
        });
        
        await batch2.commit();
        
        console.log(`Données chargées avec succès dans la collection ${collectionName}`);
        return true;
    } catch (error) {
        console.error(`Erreur lors du chargement des données CSV dans Firebase:`, error);
        return false;
    }
}

// Fonction pour comparer les données municipales avec les données gouvernementales
async function compareMunicipalWithGovernment() {
    try {
        // Charger les données municipales
        const municipalSnapshot = await db.collection('municipal_lands').get();
        const municipalData = [];
        municipalSnapshot.forEach(doc => {
            municipalData.push(doc.data());
        });
        
        // Charger les données gouvernementales
        const governmentSnapshot = await db.collection('government_lands').get();
        const governmentData = [];
        governmentSnapshot.forEach(doc => {
            governmentData.push(doc.data());
        });
        
        // Créer un ensemble de références gouvernementales pour une recherche rapide
        const governmentReferences = new Set(governmentData.map(land => land.NO_MEF_LIEU));
        
        // Identifier les terrains municipaux non présents dans le registre gouvernemental
        const notInOfficial = municipalData.filter(land => {
            // Si le terrain a une référence MENVIQ mais qu'elle n'est pas dans le registre gouvernemental
            return land.reference_menviq && !governmentReferences.has(land.reference_menviq);
        });
        
        // Identifier les terrains décontaminés
        const decontaminated = municipalData.filter(land => {
            return land.avis_decontamination && land.avis_decontamination.trim() !== '';
        });
        
        // Mettre à jour les collections Firebase
        const batch = db.batch();
        
        // Supprimer les données existantes dans not_in_official
        const existingNotInOfficial = await db.collection('not_in_official').get();
        existingNotInOfficial.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // Ajouter les nouvelles données dans not_in_official
        notInOfficial.forEach((land, index) => {
            const docRef = db.collection('not_in_official').doc(`land_${index}`);
            batch.set(docRef, land);
        });
        
        // Supprimer les données existantes dans decontaminated
        const existingDecontaminated = await db.collection('decontaminated').get();
        existingDecontaminated.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // Ajouter les nouvelles données dans decontaminated
        decontaminated.forEach((land, index) => {
            const docRef = db.collection('decontaminated').doc(`land_${index}`);
            batch.set(docRef, land);
        });
        
        await batch.commit();
        
        console.log("Comparaison des données terminée avec succès");
        return true;
    } catch (error) {
        console.error("Erreur lors de la comparaison des données:", error);
        return false;
    }
}

// Fonction principale de synchronisation
async function monthlySync() {
    console.log("Début de la synchronisation mensuelle...");
    
    // 1. Télécharger et extraire le fichier GPKG gouvernemental
    const downloadSuccess = await downloadAndExtractGPKG();
    if (!downloadSuccess) {
        console.error("Échec du téléchargement du fichier GPKG");
        return;
    }
    
    // 2. Charger les données gouvernementales dans Firebase
    const loadGovernmentSuccess = await loadCSVToFirebase('government_data.csv', 'government_lands');
    if (!loadGovernmentSuccess) {
        console.error("Échec du chargement des données gouvernementales");
        return;
    }
    
    // 3. Comparer les données municipales avec les données gouvernementales
    const compareSuccess = await compareMunicipalWithGovernment();
    if (!compareSuccess) {
        console.error("Échec de la comparaison des données");
        return;
    }
    
    console.log("Synchronisation mensuelle terminée avec succès");
}

// Exécuter la synchronisation si ce fichier est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
    monthlySync();
}

export { monthlySync };