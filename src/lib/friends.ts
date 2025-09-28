import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  getDoc,
  getDocs,
  limit,
  where,
  Timestamp,
  writeBatch,
  arrayUnion,
} from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

// Types for Friends System
export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export type FriendRequest = {
  id: string;
  fromUid: string;
  toUid: string;
  fromUserName: string;
  fromUserAvatar?: string;
  toUserName: string;
  toUserAvatar?: string;
  status: FriendshipStatus;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  message?: string;
};

export type Friendship = {
  id: string;
  userUid: string;
  friendUid: string;
  friendName: string;
  friendUsername?: string;
  friendAvatar?: string;
  createdAt: Timestamp | null;
  lastInteraction?: Timestamp | null;
  mutualFriends?: number;
  sharedInterests?: string[];
};

export type AuraPost = {
  id: string;
  authorUid: string;
  authorName: string;
  authorUsername?: string;
  authorAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'video';
  mediaUrl?: string;
  moodTag?: string;
  emoji?: string;
  isEphemeral: boolean;
  expiresAt: Timestamp | null;
  createdAt: Timestamp | null;
  viewCount: number;
  likeCount: number;
  replyCount: number;
  visibility: 'friends' | 'public' | 'private';
  tags?: string[];
};

export type AuraReaction = {
  id: string;
  postId: string;
  userUid: string;
  userName: string;
  type: 'like' | 'love' | 'support' | 'hug';
  emoji: string;
  createdAt: Timestamp | null;
};

export type AuraReply = {
  id: string;
  postId: string;
  userUid: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Timestamp | null;
  isPrivate: boolean; // If true, only visible to post author
};

export type GroupChat = {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  members: string[];
  admins: string[];
  avatar?: string;
  isPrivate: boolean;
  createdAt: Timestamp | null;
  lastActivity: Timestamp | null;
  messageCount: number;
};

export type GroupMessage = {
  id: string;
  groupId: string;
  fromUid: string;
  fromName: string;
  fromAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'system';
  mediaUrl?: string;
  replyToPostId?: string; // For contextual replies to Aura posts
  createdAt: Timestamp | null;
  editedAt?: Timestamp | null;
  reactions: { [emoji: string]: string[] }; // emoji -> array of user UIDs
};

// Helper functions for Firestore paths
export function getFriendRequestsRef(uid: string) {
  return collection(db, 'users', uid, 'friendRequests');
}

export function getFriendsRef(uid: string) {
  return collection(db, 'users', uid, 'friends');
}

export function getAuraPostsRef() {
  return collection(db, 'auraPosts');
}

export function getAuraRepliesRef(postId: string) {
  return collection(db, 'auraPosts', postId, 'replies');
}

export function getGroupChatsRef() {
  return collection(db, 'groupChats');
}

export function getGroupMessagesRef(groupId: string) {
  return collection(db, 'groupChats', groupId, 'messages');
}

