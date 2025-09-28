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
  Timestamp,
  FieldValue,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChatEncryption } from '@/utils/encryption';
import { getPublicProfile, PublicProfile } from '@/lib/socialSystem';

export type EncryptedChatMessage = {
  id: string;
  chatId: string;
  senderId: string;
  encryptedContent: string;
  iv: string;
  type: 'text' | 'image' | 'system';
  timestamp: Timestamp | FieldValue | null;
  readBy: { [userId: string]: Timestamp | FieldValue };
  editedAt?: Timestamp | FieldValue | null;
  replyTo?: string;
  mediaUrl?: string; // For images, stored separately
};

export type ChatParticipant = {
  userId: string;
  profile?: PublicProfile;
  lastSeen?: Timestamp | FieldValue | null;
  isTyping?: boolean;
  joinedAt: Timestamp | FieldValue | null;
};

export type ChatSession = {
  id: string;
  participants: { [userId: string]: ChatParticipant };
  createdAt: Timestamp | FieldValue | null;
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: Timestamp | FieldValue | null;
  };
  encryptionEnabled: boolean;
  messageCount: number;
};

// Enhanced Chat Functions
export function getEnhancedChatRef(chatId: string) {
  return collection(db, 'enhancedChats', chatId, 'messages');
}

export function getChatSessionRef(chatId: string) {
  return doc(db, 'enhancedChats', chatId);
}

export async function createOrGetChatSession(
  currentUserId: string, 
  otherUserId: string
): Promise<string> {
  const chatId = ChatEncryption.generateChatId(currentUserId, otherUserId);
  const sessionRef = getChatSessionRef(chatId);
  
  try {
    const sessionDoc = await getDoc(sessionRef);
    
    if (!sessionDoc.exists()) {
      // Create new chat session
      const [currentProfile, otherProfile] = await Promise.all([
        getPublicProfile(currentUserId),
        getPublicProfile(otherUserId)
      ]);
      
      const sessionData: Partial<ChatSession> = {
        id: chatId,
        participants: {
          [currentUserId]: {
            userId: currentUserId,
            profile: currentProfile || undefined,
            joinedAt: serverTimestamp(),
          },
          [otherUserId]: {
            userId: otherUserId,
            profile: otherProfile || undefined,
            joinedAt: serverTimestamp(),
          },
        },
        createdAt: serverTimestamp(),
        encryptionEnabled: true,
        messageCount: 0,
      };
      
      await setDoc(sessionRef, sessionData);
      console.log('✅ Created new chat session:', chatId);
    }
    
    return chatId;
  } catch (error) {
    console.error('Error creating/getting chat session:', error);
    throw error;
  }
}

