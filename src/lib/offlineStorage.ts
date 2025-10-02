/**
 * Offline Storage Utilities
 * Handles local storage for offline functionality
 */

export interface OfflineData {
  id: string;
  type: 'grounding' | 'breathing' | 'affirmations' | 'cbt-journal' | 'gratitude-journal' | 'daily-checkin' | 'connection-journal' | 'progress-tracker';
  data: any;
  timestamp: number;
  userId: string;
  synced: boolean;
}

export interface GroundingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  technique: string;
  duration: number;
  anxietyBefore: number;
  anxietyAfter?: number;
  focusBefore: number;
  focusAfter?: number;
  notes?: string;
}

export interface BreathingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  pattern: string;
  duration: number;
  moodBefore: number;
  moodAfter?: number;
  stressBefore: number;
  stressAfter?: number;
  notes?: string;
}

export interface AffirmationData {
  id: string;
  text: string;
  timestamp: number;
  category?: string;
}

export interface JournalEntry {
  id: string;
  journalType: string;
  data: any;
  timestamp: number;
  wordCount: number;
  completionScore: number;
}

class OfflineStorage {
  private storageKey = 'aura_offline_data';
  private syncQueueKey = 'aura_sync_queue';

  /**
   * Save data offline
   */
  async saveOffline(type: OfflineData['type'], data: any, userId: string): Promise<string> {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offlineData: OfflineData = {
      id,
      type,
      data,
      timestamp: Date.now(),
      userId,
      synced: false
    };

    // Save to local storage
    const existingData = this.getOfflineData();
    existingData.push(offlineData);
    localStorage.setItem(this.storageKey, JSON.stringify(existingData));

    // Add to sync queue
    this.addToSyncQueue(offlineData);

    return id;
  }

  /**
   * Get all offline data
   */
  getOfflineData(): OfflineData[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading offline data:', error);
      return [];
    }
  }

  /**
   * Get offline data by type
   */
  getOfflineDataByType(type: OfflineData['type'], userId: string): OfflineData[] {
    return this.getOfflineData().filter(
      item => item.type === type && item.userId === userId
    );
  }

  /**
   * Get unsynced data
   */
  getUnsyncedData(): OfflineData[] {
    if (typeof window === 'undefined') return [];
    return this.getOfflineData().filter(item => !item.synced);
  }

  /**
   * Mark data as synced
   */
  markAsSynced(id: string): void {
    if (typeof window === 'undefined') return;
    const data = this.getOfflineData();
    const item = data.find(item => item.id === id);
    if (item) {
      item.synced = true;
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    }
  }

  /**
   * Remove synced data older than 7 days
   */
  cleanupOldData(): void {
    if (typeof window === 'undefined') return;
    const data = this.getOfflineData();
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const filteredData = data.filter(item => 
      !item.synced || item.timestamp > sevenDaysAgo
    );
    localStorage.setItem(this.storageKey, JSON.stringify(filteredData));
  }

  /**
   * Add to sync queue
   */
  private addToSyncQueue(data: OfflineData): void {
    if (typeof window === 'undefined') return;
    try {
      const queue = this.getSyncQueue();
      queue.push(data);
      localStorage.setItem(this.syncQueueKey, JSON.stringify(queue));
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  }

  /**
   * Get sync queue
   */
  getSyncQueue(): OfflineData[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.syncQueueKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading sync queue:', error);
      return [];
    }
  }

  /**
   * Clear sync queue
   */
  clearSyncQueue(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.syncQueueKey);
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
  }

  /**
   * Get storage usage info
   */
  getStorageInfo(): { used: number; available: number; percentage: number } {
    if (typeof window === 'undefined') return { used: 0, available: 0, percentage: 0 };
    try {
      const data = this.getOfflineData();
      const used = JSON.stringify(data).length;
      const available = 5 * 1024 * 1024; // 5MB estimate
      const percentage = (used / available) * 100;
      
      return { used, available, percentage };
    } catch (error) {
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  /**
   * Export offline data for backup
   */
  exportOfflineData(): string {
    if (typeof window === 'undefined') return '[]';
    const data = this.getOfflineData();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import offline data from backup
   */
  importOfflineData(jsonData: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const data = JSON.parse(jsonData);
      if (Array.isArray(data)) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing offline data:', error);
      return false;
    }
  }
}

// Create singleton instance
export const offlineStorage = new OfflineStorage();

// Auto-cleanup on app start
if (typeof window !== 'undefined') {
  offlineStorage.cleanupOldData();
}