// Importer les bibliothèques nécessaires
import jsPDF from "jspdf";
import "jspdf-autotable";

// Base URL pour les chemins (fonctionne en dev et prod avec GitHub Pages)
const BASE_URL = import.meta.env.BASE_URL;

// Variables globales pour stocker les données
let municipalData = [];
let governmentData = [];
let notInOfficialData = [];
let decontaminatedData = [];
let pendingDecontaminatedData = []; // Terrains en attente de validation

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
const statsPendingDecontaminated = document.getElementById('stats-pending-decontaminated');
const lastUpdateElement = document.getElementById('last-update');

// Bouton de synchronisation
const syncGovernmentBtn = document.getElementById('sync-government-data');

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
        const response = await fetch(BASE_URL + 'data/municipal-data.json');
        
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
        const response = await fetch(BASE_URL + 'data/government-data.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const jsonData = await response.json();
        
        // Debug : afficher la structure des données
        console.log('📦 Structure des données reçues:', {
            hasData: !!jsonData.data,
            isArray: Array.isArray(jsonData.data),
            dataLength: jsonData.data ? jsonData.data.length : 'N/A',
            metadata: jsonData.metadata
        });
        
        governmentData = jsonData.data || jsonData;
        
        // S'assurer que governmentData est un tableau
        if (!Array.isArray(governmentData)) {
            console.error('❌ governmentData n\'est pas un tableau:', typeof governmentData);
            governmentData = [];
        }
        
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
    
    // DEBUG: Afficher échantillon des références gouvernementales
    const govRefsArray = Array.from(officialReferences).slice(0, 5);
    console.log('📋 Échantillon références gouvernementales:', govRefsArray);
    
    // Identifier les terrains non présents dans le registre officiel
    let countWithReference = 0;
    let countInRegistry = 0;
    
    notInOfficialData = municipalData.filter((item, index) => {
        // Utiliser getColumnValue pour supporter différents noms de colonnes
        const reference = getColumnValue(
            item,
            'reference',
            'reference_menviq',
            'no_mef_lieu',
            'numero_menviq'
        );
        
        if (!reference) {
            return true; // Pas de référence = non officiel
        }
        
        countWithReference++;
        const referenceStr = String(reference).trim().toLowerCase();
        const isInOfficialRegistry = officialReferences.has(referenceStr);
        
        if (isInOfficialRegistry) {
            countInRegistry++;
        }
        
        // DEBUG: Log TOUS les terrains avec référence
        if (reference) {
            console.log(`🔍 Terrain ${index} [${getColumnValue(item, 'adresse', 'address')}]: ref="${referenceStr}", dans registre=${isInOfficialRegistry}`);
        }
        
        return !isInOfficialRegistry;
    });
    
    console.log(`📊 Résumé terrains municipaux:`);
    console.log(`  - Total: ${municipalData.length}`);
    console.log(`  - Avec référence: ${countWithReference}`);
    console.log(`  - Trouvés dans registre gouv: ${countInRegistry}`);
    console.log(`  - Non officiels: ${notInOfficialData.length}`);
    
    // Identifier automatiquement les terrains potentiellement décontaminés
    identifyDecontaminatedLands(officialReferences);
    
    console.log(`📋 Catégorisation terminée :`);
    console.log(`  - Terrains municipaux: ${municipalData.length}`);
    console.log(`  - Terrains gouvernementaux: ${governmentData.length}`);
    console.log(`  - Terrains non officiels: ${notInOfficialData.length}`);
    console.log(`  - Terrains décontaminés validés: ${decontaminatedData.length}`);
    console.log(`  - Terrains en attente de validation: ${pendingDecontaminatedData.length}`);
}

/**
 * Helper: Récupérer la valeur d'une colonne en essayant différents noms possibles
 * Retourne la première valeur non vide trouvée parmi les noms de colonnes possibles
 */
function getColumnValue(item, ...possibleNames) {
    for (const name of possibleNames) {
        const value = item[name];
        if (value !== undefined && value !== null && value !== '') {
            return value;
        }
    }
    return null;
}

/**
 * Identifier automatiquement les terrains décontaminés
 * Utilise les données officielles du registre gouvernemental (ETAT_REHAB, IS_DECONTAMINATED)
 * et corrèle avec les commentaires municipaux
 */
