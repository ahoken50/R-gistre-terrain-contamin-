/**
 * Configuration Firebase pour Registre Terrains Contaminés Val-d'Or
 * 
 * IMPORTANT: L'API key est chargée depuis les variables d'environnement
 * Pour le développement local, créez un fichier .env.local avec:
 * VITE_FIREBASE_API_KEY=votre_api_key
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, setDoc, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';

// Configuration Firebase (API key chargée depuis variable d'environnement)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCXkuOEHJ8RFz4st6ilEtxGWk5UtuWn8Gk",
  authDomain: "r-gistre-terrain-contamin.firebaseapp.com",
  projectId: "r-gistre-terrain-contamin",
  storageBucket: "r-gistre-terrain-contamin.firebasestorage.app",
  messagingSenderId: "501248384607",
  appId: "1:501248384607:web:6199f69d20a194639a45ea",
  measurementId: "G-5B5GYK1SHF"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🔥 Firebase initialisé avec succès');

/**
 * Collections Firestore
 */
const COLLECTIONS = {
  MUNICIPAL_DATA: 'municipal_data',
  GOVERNMENT_DATA: 'government_data',
  VALIDATIONS: 'validations',
  APP_STATE: 'app_state'
};

/**
 * Sauvegarder les données municipales
 */
export async function saveMunicipalData(data) {
  try {
    console.log('💾 Sauvegarde des données municipales dans Firebase...', data.length, 'enregistrements');
    const docRef = doc(db, COLLECTIONS.MUNICIPAL_DATA, 'current');
    await setDoc(docRef, {
      data: data,
      lastUpdate: new Date().toISOString(),
      count: data.length
    });
    console.log('✅ Données municipales sauvegardées dans Firebase');
    return true;
  } catch (error) {
    console.error('❌ Erreur sauvegarde données municipales Firebase:', error);
    throw error;
  }
}

/**
 * Charger les données municipales
 */
export async function loadMunicipalData() {
  try {
    console.log('📥 Chargement des données municipales depuis Firebase...');
    const docRef = doc(db, COLLECTIONS.MUNICIPAL_DATA, 'current');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const result = docSnap.data();
      console.log('✅ Données municipales chargées depuis Firebase:', result.count, 'enregistrements');
      return result.data || [];
    } else {
      console.log('⚠️ Aucune donnée municipale dans Firebase');
      return [];
    }
  } catch (error) {
    console.error('❌ Erreur chargement données municipales Firebase:', error);
    return [];
  }
}

/**
 * Sauvegarder les données gouvernementales
 */
export async function saveGovernmentData(data) {
  try {
    console.log('💾 Sauvegarde des données gouvernementales dans Firebase...', data.length, 'enregistrements');
    const docRef = doc(db, COLLECTIONS.GOVERNMENT_DATA, 'current');
    await setDoc(docRef, {
      data: data,
      lastUpdate: new Date().toISOString(),
      count: data.length
    });
    console.log('✅ Données gouvernementales sauvegardées dans Firebase');
    return true;
  } catch (error) {
    console.error('❌ Erreur sauvegarde données gouvernementales Firebase:', error);
    throw error;
  }
}

/**
 * Charger les données gouvernementales
 */
export async function loadGovernmentData() {
  try {
    console.log('📥 Chargement des données gouvernementales depuis Firebase...');
    const docRef = doc(db, COLLECTIONS.GOVERNMENT_DATA, 'current');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const result = docSnap.data();
      console.log('✅ Données gouvernementales chargées depuis Firebase:', result.count, 'enregistrements');
      return result.data || [];
    } else {
      console.log('⚠️ Aucune donnée gouvernementale dans Firebase');
      return [];
    }
  } catch (error) {
    console.error('❌ Erreur chargement données gouvernementales Firebase:', error);
    return [];
  }
}

/**
 * Sauvegarder les validations de décontamination
 */
export async function saveValidations(validationsData) {
  try {
    console.log('💾 Sauvegarde des validations dans Firebase...');
    const docRef = doc(db, COLLECTIONS.VALIDATIONS, 'current');
    await setDoc(docRef, {
      validated: validationsData.validated || [],
      rejected: validationsData.rejected || [],
      lastUpdate: new Date().toISOString()
    });
    console.log('✅ Validations sauvegardées dans Firebase:', validationsData.validated?.length || 0, 'validés,', validationsData.rejected?.length || 0, 'rejetés');
    return true;
  } catch (error) {
    console.error('❌ Erreur sauvegarde validations Firebase:', error);
    throw error;
  }
}

/**
 * Charger les validations de décontamination
 */
export async function loadValidations() {
  try {
    console.log('📥 Chargement des validations depuis Firebase...');
    const docRef = doc(db, COLLECTIONS.VALIDATIONS, 'current');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const result = docSnap.data();
      console.log('✅ Validations chargées depuis Firebase:', result.validated?.length || 0, 'validés,', result.rejected?.length || 0, 'rejetés');
      return {
        validated: result.validated || [],
        rejected: result.rejected || [],
        lastUpdate: result.lastUpdate
      };
    } else {
      console.log('⚠️ Aucune validation dans Firebase');
      return { validated: [], rejected: [], lastUpdate: null };
    }
  } catch (error) {
    console.error('❌ Erreur chargement validations Firebase:', error);
    return { validated: [], rejected: [], lastUpdate: null };
  }
}

/**
 * Migrer les données depuis localStorage vers Firebase
 * Cette fonction doit être appelée une seule fois pour migrer les données existantes
 */
export async function migrateFromLocalStorage() {
  try {
    console.log('🔄 Migration des données localStorage vers Firebase...');
    let migrated = false;
    
    // Migrer les données municipales
    const localMunicipal = localStorage.getItem('municipal_data');
    if (localMunicipal) {
      const municipalData = JSON.parse(localMunicipal);
      await saveMunicipalData(municipalData);
      console.log('✅ Données municipales migrées');
      migrated = true;
    }
    
    // Migrer les validations
    const localValidated = localStorage.getItem('validated_decontaminated');
    const localRejected = localStorage.getItem('rejected_decontaminated');
    if (localValidated || localRejected) {
      const validationsData = {
        validated: localValidated ? JSON.parse(localValidated) : [],
        rejected: localRejected ? JSON.parse(localRejected) : []
      };
      await saveValidations(validationsData);
      console.log('✅ Validations migrées');
      migrated = true;
    }
    
    if (migrated) {
      // Marquer la migration comme effectuée
      localStorage.setItem('firebase_migration_done', 'true');
      console.log('✅ Migration terminée avec succès!');
      return true;
    } else {
      console.log('ℹ️ Aucune donnée localStorage à migrer');
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  }
}

/**
 * Nettoyer le localStorage après migration réussie
 */
export function cleanupLocalStorage() {
  console.log('🧹 Nettoyage du localStorage...');
  localStorage.removeItem('municipal_data');
  localStorage.removeItem('validated_decontaminated');
  localStorage.removeItem('rejected_decontaminated');
  console.log('✅ localStorage nettoyé');
}

export { db, COLLECTIONS };
