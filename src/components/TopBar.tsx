'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { Bell, Search, Menu, X } from 'lucide-react';

export default function TopBar() {
  const { user, loading } = useAuth();
  const { state, toggleSearch, toggleNotifications } = useNavigation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  if (loading) return null;

  return (
    <>
      {/* Main Top Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-black/80 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
                AuraX
              </span>
            </Link>

            {/* Center: Page Title */}
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {state.pageTitle}
              </h1>
              {state.breadcrumbs.length > 0 && (
                <div className="flex items-center justify-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  {state.breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                      {crumb.href ? (
                        <Link href={crumb.href} className="hover:text-purple-500 transition">
                          {crumb.label}
                        </Link>
                      ) : (
                        <span>{crumb.label}</span>
                      )}
                      {index < state.breadcrumbs.length - 1 && <span>→</span>}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Utility Icons */}
            <div className="flex items-center gap-3">
              {user && (
                <>
                  {/* Search */}
                  <button
                    onClick={toggleSearch}
                    className={`p-2 rounded-xl transition ${
                      state.showSearch 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-purple-500'
                    }`}
                    title="Search"
                  >
                    <Search size={20} />
                  </button>

                  {/* Notifications */}
                  <button
                    onClick={toggleNotifications}
                    className={`relative p-2 rounded-xl transition ${
                      state.showNotifications 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-purple-500'
                    }`}
                    title="Notifications"
                  >
                    <Bell size={20} />
                    {/* Notification badge - would be dynamic */}
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                      <span className="sr-only">New notifications</span>
                    </span>
                  </button>

                  {/* Mobile Menu Toggle */}
                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="md:hidden p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-purple-500 transition"
                    title="Menu"
                  >
                    {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar (when expanded) */}
        {state.showSearch && user && (
          <div className="border-t border-white/20 p-4">
            <div className="max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search journals, friends, groups..."
                className="w-full px-4 py-3 bg-white/50 dark:bg-black/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Notifications Panel (when expanded) */}
        {state.showNotifications && user && (
          <div className="border-t border-white/20 p-4">
            <div className="max-w-md mx-auto">
              <h3 className="font-semibold mb-3">Recent Notifications</h3>
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium">🏆 You earned 15 Aura Points!</p>
                  <p className="text-xs text-gray-500">Completed meditation session</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-sm font-medium">👥 Sarah joined your squad</p>
                  <p className="text-xs text-gray-500">Mindful Warriors</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium">🔥 7-day streak achieved!</p>
                  <p className="text-xs text-gray-500">Keep up the great work</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)} />
          <div className="absolute top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Menu</h2>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Mobile menu items would go here */}
              <div className="space-y-4">
                <Link href="/toolkit" className="block p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  🧰 Wellness Toolkit
                </Link>
                <Link href="/recovery" className="block p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  🔄 Recovery Hub
                </Link>
                <Link href="/therapy-support" className="block p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  🫂 Therapy Support
                </Link>
                <hr className="border-gray-200 dark:border-gray-700" />
                <Link href="/help" className="block p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  ❓ Help & Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}