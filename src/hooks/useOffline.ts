/**
 * useOffline Hook
 * Provides offline functionality for the app
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { offlineStorage, OfflineData } from '@/lib/offlineStorage';
import { syncService, SyncResult } from '@/lib/syncService';

export interface UseOfflineReturn {
  isOnline: boolean;
  isOfflineMode: boolean;
  unsyncedCount: number;
  syncStatus: {
    isRunning: boolean;
    unsyncedCount: number;
    isOnline: boolean;
    lastSync?: number;
  };
  saveOffline: (type: OfflineData['type'], data: any, userId: string) => Promise<string>;
  getOfflineData: (type: OfflineData['type'], userId: string) => OfflineData[];
  forceSync: () => Promise<SyncResult>;
  onSync: (callback: (result: SyncResult) => void) => () => void;
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState(syncService.getSyncStatus());

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update unsynced count
  useEffect(() => {
    const updateUnsyncedCount = () => {
      const unsyncedData = offlineStorage.getUnsyncedData();
      setUnsyncedCount(unsyncedData.length);
    };

    updateUnsyncedCount();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'aura_offline_data' || e.key === 'aura_sync_queue') {
        updateUnsyncedCount();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Update sync status
  useEffect(() => {
    const updateSyncStatus = () => {
      setSyncStatus(syncService.getSyncStatus());
    };

    updateSyncStatus();

    // Listen for sync events
    const unsubscribe = syncService.onSync((result) => {
      updateSyncStatus();
    });

    return unsubscribe;
  }, []);

  // Save data offline
  const saveOffline = useCallback(async (
    type: OfflineData['type'], 
    data: any, 
    userId: string
  ): Promise<string> => {
    return offlineStorage.saveOffline(type, data, userId);
  }, []);

  // Get offline data
  const getOfflineData = useCallback((
    type: OfflineData['type'], 
    userId: string
  ): OfflineData[] => {
    return offlineStorage.getOfflineDataByType(type, userId);
  }, []);

  // Force sync
  const forceSync = useCallback(async (): Promise<SyncResult> => {
    return syncService.forceSync();
  }, []);

  // Listen to sync events
  const onSync = useCallback((callback: (result: SyncResult) => void) => {
    return syncService.onSync(callback);
  }, []);

  return {
    isOnline,
    isOfflineMode: !isOnline,
    unsyncedCount,
    syncStatus,
    saveOffline,
    getOfflineData,
    forceSync,
    onSync
  };
}