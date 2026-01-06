const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Helper functions copied from src/app.js to simulate the environment

function normalizeAddress(address) {
    if (!address) return '';

    let normalized = String(address).toLowerCase().trim();

    // Enlever les accents
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Uniformiser les abréviations
    normalized = normalized
        .replace(/\bave\b\.?/g, 'avenue')
        .replace(/\bav\b\.?/g, 'avenue')
        .replace(/\bch\b\.?/g, 'chemin')
        .replace(/\bboul\b\.?/g, 'boulevard')
        .replace(/\bbd\b\.?/g, 'boulevard')
        .replace(/\brue\b/g, 'rue')
        .replace(/\broute\b/g, 'route')
        .replace(/\brt\b\.?/g, 'route')
        .replace(/\bouest\b/g, 'ouest')
        .replace(/\best\b/g, 'est')
        .replace(/\bnord\b/g, 'nord')
        .replace(/\bsud\b/g, 'sud');

    // Enlever ponctuation et espaces multiples
    normalized = normalized.replace(/[,\.]/g, ' ').replace(/\s+/g, ' ').trim();

    // Enlever les mentions de ville/province
    normalized = normalized.replace(/val-d'or/g, '').replace(/\(quebec\)/g, '').replace(/quebec/g, '');
    normalized = normalized.replace(/\s+/g, ' ').trim();

    return normalized;
}

function getColumnValue(item, ...possibleNames) {
    for (const name of possibleNames) {
        const value = item[name];
        if (value !== undefined && value !== null && value !== '') {
            return value;
        }
    }
    return null;
}

// Generate large fake datasets
function generateData(count, type) {
    const data = [];
    for (let i = 0; i < count; i++) {
        if (type === 'municipal') {
            data.push({
                adresse: `${i} 3e Avenue Val-d'Or`,
                lot: `${1000000 + i}`,
                reference: `REF-${i}`,
                avis_decontamination: i % 5 === 0 ? '2023-01-01' : '',
                commentaires: i % 10 === 0 ? 'Terrain décontaminé' : ''
            });
        } else {
            data.push({
                ADR_CIV_LIEU: `${i} 3e Avenue`,
                NO_MEF_LIEU: `REF-${i}`,
                IS_DECONTAMINATED: i % 5 === 0,
                ETAT_REHAB: i % 5 === 0 ? 'Terminée' : 'En cours'
            });
        }
    }
    return data;
}

const municipalData = generateData(5000, 'municipal');
const governmentData = generateData(5000, 'government');
const validationsData = { validated: [], rejected: [] };

// Original function (simulated)
function identifyDecontaminatedLandsOriginal() {
    let decontaminatedData = [];

    const govTerrainMapByRef = new Map();
    const govTerrainMapByAddress = new Map();

    // Build maps - this part has normalization inside the loop
    governmentData.forEach(terrain => {
        const ref = (terrain.NO_MEF_LIEU || terrain.reference || terrain.Reference || terrain.ID || '').toString().trim().toLowerCase();
        if (ref) {
            govTerrainMapByRef.set(ref, terrain);
        }

        const address = (terrain.ADR_CIV_LIEU || terrain.adresse || '').toString().toLowerCase().trim();
        if (address) {
            // ORIGINAL: Normalize on the fly
            const normalizedAddr = normalizeAddress(address);
            if (!govTerrainMapByAddress.has(normalizedAddr)) {
                govTerrainMapByAddress.set(normalizedAddr, []);
            }
            govTerrainMapByAddress.get(normalizedAddr).push(terrain);
        }
    });

    municipalData.forEach((item) => {
        const adresse = getColumnValue(item, 'adresse', 'address', 'Adresse', 'ADRESSE') || '';
        const reference = getColumnValue(item, 'reference');

        const referenceStr = reference ? String(reference).trim() : '';
        const hadReference = referenceStr !== '';
        let govTerrain = hadReference ? govTerrainMapByRef.get(referenceStr.toLowerCase()) : null;

        if (!govTerrain && adresse) {
            // ORIGINAL: Normalize on the fly
            const normalizedMunicipalAddr = normalizeAddress(adresse);
            const matchingTerrains = govTerrainMapByAddress.get(normalizedMunicipalAddr);
            if (matchingTerrains && matchingTerrains.length > 0) {
                govTerrain = matchingTerrains[0];
            }
        }

        if (govTerrain) {
             decontaminatedData.push(item);
        }
    });

    return decontaminatedData.length;
}

// Optimized approach preparation
function preprocessData() {
    governmentData.forEach(item => {
        const address = (item.ADR_CIV_LIEU || item.adresse || '').toString().toLowerCase().trim();
        // Calculate and cache _normalized_addr
        Object.defineProperty(item, '_normalized_addr', {
            value: normalizeAddress(address),
            writable: true,
            enumerable: false
        });
    });

    municipalData.forEach(item => {
        const adresse = getColumnValue(item, 'adresse', 'address', 'Adresse', 'ADRESSE') || '';
        // Calculate and cache _normalized_addr
        Object.defineProperty(item, '_normalized_addr', {
            value: normalizeAddress(adresse),
            writable: true,
            enumerable: false
        });
    });
}

// Optimized function (simulated)
function identifyDecontaminatedLandsOptimized() {
    let decontaminatedData = [];

    const govTerrainMapByRef = new Map();
    const govTerrainMapByAddress = new Map();

    governmentData.forEach(terrain => {
        const ref = (terrain.NO_MEF_LIEU || terrain.reference || terrain.Reference || terrain.ID || '').toString().trim().toLowerCase();
        if (ref) {
            govTerrainMapByRef.set(ref, terrain);
        }

        // OPTIMIZED: Use cached value
        const normalizedAddr = terrain._normalized_addr;
        if (normalizedAddr) {
            if (!govTerrainMapByAddress.has(normalizedAddr)) {
                govTerrainMapByAddress.set(normalizedAddr, []);
            }
            govTerrainMapByAddress.get(normalizedAddr).push(terrain);
        }
    });

    municipalData.forEach((item) => {
        const adresse = getColumnValue(item, 'adresse', 'address', 'Adresse', 'ADRESSE') || '';
        const reference = getColumnValue(item, 'reference');

        const referenceStr = reference ? String(reference).trim() : '';
        const hadReference = referenceStr !== '';
        let govTerrain = hadReference ? govTerrainMapByRef.get(referenceStr.toLowerCase()) : null;

        if (!govTerrain && adresse) {
            // OPTIMIZED: Use cached value
            const normalizedMunicipalAddr = item._normalized_addr;
            const matchingTerrains = govTerrainMapByAddress.get(normalizedMunicipalAddr);
            if (matchingTerrains && matchingTerrains.length > 0) {
                govTerrain = matchingTerrains[0];
            }
        }
         if (govTerrain) {
             decontaminatedData.push(item);
        }
    });

    return decontaminatedData.length;
}


// Benchmark
console.log('Starting benchmark...');

// Measure Original
const startOriginal = performance.now();
for (let i = 0; i < 100; i++) {
    identifyDecontaminatedLandsOriginal();
}
const endOriginal = performance.now();
const timeOriginal = endOriginal - startOriginal;
console.log(`Original implementation (100 runs): ${timeOriginal.toFixed(2)} ms`);

// Preprocess for Optimized
const startPreprocess = performance.now();
preprocessData();
const endPreprocess = performance.now();
console.log(`Preprocessing time (one-time cost): ${(endPreprocess - startPreprocess).toFixed(2)} ms`);

// Measure Optimized
const startOptimized = performance.now();
for (let i = 0; i < 100; i++) {
    identifyDecontaminatedLandsOptimized();
}
const endOptimized = performance.now();
const timeOptimized = endOptimized - startOptimized;
console.log(`Optimized implementation (100 runs): ${timeOptimized.toFixed(2)} ms`);

console.log(`Improvement: ${((timeOriginal - timeOptimized) / timeOriginal * 100).toFixed(2)}%`);
