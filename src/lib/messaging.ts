// AuraX Comprehensive Messaging System
// Supports: Direct Messages, Group Chats, Post Comments, Reactions, E2E Encryption

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
  setDoc,
  deleteDoc,
  Timestamp,
  FieldValue,
  writeBatch,
  where,
  limit,
  startAfter,
  DocumentSnapshot,
  getDocs,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { ChatEncryption } from '@/utils/encryption';
import { getPublicProfile, PublicProfile } from '@/lib/socialSystem';

// ===== TYPES =====

export type MessageType = 'text' | 'image' | 'voice' | 'file' | 'system' | 'sticker';
export type ChatType = 'direct' | 'group';
export type ReactionType = 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry' | 'celebrate' | 'support';

export interface ChatParticipant {
  userId: string;
  role: 'admin' | 'member' | 'owner';
  joinedAt: Timestamp | FieldValue;
  lastSeen?: Timestamp | FieldValue;
  isTyping?: boolean;
  isMuted?: boolean;
  profile?: PublicProfile;
}

export interface Chat {
  id: string;
  type: ChatType;
  name?: string; // For group chats
  description?: string; // For group chats
  avatar?: string; // For group chats
  participants: { [userId: string]: ChatParticipant };
  createdBy: string;
  createdAt: Timestamp | FieldValue;
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: Timestamp | FieldValue;
    type: MessageType;
  };
  lastActivity: Timestamp | FieldValue;
  messageCount: number;
  isEncrypted: boolean;
  encryptionKey?: string; // Stored encrypted per participant
  settings: {
    allowInvites: boolean;
    showTypingIndicators: boolean;
    allowReactions: boolean;
    autoDeleteMessages: boolean;
    autoDeleteDays?: number;
  };
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  content: string; // Encrypted if chat is encrypted
  encryptionIV?: string; // For E2E encryption
  mediaUrl?: string;
  mediaType?: string;
  fileName?: string;
  fileSize?: number;
  timestamp: Timestamp | FieldValue;
  editedAt?: Timestamp | FieldValue;
  replyTo?: string; // Reference to another message ID
  reactions: { [userId: string]: ReactionType };
  readBy: { [userId: string]: Timestamp | FieldValue };
  deliveredTo: { [userId: string]: Timestamp | FieldValue };
  metadata?: {
    mentions?: string[]; // User IDs mentioned in message
    links?: string[]; // Extracted URLs
    duration?: number; // For voice messages
    dimensions?: { width: number; height: number }; // For images
  };
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentCommentId?: string; // For nested comments/replies
  timestamp: Timestamp | FieldValue;
  editedAt?: Timestamp | FieldValue;
  reactions: { [userId: string]: ReactionType };
  likesCount: number;
  repliesCount: number;
  authorProfile?: PublicProfile;
  isDeleted?: boolean;
  deletedAt?: Timestamp | FieldValue;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  type: ReactionType;
  emoji: string;
  timestamp: Timestamp | FieldValue;
}

export interface TypingIndicator {
  userId: string;
  isTyping: boolean;
  lastUpdated: Timestamp | FieldValue;
}

// ===== COLLECTION REFERENCES =====

export const getChatsRef = () => collection(db, 'chats');
export const getChatRef = (chatId: string) => doc(db, 'chats', chatId);
export const getMessagesRef = (chatId: string) => collection(db, 'chats', chatId, 'messages');
export const getMessageRef = (chatId: string, messageId: string) => doc(db, 'chats', chatId, 'messages', messageId);
export const getReactionsRef = (chatId: string, messageId: string) => collection(db, 'chats', chatId, 'messages', messageId, 'reactions');
export const getTypingRef = (chatId: string) => collection(db, 'chats', chatId, 'typing');
export const getCommentsRef = (postId: string) => collection(db, 'posts', postId, 'comments');
export const getCommentRef = (postId: string, commentId: string) => doc(db, 'posts', postId, 'comments', commentId);

// ===== CHAT MANAGEMENT =====

