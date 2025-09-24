'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HubPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to journal hub by default
    router.replace('/hub/journal');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center pb-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
    </div>
  );
}