// Friend Request Functions
export async function sendFriendRequest(params: {
  fromUser: User;
  toUid: string;
  toUserName: string;
  toUserAvatar?: string;
  message?: string;
}): Promise<string> {
  const { fromUser, toUid, toUserName, toUserAvatar, message } = params;
  
  if (fromUser.uid === toUid) {
    throw new Error('Cannot send friend request to yourself');
  }

  const batch = writeBatch(db);
  
  // Create request document ID
  const requestId = `${fromUser.uid}_${toUid}`;
  
  const requestData = {
    fromUid: fromUser.uid,
    toUid,
    fromUserName: fromUser.displayName || fromUser.email || 'Anonymous',
    fromUserAvatar: fromUser.photoURL || undefined,
    toUserName,
    toUserAvatar,
    status: 'pending' as FriendshipStatus,
    message: message || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Add to sender's sent requests
  const senderRequestRef = doc(getFriendRequestsRef(fromUser.uid), requestId);
  batch.set(senderRequestRef, requestData);

  // Add to receiver's incoming requests
  const receiverRequestRef = doc(getFriendRequestsRef(toUid), requestId);
  batch.set(receiverRequestRef, requestData);

  await batch.commit();
  return requestId;
}

export async function acceptFriendRequest(params: {
  user: User;
  requestId: string;
  fromUid: string;
  fromUserName: string;
  fromUserAvatar?: string;
}): Promise<void> {
  const { user, requestId, fromUid, fromUserName, fromUserAvatar } = params;
  
  const batch = writeBatch(db);
  
  // Update request status
  const userRequestRef = doc(getFriendRequestsRef(user.uid), requestId);
  const senderRequestRef = doc(getFriendRequestsRef(fromUid), requestId);
  
  batch.update(userRequestRef, {
    status: 'accepted',
    updatedAt: serverTimestamp(),
  });
  batch.update(senderRequestRef, {
    status: 'accepted',
    updatedAt: serverTimestamp(),
  });

  // Create friendship records
  const userFriendRef = doc(getFriendsRef(user.uid), fromUid);
  const senderFriendRef = doc(getFriendsRef(fromUid), user.uid);
  
  const friendshipTimestamp = serverTimestamp();
  
  batch.set(userFriendRef, {
    userUid: user.uid,
    friendUid: fromUid,
    friendName: fromUserName,
    friendAvatar: fromUserAvatar,
    createdAt: friendshipTimestamp,
    lastInteraction: friendshipTimestamp,
  });

  batch.set(senderFriendRef, {
    userUid: fromUid,
    friendUid: user.uid,
    friendName: user.displayName || user.email || 'Anonymous',
    friendAvatar: user.photoURL,
    createdAt: friendshipTimestamp,
    lastInteraction: friendshipTimestamp,
  });

  await batch.commit();
}

export async function declineFriendRequest(params: {
  user: User;
  requestId: string;
  fromUid: string;
}): Promise<void> {
  const { user, requestId, fromUid } = params;
  
  const batch = writeBatch(db);
  
  // Delete request from both users
  const userRequestRef = doc(getFriendRequestsRef(user.uid), requestId);
  const senderRequestRef = doc(getFriendRequestsRef(fromUid), requestId);
  
  batch.delete(userRequestRef);
  batch.delete(senderRequestRef);

  await batch.commit();
}

export async function removeFriend(params: {
  user: User;
  friendUid: string;
}): Promise<void> {
  const { user, friendUid } = params;
  
  const batch = writeBatch(db);
  
  // Remove friendship records
  const userFriendRef = doc(getFriendsRef(user.uid), friendUid);
  const friendUserRef = doc(getFriendsRef(friendUid), user.uid);
  
  batch.delete(userFriendRef);
  batch.delete(friendUserRef);

  await batch.commit();
}

// Aura Posts (Ephemeral Posts) Functions
export async function createAuraPost(params: {
  user: User;
  content: string;
  type: 'text' | 'image' | 'video';
  file?: File;
  moodTag?: string;
  emoji?: string;
  visibility?: 'friends' | 'public' | 'private';
  tags?: string[];
}): Promise<string> {
  const { user, content, type, file, moodTag, emoji, visibility = 'friends', tags } = params;
  
  let mediaUrl: string | undefined;
  
  // Upload media if provided
  if (file && (type === 'image' || type === 'video')) {
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || '';
    const fileName = `aura_${user.uid}_${timestamp}.${extension}`;
    const storagePath = `aura-posts/${user.uid}/${fileName}`;
    
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    mediaUrl = await getDownloadURL(storageRef);
  }
  
  // Calculate expiration time (24 hours from now)
  const expiresAt = new Timestamp(Date.now() / 1000 + 24 * 60 * 60, 0);
  
  const postData = {
    authorUid: user.uid,
    authorName: user.displayName || user.email || 'Anonymous',
    authorAvatar: user.photoURL || undefined,
    content,
    type,
    mediaUrl,
    moodTag,
    emoji,
    isEphemeral: true,
    expiresAt,
    createdAt: serverTimestamp(),
    viewCount: 0,
    likeCount: 0,
    replyCount: 0,
    visibility,
    tags,
  };
  
  const docRef = await addDoc(getAuraPostsRef(), postData);
  return docRef.id;
}

export async function getAuraFeed(params: {
  userUid: string;
  limitCount?: number;
}): Promise<AuraPost[]> {
  const { userUid, limitCount = 20 } = params;
  
  // Get user's friends to filter feed
  const friendsSnapshot = await getDocs(getFriendsRef(userUid));
  const friendUids = friendsSnapshot.docs.map(doc => doc.data().friendUid);
  friendUids.push(userUid); // Include user's own posts
  
  if (friendUids.length === 0) {
    return [];
  }
  
  // Query posts from friends and self, ordered by creation time
  const q = query(
    getAuraPostsRef(),
    where('authorUid', 'in', friendUids.slice(0, 10)), // Firestore 'in' limit is 10
    where('expiresAt', '>', Timestamp.now()),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as AuraPost[];
}

export async function addAuraReaction(params: {
  user: User;
  postId: string;
  type: 'like' | 'love' | 'support' | 'hug';
  emoji: string;
}): Promise<void> {
  const { user, postId, type, emoji } = params;
  
  const reactionData = {
    postId,
    userUid: user.uid,
    userName: user.displayName || user.email || 'Anonymous',
    type,
    emoji,
    createdAt: serverTimestamp(),
  };
  
  const reactionsRef = collection(db, 'auraPosts', postId, 'reactions');
  await addDoc(reactionsRef, reactionData);
  
  // Update post like count
  const postRef = doc(getAuraPostsRef(), postId);
  await updateDoc(postRef, {
    likeCount: arrayUnion(user.uid),
  });
}

export async function addAuraReply(params: {
  user: User;
  postId: string;
  content: string;
  isPrivate?: boolean;
}): Promise<string> {
  const { user, postId, content, isPrivate = false } = params;
  
  const replyData = {
    postId,
    userUid: user.uid,
    userName: user.displayName || user.email || 'Anonymous',
    userAvatar: user.photoURL || undefined,
    content,
    isPrivate,
    createdAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(getAuraRepliesRef(postId), replyData);
  
  // Update post reply count
  const postRef = doc(getAuraPostsRef(), postId);
  await updateDoc(postRef, {
    replyCount: arrayUnion(user.uid),
  });
  
  return docRef.id;
}

// Friend Discovery Functions
export async function searchUsersByUsername(username: string): Promise<Array<{
  uid: string;
  name: string;
  username: string;
  avatar?: string;
  mutualFriends?: number;
}>> {
  try {
    const usersRef = collection(db, 'users');
    
    // Search by username first
    if (username.trim()) {
      const q = query(
        usersRef,
        where('username', '>=', username.toLowerCase()),
        where('username', '<=', username.toLowerCase() + '\uf8ff'),
        limit(10)
      );
      
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => ({
        uid: doc.id,
        name: doc.data().name || doc.data().email || 'Anonymous',
        username: doc.data().username || '',
        avatar: doc.data().avatar,
      })).filter(user => user.username); // Only return users with usernames
      
      if (results.length > 0) {
        return results;
      }
    }
    
    // If no username results, search by name or email
    const allUsersSnapshot = await getDocs(query(usersRef, limit(20)));
    const searchTerm = username.toLowerCase();
    
    return allUsersSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          name: data.name || data.email || 'Anonymous',
          username: data.username || data.email?.split('@')[0] || '',
          avatar: data.avatar,
          email: data.email,
        };
      })
      .filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.username.toLowerCase().includes(searchTerm) ||
        (user.email && user.email.toLowerCase().includes(searchTerm))
      )
      .slice(0, 10);
      
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

