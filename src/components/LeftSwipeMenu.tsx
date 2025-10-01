'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  action?: () => void;
  color: string;
  description?: string;
  badge?: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'profile',
    label: 'My Profile',
    icon: '👤',
    href: '/profile',
    color: 'from-purple-500 to-indigo-500',
    description: 'View your wellness stats and progress'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    href: '/settings',
    color: 'from-gray-500 to-slate-500',
    description: 'Customize your experience'
  },
  {
    id: 'privacy',
    label: 'Privacy & Consent',
    icon: '🔒',
    href: '/settings#privacy',
    color: 'from-green-500 to-emerald-500',
    description: 'Manage your privacy preferences'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: '🔔',
    href: '/settings#notifications',
    color: 'from-yellow-500 to-orange-500',
    description: 'Control your notification settings'
  },
  {
    id: 'therapy',
    label: 'Therapy Support',
    icon: '🫂',
    href: '/therapy-support',
    color: 'from-blue-500 to-cyan-500',
    description: 'Professional mental health support'
  },
  {
    id: 'help',
    label: 'Help & Support',
    icon: '❓',
    href: '/help',
    color: 'from-pink-500 to-rose-500',
    description: 'Get help and contact support'
  },
  {
    id: 'export',
    label: 'Export Data',
    icon: '📤',
    action: () => {
      // Implement data export functionality
      alert('Data export feature coming soon!');
    },
    color: 'from-indigo-500 to-purple-500',
    description: 'Download your wellness data'
  },
  {
    id: 'about',
    label: 'About AuraX',
    icon: 'ℹ️',
    href: '/about',
    color: 'from-cyan-500 to-blue-500',
    description: 'Learn more about the app'
  }
];

interface LeftSwipeMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LeftSwipeMenu({ isOpen, onClose }: LeftSwipeMenuProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum distance for swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    
    if (isLeftSwipe && isOpen) {
      onClose();
    }
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.href) {
      router.push(item.href);
    } else if (item.action) {
      item.action();
    }
    onClose();
  };

  const handleSignOut = async () => {
    try {
      // Import the logout function
      const { logOut } = await import('@/lib/firebaseAuth');
      await logOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-2xl"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Menu
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  ✕
                </button>
              </div>
              
              {user && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {user.displayName || 'User'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {user.email}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {MENU_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="w-full p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${item.color} flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform`}>
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                          {item.label}
                        </div>
                        {item.description && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {item.description}
                          </div>
                        )}
                      </div>
                      {item.badge && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 text-xs rounded-full">
                          {item.badge}
                        </span>
                      )}
                      <div className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition">
                        →
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => router.push('/aura')}
                    className="p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-center"
                  >
                    <div className="text-2xl mb-1">✨</div>
                    <div className="text-xs font-medium">Share Aura</div>
                  </button>
                  <button
                    onClick={() => router.push('/journal')}
                    className="p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-center"
                  >
                    <div className="text-2xl mb-1">📔</div>
                    <div className="text-xs font-medium">Write Journal</div>
                  </button>
                  <button
                    onClick={() => router.push('/toolkit')}
                    className="p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-center"
                  >
                    <div className="text-2xl mb-1">🧰</div>
                    <div className="text-xs font-medium">Toolkit</div>
                  </button>
                  <button
                    onClick={() => router.push('/aura-points')}
                    className="p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-center"
                  >
                    <div className="text-2xl mb-1">🏆</div>
                    <div className="text-xs font-medium">Points</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSignOut}
                className="w-full p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition font-medium"
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to manage left swipe menu
export function useLeftSwipeMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const openMenu = () => setIsOpen(true);
  const closeMenu = () => setIsOpen(false);

  return {
    isOpen,
    openMenu,
    closeMenu
  };
}