export async function createDirectChat(
  currentUserId: string,
  otherUserId: string
): Promise<string> {
  console.log('🔄 Creating direct chat...', { currentUserId, otherUserId });
  
  // Generate deterministic chat ID for 1-to-1 chats
  const chatId = ChatEncryption.generateChatId(currentUserId, otherUserId);
  const chatRef = getChatRef(chatId);
  
  try {
    // Check if chat already exists
    const existingChat = await getDoc(chatRef);
    if (existingChat.exists()) {
      console.log('✅ Direct chat already exists', { chatId });
      return chatId;
    }
    
    // Load participant profiles
    const [currentProfile, otherProfile] = await Promise.all([
      getPublicProfile(currentUserId),
      getPublicProfile(otherUserId)
    ]);
    
    const chatData: Partial<Chat> = {
      id: chatId,
      type: 'direct',
      participants: {
        [currentUserId]: {
          userId: currentUserId,
          role: 'member',
          joinedAt: serverTimestamp(),
          ...(currentProfile && { profile: currentProfile }),
        },
        [otherUserId]: {
          userId: otherUserId,
          role: 'member',
          joinedAt: serverTimestamp(),
          ...(otherProfile && { profile: otherProfile }),
        },
      },
      createdBy: currentUserId,
      createdAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
      messageCount: 0,
      isEncrypted: true,
      settings: {
        allowInvites: false, // Direct chats don't allow invites
        showTypingIndicators: true,
        allowReactions: true,
        autoDeleteMessages: false,
      },
    };
    
    await setDoc(chatRef, chatData);
    console.log('✅ Direct chat created successfully', { chatId });
    
    return chatId;
  } catch (error) {
    console.error('❌ Error creating direct chat:', error);
    throw error;
  }
}

export async function createGroupChat(params: {
  creatorId: string;
  name: string;
  description?: string;
  participantIds: string[];
  isEncrypted?: boolean;
  avatar?: File;
}): Promise<string> {
  const { creatorId, name, description, participantIds, isEncrypted = true, avatar } = params;
  
  console.log('🔄 Creating group chat...', { 
    creatorId, 
    name, 
    participantCount: participantIds.length 
  });
  
  try {
    let avatarUrl: string | undefined;
    
    // Upload avatar if provided
    if (avatar) {
      const timestamp = Date.now();
      const extension = avatar.name.split('.').pop() || 'jpg';
      const fileName = `group_avatar_${timestamp}.${extension}`;
      const storagePath = `group-avatars/${fileName}`;
      
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, avatar);
      avatarUrl = await getDownloadURL(storageRef);
    }
    
    // Load all participant profiles
    const participantProfiles = await Promise.all(
      [creatorId, ...participantIds].map(id => getPublicProfile(id))
    );
    
    // Build participants object
    const participants: { [userId: string]: ChatParticipant } = {};
    [creatorId, ...participantIds].forEach((userId, index) => {
      const profile = participantProfiles[index];
      participants[userId] = {
        userId,
        role: userId === creatorId ? 'owner' : 'member',
        joinedAt: serverTimestamp(),
        ...(profile && { profile }),
      };
    });
    
    const chatData: Partial<Chat> = {
      type: 'group',
      name,
      description,
      avatar: avatarUrl,
      participants,
      createdBy: creatorId,
      createdAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
      messageCount: 0,
      isEncrypted,
      settings: {
        allowInvites: true,
        showTypingIndicators: true,
        allowReactions: true,
        autoDeleteMessages: false,
      },
    };
    
    const docRef = await addDoc(getChatsRef(), chatData);
    console.log('✅ Group chat created successfully', { chatId: docRef.id });
    
    // Send system message about group creation
    await sendMessage({
      chatId: docRef.id,
      senderId: creatorId,
      content: `${participantProfiles[0]?.name || 'Someone'} created the group "${name}"`,
      type: 'system',
    });
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating group chat:', error);
    throw error;
  }
}

