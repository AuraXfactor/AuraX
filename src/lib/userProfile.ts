import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, arrayUnion, collection, addDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export async function ensureUserProfile(user: User) {
  if (!user) return;
  
  const userDocRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userDocRef);
  
  const userData = {
    uid: user.uid,
    email: user.email ?? null,
    name: user.displayName ?? user.email?.split('@')[0] ?? 'Anonymous',
    username: user.email?.split('@')[0] ?? `user${user.uid.slice(-4)}`,
    avatar: user.photoURL ?? null,
    dateOfBirth: null,
    gender: null,
    country: null,
    town: null,
    focusAreas: ['wellness'],
    reminderTime: null,
    moodBaseline: [],
    auraPoints: 0,
    isPublic: true, // Default to public for social features
    bio: 'AuraX community member',
    interests: ['wellness'],
    lastLogin: serverTimestamp(),
  };
  
  if (!snap.exists()) {
    // Create new user profile
    await setDoc(userDocRef, {
      ...userData,
      createdAt: serverTimestamp(),
    });
  } else {
    // Update existing user with social fields if missing
    const existingData = snap.data();
    const updates: any = { lastLogin: serverTimestamp() }; // eslint-disable-line @typescript-eslint/no-explicit-any
    
    if (!existingData.isPublic) updates.isPublic = true;
    if (!existingData.bio) updates.bio = 'AuraX community member';
    if (!existingData.interests) updates.interests = ['wellness'];
    if (!existingData.username) updates.username = user.email?.split('@')[0] ?? `user${user.uid.slice(-4)}`;
    
    await updateDoc(userDocRef, updates);
  }
  
  // Always ensure public profile exists for social features
  const publicProfileRef = doc(db, 'publicProfiles', user.uid);
  await setDoc(publicProfileRef, {
    userId: user.uid,
    name: userData.name,
    username: userData.username,
    bio: userData.bio,
    avatar: userData.avatar,
    country: userData.country,
    town: userData.town,
    interests: userData.interests,
    focusAreas: userData.focusAreas,
    isOnline: true,
    lastSeen: serverTimestamp(),
    friendsCount: 0,
    postsCount: 0,
    joinedAt: serverTimestamp(),
  }, { merge: true });
}

export type OnboardingProfile = {
  name: string;
  username: string;
  email: string | null;
  avatar: string;
  dateOfBirth: string;
  gender: string;
  country: string;
  town: string;
  focusAreas: string[];
  reminderTime: 'Morning' | 'Afternoon' | 'Evening';
  moodBaseline: string[]; // emojis
  termsAccepted: boolean;
};

export async function saveOnboardingProfile(user: User, profile: OnboardingProfile) {
  const userDocRef = doc(db, 'users', user.uid);
  await setDoc(userDocRef, {
    name: profile.name,
    username: profile.username,
    email: profile.email,
    avatar: profile.avatar,
    dateOfBirth: profile.dateOfBirth,
    gender: profile.gender,
    country: profile.country,
    town: profile.town,
    focusAreas: profile.focusAreas,
    reminderTime: profile.reminderTime,
    moodBaseline: profile.moodBaseline,
    termsAccepted: profile.termsAccepted,
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

// Profile and Settings Types
export type UserSettings = {
  theme?: string;
  notifications?: {
    journal?: boolean;
    recovery?: boolean;
    email?: boolean;
  };
  privacy?: {
    profileVisibility?: 'private' | 'friends' | 'public';
    journalVisibility?: 'private' | 'anonymous';
    biometricEnabled?: boolean;
    dataCollection?: boolean;
    analytics?: boolean;
    personalization?: boolean;
    notifications?: boolean;
    dataSharing?: boolean;
  };
  journals?: {
    primary?: string;
    secondary?: string[];
  };
};

export type UserProfileData = {
  uid: string;
  email?: string | null;
  name?: string | null;
  username?: string | null;
  avatar?: string | null;
  dateOfBirth?: string;
  gender?: string;
  country?: string;
  town?: string;
  focusAreas?: string[];
  reminderTime?: 'Morning' | 'Afternoon' | 'Evening' | null;
  moodBaseline?: string[];
  auraPoints?: number;
  auraTotal?: number;
  settings?: UserSettings;
  createdAt?: { toDate?: () => Date } | null;
  lastLogin?: { toDate?: () => Date } | null;
  updatedAt?: { toDate?: () => Date } | null;
};

// Enhanced profile management functions
export async function getUserProfile(user: User): Promise<UserProfileData | null> {
  if (!user) return null;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfileData;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

export async function updateUserProfile(user: User, updates: Partial<UserProfileData>) {
  if (!user) return;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export async function updateUserSettings(user: User, settings: Partial<UserSettings>) {
  if (!user) return;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const updateData: Record<string, unknown> = { updatedAt: serverTimestamp() };
    
    // Handle nested settings updates
    Object.keys(settings).forEach(key => {
      const value = settings[key as keyof UserSettings];
      if (typeof value === 'object' && value !== null) {
        // For nested objects like notifications, privacy
        Object.keys(value).forEach(subKey => {
          updateData[`${key}.${subKey}`] = (value as Record<string, unknown>)[subKey];
        });
      } else {
        updateData[key] = value;
      }
    });
    
    await updateDoc(userDocRef, updateData);
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
}

// Journal collection management
export type JournalCollection = {
  id: string;
  name: string;
  description?: string;
  entryCount: number;
  createdAt?: { toDate?: () => Date } | null;
  updatedAt?: { toDate?: () => Date } | null;
};

export async function createJournalCollection(user: User, collectionData: Omit<JournalCollection, 'id' | 'createdAt' | 'updatedAt'>) {
  if (!user) return;
  try {
    const collectionsRef = collection(db, 'users', user.uid, 'journalCollections');
    const newDoc = await addDoc(collectionsRef, {
      ...collectionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return newDoc.id;
  } catch (error) {
    console.error('Error creating journal collection:', error);
    throw error;
  }
}

export async function getJournalCollections(user: User): Promise<JournalCollection[]> {
  if (!user) return [];
  try {
    const collectionsRef = collection(db, 'users', user.uid, 'journalCollections');
    const q = query(collectionsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as JournalCollection[];
  } catch (error) {
    console.error('Error getting journal collections:', error);
    return [];
  }
}

// Biometric authentication helpers
export async function setupBiometricAuth(user: User): Promise<boolean> {
  if (!user || !window.PublicKeyCredential) {
    return false;
  }

  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: new Uint8Array(32),
        rp: {
          name: "AuraX",
          id: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
        },
        user: {
          id: new TextEncoder().encode(user.uid),
          name: user.email || '',
          displayName: user.displayName || user.email || '',
        },
        pubKeyCredParams: [{alg: -7, type: "public-key"}],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required"
        },
        timeout: 60000,
        attestation: "direct"
      }
    });

    if (credential) {
      // Store credential info in user profile
      await updateUserSettings(user, {
        privacy: { biometricEnabled: true }
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error setting up biometric auth:', error);
    return false;
  }
}

export async function authenticateWithBiometric(user: User): Promise<boolean> {
  if (!user || !window.PublicKeyCredential) {
    return false;
  }

  try {
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(32),
        timeout: 60000,
        userVerification: "required"
      }
    });

    return !!credential;
  } catch (error) {
    console.error('Error with biometric authentication:', error);
    return false;
  }
}

