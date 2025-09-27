import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, arrayUnion, collection, addDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export async function ensureUserProfile(user: User) {
  if (!user) return;
  const userDocRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    const profileData = {
      uid: user.uid,
      email: user.email ?? null,
      name: user.displayName ?? null,
      username: null,
      avatar: user.photoURL ?? null,
      bio: '',
      interests: [],
      focusAreas: [],
      preferredTherapy: null,
      reminderTime: null,
      moodBaseline: [],
      auraPoints: 0,
      isPublic: false, // New field for public profile visibility
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    };
    
    await setDoc(userDocRef, profileData);
    
    // Create public profile if user chooses to be discoverable
    await ensurePublicProfile(user, null);
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
  const userData = {
    name: profile.name,
    username: profile.username,
    email: profile.email,
    avatar: profile.avatar,
    bio: '',
    interests: profile.focusAreas, // Use focusAreas as initial interests
    focusAreas: profile.focusAreas,
    preferredTherapy: profile.preferredTherapy ?? null,
    reminderTime: profile.reminderTime,
    moodBaseline: profile.moodBaseline,
    auraPoints: 0,
    isPublic: false, // Default to private, user can change in settings
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
  };
  
  await setDoc(userDocRef, userData, { merge: true });
  
  // Create/update public profile
  await ensurePublicProfile(user, null);
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
    therapy?: boolean;
    recovery?: boolean;
    email?: boolean;
  };
  privacy?: {
    profileVisibility?: 'private' | 'friends' | 'public';
    journalVisibility?: 'private' | 'anonymous';
    biometricEnabled?: boolean;
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
  bio?: string;
  interests?: string[];
  focusAreas?: string[];
  preferredTherapy?: string | null;
  reminderTime?: 'Morning' | 'Afternoon' | 'Evening' | null;
  moodBaseline?: string[];
  auraPoints?: number;
  auraTotal?: number;
  isPublic?: boolean;
  settings?: UserSettings;
  createdAt?: { toDate?: () => Date } | null;
  lastLogin?: { toDate?: () => Date } | null;
  updatedAt?: { toDate?: () => Date } | null;
};

export type PublicProfile = {
  uid: string;
  name: string;
  username?: string;
  avatar?: string;
  bio?: string;
  interests?: string[];
  focusAreas?: string[];
  auraPoints?: number;
  createdAt?: { toDate?: () => Date } | null;
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
          id: window.location.hostname,
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

// Public Profile Management
export async function ensurePublicProfile(user: User, userData?: UserProfileData | null) {
  if (!user) return;
  
  try {
    const userDoc = userData || await getUserProfile(user);
    if (!userDoc) return;
    
    // Only create/update public profile if user has isPublic set to true
    if (userDoc.isPublic) {
      const publicProfileRef = doc(db, 'publicProfiles', user.uid);
      const publicProfileData = {
        uid: user.uid,
        name: userDoc.name || 'Anonymous',
        username: userDoc.username || undefined,
        avatar: userDoc.avatar || undefined,
        bio: userDoc.bio || '',
        interests: userDoc.interests || [],
        focusAreas: userDoc.focusAreas || [],
        auraPoints: userDoc.auraPoints || 0,
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(publicProfileRef, publicProfileData, { merge: true });
    }
  } catch (error) {
    console.error('Error ensuring public profile:', error);
  }
}

export async function updatePublicProfile(user: User, updates: Partial<PublicProfile>) {
  if (!user) return;
  
  try {
    const publicProfileRef = doc(db, 'publicProfiles', user.uid);
    await updateDoc(publicProfileRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating public profile:', error);
    throw error;
  }
}

export async function toggleProfileVisibility(user: User, isPublic: boolean) {
  if (!user) return;
  
  try {
    // Update main user profile
    await updateUserProfile(user, { isPublic });
    
    if (isPublic) {
      // Create/update public profile
      await ensurePublicProfile(user);
    } else {
      // Remove public profile
      const publicProfileRef = doc(db, 'publicProfiles', user.uid);
      await updateDoc(publicProfileRef, {
        isDeleted: true,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error toggling profile visibility:', error);
    throw error;
  }
}

export async function searchPublicProfiles(searchTerm: string, limit: number = 10): Promise<PublicProfile[]> {
  try {
    const publicProfilesRef = collection(db, 'publicProfiles');
    const snapshot = await getDocs(query(publicProfilesRef, orderBy('updatedAt', 'desc')));
    
    const searchTermLower = searchTerm.toLowerCase();
    const results = snapshot.docs
      .map(doc => ({ ...doc.data() } as PublicProfile & { isDeleted?: boolean }))
      .filter(profile => 
        !profile.isDeleted &&
        (profile.name.toLowerCase().includes(searchTermLower) ||
         (profile.username && profile.username.toLowerCase().includes(searchTermLower)) ||
         (profile.bio && profile.bio.toLowerCase().includes(searchTermLower)) ||
         (profile.interests && profile.interests.some(interest => 
           interest.toLowerCase().includes(searchTermLower)
         )))
      )
      .slice(0, limit);
      
    return results;
  } catch (error) {
    console.error('Error searching public profiles:', error);
    return [];
  }
}

