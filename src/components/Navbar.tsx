'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { logOut } from '@/lib/firebaseAuth';
import { useState } from 'react';
import PWAInstallButton from './PWAInstallButton';
import PWAInstallGuide from './PWAInstallGuide';

export default function Navbar() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

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
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500">AuraZ</span>
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
          <Link href="/messages" className="px-3 py-1.5 rounded-full hover:scale-105 transition-transform bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow">
            💬 Messages
          </Link>
          <Link href="/journals" className="px-3 py-1.5 rounded-full hover:scale-105 transition-transform bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow">
            📔 Journals
          </Link>
          <Link href="/toolkit" className="px-3 py-1.5 rounded-full hover:scale-105 transition-transform bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow">
            🧰 Toolkit
          </Link>
          <Link href="/chat" className="px-3 py-1.5 rounded-full hover:scale-105 transition-transform bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow">
            🤖 Auraz AI
          </Link>
          <button 
            onClick={() => setShowInstallGuide(!showInstallGuide)}
            className="px-3 py-1.5 rounded-full hover:scale-105 transition-transform bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow"
            title="Install App Guide"
          >
            📱
          </button>
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
      
      {/* Install Guide Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Install AuraZ App</h2>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <PWAInstallGuide compact={true} showTitle={false} />
          </div>
        </div>
      )}
    </header>
  );
}