function identifyDecontaminatedLands(officialReferences) {
    console.log('🔍 Détection automatique des terrains décontaminés...');
    console.log('📊 Données municipales disponibles:', municipalData.length);
    console.log('📊 Données gouvernementales disponibles:', governmentData.length);
    
    // DIAGNOSTIC: Afficher les noms de colonnes présents dans les données
    if (municipalData.length > 0) {
        const sampleItem = municipalData[0];
        const columnNames = Object.keys(sampleItem);
        console.log('📋 Noms de colonnes détectés dans les données municipales:', columnNames);
        console.log('📋 Exemple de données du premier terrain:');
        columnNames.forEach(col => {
            const value = sampleItem[col];
            const displayValue = value ? String(value).substring(0, 50) : '(vide)';
            console.log(`  - ${col}: ${displayValue}`);
        });
    }
    
    // Récupérer les terrains déjà validés depuis localStorage
    const validatedIds = JSON.parse(localStorage.getItem('validated_decontaminated') || '[]');
    const rejectedIds = JSON.parse(localStorage.getItem('rejected_decontaminated') || '[]');
    
    console.log('💾 localStorage validés:', validatedIds.length);
    console.log('💾 localStorage rejetés:', rejectedIds.length);
    
    // Réinitialiser les listes
    decontaminatedData = [];
    pendingDecontaminatedData = [];
    
    // Créer une map des terrains gouvernementaux pour accès rapide
    const govTerrainMap = new Map();
    governmentData.forEach(terrain => {
        const ref = (terrain.NO_MEF_LIEU || terrain.reference || '').toLowerCase();
        if (ref) {
            govTerrainMap.set(ref, terrain);
        }
    });
    
    // DIAGNOSTIC: Compter les terrains avec chaque critère
    let countWithNotice = 0;
    let countWithComment = 0;
    let countWithReference = 0;
    let countIsDecontaminatedInGov = 0;
    
    municipalData.forEach((item, index) => {
        const itemId = `${item.adresse}_${item.lot}`;
        
        // Si déjà rejeté, ignorer
        if (rejectedIds.includes(itemId)) {
            return;
        }
        
        // Utiliser le helper pour récupérer les valeurs avec noms de colonnes flexibles
        const avisDecontamination = getColumnValue(
            item, 
            'avis_decontamination',      // Format attendu originel
            'avis_de_decontamination',   // Format normalisé par upload.js
            'date_avis',
            'avis_decontamination_date'
        );
        
        const commentaires = getColumnValue(
            item,
            'commentaires',              // Format attendu originel
            'commentaire',
            'comments'
        );
        
        const reference = getColumnValue(
            item,
            'reference',                 // Format attendu originel
            'reference_menviq',          // Format normalisé par upload.js
            'no_mef_lieu',
            'numero_menviq'
        );
        
        // Critère 1 : A une date d'avis de décontamination
        const hasDecontaminationNotice = avisDecontamination && 
                                        String(avisDecontamination).trim() !== '';
        if (hasDecontaminationNotice) countWithNotice++;
        
        // Critère 2 : Commentaire mentionne "décontaminé" ou "recu avis"
        const commentairesStr = commentaires ? String(commentaires).toLowerCase() : '';
        const hasDecontaminationComment = commentairesStr && 
                                         (commentairesStr.includes('décontaminé') ||
                                          commentairesStr.includes('recu avis') ||
                                          commentairesStr.includes('reçu avis'));
        if (hasDecontaminationComment) countWithComment++;
        
        // Critère 3 : Référence dans le registre gouvernemental avec état "Terminée"
        const referenceStr = reference ? String(reference).trim() : '';
        const hadReference = referenceStr !== '';
        if (hadReference) countWithReference++;
        const govTerrain = hadReference ? govTerrainMap.get(referenceStr.toLowerCase()) : null;
        const isDecontaminatedInGov = govTerrain && govTerrain.IS_DECONTAMINATED === true;
        if (isDecontaminatedInGov) countIsDecontaminatedInGov++;
        
        // Critère 4 : Avait une référence mais n'est plus dans le registre gouvernemental
        const notInGovernmentRegistry = hadReference && !officialReferences.has(referenceStr.toLowerCase());
        
        // Déterminer si le terrain est potentiellement décontaminé
        let isDecontaminated = false;
        let confidence = 'low'; // low, medium, high
        let detectionSource = '';
        
        // Priorité 1 : Confirmation gouvernementale (IS_DECONTAMINATED = true)
        if (isDecontaminatedInGov) {
            isDecontaminated = true;
            confidence = 'high';
            detectionSource = `✓ Registre gouvernemental (${govTerrain.ETAT_REHAB})`;
        }
        // Priorité 2 : Avis municipal + retiré du registre
        else if (hasDecontaminationNotice && notInGovernmentRegistry) {
            isDecontaminated = true;
            confidence = 'high';
            detectionSource = '✓ Avis de décontamination + Retiré du registre';
        }
        // Priorité 3 : Avis municipal seul OU commentaire + retiré
        else if (hasDecontaminationNotice || (notInGovernmentRegistry && hasDecontaminationComment)) {
            isDecontaminated = true;
            confidence = 'medium';
            detectionSource = [
                hasDecontaminationNotice ? '✓ Avis de décontamination' : null,
                notInGovernmentRegistry ? '✓ Retiré du registre' : null,
                hasDecontaminationComment ? '✓ Mention dans commentaires' : null
            ].filter(Boolean).join(', ');
        }
        // Priorité 4 : Retiré du registre uniquement
        else if (notInGovernmentRegistry && hadReference) {
            isDecontaminated = true;
            confidence = 'low';
            detectionSource = '✓ Retiré du registre gouvernemental';
        }
        
        if (isDecontaminated) {
            const enrichedItem = {
                ...item,
                _id: itemId,
                _confidence: confidence,
                _detection_criteria: detectionSource,
                _gov_etat_rehab: govTerrain ? govTerrain.ETAT_REHAB : null,
                _gov_fiches_urls: govTerrain ? govTerrain.FICHES_URLS : null
            };
            
            // Si déjà validé, ajouter à la liste validée
            if (validatedIds.includes(itemId)) {
                decontaminatedData.push(enrichedItem);
            } else {
                // Sinon, ajouter à la liste en attente
                pendingDecontaminatedData.push(enrichedItem);
            }
        }
    });
    
    console.log(`📋 DIAGNOSTIC des critères de détection:`);
    console.log(`  - Terrains avec avis de décontamination: ${countWithNotice}`);
    console.log(`  - Terrains avec mention dans commentaires: ${countWithComment}`);
    console.log(`  - Terrains avec référence MENVIQ: ${countWithReference}`);
    console.log(`  - Terrains décontaminés dans registre gouv (IS_DECONTAMINATED=true): ${countIsDecontaminatedInGov}`);
    console.log(`✅ Détection terminée:`);
    console.log(`  - ${decontaminatedData.length} terrains décontaminés validés`);
    console.log(`  - ${pendingDecontaminatedData.length} terrains en attente de validation`);
    
    // DEBUG: Afficher les IDs validés vs détectés
    if (decontaminatedData.length === 0 && validatedIds.length > 0) {
        console.warn(`⚠️ PROBLÈME: ${validatedIds.length} IDs validés dans localStorage mais 0 terrains dans decontaminatedData!`);
        console.warn('IDs validés:', validatedIds);
        console.warn('ItemIds des terrains municipaux (premiers 5):', 
            municipalData.slice(0, 5).map(item => {
                const adresse = getColumnValue(item, 'adresse', 'address') || '';
                const lot = getColumnValue(item, 'lot', 'numero_de_lot') || '';
                return `${adresse}_${lot}`;
            })
        );
    }
}

