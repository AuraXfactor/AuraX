'use client';
import React, { useState, useEffect } from 'react';
import { profileCache } from '@/lib/profileCache';
import { chatOptimizer } from '@/lib/chatOptimizations';

interface PerformanceStats {
  profileCacheSize: number;
  profileCacheLoading: number;
  messageCacheSize: number;
  activeListeners: number;
  lastUpdate: Date;
}

export default function ChatPerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats>({
    profileCacheSize: 0,
    profileCacheLoading: 0,
    messageCacheSize: 0,
    activeListeners: 0,
    lastUpdate: new Date(),
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      const cacheStats = profileCache.getStats();
      setStats({
        profileCacheSize: cacheStats.size,
        profileCacheLoading: cacheStats.loading,
        messageCacheSize: 0, // Would need to expose from chatOptimizer
        activeListeners: 0, // Would need to expose from chatOptimizer
        lastUpdate: new Date(),
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition z-50"
        title="Show Performance Stats"
      >
        📊
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 z-50 max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Performance</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Cached Profiles:</span>
          <span className="font-mono text-green-600 dark:text-green-400">
            {stats.profileCacheSize}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Loading:</span>
          <span className="font-mono text-yellow-600 dark:text-yellow-400">
            {stats.profileCacheLoading}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Last Update:</span>
          <span className="font-mono text-blue-600 dark:text-blue-400">
            {stats.lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            profileCache.clear();
            chatOptimizer.cleanup();
          }}
          className="w-full px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Clear Cache
        </button>
      </div>
    </div>
  );
}