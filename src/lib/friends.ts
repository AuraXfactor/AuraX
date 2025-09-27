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
  deleteField,
} from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

// Types for Friends System
export type FriendshipStatus = 'pending' | 'accepted' | 'rejected';

export type FriendRequest = {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendshipStatus;
  createdAt: Timestamp | null;
  message?: string;
  fromUserName?: string;
  fromUserAvatar?: string;
  toUserName?: string;
  toUserAvatar?: string;
};

export type Friendship = {
  id: string;
  friendSince: Timestamp | null;
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

export type Group = {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  isPublic: boolean;
  members: { [userId: string]: boolean };
  admins: { [userId: string]: boolean };
  avatar?: string;
  createdAt: Timestamp | null;
  memberCount?: number;
  challengeCount?: number;
  tags?: string[];
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
export function getFriendRequestsRef() {
  return collection(db, 'friendRequests');
}

export function getFriendsRef(userId: string) {
  return collection(db, 'friends', userId);
}

export function getAuraPostsRef() {
  return collection(db, 'auraPosts');
}

export function getAuraRepliesRef(postId: string) {
  return collection(db, 'auraPosts', postId, 'replies');
}

export function getGroupsRef() {
  return collection(db, 'groups');
}

export function getGroupMembersRef(groupId: string) {
  return collection(db, 'groupMembers', groupId);
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

  // Check if request already exists
  const existingRequestQuery = query(
    getFriendRequestsRef(),
    where('fromUserId', '==', fromUser.uid),
    where('toUserId', '==', toUid),
    where('status', '==', 'pending')
  );
  
  const existingSnapshot = await getDocs(existingRequestQuery);
  if (!existingSnapshot.empty) {
    throw new Error('Friend request already sent');
  }

  // Check if they're already friends
  const friendshipRef = doc(getFriendsRef(fromUser.uid), toUid);
  const friendshipDoc = await getDoc(friendshipRef);
  if (friendshipDoc.exists()) {
    throw new Error('Already friends with this user');
  }
  
  const requestData = {
    fromUserId: fromUser.uid,
    toUserId: toUid,
    status: 'pending' as FriendshipStatus,
    message: message || '',
    fromUserName: fromUser.displayName || fromUser.email || 'Anonymous',
    fromUserAvatar: fromUser.photoURL || undefined,
    toUserName,
    toUserAvatar,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(getFriendRequestsRef(), requestData);
  return docRef.id;
}

export async function acceptFriendRequest(params: {
  user: User;
  requestId: string;
  fromUid: string;
  fromUserName: string;
  fromUserAvatar?: string;
}): Promise<void> {
  const { user, requestId, fromUid } = params;
  
  const batch = writeBatch(db);
  
  // Update request status to accepted
  const requestRef = doc(getFriendRequestsRef(), requestId);
  batch.update(requestRef, {
    status: 'accepted',
  });

  // Create bidirectional friendship records
  const friendshipTimestamp = serverTimestamp();
  
  const userFriendRef = doc(getFriendsRef(user.uid), fromUid);
  const senderFriendRef = doc(getFriendsRef(fromUid), user.uid);
  
  batch.set(userFriendRef, {
    friendSince: friendshipTimestamp,
    lastInteraction: friendshipTimestamp,
  });

  batch.set(senderFriendRef, {
    friendSince: friendshipTimestamp,
    lastInteraction: friendshipTimestamp,
  });

  await batch.commit();
}

export async function declineFriendRequest(params: {
  user: User;
  requestId: string;
  fromUid: string;
}): Promise<void> {
  const { requestId } = params;
  
  // Update request status to rejected
  const requestRef = doc(getFriendRequestsRef(), requestId);
  await updateDoc(requestRef, {
    status: 'rejected',
  });
}

export async function removeFriend(params: {
  user: User;
  friendUid: string;
}): Promise<void> {
  const { user, friendUid } = params;
  
  const batch = writeBatch(db);
  
  // Remove bidirectional friendship records
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
  bio?: string;
  interests?: string[];
  mutualFriends?: number;
}>> {
  try {
    // First search in public profiles for better performance
    const publicProfilesRef = collection(db, 'publicProfiles');
    const publicSnapshot = await getDocs(query(publicProfilesRef, limit(20)));
    
    const searchTerm = username.toLowerCase();
    const publicResults = publicSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          name: data.name || 'Anonymous',
          username: data.username || '',
          avatar: data.avatar,
          bio: data.bio,
          interests: data.interests || [],
          isDeleted: data.isDeleted,
        };
      })
      .filter(user => 
        !user.isDeleted &&
        (user.name.toLowerCase().includes(searchTerm) ||
         user.username.toLowerCase().includes(searchTerm) ||
         (user.bio && user.bio.toLowerCase().includes(searchTerm)))
      )
      .slice(0, 10);
    
    if (publicResults.length > 0) {
      return publicResults;
    }
    
    // Fallback to searching all users if no public profiles found
    const usersRef = collection(db, 'users');
    const allUsersSnapshot = await getDocs(query(usersRef, limit(20)));
    
    return allUsersSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          name: data.name || data.email || 'Anonymous',
          username: data.username || data.email?.split('@')[0] || '',
          avatar: data.avatar,
          bio: data.bio || '',
          interests: data.interests || [],
        };
      })
      .filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.username.toLowerCase().includes(searchTerm) ||
        user.bio.toLowerCase().includes(searchTerm)
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
  bio?: string;
  interests?: string[];
}>> {
  try {
    // Prioritize public profiles for discovery
    const publicProfilesRef = collection(db, 'publicProfiles');
    const publicSnapshot = await getDocs(query(publicProfilesRef, limit(30)));
    
    const publicResults = publicSnapshot.docs
      .filter(doc => {
        const data = doc.data();
        return doc.id !== currentUserUid && !data.isDeleted;
      })
      .map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          name: data.name || 'Anonymous',
          username: data.username || `user${doc.id.slice(-4)}`,
          avatar: data.avatar,
          bio: data.bio,
          interests: data.interests || [],
        };
      });

    if (publicResults.length >= 10) {
      return publicResults;
    }

    // Supplement with other users if needed
    const usersRef = collection(db, 'users');
    const allSnapshot = await getDocs(query(usersRef, limit(20)));
    
    const additionalResults = allSnapshot.docs
      .filter(doc => 
        doc.id !== currentUserUid && 
        !publicResults.some(p => p.uid === doc.id)
      )
      .map(doc => ({
        uid: doc.id,
        name: doc.data().name || doc.data().email || 'Anonymous',
        username: doc.data().username || doc.data().email?.split('@')[0] || `user${doc.id.slice(-4)}`,
        avatar: doc.data().avatar,
        bio: doc.data().bio || '',
        interests: doc.data().interests || [],
      }));

    return [...publicResults, ...additionalResults].slice(0, 30);
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
  bio?: string;
  mutualFriends: number;
  sharedInterests: string[];
  reason: string;
}>> {
  try {
    // Get user's friends and interests
    const [friendsSnapshot, userDoc] = await Promise.all([
      getDocs(getFriendsRef(userUid)),
      getDoc(doc(db, 'users', userUid)),
    ]);
    
    const userFriends = new Set(friendsSnapshot.docs.map(doc => doc.id));
    const userInterests = userDoc.data()?.interests || userDoc.data()?.focusAreas || [];
    
    // Get friends of friends who aren't already friends
    const suggestions = new Map();
    
    for (const friendDoc of friendsSnapshot.docs) {
      const friendUid = friendDoc.id;
      const friendsFriendsSnapshot = await getDocs(getFriendsRef(friendUid));
      
      for (const friendFriendDoc of friendsFriendsSnapshot.docs) {
        const candidateUid = friendFriendDoc.id;
        
        // Skip if already friends or self
        if (userFriends.has(candidateUid) || candidateUid === userUid) {
          continue;
        }
        
        if (!suggestions.has(candidateUid)) {
          // Get candidate's profile data
          const candidateDoc = await getDoc(doc(db, 'users', candidateUid));
          const candidateData = candidateDoc.data();
          
          if (candidateData) {
            const candidateInterests = candidateData.interests || candidateData.focusAreas || [];
            const sharedInterests = userInterests.filter((interest: string) => 
              candidateInterests.includes(interest)
            );
            
            suggestions.set(candidateUid, {
              uid: candidateUid,
              name: candidateData.name || 'Anonymous',
              username: candidateData.username,
              avatar: candidateData.avatar,
              bio: candidateData.bio,
              mutualFriends: 1,
              sharedInterests,
              reason: sharedInterests.length > 0 ? 'Shared interests' : 'Mutual friends',
            });
          }
        } else {
          suggestions.get(candidateUid).mutualFriends++;
        }
      }
    }
    
    // Add interest-based suggestions from public profiles
    const publicProfilesSnapshot = await getDocs(collection(db, 'publicProfiles'));
    
    for (const profileDoc of publicProfilesSnapshot.docs) {
      const profileData = profileDoc.data();
      const profileUid = profileDoc.id;
      
      if (profileData.isDeleted || userFriends.has(profileUid) || profileUid === userUid) {
        continue;
      }
      
      const profileInterests = profileData.interests || [];
      const sharedInterests = userInterests.filter((interest: string) => 
        profileInterests.includes(interest)
      );
      
      if (sharedInterests.length >= 2 && !suggestions.has(profileUid)) {
        suggestions.set(profileUid, {
          uid: profileUid,
          name: profileData.name || 'Anonymous',
          username: profileData.username,
          avatar: profileData.avatar,
          bio: profileData.bio,
          mutualFriends: 0,
          sharedInterests,
          reason: 'Shared interests',
        });
      }
    }
    
    // Sort by mutual friends count and shared interests
    return Array.from(suggestions.values())
      .sort((a, b) => {
        const scoreA = a.mutualFriends * 2 + a.sharedInterests.length;
        const scoreB = b.mutualFriends * 2 + b.sharedInterests.length;
        return scoreB - scoreA;
      })
      .slice(0, 10);
      
  } catch (error) {
    console.error('Error getting friend suggestions:', error);
    return [];
  }
}