export async function addParticipantsToGroup(params: {
  chatId: string;
  addedBy: string;
  participantIds: string[];
}): Promise<void> {
  const { chatId, addedBy, participantIds } = params;
  
  console.log('👥 Adding participants to group...', { 
    chatId, 
    addedBy, 
    participantCount: participantIds.length 
  });
  
  try {
    const chatRef = getChatRef(chatId);
    const chatDoc = await getDoc(chatRef);
    
    if (!chatDoc.exists()) {
      throw new Error('Chat not found');
    }
    
    const chatData = chatDoc.data() as Chat;
    
    // Verify user has permission to add participants
    const adderRole = chatData.participants[addedBy]?.role;
    if (!adderRole || (adderRole !== 'owner' && adderRole !== 'admin')) {
      throw new Error('Insufficient permissions to add participants');
    }
    
    // Load profiles for new participants
    const profiles = await Promise.all(
      participantIds.map(id => getPublicProfile(id))
    );
    
    const batch = writeBatch(db);
    
    // Add each participant
    participantIds.forEach((userId, index) => {
      if (!chatData.participants[userId]) {
        const profile = profiles[index];
        const participantData: ChatParticipant = {
          userId,
          role: 'member',
          joinedAt: serverTimestamp(),
          ...(profile && { profile }),
        };
        
        batch.update(chatRef, {
          [`participants.${userId}`]: participantData,
          lastActivity: serverTimestamp(),
        });
      }
    });
    
    await batch.commit();
    
    // Send system message about added participants
    const adderProfile = await getPublicProfile(addedBy);
    const addedNames = profiles.map(p => p?.name || 'Unknown').join(', ');
    
    await sendMessage({
      chatId,
      senderId: addedBy,
      content: `${adderProfile?.name || 'Someone'} added ${addedNames} to the group`,
      type: 'system',
    });
    
    console.log('✅ Participants added successfully');
  } catch (error) {
    console.error('❌ Error adding participants:', error);
    throw error;
  }
}

export async function removeParticipantFromGroup(params: {
  chatId: string;
  removedBy: string;
  participantId: string;
}): Promise<void> {
  const { chatId, removedBy, participantId } = params;
  
  console.log('👤 Removing participant from group...', { 
    chatId, 
    removedBy, 
    participantId 
  });
  
  try {
    const chatRef = getChatRef(chatId);
    const chatDoc = await getDoc(chatRef);
    
    if (!chatDoc.exists()) {
      throw new Error('Chat not found');
    }
    
    const chatData = chatDoc.data() as Chat;
    
    // Verify permissions
    const removerRole = chatData.participants[removedBy]?.role;
    const targetRole = chatData.participants[participantId]?.role;
    
    if (removedBy !== participantId) { // If not self-removal
      if (!removerRole || (removerRole !== 'owner' && removerRole !== 'admin')) {
        throw new Error('Insufficient permissions to remove participants');
      }
      
      if (targetRole === 'owner') {
        throw new Error('Cannot remove group owner');
      }
    }
    
    // Remove participant
    await updateDoc(chatRef, {
      [`participants.${participantId}`]: null,
      lastActivity: serverTimestamp(),
    });
    
    // Send system message
    const [removerProfile, removedProfile] = await Promise.all([
      getPublicProfile(removedBy),
      getPublicProfile(participantId)
    ]);
    
    const message = removedBy === participantId 
      ? `${removedProfile?.name || 'Someone'} left the group`
      : `${removerProfile?.name || 'Someone'} removed ${removedProfile?.name || 'someone'} from the group`;
    
    await sendMessage({
      chatId,
      senderId: removedBy,
      content: message,
      type: 'system',
    });
    
    console.log('✅ Participant removed successfully');
  } catch (error) {
    console.error('❌ Error removing participant:', error);
    throw error;
  }
}

// ===== MESSAGE SENDING =====

