// Aura Family System
// Enhanced family tracking and management system for AuraZ

import { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { PublicProfile } from './socialSystem';

export type AuraFamilyMember = {
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
};

export type AuraFamilyStats = {
  totalMembers: number;
  activeMembers: number;
  totalAuraPoints: number;
  averageAuraPoints: number;
  newMembersThisWeek: number;
  topContributors: AuraFamilyMember[];
};

// Get Aura Family members with enhanced tracking
export async function getAuraFamilyMembers(currentUserId: string): Promise<AuraFamilyMember[]> {
  try {
    const userDoc = await getDoc(doc(db, 'users', currentUserId));
    if (!userDoc.exists()) {
      return [];
    }

    const userData = userDoc.data();
    const friendIds = userData.friends || [];

    if (friendIds.length === 0) {
      return [];
    }

    // Get all friend profiles in batch
    const friendPromises = friendIds.map(async (friendId: string) => {
      try {
        const friendDoc = await getDoc(doc(db, 'users', friendId));
        if (!friendDoc.exists()) return null;

        const friendData = friendDoc.data();
        
        // Get friendship data
        const friendshipDoc = await getDoc(doc(db, 'friendships', `${currentUserId}_${friendId}`));
        const friendshipData = friendshipDoc.exists() ? friendshipDoc.data() : {};

        return {
          userId: friendId,
          name: friendData.name || 'Unknown',
          username: friendData.username || 'unknown',
          avatar: friendData.avatar,
          joinedAt: friendshipData.createdAt,
          auraPoints: friendData.auraPoints || 0,
          lastActivity: friendData.lastSeen,
          isOnline: friendData.isOnline || false,
          mutualConnections: friendshipData.mutualFriends || 0,
          sharedInterests: friendshipData.sharedInterests || [],
        } as AuraFamilyMember;
      } catch (error) {
        console.error(`Error loading friend ${friendId}:`, error);
        return null;
      }
    });

    const familyMembers = await Promise.all(friendPromises);
    return familyMembers.filter(member => member !== null) as AuraFamilyMember[];
  } catch (error) {
    console.error('Error loading Aura Family members:', error);
    return [];
  }
}

// Get Aura Family statistics
export async function getAuraFamilyStats(currentUserId: string): Promise<AuraFamilyStats> {
  try {
    const familyMembers = await getAuraFamilyMembers(currentUserId);
    
    const totalMembers = familyMembers.length;
    const activeMembers = familyMembers.filter(member => member.isOnline).length;
    const totalAuraPoints = familyMembers.reduce((sum, member) => sum + member.auraPoints, 0);
    const averageAuraPoints = totalMembers > 0 ? totalAuraPoints / totalMembers : 0;
    
    // Calculate new members this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newMembersThisWeek = familyMembers.filter(member => {
      if (!member.joinedAt) return false;
      const joinedDate = member.joinedAt.toDate ? member.joinedAt.toDate() : new Date(member.joinedAt);
      return joinedDate > oneWeekAgo;
    }).length;

    // Get top contributors (by aura points)
    const topContributors = familyMembers
      .sort((a, b) => b.auraPoints - a.auraPoints)
      .slice(0, 5);

    return {
      totalMembers,
      activeMembers,
      totalAuraPoints,
      averageAuraPoints,
      newMembersThisWeek,
      topContributors,
    };
  } catch (error) {
    console.error('Error loading Aura Family stats:', error);
    return {
      totalMembers: 0,
      activeMembers: 0,
      totalAuraPoints: 0,
      averageAuraPoints: 0,
      newMembersThisWeek: 0,
      topContributors: [],
    };
  }
}

// Listen to Aura Family changes in real-time
export function listenToAuraFamily(
  currentUserId: string,
  callback: (members: AuraFamilyMember[], stats: AuraFamilyStats) => void
): Unsubscribe {
  const userRef = doc(db, 'users', currentUserId);
  
  return onSnapshot(userRef, async (userDoc) => {
    if (userDoc.exists()) {
      try {
        const members = await getAuraFamilyMembers(currentUserId);
        const stats = await getAuraFamilyStats(currentUserId);
        callback(members, stats);
      } catch (error) {
        console.error('Error in Aura Family listener:', error);
        callback([], {
          totalMembers: 0,
          activeMembers: 0,
          totalAuraPoints: 0,
          averageAuraPoints: 0,
          newMembersThisWeek: 0,
          topContributors: [],
        });
      }
    }
  });
}

