/**
 * Sync Service
 * Handles syncing offline data to Firebase when online
 */

import { offlineStorage, OfflineData } from './offlineStorage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

class SyncService {
  private isRunning = false;
  private syncListeners: ((result: SyncResult) => void)[] = [];

  /**
   * Add sync listener
   */
  onSync(callback: (result: SyncResult) => void): () => void {
    this.syncListeners.push(callback);
    return () => {
      const index = this.syncListeners.indexOf(callback);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify sync listeners
   */
  private notifyListeners(result: SyncResult): void {
    this.syncListeners.forEach(callback => callback(result));
  }

  /**
   * Check if sync is running
   */
  isSyncRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Start automatic sync
   */
  startAutoSync(): void {
    if (typeof window === 'undefined') return;

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.syncOfflineData();
    });

    // Periodic sync every 5 minutes when online
    setInterval(() => {
      if (offlineStorage.isOnline() && !this.isRunning) {
        this.syncOfflineData();
      }
    }, 5 * 60 * 1000);

    // Initial sync if online
    if (offlineStorage.isOnline()) {
      this.syncOfflineData();
    }
  }

  /**
   * Sync offline data to Firebase
   */
  async syncOfflineData(): Promise<SyncResult> {
    if (this.isRunning) {
      return { success: false, synced: 0, failed: 0, errors: ['Sync already running'] };
    }

    if (!offlineStorage.isOnline()) {
      return { success: false, synced: 0, failed: 0, errors: ['No internet connection'] };
    }

    this.isRunning = true;
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] };

    try {
      const unsyncedData = offlineStorage.getUnsyncedData();
      
      if (unsyncedData.length === 0) {
        this.isRunning = false;
        this.notifyListeners(result);
        return result;
      }

      console.log(`Syncing ${unsyncedData.length} offline items...`);

      for (const item of unsyncedData) {
        try {
          await this.syncItem(item);
          offlineStorage.markAsSynced(item.id);
          result.synced++;
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          result.failed++;
          result.errors.push(`Failed to sync ${item.type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      result.success = result.failed === 0;
      console.log(`Sync complete: ${result.synced} synced, ${result.failed} failed`);

    } catch (error) {
      console.error('Sync error:', error);
      result.success = false;
      result.errors.push(`Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isRunning = false;
      this.notifyListeners(result);
    }

    return result;
  }

  /**
   * Sync individual item
   */
  private async syncItem(item: OfflineData): Promise<void> {
    const { type, data, userId } = item;

    switch (type) {
      case 'grounding':
        await this.syncGroundingSession(data, userId);
        break;
      case 'breathing':
        await this.syncBreathingSession(data, userId);
        break;
      case 'affirmations':
        await this.syncAffirmationData(data, userId);
        break;
      case 'cbt-journal':
        await this.syncJournalEntry('cbt-therapy', data, userId);
        break;
      case 'gratitude-journal':
        await this.syncJournalEntry('gratitude', data, userId);
        break;
      case 'daily-checkin':
        await this.syncJournalEntry('daily-checkin', data, userId);
        break;
      case 'connection-journal':
        await this.syncJournalEntry('relationship', data, userId);
        break;
      case 'progress-tracker':
        await this.syncProgressTracker(data, userId);
        break;
      default:
        throw new Error(`Unknown sync type: ${type}`);
    }
  }

  /**
   * Sync grounding session
   */
  private async syncGroundingSession(data: any, userId: string): Promise<void> {
    const sessionData = {
      ...data,
      userId,
      timestamp: serverTimestamp(),
      syncedAt: serverTimestamp()
    };

    await addDoc(collection(db, 'grounding-sessions'), sessionData);
  }

  /**
   * Sync breathing session
   */
  private async syncBreathingSession(data: any, userId: string): Promise<void> {
    const sessionData = {
      ...data,
      userId,
      timestamp: serverTimestamp(),
      syncedAt: serverTimestamp()
    };

    await addDoc(collection(db, 'breathing-sessions'), sessionData);
  }

  /**
   * Sync affirmation data
   */
  private async syncAffirmationData(data: any, userId: string): Promise<void> {
    const affirmationData = {
      ...data,
      userId,
      timestamp: serverTimestamp(),
      syncedAt: serverTimestamp()
    };

    await addDoc(collection(db, 'affirmations'), affirmationData);
  }

  /**
   * Sync journal entry
   */
  private async syncJournalEntry(journalType: string, data: any, userId: string): Promise<void> {
    const entryData = {
      ...data,
      userId,
      timestamp: serverTimestamp(),
      syncedAt: serverTimestamp()
    };

    await addDoc(collection(db, 'specialized-journals', userId, journalType), entryData);
  }

  /**
   * Sync progress tracker
   */
  private async syncProgressTracker(data: any, userId: string): Promise<void> {
    const progressData = {
      ...data,
      userId,
      timestamp: serverTimestamp(),
      syncedAt: serverTimestamp()
    };

    await addDoc(collection(db, 'progress-tracker'), progressData);
  }

  /**
   * Force sync now
   */
  async forceSync(): Promise<SyncResult> {
    return this.syncOfflineData();
  }

  /**
   * Get sync status
   */
  getSyncStatus(): { 
    isRunning: boolean; 
    unsyncedCount: number; 
    isOnline: boolean;
    lastSync?: number;
  } {
    const unsyncedData = offlineStorage.getUnsyncedData();
    return {
      isRunning: this.isRunning,
      unsyncedCount: unsyncedData.length,
      isOnline: offlineStorage.isOnline(),
      lastSync: this.getLastSyncTime()
    };
  }

  /**
   * Get last sync time
   */
  private getLastSyncTime(): number | undefined {
    try {
      const lastSync = localStorage.getItem('aura_last_sync');
      return lastSync ? parseInt(lastSync) : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Set last sync time
   */
  private setLastSyncTime(): void {
    try {
      localStorage.setItem('aura_last_sync', Date.now().toString());
    } catch (error) {
      console.error('Error setting last sync time:', error);
    }
  }
}

// Create singleton instance
export const syncService = new SyncService();

// Auto-start sync service
if (typeof window !== 'undefined') {
  syncService.startAutoSync();
}