// Groups System Functions
export async function createGroup(params: {
  user: User;
  name: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
}): Promise<string> {
  const { user, name, description, isPublic = false, tags = [] } = params;
  
  const groupData = {
    name,
    description,
    ownerId: user.uid,
    isPublic,
    members: { [user.uid]: true },
    admins: { [user.uid]: true },
    tags,
    createdAt: serverTimestamp(),
    memberCount: 1,
    challengeCount: 0,
  };
  
  const docRef = await addDoc(getGroupsRef(), groupData);
  
  // Add creator to group members subcollection
  await setDoc(doc(getGroupMembersRef(docRef.id), user.uid), {
    joinedAt: serverTimestamp(),
    role: 'owner',
    invitedBy: user.uid,
  });
  
  return docRef.id;
}

export async function joinGroup(params: {
  user: User;
  groupId: string;
}): Promise<void> {
  const { user, groupId } = params;
  
  const groupRef = doc(getGroupsRef(), groupId);
  const groupDoc = await getDoc(groupRef);
  
  if (!groupDoc.exists()) {
    throw new Error('Group not found');
  }
  
  const groupData = groupDoc.data() as Group;
  
  // Check if group is public or user is invited
  if (!groupData.isPublic) {
    throw new Error('Cannot join private group without invitation');
  }
  
  // Check if already a member
  if (groupData.members[user.uid]) {
    throw new Error('Already a member of this group');
  }
  
  const batch = writeBatch(db);
  
  // Add user to group members
  batch.update(groupRef, {
    [`members.${user.uid}`]: true,
    memberCount: (groupData.memberCount || 0) + 1,
  });
  
  // Add member to subcollection
  batch.set(doc(getGroupMembersRef(groupId), user.uid), {
    joinedAt: serverTimestamp(),
    role: 'member',
    invitedBy: null,
  });
  
  await batch.commit();
}

