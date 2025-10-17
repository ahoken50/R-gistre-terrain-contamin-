// Références aux éléments DOM
const municipalTable = document.getElementById('municipal-table');
const governmentTable = document.getElementById('government-table');
const notInOfficialTable = document.getElementById('not-in-official-table');
const decontaminatedTable = document.getElementById('decontaminated-table');

// Références aux filtres
const addressFilter = document.getElementById('address-filter');
const lotFilter = document.getElementById('lot-filter');
const referenceFilter = document.getElementById('reference-filter');

const governmentAddressFilter = document.getElementById('government-address-filter');
const governmentLotFilter = document.getElementById('government-lot-filter');
const governmentReferenceFilter = document.getElementById('government-reference-filter');

// Références aux boutons d'export
const exportPdfMunicipalBtn = document.getElementById('export-pdf-municipal');
const exportPdfGovernmentBtn = document.getElementById('export-pdf-government');
const exportPdfNotInOfficialBtn = document.getElementById('export-pdf-not-in-official');
const exportPdfDecontaminatedBtn = document.getElementById('export-pdf-decontaminated');
const generateReportBtn = document.getElementById('generate-report');

// Données simulées (en attendant la connexion Firebase)
const mockMunicipalData = [
    {
        adresse: "1185, des Foreurs",
        lot: "2299001",
        reference: "7610-08-01-17124-06",
        avis_decontamination: "",
        bureau_publicite: "12223243",
        commentaires: ""
    },
    {
        adresse: "1075, 3e Avenue",
        lot: "2297678",
        reference: "7610-08-01-12049-06",
        avis_decontamination: "",
        bureau_publicite: "",
        commentaires: ""
    },
    {
        adresse: "912, 3e Avenue",
        lot: "2297604",
        reference: "",
        avis_decontamination: "",
        bureau_publicite: "12343867",
        commentaires: ""
    },
    {
        adresse: "725, 3e Avenue",
        lot: "2297570",
        reference: "7610-08-01-12059-08",
        avis_decontamination: "",
        bureau_publicite: "",
        commentaires: ""
    }
];

const mockGovernmentData = [
    {
        reference: "90492539",
        latitude: "45.5751271636",
        longitude: "-73.6992551634",
        adresse: "1060, boulevard des Laurentides (Pont-Viau)\r\nLaval (Québec)",
        code_postal: "H7G 2W1",
        mrc_region: "650 - Ville de Laval, 13 - Laval",
        milieu_recepteur: "Sol",
        nb_fiches: "1"
    },
    {
        reference: "54873484",
        latitude: "46.6167451627",
        longitude: "-71.9323566355",
        adresse: "7472, route Marie-Victorin\r\nLotbinière (Québec)",
        code_postal: "G0S 1S0",
        mrc_region: "330 - Lotbinière, 12 - Chaudière-Appalaches",
        milieu_recepteur: "Sol",
        nb_fiches: "1"
    },
    {
        reference: "90317181",
        latitude: "50.0237166372",
        longitude: "-66.8209489204",
        adresse: "175, boulevard du Portage-des-Mousses\r\nPort-Cartier (Québec)",
        code_postal: "G5B 2V9",
        mrc_region: "971 - Sept-Rivières, 09 - Côte-Nord",
        milieu_recepteur: "Indéterminé",
        nb_fiches: "1"
    }
];

// Données pour les terrains non présents dans le répertoire officiel
const mockNotInOfficialData = [
    {
        adresse: "912, 3e Avenue",
        lot: "2297604",
        reference: "",
        avis_decontamination: "",
        bureau_publicite: "12343867",
        commentaires: ""
    }
];

// Données pour les terrains décontaminés
const mockDecontaminatedData = [
    {
        adresse: "500, rue Principale",
        lot: "1234567",
        reference: "7610-08-01-12345-01",
        avis_decontamination: "2025-01-15",
        bureau_publicite: "9876543",
        commentaires: "Décontamination complète"
    }
];

// Fonction pour afficher les données dans un tableau
function displayDataInTable(table, data, isDecontaminated = false) {
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    
    data.forEach(item => {
        const row = document.createElement('tr');
        if (isDecontaminated) {
            row.classList.add('decontaminated');
        }
        
        Object.values(item).forEach(value => {
            const cell = document.createElement('td');
            cell.textContent = value;
            row.appendChild(cell);
        });
        
        tbody.appendChild(row);
    });
}

