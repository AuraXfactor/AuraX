'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Import all chat functions to test them
import { sendTextMessage } from '@/lib/chat';
import { sendEncryptedMessage, createOrGetChatSession } from '@/lib/enhancedChat';
import { sendMessage } from '@/lib/socialSystem';

export default function DebugChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');

  const addResult = (message: string, success: boolean) => {
    const icon = success ? '✅' : '❌';
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${icon} ${message}`]);
  };

  const testLegacyChat = async () => {
    if (!user || !targetUserId.trim()) {
      addResult('Need target user ID for legacy chat test', false);
      return;
    }
    
    try {
      await sendTextMessage({
        fromUser: user,
        toUid: targetUserId.trim(),
        text: `Legacy chat test from ${user.displayName || user.email} at ${new Date().toLocaleTimeString()}`,
      });
      
      addResult(`Legacy chat message sent to ${targetUserId}`, true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`Legacy chat failed: ${errorMessage}`, false);
    }
  };

  const testEnhancedChat = async () => {
    if (!user || !targetUserId.trim()) {
      addResult('Need target user ID for enhanced chat test', false);
      return;
    }
    
    try {
      const chatId = await createOrGetChatSession(user.uid, targetUserId.trim());
      addResult(`Enhanced chat session created: ${chatId}`, true);
      
      const messageId = await sendEncryptedMessage({
        user,
        chatId,
        content: `Enhanced encrypted chat test from ${user.displayName || user.email}`,
        type: 'text',
      });
      
      addResult(`Enhanced chat message sent: ${messageId}`, true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`Enhanced chat failed: ${errorMessage}`, false);
    }
  };

  const testSocialChat = async () => {
    if (!user || !targetUserId.trim()) {
      addResult('Need target user ID for social chat test', false);
      return;
    }
    
    try {
      const chatId = `${user.uid}_${targetUserId.trim()}`;
      const messageId = await sendMessage({
        user,
        chatId,
        content: `Social system chat test from ${user.displayName || user.email}`,
        type: 'text',
        participants: [user.uid, targetUserId.trim()],
      });
      
      addResult(`Social chat message sent: ${messageId}`, true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`Social chat failed: ${errorMessage}`, false);
    }
  };

  const testAllChatSystems = async () => {
    if (!targetUserId.trim()) {
      addResult('Please enter a target user ID first', false);
      return;
    }
    
    setTesting(true);
    addResult('Starting comprehensive chat system test...', true);
    
    await testLegacyChat();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testEnhancedChat();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testSocialChat();
    
    addResult('All chat system tests completed!', true);
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
              💬 Chat System Debug
            </h1>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Back
            </button>
          </div>

          {/* Target User Input */}
          <div className="mb-8">
            <label className="block text-sm font-medium mb-2">Target User ID (for testing)</label>
            <input
              type="text"
              placeholder="Enter user ID to send test messages to..."
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 dark:bg-gray-800/80"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              💡 Use your own user ID ({user.uid}) to test chat with yourself
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Individual Chat Systems</h2>
              
              <button
                onClick={testLegacyChat}
                disabled={testing || !targetUserId.trim()}
                className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
              >
                Test Legacy Chat (/soulchat)
              </button>
              
              <button
                onClick={testEnhancedChat}
                disabled={testing || !targetUserId.trim()}
                className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
              >
                Test Enhanced Chat (/chat)
              </button>
              
              <button
                onClick={testSocialChat}
                disabled={testing || !targetUserId.trim()}
                className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50"
              >
                Test Social Chat System
              </button>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Comprehensive Test</h2>
              
              <button
                onClick={testAllChatSystems}
                disabled={testing || !targetUserId.trim()}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 font-medium text-lg"
              >
                {testing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Testing All Systems...
                  </div>
                ) : (
                  'Test All Chat Systems'
                )}
              </button>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                This will test all three chat systems to identify which one is working properly.
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
              
              <button
                onClick={() => setTestResults([])}
                className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm"
              >
                Clear Results
              </button>
            </div>
          )}

          {/* Quick Navigation */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/soulchat')}
              className="px-4 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition text-sm"
            >
              💙 Soul Chat
            </button>
            <button
              onClick={() => router.push('/friends')}
              className="px-4 py-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition text-sm"
            >
              👥 Friends
            </button>
            <button
              onClick={() => router.push('/aura')}
              className="px-4 py-3 bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 rounded-lg hover:bg-pink-200 dark:hover:bg-pink-900/50 transition text-sm"
            >
              ✨ Aura Feed
            </button>
            <button
              onClick={() => router.push('/test-all')}
              className="px-4 py-3 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition text-sm"
            >
              🧪 All Tests
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}