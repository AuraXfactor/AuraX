// Enhanced Friend System with Notifications and Better Management
// Addresses all the issues mentioned in the PR comments

import { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { getPublicProfile, PublicProfile } from './socialSystem';

// Re-export PublicProfile for convenience
export type { PublicProfile };
import { notificationManager, createNotificationPayload } from './notifications';

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';
export type FriendRequestDirection = 'sent' | 'received';

export interface EnhancedFriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  message?: string;
  createdAt: any;
  updatedAt?: any;
  fromProfile?: PublicProfile;
  toProfile?: PublicProfile;
  direction: FriendRequestDirection;
}

export interface FriendRequestCounts {
  pending: number;
  sent: number;
  received: number;
}

// Collection references
const getFriendRequestsRef = () => collection(db, 'friendRequests');
const getFriendRequestRef = (requestId: string) => doc(db, 'friendRequests', requestId);
const getFriendsRef = (userId: string) => collection(db, 'users', userId, 'friends');
const getFriendDocRef = (userId: string, friendId: string) => doc(db, 'users', userId, 'friends', friendId);

// Send friend request with notification
export async function sendFriendRequest(params: {
  fromUser: User;
  toUserId: string;
  message?: string;
}): Promise<string> {
  const { fromUser, toUserId, message } = params;
  
  if (fromUser.uid === toUserId) {
    throw new Error('Cannot send friend request to yourself');
  }

  try {
    // Check if request already exists
    const existingRequestQuery = query(
      getFriendRequestsRef(),
      where('fromUserId', '==', fromUser.uid),
      where('toUserId', '==', toUserId),
      where('status', '==', 'pending')
    );
    
    const existingRequests = await getDocs(existingRequestQuery);
    if (!existingRequests.empty) {
      throw new Error('Friend request already sent');
    }

    // Check if already friends
    const friendshipDoc = await getDoc(getFriendDocRef(fromUser.uid, toUserId));
    if (friendshipDoc.exists()) {
      throw new Error('Already friends with this user');
    }

    // Create friend request
    const requestData = {
      fromUserId: fromUser.uid,
      toUserId,
      status: 'pending' as FriendRequestStatus,
      message: message || '',
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(getFriendRequestsRef(), requestData);
    
    // Send notification to recipient
    try {
      const recipientProfile = await getPublicProfile(toUserId);
      const senderProfile = await getPublicProfile(fromUser.uid);
      
      if (recipientProfile && senderProfile) {
        const notificationPayload = createNotificationPayload('friend_request', {
          senderName: senderProfile.name,
          senderId: fromUser.uid,
        });
        
        await notificationManager.showNotification(notificationPayload);
      }
    } catch (notificationError) {
      console.warn('Failed to send friend request notification:', notificationError);
    }
    
    return docRef.id;
    
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
}

// Respond to friend request with notification
export async function respondToFriendRequest(params: {
  user: User;
  requestId: string;
  response: 'accepted' | 'rejected';
}): Promise<void> {
  const { user, requestId, response } = params;
  
  const batch = writeBatch(db);
  const requestRef = getFriendRequestRef(requestId);
  
  // Get request data first
  const requestDoc = await getDoc(requestRef);
  if (!requestDoc.exists()) {
    throw new Error('Friend request not found');
  }
  
  const requestData = requestDoc.data() as EnhancedFriendRequest;
  
  // Update request status
  batch.update(requestRef, {
    status: response,
    updatedAt: serverTimestamp(),
  });

  if (response === 'accepted') {
    // Create bidirectional friendship
    const friendshipTimestamp = serverTimestamp();
    
    batch.set(getFriendDocRef(user.uid, requestData.fromUserId), {
      userId: user.uid,
      friendId: requestData.fromUserId,
      friendSince: friendshipTimestamp,
      lastInteraction: friendshipTimestamp,
    });

    batch.set(getFriendDocRef(requestData.fromUserId, user.uid), {
      userId: requestData.fromUserId,
      friendId: user.uid,
      friendSince: friendshipTimestamp,
      lastInteraction: friendshipTimestamp,
    });
    
    // Send notification to sender about acceptance
    try {
      const senderProfile = await getPublicProfile(requestData.fromUserId);
      const acceptorProfile = await getPublicProfile(user.uid);
      
      if (senderProfile && acceptorProfile) {
        const notificationPayload = createNotificationPayload('friend_request', {
          senderName: acceptorProfile.name,
          content: 'accepted your friend request',
          senderId: user.uid,
        });
        
        await notificationManager.showNotification(notificationPayload);
      }
    } catch (notificationError) {
      console.warn('Failed to send acceptance notification:', notificationError);
    }
  }

  await batch.commit();
}

// Get friend request counts for notifications
export async function getFriendRequestCounts(userId: string): Promise<FriendRequestCounts> {
  try {
    const [sentQuery, receivedQuery] = await Promise.all([
      getDocs(query(
        getFriendRequestsRef(),
        where('fromUserId', '==', userId),
        where('status', '==', 'pending')
      )),
      getDocs(query(
        getFriendRequestsRef(),
        where('toUserId', '==', userId),
        where('status', '==', 'pending')
      ))
    ]);

    return {
      pending: receivedQuery.docs.length,
      sent: sentQuery.docs.length,
      received: receivedQuery.docs.length,
    };
  } catch (error) {
    console.error('Error getting friend request counts:', error);
    return { pending: 0, sent: 0, received: 0 };
  }
}

// Listen to friend requests with counts
export function listenToFriendRequests(
  userId: string, 
  callback: (requests: EnhancedFriendRequest[], counts: FriendRequestCounts) => void
) {
  const receivedQuery = query(
    getFriendRequestsRef(),
    where('toUserId', '==', userId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  
  const sentQuery = query(
    getFriendRequestsRef(),
    where('fromUserId', '==', userId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );

  let receivedUnsubscribe: (() => void) | null = null;
  let sentUnsubscribe: (() => void) | null = null;
  let allRequests: EnhancedFriendRequest[] = [];
  let counts: FriendRequestCounts = { pending: 0, sent: 0, received: 0 };

  const updateCallback = () => {
    callback(allRequests, counts);
  };

  receivedUnsubscribe = onSnapshot(receivedQuery, async (snapshot) => {
    const receivedRequests: EnhancedFriendRequest[] = [];
    
    for (const doc of snapshot.docs) {
      const requestData = doc.data() as EnhancedFriendRequest;
      const fromProfile = await getPublicProfile(requestData.fromUserId);
      
      receivedRequests.push({
        ...requestData,
        id: doc.id,
        fromProfile: fromProfile || undefined,
        direction: 'received' as FriendRequestDirection,
      });
    }
    
    // Update all requests and counts
    allRequests = allRequests.filter(req => req.direction !== 'received');
    allRequests.push(...receivedRequests);
    counts.received = receivedRequests.length;
    counts.pending = receivedRequests.length;
    
    updateCallback();
  });

  sentUnsubscribe = onSnapshot(sentQuery, async (snapshot) => {
    const sentRequests: EnhancedFriendRequest[] = [];
    
    for (const doc of snapshot.docs) {
      const requestData = doc.data() as EnhancedFriendRequest;
      const toProfile = await getPublicProfile(requestData.toUserId);
      
      sentRequests.push({
        ...requestData,
        id: doc.id,
        toProfile: toProfile || undefined,
        direction: 'sent' as FriendRequestDirection,
      });
    }
    
    // Update all requests and counts
    allRequests = allRequests.filter(req => req.direction !== 'sent');
    allRequests.push(...sentRequests);
    counts.sent = sentRequests.length;
    
    updateCallback();
  });

  return () => {
    if (receivedUnsubscribe) receivedUnsubscribe();
    if (sentUnsubscribe) sentUnsubscribe();
  };
}

// Get friends list (excluding current user from suggestions)
export async function getFriends(userId: string): Promise<PublicProfile[]> {
  try {
    const friendsSnapshot = await getDocs(getFriendsRef(userId));
    const friendIds = friendsSnapshot.docs.map(doc => doc.id);
    
    const friends: PublicProfile[] = [];
    for (const friendId of friendIds) {
      const profile = await getPublicProfile(friendId);
      if (profile) {
        friends.push(profile);
      }
    }
    
    return friends;
  } catch (error) {
    console.error('Error getting friends:', error);
    return [];
  }
}

// Enhanced friend suggestions (excludes existing friends)
export async function getFriendSuggestions(params: {
  userId: string;
  limitCount?: number;
}): Promise<PublicProfile[]> {
  const { userId, limitCount = 10 } = params;
  
  try {
    // Get user's friends to exclude them
    const friends = await getFriends(userId);
    const friendIds = new Set(friends.map(friend => friend.userId));
    
    // Get user's interests for better matching
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userInterests = userDoc.data()?.interests || [];
    const userFocusAreas = userDoc.data()?.focusAreas || [];
    
    // Get all public profiles
    const profilesQuery = query(
      collection(db, 'publicProfiles'),
      limit(50)
    );
    const profilesSnapshot = await getDocs(profilesQuery);
    
    const suggestions = profilesSnapshot.docs
      .filter(doc => doc.id !== userId && !friendIds.has(doc.id))
      .map(doc => {
        const data = doc.data();
        return {
          userId: doc.id,
          name: data.name || '',
          username: data.username,
          bio: data.bio,
          avatar: data.avatar,
          interests: data.interests || [],
          location: data.location,
          isOnline: data.isOnline || false,
          lastSeen: data.lastSeen,
          friendsCount: data.friendsCount || 0,
          postsCount: data.postsCount || 0,
          joinedAt: data.joinedAt,
          focusAreas: data.focusAreas || [],
        } as PublicProfile;
      })
      .filter(profile => {
        // Match by interests or focus areas
        const hasCommonInterests = profile.interests?.some(interest => 
          userInterests.includes(interest)
        );
        const hasCommonFocusAreas = profile.focusAreas?.some(area => 
          userFocusAreas.includes(area)
        );
        return hasCommonInterests || hasCommonFocusAreas;
      })
      .slice(0, limitCount);

    return suggestions;
  } catch (error) {
    console.error('Error getting friend suggestions:', error);
    return [];
  }
}

// Remove friend
export async function removeFriend(params: {
  userId: string;
  friendId: string;
}): Promise<void> {
  const { userId, friendId } = params;
  
  const batch = writeBatch(db);
  
  // Remove bidirectional friendship
  batch.delete(getFriendDocRef(userId, friendId));
  batch.delete(getFriendDocRef(friendId, userId));
  
  await batch.commit();
}

// Cancel friend request
export async function cancelFriendRequest(requestId: string): Promise<void> {
  await deleteDoc(getFriendRequestRef(requestId));
}