export async function leaveGroup(params: {
  user: User;
  groupId: string;
}): Promise<void> {
  const { user, groupId } = params;
  
  const groupRef = doc(getGroupsRef(), groupId);
  const groupDoc = await getDoc(groupRef);
  
  if (!groupDoc.exists()) {
    throw new Error('Group not found');
  }
  
  const groupData = groupDoc.data() as Group;
  
  // Check if user is the owner
  if (groupData.ownerId === user.uid) {
    throw new Error('Owner cannot leave group. Transfer ownership or delete group first.');
  }
  
  const batch = writeBatch(db);
  
  // Remove user from group members
  const updateData: Record<string, unknown> = {
    memberCount: Math.max((groupData.memberCount || 1) - 1, 0),
  };
  updateData[`members.${user.uid}`] = deleteField();
  if (groupData.admins[user.uid]) {
    updateData[`admins.${user.uid}`] = deleteField();
  }
  
  batch.update(groupRef, updateData);
  
  // Remove member from subcollection
  batch.delete(doc(getGroupMembersRef(groupId), user.uid));
  
  await batch.commit();
}

export async function inviteToGroup(params: {
  user: User;
  groupId: string;
  inviteUserId: string;
}): Promise<void> {
  const { user, groupId, inviteUserId } = params;
  
  const groupRef = doc(getGroupsRef(), groupId);
  const groupDoc = await getDoc(groupRef);
  
  if (!groupDoc.exists()) {
    throw new Error('Group not found');
  }
  
  const groupData = groupDoc.data() as Group;
  
  // Check if user has permission to invite (admin or owner)
  if (!groupData.admins[user.uid] && groupData.ownerId !== user.uid) {
    throw new Error('Only admins can invite members');
  }
  
  // Check if invitee is already a member
  if (groupData.members[inviteUserId]) {
    throw new Error('User is already a member');
  }
  
  // Check if users are friends (optional restriction)
  const areFriendsResult = await areFriends(user.uid, inviteUserId);
  if (!areFriendsResult) {
    throw new Error('Can only invite friends to groups');
  }
  
  const batch = writeBatch(db);
  
  // Add user to group members
  batch.update(groupRef, {
    [`members.${inviteUserId}`]: true,
    memberCount: (groupData.memberCount || 0) + 1,
  });
  
  // Add member to subcollection
  batch.set(doc(getGroupMembersRef(groupId), inviteUserId), {
    joinedAt: serverTimestamp(),
    role: 'member',
    invitedBy: user.uid,
  });
  
  await batch.commit();
}

