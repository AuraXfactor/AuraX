'use client';
import React, { Suspense } from 'react';
import MessagingHub from '@/components/messaging/MessagingHub';
import ChatPerformanceMonitor from '@/components/performance/ChatPerformanceMonitor';

function MessagesContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            💬 AuraX Messages
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            ✨ Secure, encrypted messaging with friends and groups
          </p>
        </div>
        
        {/* Messaging Hub */}
        <div className="h-[calc(100vh-140px)]">
          <MessagingHub className="w-full h-full" />
        </div>
        
        {/* Performance Monitor */}
        <ChatPerformanceMonitor />
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}