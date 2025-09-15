import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// REPLACE WITH YOUR ACTUAL FIREBASE CONFIG FROM FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyDEZFb364IcgkpY2GavElR3QPhqpw60BRs",
  authDomain: "aura-app-prod-4dc34.firebaseapp.com",
  projectId: "aura-app-prod-4dc34",
  storageBucket: "aura-app-prod-4dc34.firebasestorage.app",
  messagingSenderId: "978006775981",
  appId: "1:978006775981:web:0c97e9e4fd1d27c58fce24"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;