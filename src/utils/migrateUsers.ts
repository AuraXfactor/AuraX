import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  serverTimestamp,
  writeBatch 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function migrateExistingUsersToPublicProfiles(): Promise<void> {
  try {
    console.log('🔄 Starting user migration to public profiles...');
    
    // Get all existing users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const batch = writeBatch(db);
    let count = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      // Check if user already has a public profile
      const publicProfileRef = doc(db, 'publicProfiles', userId);
      
      // Create public profile if user doesn't have one or if isPublic is not set
      if (userData.isPublic !== false) { // Default to public unless explicitly set to false
        const publicProfileData = {
          userId: userId,
          name: userData.name || userData.displayName || userData.email?.split('@')[0] || 'Anonymous',
          username: userData.username || userData.email?.split('@')[0] || `user${userId.slice(-4)}`,
          bio: userData.bio || 'AuraX community member',
          avatar: userData.avatar || userData.photoURL,
          interests: userData.interests || userData.focusAreas || ['wellness'],
          location: userData.location,
          isOnline: true,
          lastSeen: serverTimestamp(),
          friendsCount: 0,
          postsCount: 0,
          joinedAt: userData.createdAt || serverTimestamp(),
          focusAreas: userData.focusAreas || ['personal growth'],
        };
        
        batch.set(publicProfileRef, publicProfileData, { merge: true });
        
        // Also ensure the user document has isPublic set to true
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, {
          isPublic: true,
          username: publicProfileData.username,
          updatedAt: serverTimestamp(),
        });
        
        count++;
      }
    }
    
    if (count > 0) {
      await batch.commit();
      console.log(`✅ Migrated ${count} users to public profiles`);
    } else {
      console.log('ℹ️  No users needed migration');
    }
    
  } catch (error) {
    console.error('❌ Error migrating users:', error);
    throw error;
  }
}

export async function ensureUserHasPublicProfile(userId: string, userData: any): Promise<void> { // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    const publicProfileRef = doc(db, 'publicProfiles', userId);
    
    const publicProfileData = {
      userId: userId,
      name: userData.name || userData.displayName || userData.email?.split('@')[0] || 'Anonymous',
      username: userData.username || userData.email?.split('@')[0] || `user${userId.slice(-4)}`,
      bio: userData.bio || 'AuraX community member',
      avatar: userData.avatar || userData.photoURL,
      interests: userData.interests || userData.focusAreas || ['wellness'],
      location: userData.location,
      isOnline: true,
      lastSeen: serverTimestamp(),
      friendsCount: 0,
      postsCount: 0,
      joinedAt: userData.createdAt || serverTimestamp(),
      focusAreas: userData.focusAreas || ['personal growth'],
    };
    
    await setDoc(publicProfileRef, publicProfileData, { merge: true });
    
    // Also update the user document
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      isPublic: true,
      username: publicProfileData.username,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    console.log(`✅ Ensured public profile exists for user: ${publicProfileData.name}`);
    
  } catch (error) {
    console.error('❌ Error ensuring public profile:', error);
    throw error;
  }
}