/**
 * Offline Status Component
 * Shows offline status and sync information
 */

'use client';

import React from 'react';
import { useOffline } from '@/hooks/useOffline';

export default function OfflineStatus() {
  const { isOfflineMode, unsyncedCount, syncStatus, forceSync } = useOffline();

  if (!isOfflineMode && unsyncedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOfflineMode && (
        <div className="mb-2 p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Working Offline
            </span>
          </div>
        </div>
      )}
      
      {unsyncedCount > 0 && (
        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {unsyncedCount} item{unsyncedCount !== 1 ? 's' : ''} pending sync
              </span>
            </div>
            
            <button
              onClick={() => forceSync()}
              disabled={syncStatus.isRunning}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition"
            >
              {syncStatus.isRunning ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}