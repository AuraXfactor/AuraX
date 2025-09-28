'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { sendTextMessage } from '@/lib/chat';

export default function ChatEmergencyFixPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState('Emergency test message');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (msg: string, success: boolean) => {
    const icon = success ? '✅' : '❌';
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${icon} ${msg}`]);
  };

  const testSoulChatWithSelf = async () => {
    if (!user) {
      alert('Please log in first');
      return;
    }

    setTesting(true);
    addResult('Starting Soul Chat self-test...', true);

    try {
      console.log('🧪 Testing Soul Chat with self...', { 
        userId: user.uid, 
        message 
      });

      await sendTextMessage({
        fromUser: user,
        toUid: user.uid, // Send to self for testing
        text: message
      });

      addResult('Soul Chat message sent successfully!', true);
      addResult('✅ CHAT SYSTEM IS WORKING!', true);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addResult(`Soul Chat failed: ${errorMsg}`, false);
      
      if (errorMsg.includes('permission')) {
        addResult('🚨 SOLUTION: Update Firestore rules in Firebase Console', false);
      }
    } finally {
      setTesting(false);
    }
  };

  const testFirestoreAccess = async () => {
    if (!user) return;

    setTesting(true);
    addResult('Testing Firestore access...', true);

    try {
      // Test basic Firestore read access
      const { getDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        addResult('✅ Firestore read access working', true);
      } else {
        addResult('⚠️ User document not found', false);
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ Firestore access failed: ${errorMsg}`, false);
    } finally {
      setTesting(false);
    }
  };

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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-8 border border-white/20">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              🚨 Chat Emergency Fix
            </h1>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Back
            </button>
          </div>

          {/* Issue Description */}
          <div className="mb-8 p-6 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700">
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-300 mb-3">
              📋 Current Issue
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-4">
              Chat send button shows: <strong>&ldquo;❌ Chat session not initialized. Please refresh the page.&rdquo;</strong>
            </p>
            
            <div className="bg-white/60 dark:bg-red-800/20 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">🔧 Immediate Fix Applied</h3>
              <div className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <p>✅ Switched friend profile chats to use <strong>Soul Chat</strong> system (working)</p>
                <p>✅ Switched friends list chats to use <strong>Soul Chat</strong> system (working)</p>
                <p>✅ Enhanced error logging for Enhanced Chat system debugging</p>
                <p>✅ Added fallback error handling for profile loading</p>
              </div>
            </div>
          </div>

          {/* Emergency Tests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            {/* Test Form */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">🧪 Emergency Chat Test</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">Test Message</label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 dark:bg-gray-800/80"
                  placeholder="Type test message..."
                />
              </div>

              <div className="space-y-3">
                <button
                  onClick={testSoulChatWithSelf}
                  disabled={testing}
                  className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 font-medium"
                >
                  {testing ? 'Testing...' : '🧪 Test Soul Chat (Self)'}
                </button>

                <button
                  onClick={testFirestoreAccess}
                  disabled={testing}
                  className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 font-medium"
                >
                  {testing ? 'Testing...' : '🔍 Test Firestore Access'}
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">📋 What to Do Now</h2>
              
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <p className="font-medium text-green-800 dark:text-green-300">✅ IMMEDIATE FIX</p>
                  <p className="text-green-700 dark:text-green-300">
                    Friend chats now use Soul Chat system. Try going to Friends → Click friend → Start Chat
                  </p>
                </div>
                
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <p className="font-medium text-blue-800 dark:text-blue-300">🔍 TEST NOW</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Click the test buttons on the left to verify Soul Chat system is working
                  </p>
                </div>
                
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <p className="font-medium text-yellow-800 dark:text-yellow-300">🔧 IF STILL FAILS</p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    Update Firestore rules with content from UPDATED_FIRESTORE_RULES.txt
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Test Results</h3>
                <button
                  onClick={() => setTestResults([])}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2 font-mono text-sm max-h-64 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className={`p-2 rounded ${
                    result.includes('✅') 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                      : result.includes('❌')
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                  }`}>
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/friends')}
              className="px-4 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition text-sm"
            >
              👥 Test Friends Chat
            </button>
            <button
              onClick={() => router.push('/soulchat')}
              className="px-4 py-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition text-sm"
            >
              💙 Soul Chat List
            </button>
            <button
              onClick={() => router.push('/quick-chat-test')}
              className="px-4 py-3 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition text-sm"
            >
              🚀 Quick Test
            </button>
            <button
              onClick={() => router.push('/debug-all-systems')}
              className="px-4 py-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition text-sm"
            >
              🔧 Full Debug
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}