/**
 * Mettre à jour les statistiques
 */
function updateStatistics() {
    console.log('📊 Mise à jour des statistiques:', {
        municipal: municipalData.length,
        government: governmentData.length,
        notOfficial: notInOfficialData.length,
        decontaminated: decontaminatedData.length,
        pending: pendingDecontaminatedData.length
    });
    
    statsMunicipal.textContent = municipalData.length;
    statsGovernment.textContent = governmentData.length;
    statsNotOfficial.textContent = notInOfficialData.length;
    statsDecontaminated.textContent = decontaminatedData.length;
    
    // Afficher le badge de notification pour les terrains en attente
    if (statsPendingDecontaminated) {
        statsPendingDecontaminated.textContent = pendingDecontaminatedData.length;
        if (pendingDecontaminatedData.length > 0) {
            statsPendingDecontaminated.classList.add('badge', 'bg-warning');
        } else {
            statsPendingDecontaminated.classList.remove('badge', 'bg-warning');
        }
    }
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
        cell.colSpan = 9; // Augmenté pour les nouvelles colonnes (Qualité avant/après)
        cell.className = 'text-center text-muted';
        cell.textContent = 'Aucune donnée disponible';
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }
    
    data.forEach(item => {
        const row = document.createElement('tr');
        
        // Colonne 1: Référence
        const refCell = document.createElement('td');
        refCell.textContent = item.NO_MEF_LIEU || item.reference || item.Reference || '';
        row.appendChild(refCell);
        
        // Colonne 2: Adresse
        const addrCell = document.createElement('td');
        const cleanAddr = cleanAddress(item.ADR_CIV_LIEU || item.adresse || item.Adresse || '');
        addrCell.textContent = cleanAddr;
        if (cleanAddr.length > 50) {
            addrCell.title = cleanAddr;
            addrCell.style.cursor = 'help';
        }
        row.appendChild(addrCell);
        
        // Colonne 3: Code postal
        const postalCell = document.createElement('td');
        postalCell.textContent = item.CODE_POST_LIEU || item.code_postal || '';
        row.appendChild(postalCell);
        
        // Colonne 4: État de réhabilitation avec badge
        const etatCell = document.createElement('td');
        const etatRehab = item.ETAT_REHAB || '';
        if (etatRehab) {
            // Créer un badge selon l'état
            if (etatRehab.includes('Terminée')) {
                etatCell.innerHTML = `<span class="badge-decontamine" title="${etatRehab}">✅ ${etatRehab}</span>`;
            } else if (etatRehab.includes('Initiée')) {
                etatCell.innerHTML = `<span class="badge-en-cours" title="${etatRehab}">🔄 ${etatRehab}</span>`;
            } else if (etatRehab.includes('Non débutée')) {
                etatCell.innerHTML = `<span class="badge-non-debutee" title="${etatRehab}">⏸️ ${etatRehab}</span>`;
            } else {
                etatCell.textContent = etatRehab;
            }
        } else {
            etatCell.textContent = 'N/D';
            etatCell.style.color = '#999';
        }
        row.appendChild(etatCell);
        
        // Colonne 5: Qualité des sols AVANT décontamination
        const qualAvantCell = document.createElement('td');
        const qualAv = item.QUAL_SOLS_AV || '';
        if (qualAv) {
            const badge = createQualityBadge(qualAv);
            qualAvantCell.innerHTML = badge;
        } else {
            qualAvantCell.innerHTML = '<span class="qual-badge qual-empty">-</span>';
        }
        row.appendChild(qualAvantCell);
        
        // Colonne 6: Qualité des sols APRÈS décontamination (critère atteint)
        const qualApresCell = document.createElement('td');
        const qualAp = item.QUAL_SOLS || '';
        if (qualAp) {
            const badge = createQualityBadge(qualAp);
            qualApresCell.innerHTML = badge;
        } else {
            qualApresCell.innerHTML = '<span class="qual-badge qual-empty">-</span>';
        }
        row.appendChild(qualApresCell);
        
        // Colonne 7: Contaminants (Sol)
        const contamCell = document.createElement('td');
        const contaminants = item.CONTAM_SOL_EXTRA || '';
        if (contaminants) {
            // Nettoyer et formater les contaminants
            const contamList = contaminants
                .replace(/\r\n/g, ', ')
                .replace(/\n/g, ', ')
                .split(',')
                .map(c => c.trim())
                .filter(c => c.length > 0)
                .slice(0, 5); // Limiter à 5 premiers
            
            const contamDiv = document.createElement('div');
            contamDiv.className = 'contaminants-cell';
            contamDiv.textContent = contamList.join(', ');
            
            // Ajouter "..." si plus de 5 contaminants
            if (contaminants.split(',').length > 5) {
                contamDiv.textContent += ', ...';
            }
            
            // Tooltip avec la liste complète
            contamDiv.title = contaminants.replace(/\r\n/g, ', ').replace(/\n/g, ', ');
            contamDiv.style.cursor = 'help';
            
            contamCell.appendChild(contamDiv);
        } else {
            contamCell.textContent = 'Non spécifié';
            contamCell.style.color = '#999';
        }
        row.appendChild(contamCell);
        
        // Colonne 8: Milieu récepteur
        const milieuCell = document.createElement('td');
        milieuCell.textContent = item.DESC_MILIEU_RECEPT || item.milieu_recepteur || '';
        row.appendChild(milieuCell);
        
        // Colonne 9: Lien vers Repère GTC pour consultation
        const consultCell = document.createElement('td');
        const mefLieu = item.NO_MEF_LIEU || '';
        if (mefLieu) {
            const link = document.createElement('a');
            link.href = `https://www.pes1.enviroweb.gouv.qc.ca/AtlasPublic/CartesPubliques/cartesmddelcc.html?cfg=TerrainsContamines.json`;
            link.target = '_blank';
            link.className = 'fiche-link';
            link.textContent = '🗺️ Atlas';
            link.title = `Consulter sur Repère GTC (rechercher: ${mefLieu})`;
            consultCell.appendChild(link);
        } else {
            consultCell.textContent = '-';
            consultCell.style.color = '#999';
        }
        row.appendChild(consultCell);
        
        tbody.appendChild(row);
    });
}