// Get all users for general discovery
export async function getAllUsersForDiscovery(currentUserUid: string): Promise<Array<{
  uid: string;
  name: string;
  username: string;
  avatar?: string;
  email?: string;
}>> {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(query(usersRef, limit(50)));
    
    return snapshot.docs
      .filter(doc => doc.id !== currentUserUid) // Exclude current user
      .map(doc => ({
        uid: doc.id,
        name: doc.data().name || doc.data().email || 'Anonymous',
        username: doc.data().username || doc.data().email?.split('@')[0] || `user${doc.id.slice(-4)}`,
        avatar: doc.data().avatar,
        email: doc.data().email,
      }));
  } catch (error) {
    console.error('Error getting users for discovery:', error);
    return [];
  }
}

export async function getFriendSuggestions(userUid: string): Promise<Array<{
  uid: string;
  name: string;
  username?: string;
  avatar?: string;
  mutualFriends: number;
  sharedInterests: string[];
  reason: string;
}>> {
  // Get user's friends and interests
  const [friendsSnapshot, userDoc] = await Promise.all([
    getDocs(getFriendsRef(userUid)),
    getDoc(doc(db, 'users', userUid)),
  ]);
  
  const userFriends = new Set(friendsSnapshot.docs.map(doc => doc.data().friendUid));
  const userInterests = userDoc.data()?.focusAreas || [];
  
  // Get friends of friends who aren't already friends
  const suggestions = new Map();
  
  for (const friendDoc of friendsSnapshot.docs) {
    const friendUid = friendDoc.data().friendUid;
    const friendsFriendsSnapshot = await getDocs(getFriendsRef(friendUid));
    
    for (const friendFriendDoc of friendsFriendsSnapshot.docs) {
      const candidateUid = friendFriendDoc.data().friendUid;
      
      // Skip if already friends or self
      if (userFriends.has(candidateUid) || candidateUid === userUid) {
        continue;
      }
      
      if (!suggestions.has(candidateUid)) {
        const candidateData = friendFriendDoc.data();
        suggestions.set(candidateUid, {
          uid: candidateUid,
          name: candidateData.friendName,
          username: candidateData.friendUsername,
          avatar: candidateData.friendAvatar,
          mutualFriends: 1,
          sharedInterests: [],
          reason: 'Mutual friends',
        });
      } else {
        suggestions.get(candidateUid).mutualFriends++;
      }
    }
  }
  
  // Add shared interests data (simplified - would need more complex analysis)
  return Array.from(suggestions.values()).slice(0, 10);
}

