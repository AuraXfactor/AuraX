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
  setDoc,
  deleteDoc,
  startAfter,
  DocumentSnapshot,
  FieldValue,
} from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

// Enhanced Types for Comprehensive Social System
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export type PublicProfile = {
  userId: string;
  name: string;
  username?: string;
  bio?: string;
  avatar?: string;
  interests: string[];
  location?: string;
  isOnline: boolean;
  lastSeen: Timestamp | FieldValue | null;
  friendsCount: number;
  postsCount: number;
  joinedAt: Timestamp | FieldValue | null;
  focusAreas?: string[];
};

export type EnhancedFriendRequest = {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  createdAt: Timestamp | FieldValue | null;
  message?: string;
  fromProfile?: PublicProfile;
  toProfile?: PublicProfile;
};

export type Friendship = {
  id: string;
  userId: string;
  friendId: string;
  friendSince: Timestamp | FieldValue | null;
  lastInteraction?: Timestamp | FieldValue | null;
  mutualFriends?: number;
  sharedInterests?: string[];
  friendProfile?: PublicProfile;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  isPublic: boolean;
  members: { [userId: string]: boolean };
  admins: { [userId: string]: boolean };
  createdAt: Timestamp | FieldValue | null;
  memberCount: number;
  avatar?: string;
  tags?: string[];
  lastActivity?: Timestamp | FieldValue | null;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'system';
  timestamp: Timestamp | FieldValue | null;
  participants: { [userId: string]: boolean };
  mediaUrl?: string;
  readBy?: { [userId: string]: Timestamp | FieldValue };
  editedAt?: Timestamp | FieldValue | null;
  replyTo?: string;
};

export type SocialPost = {
  id: string;
  authorId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'achievement' | 'boost';
  mediaUrl?: string;
  visibility: 'friends' | 'public' | 'private';
  createdAt: Timestamp | FieldValue | null;
  updatedAt?: Timestamp | FieldValue | null;
  likes: string[];
  comments: number;
  shares: number;
  tags?: string[];
  mood?: string;
  location?: string;
  authorProfile?: PublicProfile;
};

export type PostComment = {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: Timestamp | FieldValue | null;
  likes: string[];
  replyTo?: string;
  authorProfile?: PublicProfile;
};

export type PostReaction = {
  id: string;
  postId: string;
  userId: string;
  type: 'like' | 'love' | 'support' | 'celebrate' | 'inspire';
  emoji: string;
  createdAt: Timestamp | FieldValue | null;
};

// Collection References
export function getPublicProfilesRef() {
  return collection(db, 'publicProfiles');
}

export function getFriendRequestsRef() {
  return collection(db, 'friendRequests');
}

export function getFriendsCollectionRef(userId: string) {
  return collection(db, 'friends', userId);
}

export function getFriendDocRef(userId: string, friendId: string) {
  return doc(db, 'friends', userId, friendId);
}

export function getGroupsRef() {
  return collection(db, 'groups');
}

export function getChatRef(chatId: string) {
  return collection(db, 'chats', chatId, 'messages');
}

export function getPostsRef() {
  return collection(db, 'posts');
}

export function getCommentsRef(postId: string) {
  return collection(db, 'posts', postId, 'comments');
}

// User Profile Management
export async function updateUserProfile(user: User, profileData: {
  name?: string;
  username?: string;
  bio?: string;
  interests?: string[];
  location?: string;
  isPublic?: boolean;
  focusAreas?: string[];
}): Promise<void> {
  const batch = writeBatch(db);
  
  // Update main user document
  const userRef = doc(db, 'users', user.uid);
  batch.update(userRef, {
    ...profileData,
    updatedAt: serverTimestamp(),
  });

  // Update public profile if user is public
  if (profileData.isPublic !== false) {
    const publicProfileRef = doc(getPublicProfilesRef(), user.uid);
    const publicData: Partial<PublicProfile> = {
      userId: user.uid,
      name: profileData.name || user.displayName || 'Anonymous',
      username: profileData.username,
      bio: profileData.bio,
      avatar: user.photoURL || undefined,
      interests: profileData.interests || [],
      location: profileData.location,
      focusAreas: profileData.focusAreas,
      isOnline: true,
      lastSeen: serverTimestamp(),
    };
    batch.set(publicProfileRef, publicData, { merge: true });
  }

  await batch.commit();
}

export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  try {
    const profileDoc = await getDoc(doc(getPublicProfilesRef(), userId));
    if (profileDoc.exists()) {
      const data = profileDoc.data();
      return {
        userId: profileDoc.id,
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
    }
    return null;
  } catch (error) {
    console.error('Error fetching public profile:', error);
    return null;
  }
}