export async function sendMessage(params: {
  chatId: string;
  senderId: string;
  content: string;
  type?: MessageType;
  replyTo?: string;
  file?: File;
  mentions?: string[];
}): Promise<string> {
  const { chatId, senderId, content, type = 'text', replyTo, file, mentions } = params;
  
  console.log('📤 Sending message...', { 
    chatId, 
    senderId, 
    type, 
    contentLength: content.length 
  });
  
  try {
    // Get chat info
    const chatDoc = await getDoc(getChatRef(chatId));
    if (!chatDoc.exists()) {
      throw new Error('Chat not found');
    }
    
    const chatData = chatDoc.data() as Chat;
    
    // Verify sender is participant
    if (!chatData.participants[senderId]) {
      throw new Error('Not a participant in this chat');
    }
    
    let mediaUrl: string | undefined;
    let fileName: string | undefined;
    let fileSize: number | undefined;
    let mediaType: string | undefined;
    let dimensions: { width: number; height: number } | undefined;
    
    // Handle file upload
    if (file) {
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || '';
      fileName = file.name;
      fileSize = file.size;
      mediaType = file.type;
      
      const storageFileName = `${timestamp}_${file.name}`;
      const storagePath = `chats/${chatId}/media/${storageFileName}`;
      
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      mediaUrl = await getDownloadURL(storageRef);
      
      // Get image dimensions if it's an image
      if (file.type.startsWith('image/')) {
        dimensions = await getImageDimensions(file);
      }
    }
    
    let finalContent = content;
    let encryptionIV: string | undefined;
    
    // Encrypt message if chat is encrypted and it's text
    if (chatData.isEncrypted && type === 'text' && content.trim()) {
      try {
        const participantIds = Object.keys(chatData.participants).filter(id => id !== senderId);
        if (participantIds.length > 0) {
          const sharedKey = await ChatEncryption.generateSharedKey(senderId, participantIds[0]);
          const encrypted = await ChatEncryption.encrypt(content, sharedKey);
          finalContent = encrypted.encrypted;
          encryptionIV = encrypted.iv;
        }
      } catch (encryptionError) {
        console.warn('⚠️ Encryption failed, sending unencrypted:', encryptionError);
      }
    }
    
    // Prepare message data
    const messageData: Partial<Message> = {
      chatId,
      senderId,
      type,
      content: finalContent,
      ...(encryptionIV && { encryptionIV }),
      ...(mediaUrl && { mediaUrl }),
      ...(mediaType && { mediaType }),
      ...(fileName && { fileName }),
      ...(fileSize && { fileSize }),
      timestamp: serverTimestamp(),
      ...(replyTo && { replyTo }),
      reactions: {},
      readBy: { [senderId]: serverTimestamp() },
      deliveredTo: { [senderId]: serverTimestamp() },
      ...(mentions && mentions.length > 0 && {
        metadata: {
          mentions,
          ...(dimensions && { dimensions }),
        }
      }),
      ...(!mentions || mentions.length === 0) && dimensions && {
        metadata: {
          dimensions,
        }
      },
    };
    
    // Send message
    const messageRef = await addDoc(getMessagesRef(chatId), messageData);
    
    // Update chat's last message and activity
    const lastMessagePreview = type === 'text' ? content.substring(0, 100) : `Sent ${type}`;
    await updateDoc(getChatRef(chatId), {
      lastMessage: {
        content: lastMessagePreview,
        senderId,
        timestamp: serverTimestamp(),
        type,
      },
      lastActivity: serverTimestamp(),
      messageCount: (chatData.messageCount || 0) + 1,
    });
    
    console.log('✅ Message sent successfully', { messageId: messageRef.id });
    return messageRef.id;
    
  } catch (error) {
    console.error('❌ Error sending message:', error);
    throw error;
  }
}

// ===== MESSAGE REACTIONS =====

export async function addReaction(params: {
  chatId: string;
  messageId: string;
  userId: string;
  reactionType: ReactionType;
}): Promise<void> {
  const { chatId, messageId, userId, reactionType } = params;
  
  console.log('👍 Adding reaction...', { chatId, messageId, userId, reactionType });
  
  try {
    const messageRef = getMessageRef(chatId, messageId);
    await updateDoc(messageRef, {
      [`reactions.${userId}`]: reactionType,
    });
    
    console.log('✅ Reaction added successfully');
  } catch (error) {
    console.error('❌ Error adding reaction:', error);
    throw error;
  }
}

export async function removeReaction(params: {
  chatId: string;
  messageId: string;
  userId: string;
}): Promise<void> {
  const { chatId, messageId, userId } = params;
  
  console.log('👎 Removing reaction...', { chatId, messageId, userId });
  
  try {
    const messageRef = getMessageRef(chatId, messageId);
    await updateDoc(messageRef, {
      [`reactions.${userId}`]: null,
    });
    
    console.log('✅ Reaction removed successfully');
  } catch (error) {
    console.error('❌ Error removing reaction:', error);
    throw error;
  }
}

// ===== POST COMMENTS =====

