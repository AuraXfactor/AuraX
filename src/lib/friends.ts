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
function getFriendsCollection() {
  return collection(db, 'friends');
}

function buildFriendshipId(a: string, b: string) {
  return [a, b].sort().join('_');
}

export function getPostsRef() {
  return collection(db, 'posts');
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

  const friendshipId = buildFriendshipId(fromUser.uid, toUid);
  const requestRef = doc(getFriendsCollection(), friendshipId);
  await setDoc(requestRef, {
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
  });
  return friendshipId;
}

export async function acceptFriendRequest(params: {
  user: User;
  requestId: string;
  fromUid: string;
  fromUserName: string;
  fromUserAvatar?: string;
}): Promise<void> {
  const { user, requestId, fromUid, fromUserName, fromUserAvatar } = params;
  const friendshipId = buildFriendshipId(user.uid, fromUid);
  const friendshipRef = doc(getFriendsCollection(), friendshipId);
  await updateDoc(friendshipRef, {
    status: 'accepted',
    updatedAt: serverTimestamp(),
    // Denormalized names/avatars for both sides
    aUid: user.uid,
    bUid: fromUid,
    aName: user.displayName || user.email || 'Anonymous',
    aAvatar: user.photoURL || null,
    bName: fromUserName,
    bAvatar: fromUserAvatar || null,
  });
}

export async function declineFriendRequest(params: {
  user: User;
  requestId: string;
  fromUid: string;
}): Promise<void> {
  const { user, requestId, fromUid } = params;
  const friendshipId = buildFriendshipId(user.uid, fromUid);
  const friendshipRef = doc(getFriendsCollection(), friendshipId);
  await updateDoc(friendshipRef, {
    status: 'declined',
    updatedAt: serverTimestamp(),
  });
}

export async function removeFriend(params: {
  user: User;
  friendUid: string;
}): Promise<void> {
  const { user, friendUid } = params;
  const friendshipId = buildFriendshipId(user.uid, friendUid);
  await updateDoc(doc(getFriendsCollection(), friendshipId), {
    status: 'removed',
    updatedAt: serverTimestamp(),
  });
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
  const expiresAt = Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000);
  
  const postData = {
    kind: 'post' as const,
    authorId: user.uid,
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
  
  const docRef = await addDoc(getPostsRef(), postData);
  return docRef.id;
}

export async function getAuraFeed(params: {
  userUid: string;
  limitCount?: number;
}): Promise<AuraPost[]> {
  const { userUid, limitCount = 20 } = params;
  // For simplicity, show recent non-expired posts globally (kind == 'post')
  const q = query(
    getPostsRef(),
    where('kind', '==', 'post'),
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
  // Store reaction as a separate document in posts collection (allowed by rules)
  await addDoc(getPostsRef(), {
    kind: 'reaction',
    parentId: postId,
    userId: user.uid,
    userName: user.displayName || user.email || 'Anonymous',
    type,
    emoji,
    createdAt: serverTimestamp(),
  });
}

export async function addAuraReply(params: {
  user: User;
  postId: string;
  content: string;
  isPrivate?: boolean;
}): Promise<string> {
  const { user, postId, content, isPrivate = false } = params;
  const docRef = await addDoc(getPostsRef(), {
    kind: 'reply',
    parentId: postId,
    userId: user.uid,
    userName: user.displayName || user.email || 'Anonymous',
    userAvatar: user.photoURL || undefined,
    content,
    isPrivate,
    createdAt: serverTimestamp(),
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
  // Restricted by rules; searching other users' profiles is not allowed.
  return [];
}

// Get all users for general discovery
export async function getAllUsersForDiscovery(currentUserUid: string): Promise<Array<{
  uid: string;
  name: string;
  username: string;
  avatar?: string;
  email?: string;
}>> {
  // Not available under strict rules
  return [];
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
  // Build suggestions using global friends relationships
  const outgoing = await getDocs(query(getFriendsCollection(), where('fromUid', '==', userUid), where('status', '==', 'accepted')));
  const incoming = await getDocs(query(getFriendsCollection(), where('toUid', '==', userUid), where('status', '==', 'accepted')));
  const direct = new Set<string>();
  outgoing.docs.forEach(d => direct.add(d.data().toUid));
  incoming.docs.forEach(d => direct.add(d.data().fromUid));

  const suggestions = new Map<string, { uid: string; name: string; username?: string; avatar?: string; mutualFriends: number; sharedInterests: string[]; reason: string }>();

  for (const friendUid of Array.from(direct)) {
    const fo = await getDocs(query(getFriendsCollection(), where('fromUid', '==', friendUid), where('status', '==', 'accepted')));
    const fi = await getDocs(query(getFriendsCollection(), where('toUid', '==', friendUid), where('status', '==', 'accepted')));
    const fof = new Set<string>();
    fo.docs.forEach(d => fof.add(d.data().toUid));
    fi.docs.forEach(d => fof.add(d.data().fromUid));

    for (const candidate of Array.from(fof)) {
      if (candidate === userUid || direct.has(candidate)) continue;
      const id = buildFriendshipId(friendUid, candidate);
      // We rely on denormalized names stored when friendships were created
      const friendshipDoc = fo.docs.find(d => d.id === buildFriendshipId(friendUid, candidate)) || fi.docs.find(d => d.id === buildFriendshipId(friendUid, candidate));
      const name = (friendshipDoc?.data().bName || friendshipDoc?.data().aName || 'Friend') as string;
      const avatar = (friendshipDoc?.data().bAvatar || friendshipDoc?.data().aAvatar) as string | undefined;
      if (!suggestions.has(candidate)) {
        suggestions.set(candidate, {
          uid: candidate,
          name,
          username: undefined,
          avatar,
          mutualFriends: 1,
          sharedInterests: [],
          reason: 'Mutual friends',
        });
      } else {
        suggestions.get(candidate)!.mutualFriends += 1;
      }
    }
  }
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
  const q1 = query(getFriendsCollection(), where('toUid', '==', userUid), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
  return onSnapshot(q1, (snapshot) => {
    const requests = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<FriendRequest, 'id'>;
      return { id: docSnap.id, ...data } as FriendRequest;
    });
    callback(requests);
  });
}

export function listenToAuraFeed(userUid: string, callback: (posts: AuraPost[]) => void) {
  return onSnapshot(
    query(getPostsRef(), where('kind', '==', 'post'), where('expiresAt', '>', Timestamp.now()), orderBy('createdAt', 'desc'), limit(20)),
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