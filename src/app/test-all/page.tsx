'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { createAuraPost } from '@/lib/friends';
import { sendEncryptedMessage, createOrGetChatSession } from '@/lib/enhancedChat';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function TestAllPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (message: string, success: boolean) => {
    const icon = success ? '✅' : '❌';
    setTestResults(prev => [...prev, `${icon} ${message}`]);
  };

  const testPostCreation = async () => {
    if (!user) return;
    
    try {
      const postId = await createAuraPost({
        user,
        content: `Test post from ${user.displayName || user.email} at ${new Date().toLocaleTimeString()}`,
        type: 'text',
        moodTag: 'happy',
        emoji: '😊',
        visibility: 'friends',
      });
      
      addResult(`Post created successfully (ID: ${postId})`, true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`Post creation failed: ${errorMessage}`, false);
    }
  };

  const testChatSystem = async () => {
    if (!user) return;
    
    try {
      // Test creating a chat session with yourself (for testing)
      const chatId = await createOrGetChatSession(user.uid, user.uid);
      addResult(`Chat session created (ID: ${chatId})`, true);
      
      // Test sending a message
      const messageId = await sendEncryptedMessage({
        user,
        chatId,
        content: `Test message from ${user.displayName || user.email}`,
        type: 'text',
      });
      
      addResult(`Chat message sent successfully (ID: ${messageId})`, true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`Chat test failed: ${errorMessage}`, false);
    }
  };

  const testJournalEntry = async () => {
    if (!user) return;
    
    try {
      await addDoc(collection(db, 'journals', user.uid, 'entries'), {
        entryText: `Test journal entry from ${user.displayName || user.email} at ${new Date().toLocaleTimeString()}`,
        moodTag: 'happy',
        activities: ['gratitude', 'journaling'],
        affirmation: 'I am testing the journal system successfully',
        auraScore: 25,
        dateKey: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
        voiceMemoUrl: null,
      });
      
      addResult('Journal entry created successfully', true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`Journal entry failed: ${errorMessage}`, false);
    }
  };

  const runAllTests = async () => {
    if (!user) return;
    
    setTesting(true);
    setTestResults([]);
    
    addResult('Starting comprehensive system test...', true);
    
    await testPostCreation();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay
    
    await testChatSystem();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testJournalEntry();
    
    addResult('All tests completed!', true);
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-8 border border-white/20">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🧪 AuraX System Test
            </h1>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Back
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Individual Tests</h2>
              
              <button
                onClick={testPostCreation}
                disabled={testing}
                className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
              >
                Test Post Creation
              </button>
              
              <button
                onClick={testChatSystem}
                disabled={testing}
                className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
              >
                Test Chat System
              </button>
              
              <button
                onClick={testJournalEntry}
                disabled={testing}
                className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50"
              >
                Test Journal Entry
              </button>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Comprehensive Test</h2>
              
              <button
                onClick={runAllTests}
                disabled={testing}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 font-medium text-lg"
              >
                {testing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Testing...
                  </div>
                ) : (
                  'Run All Tests'
                )}
              </button>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                This will test post creation, chat messaging, and journal entries with proper permissions.
              </div>
            </div>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Test Results</h3>
              <div className="space-y-2 font-mono text-sm max-h-64 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className={`p-2 rounded ${
                    result.startsWith('✅') 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                      : result.startsWith('❌')
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                  }`}>
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Navigation */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/aura')}
              className="px-4 py-3 bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 rounded-lg hover:bg-pink-200 dark:hover:bg-pink-900/50 transition text-sm"
            >
              📱 Aura Feed
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
              onClick={() => router.push('/journal/history')}
              className="px-4 py-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition text-sm"
            >
              📚 Journal History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}