// Fonction pour filtrer les données municipales
function filterMunicipalData() {
    const addressValue = addressFilter.value.toLowerCase();
    const lotValue = lotFilter.value.toLowerCase();
    const referenceValue = referenceFilter.value.toLowerCase();
    
    const filteredData = mockMunicipalData.filter(item => {
        return (
            item.adresse.toLowerCase().includes(addressValue) &&
            item.lot.toLowerCase().includes(lotValue) &&
            item.reference.toLowerCase().includes(referenceValue)
        );
    });
    
    displayDataInTable(municipalTable, filteredData);
}

// Fonction pour filtrer les données gouvernementales
function filterGovernmentData() {
    const addressValue = governmentAddressFilter.value.toLowerCase();
    const lotValue = governmentLotFilter.value.toLowerCase();
    const referenceValue = governmentReferenceFilter.value.toLowerCase();
    
    const filteredData = mockGovernmentData.filter(item => {
        return (
            item.adresse.toLowerCase().includes(addressValue) &&
            item.nb_fiches.toLowerCase().includes(lotValue) &&
            item.reference.toLowerCase().includes(referenceValue)
        );
    });
    
    displayDataInTable(governmentTable, filteredData);
}

// Fonction pour exporter un tableau en PDF
function exportTableToPDF(table, title) {
    const doc = new jspdf.jsPDF();
    
    // Ajouter le titre
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    // Ajouter la date
    const date = new Date().toLocaleDateString('fr-CA');
    doc.setFontSize(12);
    doc.text(`Date d'export: ${date}`, 14, 30);
    
    // Ajouter le tableau
    doc.autoTable({
        html: table,
        startY: 35,
        styles: {
            fontSize: 8
        },
        headStyles: {
            fillColor: [13, 110, 253]
        }
    });
    
    // Sauvegarder le PDF
    doc.save(`${title.replace(/\s+/g, '_')}_${date}.pdf`);
}

// Fonction pour générer un rapport d'accès à l'information
function generateAccessReport() {
    const doc = new jspdf.jsPDF();
    
    // Ajouter le titre
    doc.setFontSize(18);
    doc.text("Rapport d'Accès à l'Information - Terrains Contaminés", 14, 22);
    
    // Ajouter la date
    const date = new Date().toLocaleDateString('fr-CA');
    doc.setFontSize(12);
    doc.text(`Date de génération: ${date}`, 14, 30);
    
    // Ajouter une description
    doc.setFontSize(12);
    doc.text("Ce rapport contient toutes les données présentes dans le répertoire officiel du gouvernement.", 14, 38);
    
    // Ajouter le tableau gouvernemental
    doc.autoTable({
        html: governmentTable,
        startY: 45,
        styles: {
            fontSize: 8
        },
        headStyles: {
            fillColor: [13, 110, 253]
        }
    });
    
    // Sauvegarder le PDF
    doc.save(`Rapport_Acces_Information_${date}.pdf`);
}

// Initialiser l'application
document.addEventListener('DOMContentLoaded', function() {
    // Afficher les données initiales
    displayDataInTable(municipalTable, mockMunicipalData);
    displayDataInTable(governmentTable, mockGovernmentData);
    displayDataInTable(notInOfficialTable, mockNotInOfficialData);
    displayDataInTable(decontaminatedTable, mockDecontaminatedData, true);
    
    // Ajouter les écouteurs d'événements pour les filtres
    addressFilter.addEventListener('input', filterMunicipalData);
    lotFilter.addEventListener('input', filterMunicipalData);
    referenceFilter.addEventListener('input', filterMunicipalData);
    
    governmentAddressFilter.addEventListener('input', filterGovernmentData);
    governmentLotFilter.addEventListener('input', filterGovernmentData);
    governmentReferenceFilter.addEventListener('input', filterGovernmentData);
    
    // Ajouter les écouteurs d'événements pour les exports PDF
    exportPdfMunicipalBtn.addEventListener('click', () => exportTableToPDF(municipalTable, 'Terrains Contaminés Municipaux'));
    exportPdfGovernmentBtn.addEventListener('click', () => exportTableToPDF(governmentTable, 'Répertoire Officiel Gouvernemental'));
    exportPdfNotInOfficialBtn.addEventListener('click', () => exportTableToPDF(notInOfficialTable, 'Terrains Non Présents dans le Répertoire Officiel'));
    exportPdfDecontaminatedBtn.addEventListener('click', () => exportTableToPDF(decontaminatedTable, 'Terrains Décontaminés (Archivés)'));
    
    // Ajouter l'écouteur d'événement pour la génération de rapport
    generateReportBtn.addEventListener('click', generateAccessReport);
});

