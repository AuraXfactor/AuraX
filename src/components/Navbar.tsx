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
        <div className="flex items-center gap-2">
          <Link href="/aura" className="px-3 py-1.5 rounded-full hover:scale-105 transition-transform bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow">
            ✨ Aura
          </Link>
          <Link href="/friends" className="px-3 py-1.5 rounded-full hover:scale-105 transition-transform bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow">
            👥 Friends
          </Link>
          <Link href="/groups" className="px-3 py-1.5 rounded-full hover:scale-105 transition-transform bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow">
            💬 Groups
          </Link>
          <Link href="/aura-points" className="px-3 py-1.5 rounded-full hover:scale-105 transition-transform bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow">
            🏆 Points
          </Link>
          <Link href="/soulchat" className="px-3 py-1.5 rounded-full hover:scale-105 transition-transform bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow">
            💭 Chat
          </Link>
          <Link href="/journals" className="px-3 py-1.5 rounded-full hover:scale-105 transition-transform bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow">
            📔 Journals
          </Link>
          <Link href="/toolkit" className="px-3 py-1.5 rounded-full hover:scale-105 transition-transform bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow">
            🧰 Toolkit
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/profile" className="px-3 py-1.5 rounded-full hover:scale-105 transition-transform bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow">
                👤 Profile
              </Link>
              <Link href="/settings" className="px-3 py-1.5 rounded-full hover:scale-105 transition-transform bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow">
                ⚙️ Settings
              </Link>
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="px-3 py-1.5 rounded-full border border-white/30 hover:bg-white/10 transition disabled:opacity-50"
              >
                {loading ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
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