/**
 * Créer un badge de qualité des sols
 */
function createQualityBadge(quality) {
    if (!quality || quality === '') {
        return '<span class="qual-badge qual-empty">-</span>';
    }
    
    const qualStr = quality.toString().trim();
    let badgeClass = 'qual-empty';
    let badgeText = qualStr;
    
    if (qualStr.includes('Plage A')) {
        badgeClass = 'qual-a';
        badgeText = 'A';
    } else if (qualStr.includes('Plage B-C') || qualStr.includes('Plage BC')) {
        badgeClass = 'qual-bc';
        badgeText = 'B-C';
    } else if (qualStr.includes('Plage B')) {
        badgeClass = 'qual-b';
        badgeText = 'B';
    } else if (qualStr.includes('Plage C')) {
        badgeClass = 'qual-c';
        badgeText = 'C';
    }
    
    return `<span class="qual-badge ${badgeClass}" title="${qualStr}">${badgeText}</span>`;
}

/**
 * Afficher les terrains décontaminés avec badges de statut et actions de validation
 */
function displayDecontaminatedData(table, data, showValidationButtons = false) {
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 9; // Toujours 9 colonnes (8 données + 1 actions)
        cell.className = 'text-center text-muted';
        cell.textContent = 'Aucune donnée disponible';
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }
    
    data.forEach((item, index) => {
        const row = document.createElement('tr');
        
        // Utiliser getColumnValue pour supporter différents noms de colonnes
        const adresse = getColumnValue(item, 'adresse', 'address') || '';
        const lot = getColumnValue(item, 'lot', 'numero_de_lot', 'numero_lot') || '';
        const reference = getColumnValue(item, 'reference', 'reference_menviq', 'no_mef_lieu') || 'N/A';
        const bureauPublicite = getColumnValue(item, 'bureau_publicite', 'bureau_publicite_des_droits') || '';
        const commentaires = getColumnValue(item, 'commentaires', 'commentaire', 'comments') || '';
        const avisDecontamination = getColumnValue(
            item,
            'avis_decontamination',
            'avis_de_decontamination',
            'date_avis'
        );
        
        // Badge de statut selon la confiance
        let statusBadge;
        if (item._confidence === 'high') {
            statusBadge = '<span class="badge bg-success" title="Avis de décontamination + Retiré du registre">🟢 Confirmé</span>';
        } else if (item._confidence === 'medium') {
            statusBadge = '<span class="badge bg-warning text-dark" title="Avis OU mention + retrait">🟡 Probable</span>';
        } else {
            statusBadge = '<span class="badge bg-secondary" title="Retiré du registre uniquement">⚪ Présumé</span>';
        }
        
        const decontaminationDate = avisDecontamination 
            ? formatDate(avisDecontamination)
            : 'Non spécifiée';
        
        // Colonnes
        const columns = [
            adresse,
            lot,
            reference,
            decontaminationDate,
            bureauPublicite,
            statusBadge,
            item._detection_criteria || '',
            commentaires
        ];
        
        columns.forEach((value, colIndex) => {
            const cell = document.createElement('td');
            if (colIndex === 5) { // Badge HTML
                cell.innerHTML = value;
            } else {
                cell.textContent = value;
            }
            
            // Tooltip pour textes longs
            if (typeof value === 'string' && value.length > 50) {
                cell.title = value;
                cell.style.cursor = 'help';
            }
            
            row.appendChild(cell);
        });
        
        // Ajouter les boutons de validation/actions
        const escapedId = (item._id || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
        if (showValidationButtons) {
            // Boutons pour terrains en attente: Valider ou Rejeter
            const actionsCell = document.createElement('td');
            actionsCell.innerHTML = `
                <button class="btn btn-sm btn-success me-1" onclick="validateDecontamination('${escapedId}')">
                    ✓ Valider
                </button>
                <button class="btn btn-sm btn-danger" onclick="rejectDecontamination('${escapedId}')">
                    ✗ Rejeter
                </button>
            `;
            row.appendChild(actionsCell);
        } else {
            // Bouton pour terrains validés: Annuler la validation (rejeter)
            const actionsCell = document.createElement('td');
            actionsCell.innerHTML = `
                <button class="btn btn-sm btn-outline-danger" onclick="rejectDecontamination('${escapedId}')" title="Annuler la validation de ce terrain">
                    ✗ Rejeter
                </button>
            `;
            row.appendChild(actionsCell);
        }
        
        tbody.appendChild(row);
    });
}

