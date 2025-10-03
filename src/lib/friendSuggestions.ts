// Friend Suggestions System
// Provides intelligent friend suggestions based on various factors

import { 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface FriendSuggestion {
  userId: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  interests: string[];
  location?: string;
  isOnline: boolean;
  lastSeen?: any;
  mutualFriends: number;
  sharedInterests: string[];
  sharedGroups: string[];
  similarJournals: number;
  suggestionReason: string;
  confidenceScore: number;
}

export interface SuggestionCriteria {
  mutualFriends?: boolean;
  sharedInterests?: boolean;
  sharedGroups?: boolean;
  similarJournals?: boolean;
  location?: boolean;
  maxResults?: number;
}

// Cache for suggestions to improve performance
const suggestionsCache = new Map<string, { suggestions: FriendSuggestion[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get friend suggestions based on various criteria
export async function getFriendSuggestions(
  currentUserId: string, 
  criteria: SuggestionCriteria = {}
): Promise<FriendSuggestion[]> {
  const {
    mutualFriends = true,
    sharedInterests = true,
    sharedGroups = true,
    similarJournals = true,
    location = true,
    maxResults = 20
  } = criteria;

  // Check cache first
  const cacheKey = `${currentUserId}_${JSON.stringify(criteria)}`;
  const cached = suggestionsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('📦 Using cached suggestions');
    return cached.suggestions;
  }

  try {
    console.log('🔍 Generating friend suggestions for:', currentUserId);
    
    // Get current user's data
    const [userDoc, userProfile] = await Promise.all([
      getDoc(doc(db, 'users', currentUserId)),
      getDoc(doc(db, 'publicProfiles', currentUserId))
    ]);

    if (!userDoc.exists() || !userProfile.exists()) {
      console.log('❌ User data not found');
      return [];
    }

    const userData = userDoc.data();
    const userProfileData = userProfile.data();
    
    // Get current user's friends to exclude them from suggestions
    const friendsSnapshot = await getDocs(collection(db, 'users', currentUserId, 'friends'));
    const existingFriendIds = friendsSnapshot.docs.map(doc => doc.id);
    existingFriendIds.push(currentUserId); // Exclude self

    const suggestions: FriendSuggestion[] = [];
    const suggestionMap = new Map<string, FriendSuggestion>();

    // 1. Mutual Friends Suggestions
    if (mutualFriends) {
      console.log('🔍 Finding mutual friends suggestions...');
      const mutualSuggestions = await getMutualFriendsSuggestions(currentUserId, existingFriendIds);
      mutualSuggestions.forEach(suggestion => {
        suggestionMap.set(suggestion.userId, suggestion);
      });
    }

    // 2. Shared Interests Suggestions
    if (sharedInterests && userProfileData?.interests?.length > 0) {
      console.log('🔍 Finding shared interests suggestions...');
      const interestSuggestions = await getSharedInterestsSuggestions(
        userProfileData.interests, 
        existingFriendIds
      );
      interestSuggestions.forEach(suggestion => {
        const existing = suggestionMap.get(suggestion.userId);
        if (existing) {
          // Merge with existing suggestion
          existing.sharedInterests = [...new Set([...existing.sharedInterests, ...suggestion.sharedInterests])];
          existing.confidenceScore += suggestion.confidenceScore;
        } else {
          suggestionMap.set(suggestion.userId, suggestion);
        }
      });
    }

    // 3. Shared Groups Suggestions
    if (sharedGroups) {
      console.log('🔍 Finding shared groups suggestions...');
      const groupSuggestions = await getSharedGroupsSuggestions(currentUserId, existingFriendIds);
      groupSuggestions.forEach(suggestion => {
        const existing = suggestionMap.get(suggestion.userId);
        if (existing) {
          existing.sharedGroups = [...new Set([...existing.sharedGroups, ...suggestion.sharedGroups])];
          existing.confidenceScore += suggestion.confidenceScore;
        } else {
          suggestionMap.set(suggestion.userId, suggestion);
        }
      });
    }

    // 4. Similar Journals Suggestions
    if (similarJournals) {
      console.log('🔍 Finding similar journals suggestions...');
      const journalSuggestions = await getSimilarJournalsSuggestions(currentUserId, existingFriendIds);
      journalSuggestions.forEach(suggestion => {
        const existing = suggestionMap.get(suggestion.userId);
        if (existing) {
          existing.similarJournals += suggestion.similarJournals;
          existing.confidenceScore += suggestion.confidenceScore;
        } else {
          suggestionMap.set(suggestion.userId, suggestion);
        }
      });
    }

    // 5. Location-based Suggestions
    if (location && userProfileData?.location) {
      console.log('🔍 Finding location-based suggestions...');
      const locationSuggestions = await getLocationBasedSuggestions(
        userProfileData.location, 
        existingFriendIds
      );
      locationSuggestions.forEach(suggestion => {
        const existing = suggestionMap.get(suggestion.userId);
        if (existing) {
          existing.confidenceScore += suggestion.confidenceScore;
        } else {
          suggestionMap.set(suggestion.userId, suggestion);
        }
      });
    }

    // Convert map to array and sort by confidence score
    const allSuggestions = Array.from(suggestionMap.values())
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .slice(0, maxResults);

    // Cache the results
    suggestionsCache.set(cacheKey, {
      suggestions: allSuggestions,
      timestamp: Date.now()
    });

    console.log('✅ Generated', allSuggestions.length, 'friend suggestions');
    return allSuggestions;

  } catch (error) {
    console.error('Error generating friend suggestions:', error);
    return [];
  }
}

// Get suggestions based on mutual friends
async function getMutualFriendsSuggestions(
  currentUserId: string, 
  existingFriendIds: string[]
): Promise<FriendSuggestion[]> {
  try {
    // Get current user's friends
    const friendsSnapshot = await getDocs(collection(db, 'users', currentUserId, 'friends'));
    const friendIds = friendsSnapshot.docs.map(doc => doc.id);

    if (friendIds.length === 0) return [];

    const suggestions: FriendSuggestion[] = [];

    // For each friend, find their friends who aren't already our friends
    for (const friendId of friendIds.slice(0, 5)) { // Limit to first 5 friends for performance
      try {
        const friendFriendsSnapshot = await getDocs(collection(db, 'users', friendId, 'friends'));
        
        for (const friendFriendDoc of friendFriendsSnapshot.docs) {
          const potentialFriendId = friendFriendDoc.id;
          
          if (existingFriendIds.includes(potentialFriendId)) continue;

          // Get potential friend's profile
          const profileDoc = await getDoc(doc(db, 'publicProfiles', potentialFriendId));
          if (!profileDoc.exists()) continue;

          const profileData = profileDoc.data();
          
          // Count mutual friends
          const mutualCount = await countMutualFriends(currentUserId, potentialFriendId);

          suggestions.push({
            userId: potentialFriendId,
            name: profileData.name || 'Unknown',
            username: profileData.username || 'unknown',
            avatar: profileData.avatar,
            bio: profileData.bio,
            interests: profileData.interests || [],
            location: profileData.location,
            isOnline: profileData.isOnline || false,
            lastSeen: profileData.lastSeen,
            mutualFriends: mutualCount,
            sharedInterests: [],
            sharedGroups: [],
            similarJournals: 0,
            suggestionReason: `${mutualCount} mutual friends`,
            confidenceScore: mutualCount * 10 // Higher score for more mutual friends
          });
        }
      } catch (error) {
        console.error(`Error processing friend ${friendId}:`, error);
        continue;
      }
    }

    return suggestions;
  } catch (error) {
    console.error('Error getting mutual friends suggestions:', error);
    return [];
  }
}

// Get suggestions based on shared interests
async function getSharedInterestsSuggestions(
  userInterests: string[], 
  existingFriendIds: string[]
): Promise<FriendSuggestion[]> {
  try {
    const suggestions: FriendSuggestion[] = [];
    
    // Search for users with similar interests
    for (const interest of userInterests.slice(0, 3)) { // Limit to first 3 interests
      const profilesSnapshot = await getDocs(
        query(
          collection(db, 'publicProfiles'),
          where('interests', 'array-contains', interest),
          limit(10)
        )
      );

      for (const profileDoc of profilesSnapshot.docs) {
        const profileData = profileDoc.data();
        const userId = profileDoc.id;
        
        if (existingFriendIds.includes(userId)) continue;

        const sharedInterests = (profileData.interests || []).filter((interest: string) => 
          userInterests.includes(interest)
        );

        if (sharedInterests.length === 0) continue;

        suggestions.push({
          userId,
          name: profileData.name || 'Unknown',
          username: profileData.username || 'unknown',
          avatar: profileData.avatar,
          bio: profileData.bio,
          interests: profileData.interests || [],
          location: profileData.location,
          isOnline: profileData.isOnline || false,
          lastSeen: profileData.lastSeen,
          mutualFriends: 0,
          sharedInterests,
          sharedGroups: [],
          similarJournals: 0,
          suggestionReason: `Shared interests: ${sharedInterests.join(', ')}`,
          confidenceScore: sharedInterests.length * 5
        });
      }
    }

    return suggestions;
  } catch (error) {
    console.error('Error getting shared interests suggestions:', error);
    return [];
  }
}

// Get suggestions based on shared groups
async function getSharedGroupsSuggestions(
  currentUserId: string, 
  existingFriendIds: string[]
): Promise<FriendSuggestion[]> {
  try {
    // Get user's groups
    const userGroupsSnapshot = await getDocs(collection(db, 'users', currentUserId, 'groups'));
    const userGroupIds = userGroupsSnapshot.docs.map(doc => doc.id);

    if (userGroupIds.length === 0) return [];

    const suggestions: FriendSuggestion[] = [];

    // For each group, find other members
    for (const groupId of userGroupIds.slice(0, 3)) { // Limit to first 3 groups
      try {
        const groupMembersSnapshot = await getDocs(collection(db, 'groups', groupId, 'members'));
        
        for (const memberDoc of groupMembersSnapshot.docs) {
          const memberId = memberDoc.id;
          
          if (existingFriendIds.includes(memberId)) continue;

          // Get member's profile
          const profileDoc = await getDoc(doc(db, 'publicProfiles', memberId));
          if (!profileDoc.exists()) continue;

          const profileData = profileDoc.data();
          
          suggestions.push({
            userId: memberId,
            name: profileData.name || 'Unknown',
            username: profileData.username || 'unknown',
            avatar: profileData.avatar,
            bio: profileData.bio,
            interests: profileData.interests || [],
            location: profileData.location,
            isOnline: profileData.isOnline || false,
            lastSeen: profileData.lastSeen,
            mutualFriends: 0,
            sharedInterests: [],
            sharedGroups: [groupId],
            similarJournals: 0,
            suggestionReason: 'Shared group member',
            confidenceScore: 8
          });
        }
      } catch (error) {
        console.error(`Error processing group ${groupId}:`, error);
        continue;
      }
    }

    return suggestions;
  } catch (error) {
    console.error('Error getting shared groups suggestions:', error);
    return [];
  }
}

// Get suggestions based on similar journals
async function getSimilarJournalsSuggestions(
  currentUserId: string, 
  existingFriendIds: string[]
): Promise<FriendSuggestion[]> {
  try {
    // Get user's journal entries
    const userJournalsSnapshot = await getDocs(
      query(
        collection(db, 'journals'),
        where('userId', '==', currentUserId),
        orderBy('createdAt', 'desc'),
        limit(10)
      )
    );

    if (userJournalsSnapshot.empty) return [];

    const userJournalTypes = userJournalsSnapshot.docs.map(doc => doc.data().type).filter(Boolean);
    const suggestions: FriendSuggestion[] = [];

    // Find users with similar journal types
    for (const journalType of userJournalTypes.slice(0, 3)) {
      const similarJournalsSnapshot = await getDocs(
        query(
          collection(db, 'journals'),
          where('type', '==', journalType),
          where('userId', '!=', currentUserId),
          limit(5)
        )
      );

      for (const journalDoc of similarJournalsSnapshot.docs) {
        const journalData = journalDoc.data();
        const userId = journalData.userId;
        
        if (existingFriendIds.includes(userId)) continue;

        // Get user's profile
        const profileDoc = await getDoc(doc(db, 'publicProfiles', userId));
        if (!profileDoc.exists()) continue;

        const profileData = profileDoc.data();
        
        suggestions.push({
          userId,
          name: profileData.name || 'Unknown',
          username: profileData.username || 'unknown',
          avatar: profileData.avatar,
          bio: profileData.bio,
          interests: profileData.interests || [],
          location: profileData.location,
          isOnline: profileData.isOnline || false,
          lastSeen: profileData.lastSeen,
          mutualFriends: 0,
          sharedInterests: [],
          sharedGroups: [],
          similarJournals: 1,
          suggestionReason: `Similar journal: ${journalType}`,
          confidenceScore: 6
        });
      }
    }

    return suggestions;
  } catch (error) {
    console.error('Error getting similar journals suggestions:', error);
    return [];
  }
}

// Get suggestions based on location
async function getLocationBasedSuggestions(
  userLocation: string, 
  existingFriendIds: string[]
): Promise<FriendSuggestion[]> {
  try {
    const suggestions: FriendSuggestion[] = [];
    
    const profilesSnapshot = await getDocs(
      query(
        collection(db, 'publicProfiles'),
        where('location', '==', userLocation),
        limit(10)
      )
    );

    for (const profileDoc of profilesSnapshot.docs) {
      const profileData = profileDoc.data();
      const userId = profileDoc.id;
      
      if (existingFriendIds.includes(userId)) continue;

      suggestions.push({
        userId,
        name: profileData.name || 'Unknown',
        username: profileData.username || 'unknown',
        avatar: profileData.avatar,
        bio: profileData.bio,
        interests: profileData.interests || [],
        location: profileData.location,
        isOnline: profileData.isOnline || false,
        lastSeen: profileData.lastSeen,
        mutualFriends: 0,
        sharedInterests: [],
        sharedGroups: [],
        similarJournals: 0,
        suggestionReason: `Same location: ${userLocation}`,
        confidenceScore: 4
      });
    }

    return suggestions;
  } catch (error) {
    console.error('Error getting location-based suggestions:', error);
    return [];
  }
}

// Count mutual friends between two users
async function countMutualFriends(userId1: string, userId2: string): Promise<number> {
  try {
    const [user1FriendsSnapshot, user2FriendsSnapshot] = await Promise.all([
      getDocs(collection(db, 'users', userId1, 'friends')),
      getDocs(collection(db, 'users', userId2, 'friends'))
    ]);

    const user1Friends = new Set(user1FriendsSnapshot.docs.map(doc => doc.id));
    const user2Friends = new Set(user2FriendsSnapshot.docs.map(doc => doc.id));

    let mutualCount = 0;
    for (const friendId of user1Friends) {
      if (user2Friends.has(friendId)) {
        mutualCount++;
      }
    }

    return mutualCount;
  } catch (error) {
    console.error('Error counting mutual friends:', error);
    return 0;
  }
}