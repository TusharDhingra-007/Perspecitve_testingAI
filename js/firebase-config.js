// Firebase Configuration
// Note: These are CLIENT-SIDE keys — they are safe to expose publicly.
// Security is enforced by Firestore Security Rules, not by hiding API keys.
const firebaseConfig = {
    apiKey: "AIzaSyBtPFrfdOVRSv-l5lvwbMm8p5pISwkI8rM",
    authDomain: "arpan-project-5e345.firebaseapp.com",
    databaseURL: "https://arpan-project-5e345-default-rtdb.firebaseio.com",
    projectId: "arpan-project-5e345",
    storageBucket: "arpan-project-5e345.firebasestorage.app",
    messagingSenderId: "406841976247",
    appId: "1:406841976247:web:35ddedddea36b790e2f432",
    measurementId: "G-SRKTKLR1KR"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();
