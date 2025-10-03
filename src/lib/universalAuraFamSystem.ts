// Universal Aura Fam System
// Hybrid solution that combines old friends system with new accepted friends
// Ensures all family members are displayed regardless of when they were added

import { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { getFriends } from './socialSystem';
import { PublicProfile } from './socialSystem';

export type UniversalAuraFamMember = {
  userId: string;
  name: string;
  username: string;
  avatar?: string;
  joinedAt: any;
  auraPoints: number;
  lastActivity: any;
  isOnline: boolean;
  mutualConnections: number;
  sharedInterests: string[];
  source: 'legacy' | 'new'; // Track where the member came from
  friendshipId?: string;
};

export type UniversalAuraFamStats = {
  totalMembers: number;
  activeMembers: number;
  totalAuraPoints: number;
  averageAuraPoints: number;
  newMembersThisWeek: number;
  legacyMembers: number;
  newMembers: number;
  topContributors: UniversalAuraFamMember[];
};

// Get all Aura Fam members from both systems
export async function getUniversalAuraFamMembers(currentUserId: string): Promise<UniversalAuraFamMember[]> {
  try {
    console.log('🔄 Loading Universal Aura Fam members...');
    
    // Get friends from the original system
    const legacyFriends = await getFriends(currentUserId);
    console.log('📊 Legacy friends found:', legacyFriends.length);
    
    // Convert legacy friends to universal format
    const legacyMembers: UniversalAuraFamMember[] = legacyFriends.map(friend => ({
      userId: friend.friendId,
      name: friend.friendProfile?.name || 'Unknown',
      username: friend.friendProfile?.username || 'unknown',
      avatar: friend.friendProfile?.avatar,
      joinedAt: friend.friendSince,
      auraPoints: 0, // Default since not in PublicProfile
      lastActivity: friend.friendProfile?.lastSeen,
      isOnline: friend.friendProfile?.isOnline || false,
      mutualConnections: friend.mutualFriends || 0,
      sharedInterests: friend.sharedInterests || friend.friendProfile?.interests || [],
      source: 'legacy',
      friendshipId: friend.id,
    }));

    // Get friends from the new system (subcollection)
    let newMembers: UniversalAuraFamMember[] = [];
    try {
      const friendsSnapshot = await getDocs(collection(db, 'users', currentUserId, 'friends'));
      console.log('📊 New system friends found:', friendsSnapshot.docs.length);
      
      for (const friendDoc of friendsSnapshot.docs) {
        try {
          const friendId = friendDoc.id;
          const friendData = friendDoc.data();
          
          // Get friend's public profile
          const friendProfileDoc = await getDoc(doc(db, 'publicProfiles', friendId));
          const friendProfile = friendProfileDoc.exists() ? friendProfileDoc.data() : null;
          
          // Get friendship data for additional info
          const friendshipDoc = await getDoc(doc(db, 'friendships', `${currentUserId}_${friendId}`));
          const friendshipData = friendshipDoc.exists() ? friendshipDoc.data() : {};

          newMembers.push({
            userId: friendId,
            name: friendProfile?.name || friendData.name || 'Unknown',
            username: friendProfile?.username || friendData.username || 'unknown',
            avatar: friendProfile?.avatar || friendData.avatar,
            joinedAt: friendData.createdAt || friendshipData.createdAt,
            auraPoints: friendProfile?.auraPoints || friendData.auraPoints || 0,
            lastActivity: friendProfile?.lastSeen || friendData.lastSeen,
            isOnline: friendProfile?.isOnline || friendData.isOnline || false,
            mutualConnections: friendshipData.mutualFriends || 0,
            sharedInterests: friendshipData.sharedInterests || friendProfile?.interests || [],
            source: 'new',
            friendshipId: friendDoc.id,
          });
        } catch (error) {
          console.error(`Error loading new friend ${friendDoc.id}:`, error);
          continue;
        }
      }
    } catch (error) {
      console.warn('Error loading new system friends:', error);
    }

    // Combine and deduplicate members
    const allMembers = [...legacyMembers, ...newMembers];
    const uniqueMembers = new Map<string, UniversalAuraFamMember>();
    
    // Add legacy members first (they take priority)
    legacyMembers.forEach(member => {
      uniqueMembers.set(member.userId, member);
    });
    
    // Add new members only if they don't already exist
    newMembers.forEach(member => {
      if (!uniqueMembers.has(member.userId)) {
        uniqueMembers.set(member.userId, member);
      }
    });

    const finalMembers = Array.from(uniqueMembers.values());
    console.log('🎉 Universal Aura Fam members loaded:', finalMembers.length);
    console.log('📈 Legacy members:', legacyMembers.length);
    console.log('📈 New members:', newMembers.length);
    console.log('📈 Unique members:', finalMembers.length);
    
    return finalMembers;
  } catch (error) {
    console.error('Error loading Universal Aura Fam members:', error);
    return [];
  }
}

// Get Universal Aura Fam statistics
export async function getUniversalAuraFamStats(currentUserId: string): Promise<UniversalAuraFamStats> {
  try {
    const members = await getUniversalAuraFamMembers(currentUserId);
    
    const totalMembers = members.length;
    const activeMembers = members.filter(member => member.isOnline).length;
    const totalAuraPoints = members.reduce((sum, member) => sum + member.auraPoints, 0);
    const averageAuraPoints = totalMembers > 0 ? totalAuraPoints / totalMembers : 0;
    
    const legacyMembers = members.filter(member => member.source === 'legacy').length;
    const newMembers = members.filter(member => member.source === 'new').length;
    
    // Calculate new members this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newMembersThisWeek = members.filter(member => {
      if (!member.joinedAt) return false;
      try {
        const joinedDate = member.joinedAt.toDate ? member.joinedAt.toDate() : new Date(member.joinedAt);
        return joinedDate > oneWeekAgo;
      } catch (error) {
        console.warn('Error parsing joinedAt date:', error);
        return false;
      }
    }).length;

    // Get top contributors (by aura points)
    const topContributors = members
      .sort((a, b) => b.auraPoints - a.auraPoints)
      .slice(0, 5);

    return {
      totalMembers,
      activeMembers,
      totalAuraPoints,
      averageAuraPoints,
      newMembersThisWeek,
      legacyMembers,
      newMembers,
      topContributors,
    };
  } catch (error) {
    console.error('Error loading Universal Aura Fam stats:', error);
    return {
      totalMembers: 0,
      activeMembers: 0,
      totalAuraPoints: 0,
      averageAuraPoints: 0,
      newMembersThisWeek: 0,
      legacyMembers: 0,
      newMembers: 0,
      topContributors: [],
    };
  }
}

