// Migration script to move existing friends to the new fam system
// This ensures all existing friends are preserved in the new unified system

import { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  addDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { getFriends } from './socialSystem';

export async function migrateExistingFriendsToFamSystem(userId: string): Promise<void> {
  try {
    console.log('🔄 Starting migration for user:', userId);
    
    // Get existing friends from the old system
    const existingFriends = await getFriends(userId);
    console.log('📊 Found existing friends:', existingFriends.length);
    
    if (existingFriends.length === 0) {
      console.log('✅ No existing friends to migrate');
      return;
    }
    
    // Check if migration has already been done
    const famQuery = query(
      collection(db, 'famMembers'),
      where('userId', '==', userId)
    );
    const famSnapshot = await getDocs(famQuery);
    
    if (!famSnapshot.empty) {
      console.log('✅ Migration already completed for this user');
      return;
    }
    
    // Migrate friends to new fam system
    const batch = writeBatch(db);
    const timestamp = serverTimestamp();
    
    for (const friend of existingFriends) {
      if (!friend.friendProfile) continue;
      
      // Add to user's fam list
      batch.set(doc(collection(db, 'famMembers')), {
        userId: userId,
        famUserId: friend.friendId,
        famName: friend.friendProfile.name,
        famUsername: friend.friendProfile.username || friend.friendProfile.name.toLowerCase().replace(/\s+/g, ''),
        famAvatar: friend.friendProfile.avatar || '',
        joinedAt: friend.friendSince || timestamp,
        auraPoints: 0,
        lastActivity: friend.friendProfile.lastSeen || timestamp,
        isOnline: friend.friendProfile.isOnline || false,
        mutualConnections: friend.mutualFriends || 0,
        sharedInterests: friend.sharedInterests || friend.friendProfile.interests || [],
        status: 'active',
      });
      
      // Add to friend's fam list (if they haven't been migrated yet)
      batch.set(doc(collection(db, 'famMembers')), {
        userId: friend.friendId,
        famUserId: userId,
        famName: 'You', // This will be updated when the friend logs in
        famUsername: 'you',
        famAvatar: '',
        joinedAt: friend.friendSince || timestamp,
        auraPoints: 0,
        lastActivity: timestamp,
        isOnline: false,
        mutualConnections: friend.mutualFriends || 0,
        sharedInterests: friend.sharedInterests || [],
        status: 'active',
      });
    }
    
    await batch.commit();
    console.log('✅ Migration completed successfully');
    
    // Trigger fam update event
    const event = new CustomEvent('famUpdated', {
      detail: { action: 'migrationCompleted' }
    });
    window.dispatchEvent(event);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Auto-migrate when user logs in
export async function autoMigrateUserFriends(user: User): Promise<void> {
  try {
    console.log('🔄 Auto-migrating friends for user:', user.uid);
    await migrateExistingFriendsToFamSystem(user.uid);
  } catch (error) {
    console.error('❌ Auto-migration failed:', error);
    // Don't throw error to prevent login issues
  }
}