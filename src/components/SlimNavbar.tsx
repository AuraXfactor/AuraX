'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { logOut } from '@/lib/firebaseAuth';
import { Bell, Search, Menu, X } from 'lucide-react';

export default function SlimNavbar() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await logOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur bg-white/80 dark:bg-black/80 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
                AuraX
              </span>
            </Link>

            {/* Right: Auth + Utils */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* Search */}
                  <button
                    onClick={() => setShowSearch(!showSearch)}
                    className={`p-2 rounded-xl transition ${
                      showSearch 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-purple-500'
                    }`}
                    title="Search"
                  >
                    <Search size={18} />
                  </button>

                  {/* Notifications */}
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative p-2 rounded-xl transition ${
                      showNotifications 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-purple-500'
                    }`}
                    title="Notifications"
                  >
                    <Bell size={18} />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>

                  {/* Profile Menu */}
                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="flex items-center gap-2 p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">
                        {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                    {showMobileMenu ? <X size={16} /> : <Menu size={16} />}
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link 
                    href="/login" 
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-purple-500 transition font-medium"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/signup" 
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition font-medium"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && user && (
            <div className="pt-4 border-t border-white/20 mt-3">
              <input
                type="text"
                placeholder="Search journals, friends, groups..."
                className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              />
            </div>
          )}

          {/* Notifications Panel */}
          {showNotifications && user && (
            <div className="pt-4 border-t border-white/20 mt-3">
              <h3 className="font-bold mb-3">Recent Activity</h3>
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm font-medium">🏆 +15 Aura Points earned!</p>
                  <p className="text-xs text-gray-500">Completed meditation</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm font-medium">✨ Friend shared new Aura</p>
                  <p className="text-xs text-gray-500">Sarah posted a moment</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Profile Menu Dropdown */}
      {showMobileMenu && user && (
        <div className="fixed top-16 right-4 z-50 w-64 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-white/20 p-4">
          <div className="space-y-3">
            <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
              <p className="font-medium">{user.displayName || user.email}</p>
              <p className="text-sm text-gray-500">Manage your account</p>
            </div>
            
            <Link 
              href="/profile" 
              onClick={() => setShowMobileMenu(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <span className="text-xl">👤</span>
              <span>Profile</span>
            </Link>
            
            <Link 
              href="/settings" 
              onClick={() => setShowMobileMenu(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <span className="text-xl">⚙️</span>
              <span>Settings</span>
            </Link>
            
            <hr className="border-gray-200 dark:border-gray-700" />
            
            <button
              onClick={() => {
                setShowMobileMenu(false);
                handleSignOut();
              }}
              disabled={loading}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition text-red-600 disabled:opacity-50"
            >
              <span className="text-xl">🚪</span>
              <span>{loading ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}