// Listen to Universal Aura Fam changes in real-time
export function listenToUniversalAuraFam(
  currentUserId: string,
  callback: (members: UniversalAuraFamMember[], stats: UniversalAuraFamStats) => void
): Unsubscribe {
  const userRef = doc(db, 'users', currentUserId);
  
  return onSnapshot(userRef, async (userDoc) => {
    if (userDoc.exists()) {
      try {
        const members = await getUniversalAuraFamMembers(currentUserId);
        const stats = await getUniversalAuraFamStats(currentUserId);
        callback(members, stats);
      } catch (error) {
        console.error('Error in Universal Aura Fam listener:', error);
        callback([], {
          totalMembers: 0,
          activeMembers: 0,
          totalAuraPoints: 0,
          averageAuraPoints: 0,
          newMembersThisWeek: 0,
          legacyMembers: 0,
          newMembers: 0,
          topContributors: [],
        });
      }
    }
  });
}

// Remove Universal Aura Fam member
export async function removeUniversalAuraFamMember(params: {
  currentUserId: string;
  memberId: string;
  memberName: string;
}): Promise<void> {
  const { currentUserId, memberId, memberName } = params;
  
  try {
    const batch = writeBatch(db);
    
    // Remove from both systems
    // Remove from legacy system
    const legacyFriendshipRef = doc(db, 'users', currentUserId, 'friends', memberId);
    batch.delete(legacyFriendshipRef);
    
    // Remove from new system
    const newFriendshipRef = doc(db, 'users', memberId, 'friends', currentUserId);
    batch.delete(newFriendshipRef);
    
    // Remove friendship document
    const friendshipRef = doc(db, 'friendships', `${currentUserId}_${memberId}`);
    batch.delete(friendshipRef);

    await batch.commit();

    // Trigger Universal Aura Fam refresh event
    const event = new CustomEvent('universalAuraFamUpdated', {
      detail: { action: 'memberRemoved', memberName }
    });
    window.dispatchEvent(event);

  } catch (error) {
    console.error('Error removing Universal Aura Fam member:', error);
    throw error;
  }
}

// Search Universal Aura Fam members
export function searchUniversalAuraFamMembers(
  members: UniversalAuraFamMember[],
  query: string
): UniversalAuraFamMember[] {
  if (!query.trim()) return members;
  
  const lowercaseQuery = query.toLowerCase();
  return members.filter(member => 
    member.name.toLowerCase().includes(lowercaseQuery) ||
    member.username.toLowerCase().includes(lowercaseQuery) ||
    member.sharedInterests.some(interest => 
      interest.toLowerCase().includes(lowercaseQuery)
    )
  );
}

// Sort Universal Aura Fam members
export function sortUniversalAuraFamMembers(
  members: UniversalAuraFamMember[],
  sortBy: 'name' | 'auraPoints' | 'recent' | 'online' | 'source'
): UniversalAuraFamMember[] {
  return [...members].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'auraPoints':
        return b.auraPoints - a.auraPoints;
      case 'online':
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return 0;
      case 'source':
        if (a.source === 'legacy' && b.source === 'new') return -1;
        if (a.source === 'new' && b.source === 'legacy') return 1;
        return 0;
      case 'recent':
      default:
        if (!a.lastActivity || !b.lastActivity) return 0;
        const aTime = a.lastActivity.toDate ? a.lastActivity.toDate().getTime() : 0;
        const bTime = b.lastActivity.toDate ? b.lastActivity.toDate().getTime() : 0;
        return bTime - aTime;
    }
  });
}