'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import DirectMessageInterface from '@/components/messaging/DirectMessageInterface';
import { useAuth } from '@/contexts/AuthContext';

export default function ConversationPage() {
  const { user } = useAuth();
  const params = useParams<{ otherUid: string }>();
  const otherUid = decodeURIComponent(params.otherUid);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please log in to chat
          </h1>
          <a 
            href="/login" 
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition font-medium"
          >
            Login to Continue
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto h-[calc(100vh-2rem)]">
        {/* Modern Chat Header */}
        <div className="mb-4">
          <div className="flex items-center gap-4">
            <a 
              href="/soulchat" 
              className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                AuraX Chat
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Secure, encrypted messaging
              </p>
            </div>
          </div>
        </div>
        
        {/* New Messaging Interface */}
        <DirectMessageInterface 
          otherUserId={otherUid}
          onClose={() => window.history.back()}
        />
      </div>
    </div>
  );
}