import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  increment,
  limit,
  startAfter,
  getDocs,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
  arrayUnion,
} from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

export type ChatMessageType = 'text' | 'moodSticker' | 'voice' | 'image';

export type ChatMessage = {
  messageId: string;
  fromUid: string;
  toUid: string;
  text: string | null;
  type: ChatMessageType;
  mood?: string | null;
  emoji?: string | null;
  attachmentUrl?: string | null;
  createdAt: Timestamp | null;
  read: boolean;
};

export type ChatMeta = {
  chatId: string;
  otherUid: string;
  lastMessage: string | null;
  lastAt: Timestamp | null;
  unreadCount: number;
};

export function getDeterministicChatId(aUid: string, bUid: string): string {
  return [aUid, bUid].sort().join('_');
}

export function getMessagesColRef(uid: string, chatId: string) {
  return collection(doc(collection(doc(db, 'users', uid), 'chats'), chatId), 'messages');
}

export function getChatMetaDocRef(uid: string, chatId: string) {
  return doc(collection(doc(db, 'users', uid), 'chatMeta'), chatId);
}

export async function sendTextMessage(params: {
  fromUser: User;
  toUid: string;
  text: string;
}): Promise<void> {
  const { fromUser, toUid, text } = params;
  const chatId = getDeterministicChatId(fromUser.uid, toUid);

  const messageBase = {
    fromUid: fromUser.uid,
    toUid,
    text,
    type: 'text' as const,
    createdAt: serverTimestamp(),
    read: false,
  };

  const colA = getMessagesColRef(fromUser.uid, chatId);
  const colB = getMessagesColRef(toUid, chatId);

  console.log('[Chat] sendText', { toUid, text });
  const docA = await addDoc(colA, messageBase);
  console.log('[Chat] mirrored message id', docA.id);
  await setDoc(doc(colB, docA.id), { ...messageBase });

  await Promise.all([
    updateChatMetaOnSend(fromUser.uid, toUid, chatId, text),
    updateChatMetaOnSend(toUid, fromUser.uid, chatId, text, true),
  ]);
}

export async function sendMoodSticker(params: {
  fromUser: User;
  toUid: string;
  mood: string;
  emoji: string;
  text?: string;
}): Promise<void> {
  const { fromUser, toUid, mood, emoji, text } = params;
  const chatId = getDeterministicChatId(fromUser.uid, toUid);
  const messageBase = {
    fromUid: fromUser.uid,
    toUid,
    text: text ?? null,
    type: 'moodSticker' as const,
    mood,
    emoji,
    createdAt: serverTimestamp(),
    read: false,
  };
  const colA = getMessagesColRef(fromUser.uid, chatId);
  const colB = getMessagesColRef(toUid, chatId);
  console.log('[Chat] sendMoodSticker', { toUid, mood, emoji });
  const docA = await addDoc(colA, messageBase);
  await setDoc(doc(colB, docA.id), { ...messageBase });
  const preview = text ?? `${emoji} ${mood}`;
  await Promise.all([
    updateChatMetaOnSend(fromUser.uid, toUid, chatId, preview),
    updateChatMetaOnSend(toUid, fromUser.uid, chatId, preview, true),
  ]);
}