export async function addPostComment(params: {
  postId: string;
  authorId: string;
  content: string;
  parentCommentId?: string;
}): Promise<string> {
  const { postId, authorId, content, parentCommentId } = params;
  
  console.log('💬 Adding post comment...', { postId, authorId, parentCommentId });
  
  try {
    const commentData: Partial<PostComment> = {
      postId,
      authorId,
      content,
      parentCommentId,
      timestamp: serverTimestamp(),
      reactions: {},
      likesCount: 0,
      repliesCount: 0,
    };
    
    const commentRef = await addDoc(getCommentsRef(postId), commentData);
    
    // Update parent comment reply count if it's a reply
    if (parentCommentId) {
      const parentRef = getCommentRef(postId, parentCommentId);
      const parentDoc = await getDoc(parentRef);
      if (parentDoc.exists()) {
        const currentReplies = parentDoc.data().repliesCount || 0;
        await updateDoc(parentRef, {
          repliesCount: currentReplies + 1,
        });
      }
    }
    
    // Update post comment count
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    if (postDoc.exists()) {
      const currentComments = postDoc.data().comments || 0;
      await updateDoc(postRef, {
        comments: currentComments + 1,
      });
    }
    
    console.log('✅ Post comment added successfully', { commentId: commentRef.id });
    return commentRef.id;
    
  } catch (error) {
    console.error('❌ Error adding post comment:', error);
    throw error;
  }
}

export async function addCommentReaction(params: {
  postId: string;
  commentId: string;
  userId: string;
  reactionType: ReactionType;
}): Promise<void> {
  const { postId, commentId, userId, reactionType } = params;
  
  console.log('👍 Adding comment reaction...', { postId, commentId, userId, reactionType });
  
  try {
    const commentRef = getCommentRef(postId, commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      throw new Error('Comment not found');
    }
    
    const commentData = commentDoc.data() as PostComment;
    const currentReactions = commentData.reactions || {};
    const wasLiked = currentReactions[userId] === 'like';
    
    await updateDoc(commentRef, {
      [`reactions.${userId}`]: reactionType,
      likesCount: wasLiked ? commentData.likesCount : (commentData.likesCount || 0) + 1,
    });
    
    console.log('✅ Comment reaction added successfully');
  } catch (error) {
    console.error('❌ Error adding comment reaction:', error);
    throw error;
  }
}

// ===== TYPING INDICATORS =====

export async function setTypingStatus(params: {
  chatId: string;
  userId: string;
  isTyping: boolean;
}): Promise<void> {
  const { chatId, userId, isTyping } = params;
  
  try {
    const typingRef = doc(getTypingRef(chatId), userId);
    
    if (isTyping) {
      await setDoc(typingRef, {
        userId,
        isTyping: true,
        lastUpdated: serverTimestamp(),
      });
    } else {
      await deleteDoc(typingRef);
    }
  } catch (error) {
    console.error('❌ Error setting typing status:', error);
  }
}

// ===== READ RECEIPTS =====

export async function markMessageAsRead(params: {
  chatId: string;
  messageId: string;
  userId: string;
}): Promise<void> {
  const { chatId, messageId, userId } = params;
  
  try {
    const messageRef = getMessageRef(chatId, messageId);
    await updateDoc(messageRef, {
      [`readBy.${userId}`]: serverTimestamp(),
    });
  } catch (error) {
    console.error('❌ Error marking message as read:', error);
  }
}

