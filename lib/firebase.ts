import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDEZFb364IcgkpY2GavElR3QPhqpw60BRs",
  authDomain: "aura-app-prod-4dc34.firebaseapp.com",
  projectId: "aura-app-prod-4dc34",
  storageBucket: "aura-app-prod-4dc34.firebasestorage.app",
  messagingSenderId: "978006775981",
  appId: "1:978006775981:web:0c97e9e4fd1d27c58fce24",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Enable offline persistence for Firestore with multi-tab support
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const storage = getStorage(app);

// Auto sign-in anonymously
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      signInAnonymously(auth).catch(console.error);
    }
  });
}

export default app;