// Fonction pour charger les données depuis Firebase (à implémenter)
async function loadMunicipalDataFromFirebase() {
    try {
        // À implémenter avec Firebase
        console.log("Chargement des données municipales depuis Firebase...");
        // Filtrer pour ne garder que les données de Val-d'Or
        const valdorData = mockMunicipalData.filter(land => 
            land.adresse && land.adresse.toLowerCase().includes("val-d'or")
        );
        return valdorData.length > 0 ? valdorData : mockMunicipalData; // Pour l'instant, retourne les données simulées
    } catch (error) {
        console.error("Erreur lors du chargement des données municipales:", error);
        return [];
    }
}

// Fonction pour charger les données gouvernementales depuis Firebase (à implémenter)
async function loadGovernmentDataFromFirebase() {
    try {
        // À implémenter avec Firebase
        console.log("Chargement des données gouvernementales depuis Firebase...");
        // Filtrer pour ne garder que les données de Val-d'Or
        const valdorData = mockGovernmentData.filter(land => 
            land.mrc_region && land.mrc_region.toLowerCase().includes("val-d'or")
        );
        return valdorData.length > 0 ? valdorData : mockGovernmentData; // Pour l'instant, retourne les données simulées
    } catch (error) {
        console.error("Erreur lors du chargement des données gouvernementales:", error);
        return [];
    }
}

// Fonction pour comparer les données municipales avec les données gouvernementales
function compareData(municipalData, governmentData) {
    // Pour l'instant, utilise les données simulées
    // Cette fonction sera implémentée pour comparer les vraies données
    
    console.log("Comparaison des données municipales et gouvernementales...");
    
    // Identifier les terrains décontaminés (ceux avec une date d'avis de décontamination)
    const decontaminatedLands = municipalData.filter(land => land.avis_decontamination !== "");
    
    // Identifier les terrains non présents dans le répertoire officiel
    const notInOfficial = municipalData.filter(land => land.reference === "");
    
    return {
        decontaminated: decontaminatedLands,
        notInOfficial: notInOfficial
    };
}

// Fonction pour extraire les données du fichier GPKG (à implémenter)
async function extractGPKGData() {
    try {
        // À implémenter - extraction des données depuis le fichier GPKG
        console.log("Extraction des données GPKG...");
        return mockGovernmentData; // Pour l'instant, retourne les données simulées
    } catch (error) {
        console.error("Erreur lors de l'extraction des données GPKG:", error);
        return [];
    }
}

// Fonction pour synchroniser les données mensuellement (à implémenter)
async function monthlySync() {
    try {
        // À implémenter - synchronisation mensuelle des données
        console.log("Synchronisation mensuelle des données...");
        
        // 1. Extraire les données du fichier GPKG gouvernemental
        const governmentData = await extractGPKGData();
        
        // 2. Charger les données municipales
        const municipalData = await loadMunicipalDataFromFirebase();
        
        // 3. Comparer les données
        const comparisonResult = compareData(municipalData, governmentData);
        
        // 4. Mettre à jour les onglets correspondants
        displayDataInTable(decontaminatedTable, comparisonResult.decontaminated, true);
        displayDataInTable(notInOfficialTable, comparisonResult.notInOfficial);
        displayDataInTable(governmentTable, governmentData);
        
        console.log("Synchronisation terminée avec succès.");
    } catch (error) {
        console.error("Erreur lors de la synchronisation mensuelle:", error);
    }
}

// Planifier la synchronisation mensuelle
// Pour l'instant, nous l'exécutons manuellement
// Dans une implémentation réelle, cela serait planifié avec un service comme Cloud Functions
console.log("Application initialisée. La synchronisation mensuelle peut être exécutée manuellement.");