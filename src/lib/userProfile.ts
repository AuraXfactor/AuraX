import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';

export async function ensureUserProfile(user: User) {
  if (!user) return;
  const userDocRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email ?? null,
      name: user.displayName ?? null,
      username: null,
      avatar: user.photoURL ?? null,
      focusAreas: [],
      preferredTherapy: null,
      reminderTime: null,
      moodBaseline: [],
      auraPoints: 0,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });
  } else {
    await updateDoc(userDocRef, { lastLogin: serverTimestamp() });
  }
}

export type OnboardingProfile = {
  name: string;
  username: string;
  email: string | null;
  avatar: string | null;
  focusAreas: string[];
  preferredTherapy?: string | null;
  reminderTime: 'Morning' | 'Afternoon' | 'Evening';
  moodBaseline: string[]; // emojis
};

export async function saveOnboardingProfile(user: User, profile: OnboardingProfile) {
  const userDocRef = doc(db, 'users', user.uid);
  await setDoc(userDocRef, {
    name: profile.name,
    username: profile.username,
    email: profile.email,
    avatar: profile.avatar,
    focusAreas: profile.focusAreas,
    preferredTherapy: profile.preferredTherapy ?? null,
    reminderTime: profile.reminderTime,
    moodBaseline: profile.moodBaseline,
    auraPoints: 0,
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
  }, { merge: true });
}

// Recovery Hub types and helpers
export type RecoveryEntry = {
  createdAt: Date | null;
  level: 'Calm' | 'Tempted' | 'Struggling' | 'Urgent';
};

export type ShadowBoxEntry = {
  createdAt: Date | null;
  thought: string;
  reframed: string;
};

export type WhisperEntry = {
  createdAt: Date | null;
  note: string;
};

export async function setUserAddiction(user: User, addiction: string) {
  const userDocRef = doc(db, 'users', user.uid);
  await setDoc(userDocRef, { recovery: { addiction } }, { merge: true });
}

export async function logCraving(user: User, level: RecoveryEntry['level']) {
  const userDocRef = doc(db, 'users', user.uid);
  await updateDoc(userDocRef, {
    'recovery.cravings': arrayUnion({ level, at: serverTimestamp() }),
  });
}

export async function addShadowBox(user: User, thought: string, reframed: string) {
  const userDocRef = doc(db, 'users', user.uid);
  await updateDoc(userDocRef, {
    'recovery.shadowBox': arrayUnion({ thought, reframed, at: serverTimestamp() }),
  });
}

export async function addWhisper(user: User, note: string) {
  const userDocRef = doc(db, 'users', user.uid);
  await updateDoc(userDocRef, {
    'recovery.whispers': arrayUnion({ note, at: serverTimestamp() }),
  });
}

