'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DirectMessageInterface from '@/components/messaging/DirectMessageInterface';

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ chatId: string }>();
  const otherUserId = decodeURIComponent(params.chatId);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20 p-4">
      <div className="max-w-5xl mx-auto h-[calc(100vh-2rem)]">
        <DirectMessageInterface
          otherUserId={otherUserId}
          onClose={() => router.back()}
        />
      </div>
    </div>
  );
}