/**
 * Formater une date au format français
 */
function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-CA');
    } catch (e) {
        return dateString;
    }
}

/**
 * Valider un terrain décontaminé
 */
window.validateDecontamination = function(itemId) {
    console.log(`✅ Validation du terrain: ${itemId}`);
    
    // Récupérer les listes
    const validatedIds = JSON.parse(localStorage.getItem('validated_decontaminated') || '[]');
    const rejectedIds = JSON.parse(localStorage.getItem('rejected_decontaminated') || '[]');
    
    // Ajouter à la liste validée
    if (!validatedIds.includes(itemId)) {
        validatedIds.push(itemId);
    }
    
    // Retirer de la liste rejetée si présent
    const rejectedIndex = rejectedIds.indexOf(itemId);
    if (rejectedIndex > -1) {
        rejectedIds.splice(rejectedIndex, 1);
    }
    
    // Sauvegarder
    localStorage.setItem('validated_decontaminated', JSON.stringify(validatedIds));
    localStorage.setItem('rejected_decontaminated', JSON.stringify(rejectedIds));
    
    // Rafraîchir l'affichage
    compareAndCategorizeData();
    updateStatistics();
    displayDecontaminatedData(decontaminatedTable, decontaminatedData, false);
    
    // Mettre à jour le compteur
    const countElement = document.getElementById('decontaminated-filtered-count');
    if (countElement) {
        countElement.textContent = decontaminatedData.length;
    }
    displayPendingDecontaminatedData();
    
    showNotification('Terrain validé avec succès!', 'success');
}

/**
 * Rejeter un terrain décontaminé
 */
window.rejectDecontamination = function(itemId) {
    console.log(`❌ Rejet du terrain: ${itemId}`);
    
    // Récupérer les listes
    const validatedIds = JSON.parse(localStorage.getItem('validated_decontaminated') || '[]');
    const rejectedIds = JSON.parse(localStorage.getItem('rejected_decontaminated') || '[]');
    
    // Ajouter à la liste rejetée
    if (!rejectedIds.includes(itemId)) {
        rejectedIds.push(itemId);
    }
    
    // Retirer de la liste validée si présent
    const validatedIndex = validatedIds.indexOf(itemId);
    if (validatedIndex > -1) {
        validatedIds.splice(validatedIndex, 1);
    }
    
    // Sauvegarder
    localStorage.setItem('validated_decontaminated', JSON.stringify(validatedIds));
    localStorage.setItem('rejected_decontaminated', JSON.stringify(rejectedIds));
    
    // Rafraîchir l'affichage
    compareAndCategorizeData();
    updateStatistics();
    displayDecontaminatedData(decontaminatedTable, decontaminatedData, false);
    
    // Mettre à jour le compteur
    const countElement = document.getElementById('decontaminated-filtered-count');
    if (countElement) {
        countElement.textContent = decontaminatedData.length;
    }
    displayPendingDecontaminatedData();
    
    showNotification('Terrain rejeté', 'info');
}

/**
 * Afficher une notification temporaire
 */