// Friend Request System
export async function sendFriendRequest(params: {
  fromUser: User;
  toUserId: string;
  message?: string;
}): Promise<string> {
  const { fromUser, toUserId, message } = params;
  
  if (fromUser.uid === toUserId) {
    throw new Error('Cannot send friend request to yourself');
  }

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

  const requestData: Partial<EnhancedFriendRequest> = {
    fromUserId: fromUser.uid,
    toUserId,
    status: 'pending',
    message: message || '',
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(getFriendRequestsRef(), requestData);
  return docRef.id;
}

export async function respondToFriendRequest(params: {
  user: User;
  requestId: string;
  response: 'accepted' | 'rejected';
}): Promise<void> {
  const { user, requestId, response } = params;
  
  const batch = writeBatch(db);
  const requestRef = doc(getFriendRequestsRef(), requestId);
  
  // Update request status
  batch.update(requestRef, {
    status: response,
    updatedAt: serverTimestamp(),
  });

  if (response === 'accepted') {
    // Get request data to create friendship
    const requestDoc = await getDoc(requestRef);
    if (!requestDoc.exists()) {
      throw new Error('Friend request not found');
    }
    
    const requestData = requestDoc.data() as EnhancedFriendRequest;
    
    // Create bidirectional friendship
    const friendship1Ref = getFriendDocRef(user.uid, requestData.fromUserId);
    const friendship2Ref = getFriendDocRef(requestData.fromUserId, user.uid);
    
    const friendshipTimestamp = serverTimestamp();
    
    batch.set(friendship1Ref, {
      userId: user.uid,
      friendId: requestData.fromUserId,
      friendSince: friendshipTimestamp,
      lastInteraction: friendshipTimestamp,
    });

    batch.set(friendship2Ref, {
      userId: requestData.fromUserId,
      friendId: user.uid,
      friendSince: friendshipTimestamp,
      lastInteraction: friendshipTimestamp,
    });
  }

  await batch.commit();
}

// Friend Discovery and Search
export async function searchUsers(params: {
  query: string;
  currentUserId: string;
  limitCount?: number;
}): Promise<PublicProfile[]> {
  const { query: searchQuery, currentUserId, limitCount = 20 } = params;
  
  try {
    const searchTerm = searchQuery.toLowerCase().trim();
    
    if (!searchTerm) {
      // Return random public profiles
      const q = query(getPublicProfilesRef(), limit(limitCount));
      const snapshot = await getDocs(q);
      return snapshot.docs
        .filter(doc => doc.id !== currentUserId)
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
        });
    }

    // Search by username first
    const usernameQuery = query(
      getPublicProfilesRef(),
      where('username', '>=', searchTerm),
      where('username', '<=', searchTerm + '\uf8ff'),
      limit(limitCount)
    );
    
    const usernameSnapshot = await getDocs(usernameQuery);
    const usernameResults = usernameSnapshot.docs
      .filter(doc => doc.id !== currentUserId)
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
      });

    if (usernameResults.length > 0) {
      return usernameResults;
    }

    // Fallback to name search (client-side filtering due to Firestore limitations)
    const allProfilesQuery = query(getPublicProfilesRef(), limit(100));
    const allSnapshot = await getDocs(allProfilesQuery);
    
    return allSnapshot.docs
      .filter(doc => doc.id !== currentUserId)
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
      .filter(profile => 
        profile.name.toLowerCase().includes(searchTerm) ||
        profile.username?.toLowerCase().includes(searchTerm) ||
        profile.bio?.toLowerCase().includes(searchTerm)
      )
      .slice(0, limitCount);
      
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