export async function updateGroupRole(params: {
  user: User;
  groupId: string;
  targetUserId: string;
  newRole: 'member' | 'admin';
}): Promise<void> {
  const { user, groupId, targetUserId, newRole } = params;
  
  const groupRef = doc(getGroupsRef(), groupId);
  const groupDoc = await getDoc(groupRef);
  
  if (!groupDoc.exists()) {
    throw new Error('Group not found');
  }
  
  const groupData = groupDoc.data() as Group;
  
  // Check if user is owner
  if (groupData.ownerId !== user.uid) {
    throw new Error('Only group owner can change member roles');
  }
  
  // Cannot change owner's role
  if (targetUserId === user.uid) {
    throw new Error('Cannot change owner role');
  }
  
  const batch = writeBatch(db);
  
  if (newRole === 'admin') {
    batch.update(groupRef, {
      [`admins.${targetUserId}`]: true,
    });
  } else {
    const updateData: Record<string, unknown> = {};
    updateData[`admins.${targetUserId}`] = deleteField();
    batch.update(groupRef, updateData);
  }
  
  // Update member subcollection
  batch.update(doc(getGroupMembersRef(groupId), targetUserId), {
    role: newRole,
    updatedAt: serverTimestamp(),
  });
  
  await batch.commit();
}

export async function searchGroups(searchTerm: string, limit: number = 10): Promise<Group[]> {
  try {
    const groupsRef = getGroupsRef();
    const snapshot = await getDocs(query(groupsRef, where('isPublic', '==', true)));
    
    const searchTermLower = searchTerm.toLowerCase();
    const results = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Group))
      .filter(group => 
        group.name.toLowerCase().includes(searchTermLower) ||
        (group.description && group.description.toLowerCase().includes(searchTermLower)) ||
        (group.tags && group.tags.some(tag => tag.toLowerCase().includes(searchTermLower)))
      )
      .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
      .slice(0, limit);
      
    return results;
  } catch (error) {
    console.error('Error searching groups:', error);
    return [];
  }
}

