// Chat Performance Optimizations
// Implements pagination, lazy loading, and efficient data fetching

import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  onSnapshot, 
  getDocs,
  DocumentSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Message, Chat } from './messaging';

// Pagination for messages
export interface MessagePagination {
  hasMore: boolean;
  lastDoc: DocumentSnapshot | null;
  isLoading: boolean;
}

export class ChatOptimizer {
  private messageCache = new Map<string, Message[]>();
  private chatCache = new Map<string, Chat>();
  private listeners = new Map<string, () => void>();

  // Optimized message loading with pagination
  listenToMessagesPaginated(
    chatId: string,
    currentUserId: string,
    callback: (messages: Message[], pagination: MessagePagination) => void,
    pageSize = 20
  ): () => void {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(pageSize)
    );

    let lastDoc: DocumentSnapshot | null = null;
    let allMessages: Message[] = [];

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        callback([], { hasMore: false, lastDoc: null, isLoading: false });
        return;
      }

      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      const newMessages: Message[] = [];

      for (const messageDoc of snapshot.docs) {
        const messageData = messageDoc.data() as Message;
        const message: Message = {
          ...messageData,
          id: messageDoc.id,
        };
        newMessages.push(message);
      }

      // Cache messages
      this.messageCache.set(chatId, newMessages);
      allMessages = newMessages;

      callback(newMessages.reverse(), {
        hasMore: snapshot.docs.length === pageSize,
        lastDoc,
        isLoading: false,
      });
    });

    this.listeners.set(chatId, unsubscribe);
    return unsubscribe;
  }

  // Load more messages (pagination)
  async loadMoreMessages(
    chatId: string,
    lastDoc: DocumentSnapshot,
    pageSize = 20
  ): Promise<{ messages: Message[]; hasMore: boolean; lastDoc: DocumentSnapshot | null }> {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );

    const snapshot = await getDocs(q);
    const messages: Message[] = [];

    for (const messageDoc of snapshot.docs) {
      const messageData = messageDoc.data() as Message;
      const message: Message = {
        ...messageData,
        id: messageDoc.id,
      };
      messages.push(message);
    }

    return {
      messages: messages.reverse(),
      hasMore: snapshot.docs.length === pageSize,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    };
  }

  // Optimized chat loading with debouncing
  listenToChatsOptimized(
    userId: string,
    callback: (chats: Chat[]) => void,
    debounceMs = 100
  ): () => void {
    let timeoutId: NodeJS.Timeout;
    let lastChats: Chat[] = [];

    const debouncedCallback = (chats: Chat[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Only update if chats actually changed
        if (JSON.stringify(chats) !== JSON.stringify(lastChats)) {
          lastChats = [...chats];
          callback(chats);
        }
      }, debounceMs);
    };

    // This would integrate with the existing listenToUserChats
    // but with debouncing to prevent excessive re-renders
    return () => clearTimeout(timeoutId);
  }

  // Batch profile loading for chat participants
  async loadChatParticipants(chat: Chat): Promise<{ [userId: string]: any }> {
    const participantIds = Object.keys(chat.participants);
    
    // Use the profile cache for efficient loading
    const { loadProfilesBatch } = await import('./profileCache');
    const { getPublicProfile } = await import('./socialSystem');
    
    return loadProfilesBatch(participantIds, getPublicProfile);
  }

  // Cleanup listeners
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
    this.messageCache.clear();
    this.chatCache.clear();
  }

  // Get cached messages
  getCachedMessages(chatId: string): Message[] {
    return this.messageCache.get(chatId) || [];
  }

  // Get cached chat
  getCachedChat(chatId: string): Chat | null {
    return this.chatCache.get(chatId) || null;
  }
}

// Global chat optimizer instance
export const chatOptimizer = new ChatOptimizer();

// Utility functions for performance monitoring
export function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  return fn().then(result => {
    const end = performance.now();
    console.log(`⏱️ ${name} took ${(end - start).toFixed(2)}ms`);
    return result;
  });
}

// Debounce utility for search and other frequent operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for scroll events and other high-frequency events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}