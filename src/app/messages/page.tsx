'use client';
import React from 'react';
import MessagingHub from '@/components/messaging/MessagingHub';

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AuraX Messages
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Secure, encrypted messaging with friends and groups
          </p>
        </div>
        
        {/* Messaging Hub */}
        <div className="h-[calc(100vh-140px)]">
          <MessagingHub className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}