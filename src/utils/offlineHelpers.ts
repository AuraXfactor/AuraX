'use client';

import { useOfflineSync } from './offlineStorage';

// Helper functions for common offline operations
export function useOfflineJournal() {
  const { saveOffline, isOnline } = useOfflineSync();

  const saveJournalEntry = async (entry: {
    title: string;
    content: string;
    mood?: string;
    tags?: string[];
    type?: string;
  }) => {
    try {
      if (isOnline) {
        // Try to save online first
        const response = await fetch('/api/journals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        });
        
        if (response.ok) {
          return await response.json();
        }
      }
      
      // If offline or online save failed, save offline
      const id = await saveOffline('journal', entry);
      return { id, offline: true };
    } catch (error) {
      // Fallback to offline storage
      const id = await saveOffline('journal', entry);
      return { id, offline: true };
    }
  };

  return { saveJournalEntry };
}

export function useOfflineMood() {
  const { saveOffline, isOnline } = useOfflineSync();

  const saveMoodEntry = async (mood: {
    value: number;
    note?: string;
    activities?: string[];
    timestamp?: number;
  }) => {
    try {
      if (isOnline) {
        const response = await fetch('/api/mood', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mood)
        });
        
        if (response.ok) {
          return await response.json();
        }
      }
      
      const id = await saveOffline('mood', mood);
      return { id, offline: true };
    } catch (error) {
      const id = await saveOffline('mood', mood);
      return { id, offline: true };
    }
  };

  return { saveMoodEntry };
}

export function useOfflineAura() {
  const { saveOffline, isOnline } = useOfflineSync();

  const saveAuraEntry = async (aura: {
    content: string;
    mood: string;
    visibility: 'public' | 'friends' | 'private';
    tags?: string[];
  }) => {
    try {
      if (isOnline) {
        const response = await fetch('/api/aura', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(aura)
        });
        
        if (response.ok) {
          return await response.json();
        }
      }
      
      const id = await saveOffline('aura', aura);
      return { id, offline: true };
    } catch (error) {
      const id = await saveOffline('aura', aura);
      return { id, offline: true };
    }
  };

  return { saveAuraEntry };
}

export function useOfflineMessages() {
  const { saveOffline, isOnline } = useOfflineSync();

  const sendMessage = async (message: {
    recipientId: string;
    content: string;
    type?: 'text' | 'image' | 'audio';
    metadata?: any;
  }) => {
    try {
      if (isOnline) {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });
        
        if (response.ok) {
          return await response.json();
        }
      }
      
      const id = await saveOffline('message', message);
      return { id, offline: true };
    } catch (error) {
      const id = await saveOffline('message', message);
      return { id, offline: true };
    }
  };

  return { sendMessage };
}

export function useOfflineFriends() {
  const { saveOffline, isOnline } = useOfflineSync();

  const sendFriendRequest = async (request: {
    targetUserId: string;
    message?: string;
  }) => {
    try {
      if (isOnline) {
        const response = await fetch('/api/friends/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        });
        
        if (response.ok) {
          return await response.json();
        }
      }
      
      const id = await saveOffline('friend_request', request);
      return { id, offline: true };
    } catch (error) {
      const id = await saveOffline('friend_request', request);
      return { id, offline: true };
    }
  };

  return { sendFriendRequest };
}

// Utility to check if data was saved offline
export function isOfflineData(result: any): boolean {
  return result && result.offline === true;
}

// Utility to get offline data count
export async function getOfflineDataCount(): Promise<number> {
  try {
    const { offlineStorage } = await import('./offlineStorage');
    const unsyncedData = await offlineStorage.getUnsyncedData();
    return unsyncedData.length;
  } catch (error) {
    console.error('Failed to get offline data count:', error);
    return 0;
  }
}