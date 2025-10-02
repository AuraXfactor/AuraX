'use client';
import React, { useState, useEffect } from 'react';
import PWAInstallButton from '@/components/PWAInstallButton';
import PWAInstallGuide from '@/components/PWAInstallGuide';

export default function PWATestPage() {
  const [isOnline, setIsOnline] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);
  const [userAgent, setUserAgent] = useState('');

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    // Check if running in standalone mode
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isInStandaloneMode || isStandaloneMode);

    // Get user agent
    setUserAgent(navigator.userAgent);

    return () => {
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">PWA Test Page</h1>
        
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-2">Connection Status</h3>
            <div className={`text-2xl ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
              {isOnline ? '🟢 Online' : '🔴 Offline'}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-2">App Mode</h3>
            <div className={`text-2xl ${isStandalone ? 'text-blue-500' : 'text-orange-500'}`}>
              {isStandalone ? '📱 Standalone' : '🌐 Browser'}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-2">Service Worker</h3>
            <div className="text-2xl text-purple-500">
              {typeof window !== 'undefined' && 'serviceWorker' in navigator ? '✅ Available' : '❌ Not Available'}
            </div>
          </div>
        </div>

        {/* Install Button */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow mb-8">
          <h3 className="text-lg font-semibold mb-4">Install App</h3>
          <PWAInstallButton className="text-lg" />
        </div>

        {/* Install Guide */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow mb-8">
          <h3 className="text-lg font-semibold mb-4">Installation Guide</h3>
          <PWAInstallGuide />
        </div>

        {/* Device Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">Device Information</h3>
          <div className="space-y-2 text-sm">
            <div><strong>User Agent:</strong> {userAgent}</div>
            <div><strong>Platform:</strong> {navigator.platform}</div>
            <div><strong>Language:</strong> {navigator.language}</div>
            <div><strong>Screen:</strong> {window.screen.width}x{window.screen.height}</div>
            <div><strong>Viewport:</strong> {window.innerWidth}x{window.innerHeight}</div>
          </div>
        </div>
      </div>
    </div>
  );
}