export async function markMessagesAsDelivered(params: {
  chatId: string;
  messageIds: string[];
  userId: string;
}): Promise<void> {
  const { chatId, messageIds, userId } = params;
  
  try {
    const batch = writeBatch(db);
    const timestamp = serverTimestamp();
    
    messageIds.forEach(messageId => {
      const messageRef = getMessageRef(chatId, messageId);
      batch.update(messageRef, {
        [`deliveredTo.${userId}`]: timestamp,
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('❌ Error marking messages as delivered:', error);
  }
}

// ===== REAL-TIME LISTENERS =====

export function listenToChat(
  chatId: string,
  callback: (chat: Chat | null) => void
): () => void {
  const chatRef = getChatRef(chatId);
  
  return onSnapshot(chatRef, (doc) => {
    if (doc.exists()) {
      const chatData = {
        ...doc.data(),
        id: doc.id,
      } as Chat;
      callback(chatData);
    } else {
      callback(null);
    }
  });
}

export function listenToMessages(
  chatId: string,
  currentUserId: string,
  callback: (messages: Message[]) => void,
  limitCount = 50
): () => void {
  const messagesRef = getMessagesRef(chatId);
  const q = query(
    messagesRef,
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  
  return onSnapshot(q, async (snapshot) => {
    const messages: Message[] = [];
    
    // Get chat info for decryption
    const chatDoc = await getDoc(getChatRef(chatId));
    const chatData = chatDoc.exists() ? chatDoc.data() as Chat : null;
    
    for (const messageDoc of snapshot.docs) {
      const messageData = messageDoc.data() as Message;
      const message: Message = {
        ...messageData,
        id: messageDoc.id,
      };
      
      // Decrypt message if encrypted
      if (chatData?.isEncrypted && message.encryptionIV && message.type === 'text') {
        try {
          const participantIds = Object.keys(chatData.participants).filter(id => id !== currentUserId);
          if (participantIds.length > 0) {
            const sharedKey = await ChatEncryption.generateSharedKey(currentUserId, participantIds[0]);
            const decrypted = await ChatEncryption.decrypt(
              message.content,
              message.encryptionIV,
              sharedKey
            );
            message.content = decrypted;
          }
        } catch (decryptionError) {
          console.error('❌ Failed to decrypt message:', decryptionError);
          message.content = '[Unable to decrypt message]';
        }
      }
      
      messages.push(message);
    }
    
    callback(messages.reverse());
  });
}

export function listenToTypingIndicators(
  chatId: string,
  currentUserId: string,
  callback: (typingUsers: string[]) => void
): () => void {
  const typingRef = getTypingRef(chatId);
  
  return onSnapshot(typingRef, (snapshot) => {
    const typingUsers = snapshot.docs
      .map(doc => doc.data() as TypingIndicator)
      .filter(indicator => 
        indicator.userId !== currentUserId && 
        indicator.isTyping &&
        indicator.lastUpdated &&
        // Only consider recent typing indicators (within 5 seconds)
        Date.now() - (indicator.lastUpdated as Timestamp).toMillis() < 5000
      )
      .map(indicator => indicator.userId);
    
    callback(typingUsers);
  });
}

export function listenToPostComments(
  postId: string,
  callback: (comments: PostComment[]) => void
): () => void {
  const commentsRef = getCommentsRef(postId);
  const q = query(
    commentsRef,
    orderBy('timestamp', 'asc')
  );
  
  return onSnapshot(q, async (snapshot) => {
    const comments: PostComment[] = [];
    
    // Process comments in parallel for better performance
    const commentPromises = snapshot.docs.map(async (commentDoc) => {
      const commentData = commentDoc.data() as PostComment;
      
      // Fetch author profile
      let authorProfile: PublicProfile | undefined;
      try {
        authorProfile = await getPublicProfile(commentData.authorId);
      } catch (error) {
        console.warn('Failed to fetch author profile for comment:', error);
        // Create a fallback profile with basic info
        authorProfile = {
          userId: commentData.authorId,
          name: 'Unknown User',
          username: `user${commentData.authorId.slice(-4)}`,
          bio: '',
          avatar: undefined,
        };
      }
      
      return {
        ...commentData,
        id: commentDoc.id,
        authorProfile,
      };
    });
    
    const resolvedComments = await Promise.all(commentPromises);
    callback(resolvedComments);
  });
}

// ===== USER CHATS =====

export function listenToUserChats(
  userId: string,
  callback: (chats: Chat[]) => void
): () => void {
  const chatsRef = getChatsRef();
  const q = query(
    chatsRef,
    where(`participants.${userId}`, '!=', null),
    orderBy('lastActivity', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as Chat[];
    
    callback(chats);
  });
}

// ===== UTILITY FUNCTIONS =====

async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
    };
    img.src = URL.createObjectURL(file);
  });
}

export function getEmojiForReaction(reaction: ReactionType): string {
  const emojiMap: { [key in ReactionType]: string } = {
    like: '👍',
    love: '❤️',
    laugh: '😂',
    wow: '😮',
    sad: '😢',
    angry: '😠',
    celebrate: '🎉',
    support: '💪',
  };
  
  return emojiMap[reaction];
}

export function formatMessageTime(timestamp: Timestamp | FieldValue | null): string {
  if (!timestamp || typeof timestamp !== 'object' || !('toDate' in timestamp)) {
    return '';
  }
  
  const date = timestamp.toDate();
  const now = new Date();
  const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 168) { // Within a week
    return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}

export { ChatEncryption };