export async function getUserGroups(userUid: string): Promise<Group[]> {
  try {
    const groupsRef = getGroupsRef();
    const snapshot = await getDocs(query(groupsRef, where(`members.${userUid}`, '==', true)));
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
  } catch (error) {
    console.error('Error getting user groups:', error);
    return [];
  }
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
  
  const messageData = {
    groupId,
    fromUid: user.uid,
    fromName: user.displayName || user.email || 'Anonymous',
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
    getFriendRequestsRef(),
    where('toUserId', '==', userUid),
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

export function listenToSentFriendRequests(userUid: string, callback: (requests: FriendRequest[]) => void) {
  const q = query(
    getFriendRequestsRef(),
    where('fromUserId', '==', userUid),
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

export function listenToFriends(userUid: string, callback: (friends: Array<{ uid: string; [key: string]: unknown }>) => void) {
  const q = query(
    getFriendsRef(userUid),
    orderBy('friendSince', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const friends = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    }));
    callback(friends);
  });
}

// Get enriched friends list with user data
export async function getEnrichedFriendsList(userUid: string): Promise<Array<{
  uid: string;
  name: string;
  username?: string;
  avatar?: string;
  bio?: string;
  friendSince: Timestamp | null;
  lastInteraction?: Timestamp | null;
  isOnline?: boolean;
  mutualFriends?: number;
}>> {
  try {
    const friendsSnapshot = await getDocs(getFriendsRef(userUid));
    const enrichedFriends = [];
    
    for (const friendDoc of friendsSnapshot.docs) {
      const friendUid = friendDoc.id;
      const friendshipData = friendDoc.data();
      
      // Get friend's profile data
      const friendProfileDoc = await getDoc(doc(db, 'users', friendUid));
      
      if (friendProfileDoc.exists()) {
        const profileData = friendProfileDoc.data();
        
        enrichedFriends.push({
          uid: friendUid,
          name: profileData.name || 'Anonymous',
          username: profileData.username,
          avatar: profileData.avatar,
          bio: profileData.bio,
          friendSince: friendshipData.friendSince,
          lastInteraction: friendshipData.lastInteraction,
          isOnline: profileData.lastLogin && 
            profileData.lastLogin.toDate() > new Date(Date.now() - 15 * 60 * 1000), // Online if active in last 15 minutes
        });
      }
    }
    
    return enrichedFriends.sort((a, b) => {
      // Sort by online status first, then by last interaction
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      
      const aTime = a.lastInteraction?.toDate() || a.friendSince?.toDate() || new Date(0);
      const bTime = b.lastInteraction?.toDate() || b.friendSince?.toDate() || new Date(0);
      return bTime.getTime() - aTime.getTime();
    });
    
  } catch (error) {
    console.error('Error getting enriched friends list:', error);
    return [];
  }
}

// Update last interaction timestamp between friends
export async function updateFriendInteraction(userUid: string, friendUid: string) {
  try {
    const batch = writeBatch(db);
    const timestamp = serverTimestamp();
    
    const userFriendRef = doc(getFriendsRef(userUid), friendUid);
    const friendUserRef = doc(getFriendsRef(friendUid), userUid);
    
    batch.update(userFriendRef, { lastInteraction: timestamp });
    batch.update(friendUserRef, { lastInteraction: timestamp });
    
    await batch.commit();
  } catch (error) {
    console.error('Error updating friend interaction:', error);
  }
}

// Check if two users are friends
export async function areFriends(userUid: string, friendUid: string): Promise<boolean> {
  try {
    const friendshipDoc = await getDoc(doc(getFriendsRef(userUid), friendUid));
    return friendshipDoc.exists();
  } catch (error) {
    console.error('Error checking friendship status:', error);
    return false;
  }
}

// Get mutual friends between two users
export async function getMutualFriends(userUid: string, otherUserUid: string): Promise<Array<{
  uid: string;
  name: string;
  avatar?: string;
}>> {
  try {
    const [userFriendsSnapshot, otherUserFriendsSnapshot] = await Promise.all([
      getDocs(getFriendsRef(userUid)),
      getDocs(getFriendsRef(otherUserUid))
    ]);
    
    const userFriends = new Set(userFriendsSnapshot.docs.map(doc => doc.id));
    const mutualFriendUids = otherUserFriendsSnapshot.docs
      .map(doc => doc.id)
      .filter(uid => userFriends.has(uid));
    
    const mutualFriends = [];
    for (const mutualUid of mutualFriendUids) {
      const userDoc = await getDoc(doc(db, 'users', mutualUid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        mutualFriends.push({
          uid: mutualUid,
          name: userData.name || 'Anonymous',
          avatar: userData.avatar,
        });
      }
    }
    
    return mutualFriends.slice(0, 10); // Limit to 10 mutual friends
  } catch (error) {
    console.error('Error getting mutual friends:', error);
    return [];
  }
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