// Add Aura Family member (when friend request is accepted)
export async function addAuraFamilyMember(params: {
  currentUserId: string;
  newMemberId: string;
  newMemberName: string;
}): Promise<void> {
  const { currentUserId, newMemberId, newMemberName } = params;
  
  try {
    const batch = writeBatch(db);
    
    // Add to current user's friends
    const currentUserRef = doc(db, 'users', currentUserId);
    batch.update(currentUserRef, {
      friends: arrayUnion(newMemberId),
      lastActivity: serverTimestamp(),
    });

    // Add to new member's friends
    const newMemberRef = doc(db, 'users', newMemberId);
    batch.update(newMemberRef, {
      friends: arrayUnion(currentUserId),
      lastActivity: serverTimestamp(),
    });

    // Update friendship document
    const friendshipRef = doc(db, 'friendships', `${currentUserId}_${newMemberId}`);
    batch.set(friendshipRef, {
      userId: currentUserId,
      friendId: newMemberId,
      status: 'accepted',
      createdAt: serverTimestamp(),
      acceptedAt: serverTimestamp(),
    }, { merge: true });

    await batch.commit();

    // Trigger Aura Family refresh event
    const event = new CustomEvent('auraFamilyUpdated', {
      detail: { action: 'memberAdded', memberName: newMemberName }
    });
    window.dispatchEvent(event);

  } catch (error) {
    console.error('Error adding Aura Family member:', error);
    throw error;
  }
}

// Remove Aura Family member
export async function removeAuraFamilyMember(params: {
  currentUserId: string;
  memberId: string;
  memberName: string;
}): Promise<void> {
  const { currentUserId, memberId, memberName } = params;
  
  try {
    const batch = writeBatch(db);
    
    // Remove from current user's friends
    const currentUserRef = doc(db, 'users', currentUserId);
    batch.update(currentUserRef, {
      friends: arrayRemove(memberId),
      lastActivity: serverTimestamp(),
    });

    // Remove from member's friends
    const memberRef = doc(db, 'users', memberId);
    batch.update(memberRef, {
      friends: arrayRemove(currentUserId),
      lastActivity: serverTimestamp(),
    });

    // Delete friendship document
    const friendshipRef = doc(db, 'friendships', `${currentUserId}_${memberId}`);
    batch.delete(friendshipRef);

    await batch.commit();

    // Trigger Aura Family refresh event
    const event = new CustomEvent('auraFamilyUpdated', {
      detail: { action: 'memberRemoved', memberName }
    });
    window.dispatchEvent(event);

  } catch (error) {
    console.error('Error removing Aura Family member:', error);
    throw error;
  }
}

// Get Aura Family member by ID
export async function getAuraFamilyMember(
  currentUserId: string,
  memberId: string
): Promise<AuraFamilyMember | null> {
  try {
    const familyMembers = await getAuraFamilyMembers(currentUserId);
    return familyMembers.find(member => member.userId === memberId) || null;
  } catch (error) {
    console.error('Error getting Aura Family member:', error);
    return null;
  }
}

// Search Aura Family members
export function searchAuraFamilyMembers(
  members: AuraFamilyMember[],
  query: string
): AuraFamilyMember[] {
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

// Sort Aura Family members
export function sortAuraFamilyMembers(
  members: AuraFamilyMember[],
  sortBy: 'name' | 'auraPoints' | 'recent' | 'online'
): AuraFamilyMember[] {
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
      case 'recent':
      default:
        if (!a.lastActivity || !b.lastActivity) return 0;
        const aTime = a.lastActivity.toDate ? a.lastActivity.toDate().getTime() : 0;
        const bTime = b.lastActivity.toDate ? b.lastActivity.toDate().getTime() : 0;
        return bTime - aTime;
    }
  });
}