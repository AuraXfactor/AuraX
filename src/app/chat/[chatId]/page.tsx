'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ChatInterface from '@/components/social/ChatInterface';

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ chatId: string }>();
  const chatId = decodeURIComponent(params.chatId);

  React.useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // For now, we'll treat this as a 1-on-1 chat
  // In a full implementation, you'd fetch chat metadata to determine participants
  const participants = [user.uid, chatId]; // Simple assumption for demo

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-sm">
          <ChatInterface
            chatId={chatId}
            participants={participants}
            isGroup={false}
          />
        </div>
      </div>
    </div>
  );
}