import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence, EmailAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // For Firestore
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY_HERE",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "mindfulspace-956b8.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "mindfulspace-956b8",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "mindfulspace-956b8.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "339812618356",
  appId: process.env.FIREBASE_APP_ID || "1:339812618356:web:c5229ca7fe96b9fa23c121",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-5Q6HY1TCV0",
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage), // Use AsyncStorage for persistence
});

// Initialize Firestore
const firestore = getFirestore(app);

export { auth, firestore, EmailAuthProvider };