// Group Chat Functions
export async function createGroupChat(params: {
  user: User;
  name: string;
  description?: string;
  memberUids: string[];
  isPrivate?: boolean;
}): Promise<string> {
  const { user, name, description, memberUids, isPrivate = true } = params;
  
  const groupData = {
    name,
    description,
    createdBy: user.uid,
    members: [user.uid, ...memberUids],
    admins: [user.uid],
    isPrivate,
    createdAt: serverTimestamp(),
    lastActivity: serverTimestamp(),
    messageCount: 0,
  };
  
  const docRef = await addDoc(getGroupChatsRef(), groupData);
  return docRef.id;
}

export async function sendGroupMessage(params: {
  user: User;
  groupId: string;
  content: string;
  type?: 'text' | 'image' | 'video';
  file?: File;
  replyToPostId?: string;
}): Promise<string> {
  const { user, groupId, content, type = 'text', file, replyToPostId } = params;
  
  let mediaUrl: string | undefined;
  
  if (file && (type === 'image' || type === 'video')) {
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || '';
    const fileName = `group_${groupId}_${timestamp}.${extension}`;
    const storagePath = `group-messages/${groupId}/${fileName}`;
    
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    mediaUrl = await getDownloadURL(storageRef);
  }
  
  // Get a better display name
  const getDisplayName = () => {
    if (user.displayName && user.displayName.trim() && user.displayName !== 'Anonymous') {
      return user.displayName.trim();
    }
    if (user.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return `User ${user.uid.slice(-4)}`;
  };

  const messageData = {
    groupId,
    fromUid: user.uid,
    fromName: getDisplayName(),
    fromAvatar: user.photoURL || undefined,
    content,
    type,
    mediaUrl,
    replyToPostId,
    createdAt: serverTimestamp(),
    reactions: {},
  };
  
  const docRef = await addDoc(getGroupMessagesRef(groupId), messageData);
  
  // Update group last activity
  await updateDoc(doc(getGroupChatsRef(), groupId), {
    lastActivity: serverTimestamp(),
    messageCount: arrayUnion(docRef.id),
  });
  
  return docRef.id;
}

// Listen to real-time updates
export function listenToFriendRequests(userUid: string, callback: (requests: FriendRequest[]) => void) {
  const q = query(
    getFriendRequestsRef(userUid),
    where('toUid', '==', userUid),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as FriendRequest[];
    callback(requests);
  });
}

export function listenToAuraFeed(userUid: string, callback: (posts: AuraPost[]) => void) {
  return onSnapshot(
    query(
      getAuraPostsRef(),
      where('expiresAt', '>', Timestamp.now()),
      orderBy('createdAt', 'desc'),
      limit(20)
    ),
    (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AuraPost[];
      callback(posts);
    }
  );
}

export function listenToGroupMessages(groupId: string, callback: (messages: GroupMessage[]) => void) {
  const q = query(
    getGroupMessagesRef(groupId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as GroupMessage[];
    callback(messages.reverse());
  });
}