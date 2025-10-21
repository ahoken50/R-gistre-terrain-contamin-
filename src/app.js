// Importer les bibliothèques nécessaires
import jsPDF from "jspdf";
import "jspdf-autotable";

// Variables globales pour stocker les données
let municipalData = [];
let governmentData = [];
let notInOfficialData = [];
let decontaminatedData = [];

// Références aux éléments DOM
const municipalTable = document.getElementById('municipal-table');
const governmentTable = document.getElementById('government-table');
const notInOfficialTable = document.getElementById('not-in-official-table');
const decontaminatedTable = document.getElementById('decontaminated-table');

// Références aux éléments de statistiques
const statsMunicipal = document.getElementById('stats-municipal');
const statsGovernment = document.getElementById('stats-government');
const statsNotOfficial = document.getElementById('stats-not-official');
const statsDecontaminated = document.getElementById('stats-decontaminated');
const lastUpdateElement = document.getElementById('last-update');

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

/**
 * Charger les données municipales depuis JSON
 */
async function loadMunicipalData() {
    try {
        console.log('📊 Chargement des données municipales...');
        
        // Vérifier d'abord si des données temporaires sont disponibles dans localStorage
        const tempData = localStorage.getItem('temp_municipal_data');
        if (tempData) {
            console.log('🔄 Données temporaires trouvées dans localStorage');
            const jsonData = JSON.parse(tempData);
            municipalData = jsonData.data || jsonData;
            console.log(`✅ ${municipalData.length} enregistrements municipaux chargés depuis localStorage`);
            
            // Afficher une notification pour informer l'utilisateur
            showTempDataNotification();
            
            return municipalData;
        }
        
        // Sinon, charger depuis le fichier JSON
        const response = await fetch('/data/municipal-data.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const jsonData = await response.json();
        municipalData = jsonData.data || jsonData; // Support pour format avec ou sans metadata
        
        console.log(`✅ ${municipalData.length} enregistrements municipaux chargés`);
        return municipalData;
    } catch (error) {
        console.error('❌ Erreur lors du chargement des données municipales:', error);
        // Retourner des données de démonstration en cas d'erreur
        municipalData = [
            {
                adresse: "Exemple - Aucune donnée chargée",
                lot: "N/A",
                reference: "N/A",
                avis_decontamination: "",
                bureau_publicite: "",
                commentaires: "Veuillez charger vos données municipales"
            }
        ];
        return municipalData;
    }
}

/**
 * Afficher une notification pour les données temporaires
 */
function showTempDataNotification() {
    const notification = document.createElement('div');
    notification.className = 'alert alert-info alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
    notification.style.zIndex = '9999';
    notification.innerHTML = `
        <strong>📊 Données chargées depuis l'upload</strong>
        <p class="mb-0">Vous visualisez les données que vous venez de charger. Pour les rendre permanentes, téléchargez le fichier JSON et placez-le dans <code>public/data/</code>.</p>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(notification);
    
    // Retirer la notification automatiquement après 10 secondes
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 10000);
}

/**
 * Charger les données gouvernementales depuis JSON
 */
async function loadGovernmentData() {
    try {
        console.log('🏛️ Chargement des données gouvernementales...');
        const response = await fetch('/data/government-data.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const jsonData = await response.json();
        governmentData = jsonData.data || jsonData;
        
        console.log(`✅ ${governmentData.length} enregistrements gouvernementaux chargés`);
        
        // Mettre à jour la date de dernière mise à jour si disponible
        if (jsonData.metadata && jsonData.metadata.last_update) {
            const updateDate = new Date(jsonData.metadata.last_update);
            lastUpdateElement.textContent = updateDate.toLocaleDateString('fr-CA') + ' à ' + 
                                            updateDate.toLocaleTimeString('fr-CA');
        }
        
        return governmentData;
    } catch (error) {
        console.error('❌ Erreur lors du chargement des données gouvernementales:', error);
        governmentData = [
            {
                ID: "N/A",
                Adresse: "Aucune donnée gouvernementale chargée",
                Ville: "Val-d'Or",
                MRC: "N/A",
                commentaires: "Exécutez automate_registre_valdor.py puis convert_excel_to_json.py"
            }
        ];
        return governmentData;
    }
}

/**
 * Comparer les données et identifier les catégories
 */
function compareAndCategorizeData() {
    console.log('🔍 Comparaison et catégorisation des données...');
    
    // Créer un Set des références officielles pour recherche rapide
    const officialReferences = new Set(
        governmentData.map(item => {
            const ref = item.reference || item.Reference || item.ID || item.NO_MEF_LIEU;
            return (ref || '').toString().trim().toLowerCase();
        })
    );
    
    // Identifier les terrains non présents dans le registre officiel
    notInOfficialData = municipalData.filter(item => {
        const ref = (item.reference || item.Reference || '').toString().trim().toLowerCase();
        return ref === '' || !officialReferences.has(ref);
    });
    
    // Identifier les terrains décontaminés (avec date d'avis)
    decontaminatedData = municipalData.filter(item => {
        return item.avis_decontamination && item.avis_decontamination !== '';
    });
    
    console.log(`📋 Catégorisation terminée :`);
    console.log(`  - Terrains municipaux: ${municipalData.length}`);
    console.log(`  - Terrains gouvernementaux: ${governmentData.length}`);
    console.log(`  - Terrains non officiels: ${notInOfficialData.length}`);
    console.log(`  - Terrains décontaminés: ${decontaminatedData.length}`);
}

/**
 * Mettre à jour les statistiques
 */
function updateStatistics() {
    statsMunicipal.textContent = municipalData.length;
    statsGovernment.textContent = governmentData.length;
    statsNotOfficial.textContent = notInOfficialData.length;
    statsDecontaminated.textContent = decontaminatedData.length;
}

/**
 * Afficher les données dans un tableau
 */
function displayDataInTable(table, data) {
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 10;
        cell.className = 'text-center text-muted';
        cell.textContent = 'Aucune donnée disponible';
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }
    
    data.forEach(item => {
        const row = document.createElement('tr');
        
        // Obtenir les valeurs de l'objet (s'adapte aux différentes structures)
        Object.values(item).forEach(value => {
            const cell = document.createElement('td');
            cell.textContent = value || '';
            row.appendChild(cell);
        });
        
        tbody.appendChild(row);
    });
}

/**
 * Nettoyer les adresses (enlever les retours de ligne)
 */
function cleanAddress(address) {
    if (!address) return '';
    return address.replace(/\r\n/g, ', ').replace(/\n/g, ', ').trim();
}

/**
 * Formater les nombres (enlever les décimales inutiles)
 */
function formatNumber(num) {
    if (!num) return '';
    return Math.round(parseFloat(num)).toString();
}

/**
 * Afficher les données gouvernementales avec les bonnes colonnes
 */
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
        
        // Colonnes spécifiques pour les données gouvernementales avec nettoyage
        const columns = [
            item.NO_MEF_LIEU || item.reference || item.Reference || '',
            cleanAddress(item.ADR_CIV_LIEU || item.adresse || item.Adresse || ''),
            item.CODE_POST_LIEU || item.code_postal || '',
            item.LST_MRC_REG_ADM || item.mrc_region || '',
            item.DESC_MILIEU_RECEPT || item.milieu_recepteur || '',
            formatNumber(item.NB_FICHES || item.nb_fiches || '')
        ];
        
        columns.forEach((value, index) => {
            const cell = document.createElement('td');
            cell.textContent = value;
            
            // Ajouter un tooltip pour les textes longs (>50 caractères)
            if (value && value.length > 50) {
                cell.title = value;
                cell.style.cursor = 'help';
            }
            
            row.appendChild(cell);
        });
        
        tbody.appendChild(row);
    });
}

/**
 * Filtrer les données municipales
 */
function filterMunicipalData() {
    const addressValue = addressFilter.value.toLowerCase();
    const lotValue = lotFilter.value.toLowerCase();
    const referenceValue = referenceFilter.value.toLowerCase();
    
    const filteredData = municipalData.filter(item => {
        const adresse = (item.adresse || item.Adresse || '').toString().toLowerCase();
        const lot = (item.lot || item.Lot || '').toString().toLowerCase();
        const reference = (item.reference || item.Reference || '').toString().toLowerCase();
        
        return adresse.includes(addressValue) &&
               lot.includes(lotValue) &&
               reference.includes(referenceValue);
    });
    
    displayDataInTable(municipalTable, filteredData);
}

/**
 * Filtrer les données gouvernementales
 */
function filterGovernmentData() {
    const addressValue = governmentAddressFilter.value.toLowerCase();
    const lotValue = governmentLotFilter.value.toLowerCase();
    const referenceValue = governmentReferenceFilter.value.toLowerCase();
    
    const filteredData = governmentData.filter(item => {
        const adresse = (item.Adresse || item.adresse || '').toString().toLowerCase();
        const lot = (item.Lot || item.lot || '').toString().toLowerCase();
        const reference = (item.Reference || item.reference || item.ID || item.NO_MEF_LIEU || '').toString().toLowerCase();
        
        return adresse.includes(addressValue) &&
               lot.includes(lotValue) &&
               reference.includes(referenceValue);
    });
    
    displayGovernmentData(governmentTable, filteredData);
}

/**
 * Exporter un tableau en PDF
 */
function exportTableToPDF(table, title) {
    const doc = new jsPDF();
    
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

/**
 * Générer un rapport d'accès à l'information
 */
function generateAccessReport() {
    const doc = new jsPDF();
    
    // Ajouter le titre
    doc.setFontSize(18);
    doc.text("Rapport d'Accès à l'Information - Terrains Contaminés", 14, 22);
    
    // Ajouter la date
    const date = new Date().toLocaleDateString('fr-CA');
    doc.setFontSize(12);
    doc.text(`Date de génération: ${date}`, 14, 30);
    doc.text(`Ville de Val-d'Or`, 14, 37);
    
    // Statistiques
    doc.setFontSize(10);
    doc.text(`Total de terrains contaminés: ${governmentData.length}`, 14, 45);
    doc.text(`Terrains municipaux recensés: ${municipalData.length}`, 14, 52);
    doc.text(`Terrains non présents au registre officiel: ${notInOfficialData.length}`, 14, 59);
    
    // Ajouter le tableau gouvernemental
    doc.autoTable({
        html: governmentTable,
        startY: 67,
        styles: {
            fontSize: 7
        },
        headStyles: {
            fillColor: [13, 110, 253]
        }
    });
    
    // Sauvegarder le PDF
    doc.save(`Rapport_Acces_Information_${date}.pdf`);
}

/**
 * Initialiser l'application
 */
async function initializeApp() {
    console.log('🚀 Initialisation de l\'application...');
    
    // Afficher un message de chargement
    lastUpdateElement.textContent = 'Chargement en cours...';
    
    try {
        // Charger les données
        await loadMunicipalData();
        await loadGovernmentData();
        
        // Comparer et catégoriser
        compareAndCategorizeData();
        
        // Mettre à jour les statistiques
        updateStatistics();
        
        // Afficher les données initiales
        displayDataInTable(municipalTable, municipalData);
        displayGovernmentData(governmentTable, governmentData);
        displayDataInTable(notInOfficialTable, notInOfficialData);
        displayDataInTable(decontaminatedTable, decontaminatedData);
        
        // Ajouter les écouteurs d'événements pour les filtres
        addressFilter.addEventListener('input', filterMunicipalData);
        lotFilter.addEventListener('input', filterMunicipalData);
        referenceFilter.addEventListener('input', filterMunicipalData);
        
        governmentAddressFilter.addEventListener('input', filterGovernmentData);
        governmentLotFilter.addEventListener('input', filterGovernmentData);
        governmentReferenceFilter.addEventListener('input', filterGovernmentData);
        
        // Ajouter les écouteurs d'événements pour les exports PDF
        exportPdfMunicipalBtn.addEventListener('click', () => 
            exportTableToPDF(municipalTable, 'Terrains_Contamines_Municipaux'));
        exportPdfGovernmentBtn.addEventListener('click', () => 
            exportTableToPDF(governmentTable, 'Repertoire_Officiel_Gouvernemental'));
        exportPdfNotInOfficialBtn.addEventListener('click', () => 
            exportTableToPDF(notInOfficialTable, 'Terrains_Non_Presents_Registre_Officiel'));
        exportPdfDecontaminatedBtn.addEventListener('click', () => 
            exportTableToPDF(decontaminatedTable, 'Terrains_Decontamines_Archives'));
        
        // Ajouter l'écouteur d'événement pour la génération de rapport
        generateReportBtn.addEventListener('click', generateAccessReport);
        
        console.log('✅ Application initialisée avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        lastUpdateElement.textContent = 'Erreur de chargement';
    }
}

// Démarrer l'application quand le DOM est prêt
document.addEventListener('DOMContentLoaded', initializeApp);