export async function sendEncryptedMessage(params: {
  user: User;
  chatId: string;
  content: string;
  type?: 'text' | 'image' | 'system';
  replyTo?: string;
}): Promise<string> {
  const { user, chatId, content, type = 'text', replyTo } = params;
  
  console.log('🔐 sendEncryptedMessage called', { 
    userId: user.uid, 
    chatId, 
    contentLength: content.length, 
    type 
  });
  
  try {
    // Generate or get shared encryption key
    const chatSession = await getDoc(getChatSessionRef(chatId));
    if (!chatSession.exists()) {
      throw new Error('Chat session not found');
    }
    
    const sessionData = chatSession.data() as ChatSession;
    const otherParticipants = Object.keys(sessionData.participants).filter(id => id !== user.uid);
    
    let encryptedContent = content;
    let iv = '';
    
    if (sessionData.encryptionEnabled && type === 'text') {
      // Generate shared key and encrypt message
      const sharedKey = await ChatEncryption.generateSharedKey(user.uid, otherParticipants[0]);
      const encrypted = await ChatEncryption.encrypt(content, sharedKey);
      encryptedContent = encrypted.encrypted;
      iv = encrypted.iv;
    }
    
    const messageData: Partial<EncryptedChatMessage> = {
      chatId,
      senderId: user.uid,
      encryptedContent,
      iv,
      type,
      timestamp: serverTimestamp(),
      readBy: { [user.uid]: serverTimestamp() },
      replyTo,
    };
    
    // Add message to chat
    const docRef = await addDoc(getEnhancedChatRef(chatId), messageData);
    
    // Update chat session with last message
    await updateDoc(getChatSessionRef(chatId), {
      lastMessage: {
        content: type === 'text' ? content : `Sent ${type}`,
        senderId: user.uid,
        timestamp: serverTimestamp(),
      },
      messageCount: (sessionData.messageCount || 0) + 1,
    });
    
    console.log('✅ Encrypted message sent:', docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Error sending encrypted message:', error);
    throw error;
  }
}

export async function decryptMessage(
  encryptedMessage: EncryptedChatMessage,
  currentUserId: string
): Promise<string> {
  try {
    if (!encryptedMessage.iv || encryptedMessage.type !== 'text') {
      // Not encrypted or not text
      return encryptedMessage.encryptedContent;
    }
    
    // Get other participant for key generation
    const chatSession = await getDoc(getChatSessionRef(encryptedMessage.chatId));
    if (!chatSession.exists()) {
      return encryptedMessage.encryptedContent;
    }
    
    const sessionData = chatSession.data() as ChatSession;
    const otherParticipants = Object.keys(sessionData.participants).filter(id => id !== currentUserId);
    
    if (otherParticipants.length === 0) {
      return encryptedMessage.encryptedContent;
    }
    
    // Generate shared key and decrypt
    const sharedKey = await ChatEncryption.generateSharedKey(currentUserId, otherParticipants[0]);
    const decrypted = await ChatEncryption.decrypt(
      encryptedMessage.encryptedContent,
      encryptedMessage.iv,
      sharedKey
    );
    
    return decrypted;
    
  } catch (error) {
    console.error('❌ Error decrypting message:', error);
    return '[Unable to decrypt message]';
  }
}

export function listenToEncryptedChat(
  chatId: string, 
  currentUserId: string,
  callback: (messages: Array<EncryptedChatMessage & { decryptedContent?: string }>) => void
) {
  const q = query(
    getEnhancedChatRef(chatId),
    orderBy('timestamp', 'desc'),
    // limit(50)
  );
  
  return onSnapshot(q, async (snapshot) => {
    const messages: Array<EncryptedChatMessage & { decryptedContent?: string }> = [];
    
    for (const messageDoc of snapshot.docs) {
      const messageData = messageDoc.data() as EncryptedChatMessage;
      const message: EncryptedChatMessage & { decryptedContent?: string } = {
        ...messageData,
        id: messageDoc.id,
      };
      
      // Decrypt message if it's encrypted
      if (messageData.iv && messageData.type === 'text') {
        try {
          message.decryptedContent = await decryptMessage(messageData, currentUserId);
        } catch (error) {
          console.error('Error decrypting message:', error);
          message.decryptedContent = '[Unable to decrypt]';
        }
      } else {
        message.decryptedContent = messageData.encryptedContent;
      }
      
      messages.push(message);
    }
    
    // Reverse to show oldest first
    callback(messages.reverse());
  });
}

export async function markMessageAsRead(
  chatId: string,
  messageId: string,
  userId: string
): Promise<void> {
  try {
    const messageRef = doc(getEnhancedChatRef(chatId), messageId);
    await updateDoc(messageRef, {
      [`readBy.${userId}`]: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
  }
}

export async function setTypingStatus(
  chatId: string,
  userId: string,
  isTyping: boolean
): Promise<void> {
  try {
    const sessionRef = getChatSessionRef(chatId);
    await updateDoc(sessionRef, {
      [`participants.${userId}.isTyping`]: isTyping,
      [`participants.${userId}.lastSeen`]: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error setting typing status:', error);
  }
}

export function listenToChatSession(
  chatId: string,
  callback: (session: ChatSession) => void
) {
  const sessionRef = getChatSessionRef(chatId);
  
  return onSnapshot(sessionRef, (doc) => {
    if (doc.exists()) {
      const sessionData = {
        ...doc.data(),
        id: doc.id,
      } as ChatSession;
      callback(sessionData);
    }
  });
}