'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { logOut } from '@/lib/firebaseAuth';
import { useState } from 'react';

export default function Navbar() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await logOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white/70 dark:bg-black/30 border-b border-white/20">
      <nav className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-extrabold text-xl tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500">AuraX</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/therapy" className="px-3 py-1.5 rounded-full hover:scale-105 transition-transform bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow">
            🧑‍⚕️ Therapy
          </Link>
          <Link href="/recovery" className="px-3 py-1.5 rounded-full hover:scale-105 transition-transform bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow">
            💫 Recovery
          </Link>
          <Link href="/toolkit" className="px-3 py-1.5 rounded-full hover:scale-105 transition-transform bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow">
            🧰 Toolkit
          </Link>
          <Link href="/journal" className="px-3 py-1.5 rounded-full hover:scale-105 transition-transform bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow">
            📔 Journal
          </Link>
          {user ? (
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="px-3 py-1.5 rounded-full border border-white/30 hover:bg-white/10 transition disabled:opacity-50"
            >
              {loading ? 'Signing out…' : 'Sign out'}
            </button>
          ) : (
            <Link href="/login" className="px-3 py-1.5 rounded-full border border-white/30 hover:bg-white/10 transition">
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

