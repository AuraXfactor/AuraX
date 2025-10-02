'use client';

import React from 'react';

interface OfflineData {
  id: string;
  type: 'journal' | 'mood' | 'aura' | 'message' | 'friend_request' | 'group_activity';
  data: any;
  timestamp: number;
  synced: boolean;
}

class OfflineStorage {
  private dbName = 'AuraZ_Offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store for offline data
        if (!db.objectStoreNames.contains('offlineData')) {
          const store = db.createObjectStore('offlineData', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
        }
      };
    });
  }

  async saveData(type: OfflineData['type'], data: any): Promise<string> {
    if (!this.db) await this.init();
    
    const offlineData: OfflineData = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      synced: false
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      const request = store.add(offlineData);
      
      request.onsuccess = () => resolve(offlineData.id);
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedData(): Promise<OfflineData[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readonly');
      const store = transaction.objectStore('offlineData');
      const index = store.index('synced');
      const request = index.getAll(IDBKeyRange.only(false));
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markAsSynced(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.synced = true;
          const putRequest = store.put(data);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async clearSyncedData(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      const index = store.index('synced');
      const request = index.openCursor(IDBKeyRange.only(true));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getDataByType(type: OfflineData['type']): Promise<OfflineData[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readonly');
      const store = transaction.objectStore('offlineData');
      const index = store.index('type');
      const request = index.getAll(type);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteData(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Network status detection
class NetworkManager {
  private isOnline = typeof window !== 'undefined' ? navigator.onLine : true;
  private listeners: ((isOnline: boolean) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyListeners();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyListeners();
      });
    }
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  addListener(callback: (isOnline: boolean) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.isOnline));
  }
}

// Sync manager for handling data synchronization
class SyncManager {
  private offlineStorage: OfflineStorage;
  private networkManager: NetworkManager;
  private syncInProgress = false;

  constructor() {
    this.offlineStorage = new OfflineStorage();
    this.networkManager = new NetworkManager();
  }

  async init(): Promise<void> {
    await this.offlineStorage.init();
    
    // Listen for network changes
    this.networkManager.addListener((isOnline) => {
      if (isOnline && !this.syncInProgress) {
        this.syncData();
      }
    });

    // Initial sync if online
    if (this.networkManager.getOnlineStatus()) {
      this.syncData();
    }
  }

  async saveOffline(type: OfflineData['type'], data: any): Promise<string> {
    return await this.offlineStorage.saveData(type, data);
  }

  async syncData(): Promise<void> {
    if (this.syncInProgress || !this.networkManager.getOnlineStatus()) {
      return;
    }

    this.syncInProgress = true;
    
    try {
      const unsyncedData = await this.offlineStorage.getUnsyncedData();
      
      for (const item of unsyncedData) {
        try {
          await this.syncItem(item);
          await this.offlineStorage.markAsSynced(item.id);
        } catch (error) {
          console.error('Failed to sync item:', item.id, error);
        }
      }
      
      // Clean up synced data
      await this.offlineStorage.clearSyncedData();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncItem(item: OfflineData): Promise<void> {
    const { type, data } = item;
    
    switch (type) {
      case 'journal':
        await this.syncJournal(data);
        break;
      case 'mood':
        await this.syncMood(data);
        break;
      case 'aura':
        await this.syncAura(data);
        break;
      case 'message':
        await this.syncMessage(data);
        break;
      case 'friend_request':
        await this.syncFriendRequest(data);
        break;
      case 'group_activity':
        await this.syncGroupActivity(data);
        break;
    }
  }

  private async syncJournal(data: any): Promise<void> {
    const response = await fetch('/api/journals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync journal');
    }
  }

  private async syncMood(data: any): Promise<void> {
    const response = await fetch('/api/mood', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync mood');
    }
  }

  private async syncAura(data: any): Promise<void> {
    const response = await fetch('/api/aura', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync aura');
    }
  }

  private async syncMessage(data: any): Promise<void> {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync message');
    }
  }

  private async syncFriendRequest(data: any): Promise<void> {
    const response = await fetch('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync friend request');
    }
  }

  private async syncGroupActivity(data: any): Promise<void> {
    const response = await fetch('/api/groups/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync group activity');
    }
  }

  getOfflineStorage(): OfflineStorage {
    return this.offlineStorage;
  }

  getNetworkManager(): NetworkManager {
    return this.networkManager;
  }
}

// Export singleton instances
export const syncManager = new SyncManager();
export const offlineStorage = new OfflineStorage();
export const networkManager = new NetworkManager();

// React hook for offline functionality
export function useOfflineSync() {
  const [isOnline, setIsOnline] = React.useState(
    typeof window !== 'undefined' ? networkManager.getOnlineStatus() : true
  );
  const [syncStatus, setSyncStatus] = React.useState<'idle' | 'syncing' | 'error'>('idle');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const removeListener = networkManager.addListener(setIsOnline);
      return removeListener;
    }
  }, []);

  const saveOffline = async (type: OfflineData['type'], data: any) => {
    if (typeof window === 'undefined') {
      throw new Error('Offline storage not available on server');
    }
    
    try {
      const id = await syncManager.saveOffline(type, data);
      return id;
    } catch (error) {
      console.error('Failed to save offline:', error);
      throw error;
    }
  };

  const triggerSync = async () => {
    if (typeof window === 'undefined') return;
    
    setSyncStatus('syncing');
    try {
      await syncManager.syncData();
      setSyncStatus('idle');
    } catch (error) {
      setSyncStatus('error');
      console.error('Sync failed:', error);
    }
  };

  return {
    isOnline,
    syncStatus,
    saveOffline,
    triggerSync
  };
}