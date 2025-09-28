'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SoulChatListPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new messaging system
    router.replace('/messages');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">
          Redirecting to new messaging system...
        </p>
      </div>
    </div>
  );
}