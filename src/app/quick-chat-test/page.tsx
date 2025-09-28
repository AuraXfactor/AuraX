'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { sendTextMessage } from '@/lib/chat';
import { sendEncryptedMessage, createOrGetChatSession } from '@/lib/enhancedChat';

export default function QuickChatTestPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [targetUser, setTargetUser] = useState('');
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState('');

  const testLegacyChat = async () => {
    if (!user || !message.trim() || !targetUser.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setSending(true);
    setLastResult('Sending legacy chat message...');
    
    try {
      console.log('🧪 Testing legacy chat...', { message, targetUser });
      await sendTextMessage({
        fromUser: user,
        toUid: targetUser.trim(),
        text: message.trim()
      });
      
      const result = '✅ Legacy chat message sent successfully!';
      setLastResult(result);
      console.log(result);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      const result = `❌ Legacy chat failed: ${errorMsg}`;
      setLastResult(result);
      console.error(result, error);
    } finally {
      setSending(false);
    }
  };

  const testEnhancedChat = async () => {
    if (!user || !message.trim() || !targetUser.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setSending(true);
    setLastResult('Creating enhanced chat session...');
    
    try {
      console.log('🧪 Testing enhanced chat...', { message, targetUser });
      
      const chatId = await createOrGetChatSession(user.uid, targetUser.trim());
      setLastResult(`Chat session created: ${chatId}. Sending message...`);
      
      const messageId = await sendEncryptedMessage({
        user,
        chatId,
        content: message.trim(),
        type: 'text'
      });
      
      const result = `✅ Enhanced chat message sent! ID: ${messageId}`;
      setLastResult(result);
      console.log(result);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      const result = `❌ Enhanced chat failed: ${errorMsg}`;
      setLastResult(result);
      console.error(result, error);
    } finally {
      setSending(false);
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
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-8 border border-white/20">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🚀 Quick Chat Test
            </h1>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Back
            </button>
          </div>

          <div className="space-y-6">
            {/* User Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <h3 className="font-semibold mb-2">Current User</h3>
              <p className="text-sm"><strong>ID:</strong> {user.uid}</p>
              <p className="text-sm"><strong>Name:</strong> {user.displayName || user.email}</p>
            </div>

            {/* Test Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Target User ID</label>
                <input
                  type="text"
                  placeholder="Enter user ID to send message to..."
                  value={targetUser}
                  onChange={(e) => setTargetUser(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 dark:bg-gray-800/80"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  💡 Use your own ID ({user.uid}) to test chat with yourself
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Test Message</label>
                <textarea
                  placeholder="Type your test message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 dark:bg-gray-800/80 resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Test Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={testLegacyChat}
                disabled={sending || !message.trim() || !targetUser.trim()}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 font-medium"
              >
                {sending ? 'Testing...' : 'Test Legacy Chat'}
              </button>

              <button
                onClick={testEnhancedChat}
                disabled={sending || !message.trim() || !targetUser.trim()}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 font-medium"
              >
                {sending ? 'Testing...' : 'Test Enhanced Chat'}
              </button>
            </div>

            {/* Results */}
            {lastResult && (
              <div className={`p-4 rounded-lg ${
                lastResult.includes('✅') 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                  : lastResult.includes('❌')
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
              }`}>
                <h3 className="font-semibold mb-2">Test Result:</h3>
                <p className="text-sm font-mono">{lastResult}</p>
              </div>
            )}

            {/* Instructions */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">📋 Instructions</h3>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
                <p><strong>1.</strong> Open browser console (F12) to see detailed logs</p>
                <p><strong>2.</strong> Fill in target user ID and message</p>
                <p><strong>3.</strong> Click test buttons to verify chat functionality</p>
                <p><strong>4.</strong> Check console for detailed error messages if tests fail</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => router.push('/chat-diagnostics')}
                className="px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition text-sm"
              >
                🔍 Live Diagnostics
              </button>
              <button
                onClick={() => router.push('/debug-all-systems')}
                className="px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition text-sm"
              >
                🧪 Full System Test
              </button>
              <button
                onClick={() => router.push('/friends')}
                className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition text-sm"
              >
                👥 Friends
              </button>
              <button
                onClick={() => router.push('/aura')}
                className="px-3 py-2 bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 rounded-lg hover:bg-pink-200 dark:hover:bg-pink-900/50 transition text-sm"
              >
                ✨ Aura Feed
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}