export async function getFriendSuggestions(params: {
  userId: string;
  limitCount?: number;
}): Promise<PublicProfile[]> {
  const { userId, limitCount = 10 } = params;
  
  try {
    // Get user's interests and friends
    const [userDoc, friendsSnapshot] = await Promise.all([
      getDoc(doc(db, 'users', userId)),
      getDocs(getFriendsCollectionRef(userId))
    ]);
    
    const userInterests = userDoc.data()?.interests || [];
    const userFocusAreas = userDoc.data()?.focusAreas || [];
    const friendIds = new Set(friendsSnapshot.docs.map(doc => doc.id));
    
    // Get all public profiles and filter for suggestions
    const profilesQuery = query(getPublicProfilesRef(), limit(50));
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

// Friends Management
export async function getFriends(userId: string): Promise<Friendship[]> {
  try {
    const friendsSnapshot = await getDocs(
      query(getFriendsCollectionRef(userId), orderBy('friendSince', 'desc'))
    );
    
    const friends: Friendship[] = [];
    
    for (const friendDoc of friendsSnapshot.docs) {
      const friendData = friendDoc.data() as Friendship;
      const friendProfile = await getPublicProfile(friendData.friendId);
      
      friends.push({
        ...friendData,
        id: friendDoc.id,
        friendProfile: friendProfile || undefined,
      });
    }
    
    return friends;
  } catch (error) {
    console.error('Error getting friends:', error);
    return [];
  }
}

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

// Groups System
export async function createGroup(params: {
  user: User;
  name: string;
  description: string;
  isPublic: boolean;
  tags?: string[];
}): Promise<string> {
  const { user, name, description, isPublic, tags } = params;
  
  const groupData: Partial<Group> = {
    name,
    description,
    ownerId: user.uid,
    isPublic,
    members: { [user.uid]: true },
    admins: { [user.uid]: true },
    createdAt: serverTimestamp(),
    memberCount: 1,
    tags: tags || [],
    lastActivity: serverTimestamp(),
  };
  
  const docRef = await addDoc(getGroupsRef(), groupData);
  return docRef.id;
}

export async function joinGroup(params: {
  userId: string;
  groupId: string;
}): Promise<void> {
  const { userId, groupId } = params;
  
  const groupRef = doc(getGroupsRef(), groupId);
  await updateDoc(groupRef, {
    [`members.${userId}`]: true,
    memberCount: arrayUnion(userId),
    lastActivity: serverTimestamp(),
  });
}

export async function leaveGroup(params: {
  userId: string;
  groupId: string;
}): Promise<void> {
  const { userId, groupId } = params;
  
  const batch = writeBatch(db);
  const groupRef = doc(getGroupsRef(), groupId);
  
  // Remove from members and admins
  batch.update(groupRef, {
    [`members.${userId}`]: null,
    [`admins.${userId}`]: null,
    lastActivity: serverTimestamp(),
  });
  
  await batch.commit();
}

export async function getGroups(params: {
  userId?: string;
  isPublic?: boolean;
  limitCount?: number;
}): Promise<Group[]> {
  const { userId, isPublic, limitCount = 20 } = params;
  
  try {
    let q;
    
    if (userId) {
      // Get groups where user is a member
      q = query(
        getGroupsRef(),
        where(`members.${userId}`, '==', true),
        orderBy('lastActivity', 'desc'),
        limit(limitCount)
      );
    } else if (isPublic !== undefined) {
      q = query(
        getGroupsRef(),
        where('isPublic', '==', isPublic),
        orderBy('memberCount', 'desc'),
        limit(limitCount)
      );
    } else {
      q = query(
        getGroupsRef(),
        orderBy('memberCount', 'desc'),
        limit(limitCount)
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Group[];
    
  } catch (error) {
    console.error('Error getting groups:', error);
    return [];
  }
}

// Social Feed and Posts
export async function createPost(params: {
  user: User;
  content: string;
  type: 'text' | 'image' | 'video' | 'achievement' | 'boost';
  visibility: 'friends' | 'public' | 'private';
  file?: File;
  tags?: string[];
  mood?: string;
  location?: string;
}): Promise<string> {
  const { user, content, type, visibility, file, tags, mood, location } = params;
  
  let mediaUrl: string | undefined;
  
  // Upload media if provided
  if (file && (type === 'image' || type === 'video')) {
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || '';
    const fileName = `post_${user.uid}_${timestamp}.${extension}`;
    const storagePath = `posts/${user.uid}/${fileName}`;
    
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    mediaUrl = await getDownloadURL(storageRef);
  }
  
  const postData: Partial<SocialPost> = {
    authorId: user.uid,
    content,
    type,
    mediaUrl,
    visibility,
    createdAt: serverTimestamp(),
    likes: [],
    comments: 0,
    shares: 0,
    tags: tags || [],
    mood,
    location,
  };
  
  const docRef = await addDoc(getPostsRef(), postData);
  
  // Update user's post count in public profile
  const publicProfileRef = doc(getPublicProfilesRef(), user.uid);
  const profileDoc = await getDoc(publicProfileRef);
  if (profileDoc.exists()) {
    const currentCount = profileDoc.data().postsCount || 0;
    await updateDoc(publicProfileRef, {
      postsCount: currentCount + 1,
    });
  }
  
  return docRef.id;
}

export async function getSocialFeed(params: {
  userId: string;
  limitCount?: number;
  lastDoc?: DocumentSnapshot;
}): Promise<{ posts: SocialPost[], lastDoc?: DocumentSnapshot }> {
  const { userId, limitCount = 20, lastDoc } = params;
  
  try {
    // Get user's friends to filter feed
    const friendsSnapshot = await getDocs(getFriendsCollectionRef(userId));
    const friendIds = friendsSnapshot.docs.map(doc => doc.id);
    friendIds.push(userId); // Include user's own posts
    
    if (friendIds.length === 0) {
      return { posts: [] };
    }
    
    // Build query for posts from friends
    let q = query(
      getPostsRef(),
      where('authorId', 'in', friendIds.slice(0, 10)), // Firestore 'in' limit
      where('visibility', 'in', ['friends', 'public']),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    
    const snapshot = await getDocs(q);
    const posts: SocialPost[] = [];
    
    // Enhance posts with author profiles
    for (const postDoc of snapshot.docs) {
      const postData = postDoc.data() as SocialPost;
      const authorProfile = await getPublicProfile(postData.authorId);
      
      posts.push({
        ...postData,
        id: postDoc.id,
        authorProfile: authorProfile || undefined,
      });
    }
    
    return {
      posts,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
    };
    
  } catch (error) {
    console.error('Error getting social feed:', error);
    return { posts: [] };
  }
}

export async function likePost(params: {
  userId: string;
  postId: string;
}): Promise<void> {
  const { userId, postId } = params;
  
  const postRef = doc(getPostsRef(), postId);
  await updateDoc(postRef, {
    likes: arrayUnion(userId),
  });
}

export async function unlikePost(params: {
  userId: string;
  postId: string;
}): Promise<void> {
  const { userId, postId } = params;
  
  const postRef = doc(getPostsRef(), postId);
  const postDoc = await getDoc(postRef);
  
  if (postDoc.exists()) {
    const currentLikes = postDoc.data().likes || [];
    const updatedLikes = currentLikes.filter((id: string) => id !== userId);
    
    await updateDoc(postRef, {
      likes: updatedLikes,
    });
  }
}

// Real-time Listeners
export function listenToFriendRequests(userId: string, callback: (requests: EnhancedFriendRequest[]) => void) {
  const q = query(
    getFriendRequestsRef(),
    where('toUserId', '==', userId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, async (snapshot) => {
    const requests: EnhancedFriendRequest[] = [];
    
    for (const doc of snapshot.docs) {
      const requestData = doc.data() as EnhancedFriendRequest;
      const fromProfile = await getPublicProfile(requestData.fromUserId);
      
      requests.push({
        ...requestData,
        id: doc.id,
        fromProfile: fromProfile || undefined,
      });
    }
    
    callback(requests);
  });
}

export function listenToSocialFeed(userId: string, callback: (posts: SocialPost[]) => void) {
  // This is a simplified version - in production, you'd want to implement
  // a more sophisticated feed algorithm
  const q = query(
    getPostsRef(),
    where('visibility', 'in', ['friends', 'public']),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  
  return onSnapshot(q, async (snapshot) => {
    const posts: SocialPost[] = [];
    
    for (const postDoc of snapshot.docs) {
      const postData = postDoc.data() as SocialPost;
      const authorProfile = await getPublicProfile(postData.authorId);
      
      posts.push({
        ...postData,
        id: postDoc.id,
        authorProfile: authorProfile || undefined,
      });
    }
    
    callback(posts);
  });
}

// Chat System
export async function sendMessage(params: {
  user: User;
  chatId: string;
  content: string;
  type?: 'text' | 'image' | 'system';
  participants: string[];
  file?: File;
}): Promise<string> {
  const { user, chatId, content, type = 'text', participants, file } = params;
  
  let mediaUrl: string | undefined;
  
  if (file && type === 'image') {
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || '';
    const fileName = `chat_${chatId}_${timestamp}.${extension}`;
    const storagePath = `chats/${chatId}/${fileName}`;
    
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    mediaUrl = await getDownloadURL(storageRef);
  }
  
  const participantsMap = participants.reduce((acc, userId) => {
    acc[userId] = true;
    return acc;
  }, {} as { [key: string]: boolean });
  
  const messageData: Partial<ChatMessage> = {
    senderId: user.uid,
    content,
    type,
    timestamp: serverTimestamp(),
    participants: participantsMap,
    mediaUrl,
    readBy: { [user.uid]: serverTimestamp() },
  };
  
  const docRef = await addDoc(getChatRef(chatId), messageData);
  return docRef.id;
}

export function listenToChatMessages(chatId: string, callback: (messages: ChatMessage[]) => void) {
  const q = query(
    getChatRef(chatId),
    orderBy('timestamp', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ChatMessage[];
    
    callback(messages.reverse());
  });
}