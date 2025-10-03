// Unified Friend System
// Bridges the gap between chat system and fam system
// Gets friends from chat participants and provides unified interface

import { 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';
import { getPublicProfile, PublicProfile } from './socialSystem';

export interface UnifiedFriend {
  userId: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  isOnline: boolean;
  lastSeen?: any;
  joinedAt: any;
  auraPoints: number;
  mutualConnections: number;
  sharedInterests: string[];
  chatId: string; // The chat ID for this friendship
}

export interface UnifiedFriendStats {
  totalFriends: number;
  activeFriends: number;
  totalAuraPoints: number;
  averageAuraPoints: number;
  newFriendsThisWeek: number;
}

// Get friends from chat participants
export async function getFriendsFromChats(userId: string): Promise<UnifiedFriend[]> {
  try {
    console.log('🔄 Loading friends from chat participants for user:', userId);
    
    // Get all chats where user is a participant
    const chatsQuery = query(
      collection(db, 'chats'),
      where(`participants.${userId}`, '!=', null),
      orderBy('lastActivity', 'desc')
    );
    
    const chatsSnapshot = await getDocs(chatsQuery);
    const friends: UnifiedFriend[] = [];
    const processedUserIds = new Set<string>();
    
    for (const chatDoc of chatsSnapshot.docs) {
      const chatData = chatDoc.data();
      
      // Only process direct messages (not group chats)
      if (chatData.type === 'direct') {
        const participants = chatData.participants || {};
        const participantIds = Object.keys(participants);
        
        // Find the other participant (not the current user)
        const otherUserId = participantIds.find(id => id !== userId);
        
        if (otherUserId && !processedUserIds.has(otherUserId)) {
          processedUserIds.add(otherUserId);
          
          try {
            // Get the other user's profile
            const profile = await getPublicProfile(otherUserId);
            
            if (profile) {
              const participant = participants[otherUserId];
              
              friends.push({
                userId: otherUserId,
                name: profile.name || 'Unknown',
                username: profile.username || 'unknown',
                avatar: profile.avatar,
                bio: profile.bio,
                isOnline: profile.isOnline || false,
                lastSeen: profile.lastSeen,
                joinedAt: participant?.joinedAt || chatData.createdAt,
                auraPoints: profile.auraPoints || 0,
                mutualConnections: 0, // We'll calculate this separately if needed
                sharedInterests: profile.interests || [],
                chatId: chatDoc.id,
              });
            }
          } catch (error) {
            console.error(`Error loading profile for user ${otherUserId}:`, error);
            // Add a basic entry even if profile loading fails
            friends.push({
              userId: otherUserId,
              name: 'Unknown User',
              username: `user${otherUserId.slice(-4)}`,
              avatar: undefined,
              bio: '',
              isOnline: false,
              lastSeen: null,
              joinedAt: chatData.createdAt,
              auraPoints: 0,
              mutualConnections: 0,
              sharedInterests: [],
              chatId: chatDoc.id,
            });
          }
        }
      }
    }
    
    console.log('✅ Friends loaded from chats:', friends.length);
    return friends;
    
  } catch (error) {
    console.error('Error loading friends from chats:', error);
    return [];
  }
}

// Get friend statistics
export async function getFriendStats(userId: string): Promise<UnifiedFriendStats> {
  try {
    const friends = await getFriendsFromChats(userId);
    
    const totalFriends = friends.length;
    const activeFriends = friends.filter(friend => friend.isOnline).length;
    const totalAuraPoints = friends.reduce((sum, friend) => sum + friend.auraPoints, 0);
    const averageAuraPoints = totalFriends > 0 ? totalAuraPoints / totalFriends : 0;
    
    // Calculate new friends this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newFriendsThisWeek = friends.filter(friend => {
      if (!friend.joinedAt) return false;
      try {
        const joinedDate = friend.joinedAt.toDate ? friend.joinedAt.toDate() : new Date(friend.joinedAt);
        return joinedDate > oneWeekAgo;
      } catch (error) {
        return false;
      }
    }).length;
    
    return {
      totalFriends,
      activeFriends,
      totalAuraPoints,
      averageAuraPoints,
      newFriendsThisWeek,
    };
  } catch (error) {
    console.error('Error loading friend stats:', error);
    return {
      totalFriends: 0,
      activeFriends: 0,
      totalAuraPoints: 0,
      averageAuraPoints: 0,
      newFriendsThisWeek: 0,
    };
  }
}

// Search friends
export function searchFriends(
  friends: UnifiedFriend[],
  query: string
): UnifiedFriend[] {
  if (!query.trim()) return friends;
  
  const lowercaseQuery = query.toLowerCase();
  return friends.filter(friend => 
    friend.name.toLowerCase().includes(lowercaseQuery) ||
    friend.username.toLowerCase().includes(lowercaseQuery) ||
    friend.sharedInterests.some(interest => 
      interest.toLowerCase().includes(lowercaseQuery)
    )
  );
}

// Sort friends
export function sortFriends(
  friends: UnifiedFriend[],
  sortBy: 'name' | 'auraPoints' | 'recent' | 'online'
): UnifiedFriend[] {
  return [...friends].sort((a, b) => {
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
        if (!a.lastSeen || !b.lastSeen) return 0;
        const aTime = a.lastSeen.toDate ? a.lastSeen.toDate().getTime() : 0;
        const bTime = b.lastSeen.toDate ? b.lastSeen.toDate().getTime() : 0;
        return bTime - aTime;
    }
  });
}

// Get mutual connections count
export async function getMutualConnectionsCount(
  currentUserId: string, 
  targetUserId: string
): Promise<number> {
  try {
    // Get current user's friends
    const currentUserFriends = await getFriendsFromChats(currentUserId);
    const currentUserFriendIds = new Set(currentUserFriends.map(f => f.userId));
    
    // Get target user's friends
    const targetUserFriends = await getFriendsFromChats(targetUserId);
    const targetUserFriendIds = new Set(targetUserFriends.map(f => f.userId));
    
    // Count mutual connections
    let mutualCount = 0;
    for (const friendId of currentUserFriendIds) {
      if (targetUserFriendIds.has(friendId)) {
        mutualCount++;
      }
    }
    
    return mutualCount;
  } catch (error) {
    console.error('Error calculating mutual connections:', error);
    return 0;
  }
}

// Search public profiles for friend discovery
export async function searchPublicProfiles(query: string): Promise<any[]> {
  try {
    console.log('🔍 Searching public profiles:', query);
    
    // For now, we'll use a simple approach
    // In a real app, you'd want to implement proper search indexing
    const profilesQuery = query(
      collection(db, 'publicProfiles'),
      orderBy('name')
    );
    
    const snapshot = await getDocs(profilesQuery);
    const profiles = snapshot.docs.map(doc => ({
      ...doc.data(),
      uid: doc.id,
    })) as any[];
    
    // Filter by search query
    const lowercaseQuery = query.toLowerCase();
    const filteredProfiles = profiles.filter(profile => 
      profile.name?.toLowerCase().includes(lowercaseQuery) ||
      profile.username?.toLowerCase().includes(lowercaseQuery) ||
      profile.interests?.some((interest: string) => 
        interest.toLowerCase().includes(lowercaseQuery)
      )
    );
    
    console.log('✅ Search results:', filteredProfiles.length);
    return filteredProfiles;
  } catch (error) {
    console.error('Error searching public profiles:', error);
    return [];
  }
}