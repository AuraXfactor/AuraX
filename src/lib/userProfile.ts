import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  name: string;
  username: string;
  email: string;
  avatar: string;
  focusAreas: string[];
  preferredTherapy: string;
  reminderTime: string;
  moodBaseline: string[];
  auraPoints: number;
  createdAt: Date;
  lastLogin: Date;
}

export async function ensureUserProfile(user: User) {
  if (!user) return;
  const userDocRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function saveUserProfile(userId: string, profileData: Omit<UserProfile, 'createdAt' | 'lastLogin'> & { createdAt: Date; lastLogin: Date }) {
  const userDocRef = doc(db, 'users', userId);
  
  const firestoreData = {
    ...profileData,
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  await setDoc(userDocRef, firestoreData, { merge: true });
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const userDocRef = doc(db, 'users', userId);
  const snap = await getDoc(userDocRef);
  
  if (!snap.exists()) {
    return null;
  }
  
  const data = snap.data();
  
  // Convert Firestore timestamps to Date objects
  return {
    name: data.name || '',
    username: data.username || '',
    email: data.email || '',
    avatar: data.avatar || '✨',
    focusAreas: data.focusAreas || [],
    preferredTherapy: data.preferredTherapy || '',
    reminderTime: data.reminderTime || '',
    moodBaseline: data.moodBaseline || [],
    auraPoints: data.auraPoints || 0,
    createdAt: data.createdAt?.toDate() || new Date(),
    lastLogin: data.lastLogin?.toDate() || new Date(),
  };
}

export async function updateLastLogin(userId: string) {
  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    lastLogin: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

