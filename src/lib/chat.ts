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