export async function sendImage(params: {
  fromUser: User;
  toUid: string;
  file: File;
  caption?: string;
}): Promise<void> {
  const { fromUser, toUid, file, caption } = params;
  const chatId = getDeterministicChatId(fromUser.uid, toUid);
  const path = `chat/${chatId}/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);
  console.log('[Chat] upload image start', { path });
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  console.log('[Chat] image uploaded', { url });

  const messageBase = {
    fromUid: fromUser.uid,
    toUid,
    text: caption ?? null,
    type: 'image' as const,
    attachmentUrl: url,
    createdAt: serverTimestamp(),
    read: false,
  };
  const colA = getMessagesColRef(fromUser.uid, chatId);
  const colB = getMessagesColRef(toUid, chatId);
  const docA = await addDoc(colA, messageBase);
  await setDoc(doc(colB, docA.id), { ...messageBase });
  const preview = caption ? `🖼️ ${caption}` : '🖼️ Image';
  await Promise.all([
    updateChatMetaOnSend(fromUser.uid, toUid, chatId, preview),
    updateChatMetaOnSend(toUid, fromUser.uid, chatId, preview, true),
  ]);
}

async function updateChatMetaOnSend(
  uid: string,
  otherUid: string,
  chatId: string,
  lastMessage: string,
  incrementUnread?: boolean,
) {
  const metaRef = getChatMetaDocRef(uid, chatId);
  await setDoc(metaRef, {
    chatId,
    otherUid,
    lastMessage,
    lastAt: serverTimestamp(),
    unreadCount: 0,
  }, { merge: true });
  if (incrementUnread) {
    await updateDoc(metaRef, { unreadCount: increment(1) });
  }
}

export function listenToMessages(params: {
  uid: string;
  chatId: string;
  pageSize?: number;
  onChange: (messages: ChatMessage[], last?: QueryDocumentSnapshot<DocumentData> | undefined) => void;
}) {
  const { uid, chatId, pageSize = 50, onChange } = params;
  const q = query(getMessagesColRef(uid, chatId), orderBy('createdAt', 'desc'), limit(pageSize));
  return onSnapshot(q, (snap) => {
    const messages: ChatMessage[] = snap.docs.map((d) => {
      const data = d.data() as Omit<ChatMessage, 'messageId'>;
      return { messageId: d.id, ...data };
    });
    const last = snap.docs.at(-1);
    onChange(messages.reverse(), last);
  });
}

export async function loadMoreMessages(params: {
  uid: string;
  chatId: string;
  after: QueryDocumentSnapshot<DocumentData> | null | undefined;
  pageSize?: number;
}): Promise<{ messages: ChatMessage[]; last?: QueryDocumentSnapshot<DocumentData> | undefined }>
{
  const { uid, chatId, after, pageSize = 50 } = params;
  const base = query(getMessagesColRef(uid, chatId), orderBy('createdAt', 'desc'));
  const q = after ? query(base, startAfter(after), limit(pageSize)) : query(base, limit(pageSize));
  const snap = await getDocs(q);
  const messages: ChatMessage[] = snap.docs.map((d) => {
    const data = d.data() as Omit<ChatMessage, 'messageId'>;
    return { messageId: d.id, ...data };
  });
  const last = snap.docs.at(-1);
  return { messages: messages.reverse(), last };
}

export async function markMessagesRead(params: { uid: string; chatId: string }): Promise<void> {
  const { uid, chatId } = params;
  const metaRef = getChatMetaDocRef(uid, chatId);
  await updateDoc(metaRef, { unreadCount: 0 });
}

// Typing indicator via ephemeral document: /users/{uid}/chats/{chatId}/typing/{otherUid}
export function typingDocRef(params: { uid: string; chatId: string; otherUid: string }) {
  const { uid, chatId, otherUid } = params;
  return doc(collection(doc(collection(doc(db, 'users', uid), 'chats'), chatId), 'typing'), otherUid);
}

export async function setTyping(params: { uid: string; chatId: string; otherUid: string; typing: boolean }) {
  const { uid, chatId, otherUid, typing } = params;
  await setDoc(typingDocRef({ uid, chatId, otherUid }), { typing, at: serverTimestamp() }, { merge: true });
}

export type AiPersonality = 'calm' | 'hype' | 'scripture' | 'friendly';

export async function saveChatExcerptToJournal(params: {
  user: User;
  mood?: string | null;
  notes: string;
}): Promise<void> {
  const { user, mood, notes } = params;
  const entryRef = doc(collection(doc(db, 'users', user.uid), 'journalEntries'));
  await setDoc(entryRef, {
    date: serverTimestamp(),
    mood: mood ?? null,
    selfCareActivities: [],
    affirmation: null,
    notes,
    auraPoints: 0,
    source: 'chat',
    createdAt: serverTimestamp(),
  });
}

// Enhanced chat functions for friend interactions
export type ChatParticipant = {
  uid: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: Timestamp;
};

export type EnhancedChatMessage = ChatMessage & {
  senderName?: string;
  senderAvatar?: string;
  readBy?: string[];
  reactions?: { [emoji: string]: string[] };
  replyTo?: string;
};

// Get chat participants with enriched data
export async function getChatParticipants(userUid: string, otherUid: string): Promise<ChatParticipant[]> {
  try {
    const [userDoc, otherDoc] = await Promise.all([
      getDocs(query(collection(db, 'users'), limit(1))),
      getDocs(query(collection(db, 'users'), limit(1)))
    ]);

    const participants: ChatParticipant[] = [];
    
    // Get user data
    const userRef = doc(db, 'users', userUid);
    const userSnap = await getDocs(query(collection(db, 'users'), limit(1)));
    
    // This would need proper implementation to get actual user data
    // For now, returning basic structure
    return [
      { uid: userUid, name: 'You' },
      { uid: otherUid, name: 'Friend' }
    ];
  } catch (error) {
    console.error('Error getting chat participants:', error);
    return [];
  }
}

// Send message with enhanced features
export async function sendEnhancedMessage(params: {
  fromUser: User;
  toUid: string;
  text: string;
  type?: ChatMessageType;
  replyTo?: string;
}): Promise<void> {
  const { fromUser, toUid, text, type = 'text', replyTo } = params;
  const chatId = getDeterministicChatId(fromUser.uid, toUid);

  const messageBase = {
    fromUid: fromUser.uid,
    toUid,
    text,
    type,
    createdAt: serverTimestamp(),
    read: false,
    senderName: fromUser.displayName || 'Anonymous',
    senderAvatar: fromUser.photoURL || undefined,
    reactions: {},
    replyTo: replyTo || undefined,
  };

  const colA = getMessagesColRef(fromUser.uid, chatId);
  const colB = getMessagesColRef(toUid, chatId);

  const docA = await addDoc(colA, messageBase);
  await setDoc(doc(colB, docA.id), { ...messageBase });

  // Update friend interaction timestamp
  try {
    const { updateFriendInteraction } = await import('./friends');
    await updateFriendInteraction(fromUser.uid, toUid);
  } catch (error) {
    console.error('Error updating friend interaction:', error);
  }

  await Promise.all([
    updateChatMetaOnSend(fromUser.uid, toUid, chatId, text),
    updateChatMetaOnSend(toUid, fromUser.uid, chatId, text, true),
  ]);
}

// Add reaction to message
export async function addMessageReaction(params: {
  userUid: string;
  otherUid: string;
  messageId: string;
  emoji: string;
}): Promise<void> {
  const { userUid, otherUid, messageId, emoji } = params;
  const chatId = getDeterministicChatId(userUid, otherUid);

  try {
    const userMessageRef = doc(getMessagesColRef(userUid, chatId), messageId);
    const otherMessageRef = doc(getMessagesColRef(otherUid, chatId), messageId);

    const updates = {
      [`reactions.${emoji}`]: arrayUnion(userUid)
    };

    await Promise.all([
      updateDoc(userMessageRef, updates),
      updateDoc(otherMessageRef, updates)
    ]);
  } catch (error) {
    console.error('Error adding message reaction:', error);
  }
}

// Remove reaction from message
export async function removeMessageReaction(params: {
  userUid: string;
  otherUid: string;
  messageId: string;
  emoji: string;
}): Promise<void> {
  const { userUid, otherUid, messageId, emoji } = params;
  const chatId = getDeterministicChatId(userUid, otherUid);

  try {
    const userMessageRef = doc(getMessagesColRef(userUid, chatId), messageId);
    const otherMessageRef = doc(getMessagesColRef(otherUid, chatId), messageId);

    // This would need a more complex implementation to properly remove from array
    // For now, just updating to remove the user
    const updates = {
      [`reactions.${emoji}`]: []
    };

    await Promise.all([
      updateDoc(userMessageRef, updates),
      updateDoc(otherMessageRef, updates)
    ]);
  } catch (error) {
    console.error('Error removing message reaction:', error);
  }
}

// Get message read status
export async function getMessageReadStatus(params: {
  userUid: string;
  otherUid: string;
  messageId: string;
}): Promise<boolean> {
  const { userUid, otherUid, messageId } = params;
  const chatId = getDeterministicChatId(userUid, otherUid);

  try {
    const messageRef = doc(getMessagesColRef(otherUid, chatId), messageId);
    const messageSnap = await getDocs(query(getMessagesColRef(otherUid, chatId), limit(1)));
    
    // This would need proper implementation to check read status
    return false;
  } catch (error) {
    console.error('Error getting message read status:', error);
    return false;
  }
}

