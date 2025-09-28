'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Import all functions to test
import { createAuraPost } from '@/lib/friends';
import { createPost } from '@/lib/socialSystem';
import { sendTextMessage } from '@/lib/chat';
import { sendEncryptedMessage, createOrGetChatSession } from '@/lib/enhancedChat';
import { sendMessage } from '@/lib/socialSystem';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function DebugAllSystemsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');

  const addResult = (message: string, success: boolean, details?: unknown) => {
    const icon = success ? '✅' : '❌';
    const timestamp = new Date().toLocaleTimeString();
    let resultMessage = `[${timestamp}] ${icon} ${message}`;
    
    if (details) {
      resultMessage += `\n    Details: ${JSON.stringify(details, null, 2)}`;
    }
    
    setTestResults(prev => [...prev, resultMessage]);
    console.log(resultMessage);
  };

  // Test Aura Posts (24hr ephemeral)
  const testAuraPost = async () => {
    if (!user) return;
    
    try {
      addResult('Testing Aura Post creation...', true);
      
      const postId = await createAuraPost({
        user,
        content: `🧪 Test Aura story from ${user.displayName || user.email} - expires in 24hrs`,
        type: 'text',
        moodTag: 'happy',
        emoji: '😊',
        visibility: 'friends',
      });
      
      addResult('Aura Post (24hr story) created successfully', true, { postId });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult('Aura Post creation failed', false, { error: errorMessage });
    }
  };

  // Test Social Posts (permanent)
  const testSocialPost = async () => {
    if (!user) return;
    
    try {
      addResult('Testing Social Post creation...', true);
      
      const postId = await createPost({
        user,
        content: `🧪 Test social post from ${user.displayName || user.email}`,
        type: 'text',
        visibility: 'friends',
      });
      
      addResult('Social Post created successfully', true, { postId });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult('Social Post creation failed', false, { error: errorMessage });
    }
  };

  // Test all chat systems
  const testAllChats = async () => {
    if (!user || !targetUserId.trim()) {
      addResult('Need target user ID for chat tests', false);
      return;
    }
    
    const testUserId = targetUserId.trim();
    
    // Test 1: Legacy Soul Chat
    try {
      addResult('Testing Legacy Soul Chat...', true);
      await sendTextMessage({
        fromUser: user,
        toUid: testUserId,
        text: `🧪 Legacy chat test from ${user.displayName || user.email}`,
      });
      addResult('Legacy Soul Chat message sent', true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult('Legacy Soul Chat failed', false, { error: errorMessage });
    }

    // Test 2: Enhanced Encrypted Chat
    try {
      addResult('Testing Enhanced Encrypted Chat...', true);
      const chatId = await createOrGetChatSession(user.uid, testUserId);
      const messageId = await sendEncryptedMessage({
        user,
        chatId,
        content: `🧪 Enhanced encrypted chat test from ${user.displayName || user.email}`,
        type: 'text',
      });
      addResult('Enhanced Encrypted Chat message sent', true, { chatId, messageId });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult('Enhanced Encrypted Chat failed', false, { error: errorMessage });
    }

    // Test 3: Social System Chat
    try {
      addResult('Testing Social System Chat...', true);
      const chatId = `${user.uid}_${testUserId}`;
      const messageId = await sendMessage({
        user,
        chatId,
        content: `🧪 Social system chat test from ${user.displayName || user.email}`,
        type: 'text',
        participants: [user.uid, testUserId],
      });
      addResult('Social System Chat message sent', true, { chatId, messageId });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult('Social System Chat failed', false, { error: errorMessage });
    }
  };

  // Test Journal Saving
  const testJournalSaving = async () => {
    if (!user) return;
    
    try {
      addResult('Testing regular journal entry...', true);
      
      // Test regular journal
      await addDoc(collection(db, 'journals', user.uid, 'entries'), {
        entryText: `🧪 Test journal entry from ${user.displayName || user.email}`,
        moodTag: 'happy',
        activities: ['gratitude', 'journaling'],
        auraScore: 25,
        dateKey: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
      });
      
      addResult('Regular journal entry saved', true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult('Regular journal failed', false, { error: errorMessage });
    }

    try {
      addResult('Testing specialized journal entry...', true);
      
      // Test specialized journal
      await addDoc(collection(db, 'specialized-journals', user.uid, 'daily-checkin'), {
        journalType: 'daily-checkin',
        userId: user.uid,
        timestamp: serverTimestamp(),
        dateKey: new Date().toISOString().split('T')[0],
        mood: { value: 'happy', customLabel: 'Test mood' },
        heartSpeak: '🧪 Test heart speak entry',
        gratitude: ['Testing', 'Debugging', 'Problem solving'],
        challenges: 'Testing journal system functionality',
        selfCareActivities: ['Journaling', 'Problem solving'],
      });
      
      addResult('Specialized journal entry saved', true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult('Specialized journal failed', false, { error: errorMessage });
    }
  };

  const runComprehensiveTest = async () => {
    setTesting(true);
    setTestResults([]);
    
    addResult('🚀 Starting comprehensive AuraX system test...', true);
    
    // Test posts
    await testAuraPost();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testSocialPost();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test journal saving
    await testJournalSaving();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test chats if target user provided
    if (targetUserId.trim()) {
      await testAllChats();
    } else {
      addResult('Skipping chat tests - no target user ID provided', true);
    }
    
    addResult('🎉 Comprehensive test completed!', true);
    setTesting(false);
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
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-8 border border-white/20">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🧪 AuraX Complete System Debug
            </h1>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Back
            </button>
          </div>

          {/* User Info */}
          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <h3 className="font-semibold mb-2">Current User</h3>
            <div className="text-sm">
              <p><strong>ID:</strong> {user.uid}</p>
              <p><strong>Name:</strong> {user.displayName || 'Not set'}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </div>
          </div>

          {/* Target User for Chat Tests */}
          <div className="mb-8">
            <label className="block text-sm font-medium mb-2">Target User ID (for chat tests)</label>
            <input
              type="text"
              placeholder="Enter user ID to test chat with (optional)..."
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 dark:bg-gray-800/80"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              💡 Leave empty to skip chat tests, or use your own ID ({user.uid}) to test with yourself
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Post Tests */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">📱 Post Systems</h2>
              
              <button
                onClick={testAuraPost}
                disabled={testing}
                className="w-full px-4 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition disabled:opacity-50"
              >
                Test Aura Posts (24hr)
              </button>
              
              <button
                onClick={testSocialPost}
                disabled={testing}
                className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
              >
                Test Social Posts
              </button>
            </div>

            {/* Chat Tests */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">💬 Chat Systems</h2>
              
              <button
                onClick={testAllChats}
                disabled={testing || !targetUserId.trim()}
                className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
              >
                Test All Chat Systems
              </button>
              
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Tests 3 chat systems: Legacy, Enhanced, Social
              </div>
            </div>

            {/* Journal Tests */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">📖 Journal Systems</h2>
              
              <button
                onClick={testJournalSaving}
                disabled={testing}
                className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50"
              >
                Test Journal Saving
              </button>
              
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Tests regular & specialized journals
              </div>
            </div>
          </div>

          {/* Comprehensive Test */}
          <div className="text-center mb-8">
            <button
              onClick={runComprehensiveTest}
              disabled={testing}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 font-medium text-lg"
            >
              {testing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Running Complete System Test...
                </div>
              ) : (
                '🚀 Run Complete System Test'
              )}
            </button>
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
              <div className="space-y-2 font-mono text-xs max-h-96 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className={`p-3 rounded ${
                    result.includes('✅') 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                      : result.includes('❌')
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                  }`}>
                    <pre className="whitespace-pre-wrap">{result}</pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Firestore Rules Status */}
          <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-700">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">📋 Important Notes</h3>
            <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
              <p>
                <strong>Firestore Rules:</strong> Make sure you&apos;ve applied the updated rules from <code>UPDATED_FIRESTORE_RULES.txt</code> to your Firebase Console.
              </p>
              <p>
                <strong>Collections being tested:</strong>
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><code>auraPosts</code> - 24hr ephemeral stories</li>
                <li><code>posts</code> - permanent social posts</li>
                <li><code>enhancedChats/{'{chatId}'}/messages</code> - encrypted messages</li>
                <li><code>users/{'{userId}'}/chats/{'{chatId}'}/messages</code> - legacy chat</li>
                <li><code>chats/{'{chatId}'}/messages</code> - social system chat</li>
                <li><code>journals/{'{userId}'}/entries</code> - regular journal</li>
                <li><code>specialized-journals/&#123;userId&#125;/&#123;journalType&#125;</code> - specialized journals</li>
              </ul>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/aura')}
              className="px-4 py-3 bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 rounded-lg hover:bg-pink-200 dark:hover:bg-pink-900/50 transition text-sm"
            >
              ✨ Aura Feed
            </button>
            <button
              onClick={() => router.push('/friends')}
              className="px-4 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition text-sm"
            >
              👥 Friends
            </button>
            <button
              onClick={() => router.push('/journal')}
              className="px-4 py-3 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition text-sm"
            >
              📖 Journal
            </button>
            <button
              onClick={() => router.push('/journals')}
              className="px-4 py-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition text-sm"
            >
              📚 Specialized Journals
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}