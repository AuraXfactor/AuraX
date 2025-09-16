"use client";
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { PointsHeader } from '@/components/PointsHeader';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isReady && user === null) {
      // Not authenticated; redirect to login preserving intended path
      const callback = encodeURIComponent(pathname || '/app');
      router.replace(`/login?redirect=${callback}`);
    }
  }, [user, isReady, router, pathname]);

  if (!isReady) {
    return (
      <div className="min-h-screen grid place-items-center p-8">
        <div className="max-w-sm w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/10 backdrop-blur">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white">✨</div>
          <div className="text-sm text-[rgba(230,230,255,0.8)]">Loading your Aura…</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <PointsHeader />
      {children}
    </div>
  );
}

