// Firebase configuration
const firebaseConfig = {
  // Vos informations de configuration Firebase iront ici
  // Pour l'instant, nous utiliserons une configuration fictive
  apiKey: "AIzaSyDummyKeyForContaminatedLandsApp",
  authDomain: "contaminated-lands-app.firebaseapp.com",
  projectId: "contaminated-lands-app",
  storageBucket: "contaminated-lands-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:dummyappidforcontaminatedlandsapp"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Initialize Storage
const storage = firebase.storage();

export { db, storage, firebase };