function showNotification(message, type = 'info') {
    const alertClass = type === 'success' ? 'alert-success' : 
                      type === 'danger' ? 'alert-danger' : 
                      type === 'warning' ? 'alert-warning' : 'alert-info';
    
    const notification = document.createElement('div');
    notification.className = `alert ${alertClass} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    notification.style.zIndex = '9999';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

/**
 * Forcer le rafraîchissement du cache (pour synchroniser entre appareils)
 */
function forceRefreshCache() {
    console.log('🔄 Forçage du rafraîchissement du cache...');
    
    // Afficher les données actuelles dans localStorage
    console.log('💾 Données localStorage actuelles:');
    console.log('- temp_municipal_data:', localStorage.getItem('temp_municipal_data') ? 'présent' : 'absent');
    console.log('- validated_decontaminated:', localStorage.getItem('validated_decontaminated') || '[]');
    console.log('- rejected_decontaminated:', localStorage.getItem('rejected_decontaminated') || '[]');
    
    // Recalculer tout
    compareAndCategorizeData();
    updateStatistics();
    
    // Rafraîchir tous les affichages
    displayDataInTable(municipalTable, municipalData);
    displayGovernmentData(governmentTable, governmentData);
    displayDataInTable(notInOfficialTable, notInOfficialData);
    displayDecontaminatedData(decontaminatedTable, decontaminatedData, false);
    
    // Mettre à jour le compteur
    const countElement = document.getElementById('decontaminated-filtered-count');
    if (countElement) {
        countElement.textContent = decontaminatedData.length;
    }
    displayPendingDecontaminatedData();
    
    // Recalculer les stats de décontamination
    calculateDecontaminationStats();
    
    console.log('✅ Rafraîchissement terminé');
    console.log(`📊 Résultat: ${decontaminatedData.length} validés, ${pendingDecontaminatedData.length} en attente`);
    
    showNotification(`Rafraîchissement terminé: ${pendingDecontaminatedData.length} terrains en attente de validation`, 'success');
}

/**
 * Afficher les terrains en attente de validation dans un tableau séparé
 */
function displayPendingDecontaminatedData() {
    const pendingTable = document.getElementById('pending-decontaminated-table');
    if (pendingTable) {
        displayDecontaminatedData(pendingTable, pendingDecontaminatedData, true);
    }
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
 * Filtrer les terrains décontaminés (Phase 2)
 */
function filterDecontaminatedData() {
    const addressFilter = document.getElementById('decontaminated-address-filter');
    const yearFilter = document.getElementById('decontaminated-year-filter');
    const statusFilter = document.getElementById('decontaminated-status-filter');
    
    if (!addressFilter) return; // Si les filtres n'existent pas encore
    
    const addressValue = addressFilter.value.toLowerCase();
    const yearValue = yearFilter.value;
    const statusValue = statusFilter.value;
    
    const filteredData = decontaminatedData.filter(item => {
        const adresse = (item.adresse || '').toString().toLowerCase();
        const matchAddress = adresse.includes(addressValue);
        
        let matchYear = true;
        if (yearValue && item.avis_decontamination) {
            const itemYear = new Date(item.avis_decontamination).getFullYear().toString();
            matchYear = itemYear === yearValue;
        }
        
        let matchStatus = true;
        if (statusValue) {
            matchStatus = item._confidence === statusValue;
        }
        
        return matchAddress && matchYear && matchStatus;
    });
    
    displayDecontaminatedData(decontaminatedTable, filteredData, false);
    
    // Mettre à jour le compteur
    const countElement = document.getElementById('decontaminated-filtered-count');
    if (countElement) {
        countElement.textContent = filteredData.length;
    }
}

/**
 * Synchroniser les données gouvernementales
 * Recharge les données depuis le serveur et recatégorise tout
 */
async function synchronizeGovernmentData() {
    console.log('🔄 Synchronisation des données gouvernementales...');
    
    // Afficher un indicateur de chargement
    if (syncGovernmentBtn) {
        syncGovernmentBtn.disabled = true;
        syncGovernmentBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Synchronisation...';
    }
    
    try {
        // Forcer le rechargement en ajoutant un timestamp pour éviter le cache
        const timestamp = new Date().getTime();
        const response = await fetch(BASE_URL + `data/government-data.json?t=${timestamp}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const jsonData = await response.json();
        governmentData = jsonData.data || jsonData;
        
        console.log(`✅ ${governmentData.length} enregistrements gouvernementaux rechargés`);
        
        // Mettre à jour la date
        if (jsonData.metadata && jsonData.metadata.last_update) {
            const updateDate = new Date(jsonData.metadata.last_update);
            lastUpdateElement.textContent = updateDate.toLocaleDateString('fr-CA') + ' à ' + 
                                            updateDate.toLocaleTimeString('fr-CA');
        }
        
        // Recatégoriser toutes les données
        compareAndCategorizeData();
        updateStatistics();
        
        // Rafraîchir tous les affichages
        displayGovernmentData(governmentTable, governmentData);
        displayDataInTable(notInOfficialTable, notInOfficialData);
        displayDecontaminatedData(decontaminatedTable, decontaminatedData, false);
    
    // Mettre à jour le compteur
    const countElement = document.getElementById('decontaminated-filtered-count');
    if (countElement) {
        countElement.textContent = decontaminatedData.length;
    }
        displayPendingDecontaminatedData();
        
        showNotification('Données gouvernementales synchronisées avec succès!', 'success');
        
    } catch (error) {
        console.error('❌ Erreur lors de la synchronisation:', error);
        showNotification('Erreur lors de la synchronisation des données', 'danger');
    } finally {
        // Restaurer le bouton
        if (syncGovernmentBtn) {
            syncGovernmentBtn.disabled = false;
            syncGovernmentBtn.innerHTML = '🔄 Synchroniser les données';
        }
    }
}

/**
 * Calculer les statistiques annuelles de décontamination (Phase 2)
 */
