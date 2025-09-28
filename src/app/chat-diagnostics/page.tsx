'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ChatDiagnosticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [consoleMessages, setConsoleMessages] = useState<string[]>([]);

  useEffect(() => {
    // Capture console logs for debugging
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      if (message.includes('🚀') || message.includes('📤') || message.includes('✅') || message.includes('❌')) {
        setConsoleMessages(prev => [...prev.slice(-20), `[LOG] ${new Date().toLocaleTimeString()}: ${message}`]);
      }
      
      originalLog(...args);
    };
    
    console.error = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setConsoleMessages(prev => [...prev.slice(-20), `[ERROR] ${new Date().toLocaleTimeString()}: ${message}`]);
      originalError(...args);
    };
    
    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Login</h1>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-8 border border-white/20">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🔍 Live Chat Diagnostics
            </h1>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Back
            </button>
          </div>

          {/* Instructions */}
          <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
            <h2 className="text-xl font-semibold mb-4 text-blue-800 dark:text-blue-300">🧪 How to Use This Diagnostic Tool</h2>
            <div className="space-y-3 text-blue-700 dark:text-blue-300">
              <p><strong>1.</strong> Keep this page open in one tab</p>
              <p><strong>2.</strong> Open another tab and go to any chat page:</p>
              <ul className="list-disc list-inside ml-6 space-y-1">
                <li><strong>Soul Chat:</strong> Go to <code>/friends</code> → Click friend → Start chat</li>
                <li><strong>Enhanced Chat:</strong> Go to <code>/profile/[userId]</code> → Start Chat</li>
                <li><strong>Group Chat:</strong> Go to <code>/groups/[groupId]</code></li>
              </ul>
              <p><strong>3.</strong> Try sending a message</p>
              <p><strong>4.</strong> Watch the console logs below in real-time</p>
            </div>
          </div>

          {/* User Info */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <h3 className="font-semibold mb-2">Current User Info</h3>
            <div className="text-sm space-y-1">
              <p><strong>User ID:</strong> <code>{user.uid}</code></p>
              <p><strong>Name:</strong> {user.displayName || 'Not set'}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Logged In:</strong> ✅ Yes</p>
            </div>
          </div>

          {/* Quick Chat Links */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => window.open('/friends', '_blank')}
              className="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
            >
              <div className="text-xl mb-2">👥</div>
              <div className="font-medium">Friends & Soul Chat</div>
              <div className="text-sm opacity-80">Legacy chat system</div>
            </button>
            
            <button
              onClick={() => window.open('/debug-all-systems', '_blank')}
              className="p-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition"
            >
              <div className="text-xl mb-2">🧪</div>
              <div className="font-medium">System Test</div>
              <div className="text-sm opacity-80">Test all systems</div>
            </button>
            
            <button
              onClick={() => window.open('/groups', '_blank')}
              className="p-4 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
            >
              <div className="text-xl mb-2">👨‍👩‍👧‍👦</div>
              <div className="font-medium">Group Chats</div>
              <div className="text-sm opacity-80">Group messaging</div>
            </button>
          </div>

          {/* Live Console Logs */}
          <div className="bg-gray-900 dark:bg-black rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">🖥️ Live Console Logs</h3>
              <button
                onClick={() => setConsoleMessages([])}
                className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition text-sm"
              >
                Clear Logs
              </button>
            </div>
            
            <div className="text-green-400 font-mono text-sm space-y-2 max-h-96 overflow-y-auto">
              {consoleMessages.length === 0 ? (
                <div className="text-gray-500 italic">
                  Waiting for chat activity... Try sending a message in another tab.
                </div>
              ) : (
                consoleMessages.map((msg, index) => (
                  <div key={index} className={`${
                    msg.includes('[ERROR]') ? 'text-red-400' : 
                    msg.includes('✅') ? 'text-green-400' : 
                    msg.includes('❌') ? 'text-red-400' : 
                    msg.includes('🚀') ? 'text-blue-400' : 'text-yellow-400'
                  }`}>
                    {msg}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Firestore Rules Reminder */}
          <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700">
            <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">🚨 Critical Reminder</h3>
            <p className="text-red-700 dark:text-red-300 text-sm">
              If you see permission errors in the logs above, make sure you&apos;ve updated your Firestore rules in Firebase Console with the content from <code>UPDATED_FIRESTORE_RULES.txt</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}