function calculateDecontaminationStats() {
    const statsByYear = {};
    
    decontaminatedData.forEach(item => {
        // Utiliser getColumnValue pour supporter différents noms de colonnes
        const avisDecontamination = getColumnValue(
            item,
            'avis_decontamination',
            'avis_de_decontamination',
            'date_avis',
            'avis_decontamination_date'
        );
        
        if (avisDecontamination) {
            try {
                const year = new Date(avisDecontamination).getFullYear();
                statsByYear[year] = (statsByYear[year] || 0) + 1;
            } catch (e) {
                // Ignorer les dates invalides
            }
        }
    });
    
    // Afficher les statistiques
    const statsContainer = document.getElementById('decontamination-yearly-stats');
    if (statsContainer) {
        const years = Object.keys(statsByYear).sort().reverse();
        let html = '<h6>📊 Statistiques annuelles</h6><div class="row">';
        
        years.forEach(year => {
            html += `
                <div class="col-md-3 mb-2">
                    <div class="card">
                        <div class="card-body p-2 text-center">
                            <h6 class="mb-0">${year}</h6>
                            <h4 class="mb-0 text-primary">${statsByYear[year]}</h4>
                            <small class="text-muted">terrain${statsByYear[year] > 1 ? 's' : ''}</small>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        statsContainer.innerHTML = html;
    }
}

/**
 * Ajouter le logo et l'en-tête officiel au PDF (format paysage)
 */
async function addPDFHeader(doc, title) {
    try {
        // Charger le logo
        const logoImg = new Image();
        logoImg.src = BASE_URL + 'assets/valdor-logo.png';
        
        await new Promise((resolve, reject) => {
            logoImg.onload = () => {
                // Calculer les dimensions pour garder le ratio d'aspect
                // Logo original est environ 300x150 (ratio 2:1)
                const logoWidth = 50;
                const logoHeight = 25;
                
                // Ajouter le logo en haut à gauche (non compressé)
                doc.addImage(logoImg, 'PNG', 15, 12, logoWidth, logoHeight);
                resolve();
            };
            logoImg.onerror = () => {
                console.warn('Logo non chargé, continuation sans logo');
                resolve();
            };
            // Timeout de 2 secondes
            setTimeout(resolve, 2000);
        });
    } catch (error) {
        console.warn('Erreur lors du chargement du logo:', error);
    }
    
    // En-tête professionnel centré
    const pageWidth = doc.internal.pageSize.width;
    
    // Titre principal
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(title, pageWidth / 2, 20, { align: 'center' });
    
    // Sous-titre ville
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Ville de Val-d\'Or', pageWidth / 2, 28, { align: 'center' });
    
    // Date
    const date = new Date().toLocaleDateString('fr-CA');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date de génération: ${date}`, pageWidth / 2, 35, { align: 'center' });
    
    // Ligne de séparation
    doc.setDrawColor(198, 54, 64); // Rouge Val-d'Or
    doc.setLineWidth(0.5);
    doc.line(15, 40, pageWidth - 15, 40);
    
    doc.setTextColor(0); // Réinitialiser la couleur
    
    return 45; // Retourner la position Y de départ pour le contenu
}

/**
 * Exporter un tableau en PDF avec logo officiel (format Legal paysage)
 */
async function exportTableToPDF(table, title) {
    // Format Legal (8.5" x 14") en orientation paysage
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'legal' // 215.9mm x 355.6mm en paysage
    });
    
    // Ajouter l'en-tête avec logo
    const startY = await addPDFHeader(doc, title);
    
    // Ajouter le tableau avec colonnes optimisées pour paysage Legal (325mm de largeur disponible)
    doc.autoTable({
        html: table,
        startY: startY + 5,
        margin: { left: 15, right: 15 },
        styles: {
            fontSize: 7,
            cellPadding: 2,
            overflow: 'linebreak',
            halign: 'left',
            valign: 'middle',
            cellWidth: 'wrap'
        },
        headStyles: {
            fillColor: [198, 54, 64], // Rouge de Val-d'Or
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8,
            halign: 'center'
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        tableWidth: 'auto'
    });
    
    // Pied de page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Page ${i} sur ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }
    
    // Sauvegarder le PDF
    const date = new Date().toLocaleDateString('fr-CA');
    doc.save(`${title.replace(/\s+/g, '_')}_${date}.pdf`);
}

/**
 * Générer un rapport d'accès à l'information complet et professionnel (format Legal paysage)
 */
async function generateAccessReport() {
    // Format Legal paysage pour tout le rapport
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'legal'
    });
    
    const date = new Date().toLocaleDateString('fr-CA');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Page 1: Page de garde professionnelle
    try {
        const logoImg = new Image();
        logoImg.src = BASE_URL + 'assets/valdor-logo.png';
        
        await new Promise((resolve) => {
            logoImg.onload = () => {
                // Logo centré en haut (non compressé)
                const logoWidth = 70;
                const logoHeight = 35;
                doc.addImage(logoImg, 'PNG', (pageWidth - logoWidth) / 2, 40, logoWidth, logoHeight);
                resolve();
            };
            logoImg.onerror = resolve;
            setTimeout(resolve, 2000);
        });
    } catch (error) {
        console.warn('Logo non chargé');
    }
    
    // Titre principal
    doc.setFontSize(26);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(198, 54, 64); // Rouge Val-d'Or
    doc.text("Rapport d'Accès à l'Information", pageWidth / 2, 85, { align: 'center' });
    
    doc.setTextColor(0);
    doc.setFontSize(20);
    doc.text("Registre des Terrains Contaminés", pageWidth / 2, 98, { align: 'center' });
    
    // Informations officielles
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text("Ville de Val-d'Or", pageWidth / 2, 115, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(60);
    doc.text("Extraction du répertoire officiel provincial", pageWidth / 2, 125, { align: 'center' });
    doc.text("Dans le cadre d'une demande d'accès à l'information", pageWidth / 2, 132, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Date de mise à jour: ${date}`, pageWidth / 2, 142, { align: 'center' });
    
    // Résumé exécutif dans un cadre
    doc.setTextColor(0);
    doc.setDrawColor(198, 54, 64);
    doc.setLineWidth(0.5);
    doc.rect(40, 155, pageWidth - 80, 45);
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("Résumé Exécutif", pageWidth / 2, 165, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const stats = [
        `Terrains au registre gouvernemental: ${governmentData.length}`,
        `Terrains municipaux recensés: ${municipalData.length}`,
        `Terrains décontaminés validés: ${decontaminatedData.length}`,
        `Terrains en attente de validation: ${pendingDecontaminatedData.length}`,
        `Terrains non présents au registre officiel: ${notInOfficialData.length}`
    ];
    
    let yPos = 175;
    stats.forEach(stat => {
        doc.text(`• ${stat}`, 50, yPos);
        yPos += 7;
    });
    
    // Note légale
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
        "Ce rapport a été généré automatiquement à partir des données du registre gouvernemental",
        pageWidth / 2, 
        pageHeight - 20, 
        { align: 'center' }
    );
    doc.text(
        "et des registres municipaux de la Ville de Val-d'Or.",
        pageWidth / 2, 
        pageHeight - 15, 
        { align: 'center' }
    );
    
    // Page 2: Tableau détaillé avec en-tête professionnel
    doc.addPage();
    doc.setTextColor(0);
    
    // Ajouter l'en-tête avec logo sur cette page aussi
    await addPDFHeader(doc, "Registre Détaillé des Terrains Contaminés");
    
    // Tableau gouvernemental optimisé pour paysage Legal
    doc.autoTable({
        html: governmentTable,
        startY: 50,
        margin: { left: 15, right: 15 },
        styles: {
            fontSize: 7,
            cellPadding: 2,
            overflow: 'linebreak',
            halign: 'left',
            valign: 'middle'
        },
        headStyles: {
            fillColor: [198, 54, 64],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8,
            halign: 'center'
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        tableWidth: 'wrap',
        columnStyles: {
            0: { cellWidth: 28 },  // Référence
            1: { cellWidth: 50 },  // Adresse
            2: { cellWidth: 18 },  // Code postal
            3: { cellWidth: 32 },  // État réhabilitation
            4: { cellWidth: 22 },  // Qualité avant
            5: { cellWidth: 22 },  // Qualité après
            6: { cellWidth: 60, overflow: 'linebreak', cellPadding: 2 },  // Contaminants (avec retours de ligne)
            7: { cellWidth: 28 },  // Milieu récepteur
            8: { cellWidth: 18 }   // Consultation
        }
    });
    
    // Pied de page pour toutes les pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Ville de Val-d'Or - Rapport Terrains Contaminés - Page ${i}/${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }
    
    // Sauvegarder le PDF
    doc.save(`Rapport_Officiel_Terrains_Contamines_Val-dOr_${date}.pdf`);
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
        displayDecontaminatedData(decontaminatedTable, decontaminatedData, false);
    
    // Mettre à jour le compteur
    const countElement = document.getElementById('decontaminated-filtered-count');
    if (countElement) {
        countElement.textContent = decontaminatedData.length;
    }
        displayPendingDecontaminatedData();
        
        // Calculer les statistiques de décontamination
        calculateDecontaminationStats();
        
        // Ajouter les écouteurs d'événements pour les filtres
        addressFilter.addEventListener('input', filterMunicipalData);
        lotFilter.addEventListener('input', filterMunicipalData);
        referenceFilter.addEventListener('input', filterMunicipalData);
        
        governmentAddressFilter.addEventListener('input', filterGovernmentData);
        governmentLotFilter.addEventListener('input', filterGovernmentData);
        governmentReferenceFilter.addEventListener('input', filterGovernmentData);
        
        // Ajouter les écouteurs pour les filtres décontaminés (Phase 2)
        const decontaminatedAddressFilter = document.getElementById('decontaminated-address-filter');
        const decontaminatedYearFilter = document.getElementById('decontaminated-year-filter');
        const decontaminatedStatusFilter = document.getElementById('decontaminated-status-filter');
        
        if (decontaminatedAddressFilter) {
            decontaminatedAddressFilter.addEventListener('input', filterDecontaminatedData);
        }
        if (decontaminatedYearFilter) {
            decontaminatedYearFilter.addEventListener('change', filterDecontaminatedData);
        }
        if (decontaminatedStatusFilter) {
            decontaminatedStatusFilter.addEventListener('change', filterDecontaminatedData);
        }
        
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
        
        // Ajouter l'écouteur pour le bouton de synchronisation
        if (syncGovernmentBtn) {
            syncGovernmentBtn.addEventListener('click', synchronizeGovernmentData);
        }
        
        // Ajouter l'écouteur pour le bouton de rafraîchissement forcé
        const forceRefreshBtn = document.getElementById('force-refresh-decontaminated');
        if (forceRefreshBtn) {
            forceRefreshBtn.addEventListener('click', forceRefreshCache);
        }
        
        console.log('✅ Application initialisée avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        lastUpdateElement.textContent = 'Erreur de chargement';
    }
}

// Démarrer l'application quand le DOM est prêt
document.addEventListener('DOMContentLoaded', initializeApp);
