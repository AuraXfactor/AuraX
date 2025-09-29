'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

// Smart navigation that doesn't break existing functionality
// Just adds a better organized overlay system

interface NavTab {
  id: string;
  label: string;
  icon: string;
  color: string;
  items: Array<{
    label: string;
    href: string;
    icon: string;
    description: string;
  }>;
}

const NAV_TABS: NavTab[] = [
  {
    id: 'journal',
    label: 'Journal',
    icon: '📔',
    color: 'from-rose-500 to-orange-500',
    items: [
      { label: 'Write Entry', href: '/journal', icon: '✍️', description: 'Create a new journal entry' },
      { label: 'Recent Entries', href: '/journal', icon: '📄', description: 'View your latest entries' },
      { label: 'Toolkit', href: '/toolkit', icon: '🧰', description: 'Meditations, workouts, tools' },
      { label: 'Recovery Hub', href: '/recovery', icon: '🔄', description: 'Addiction support tools' },
    ],
  },
  {
    id: 'connect',
    label: 'Connect',
    icon: '🌟',
    color: 'from-purple-500 to-pink-500',
    items: [
      { label: 'Aura Feed', href: '/aura', icon: '✨', description: 'View friends\' 24h glimpses' },
      { label: 'Friends', href: '/friends', icon: '👥', description: 'Manage your network' },
      { label: 'Groups', href: '/groups', icon: '💬', description: 'Group conversations' },
      { label: 'Direct Chat', href: '/soulchat', icon: '💭', description: 'Private messages' },
    ],
  },
  {
    id: 'points',
    label: 'Points',
    icon: '🏆',
    color: 'from-yellow-500 to-orange-500',
    items: [
      { label: 'Dashboard', href: '/aura-points', icon: '📊', description: 'Your points overview' },
      { label: 'Aura Squads', href: '/squads', icon: '👥', description: 'Team challenges' },
      { label: 'Earn Points', href: '/aura-points?tab=earn', icon: '💰', description: 'How to earn more' },
      { label: 'Rewards Store', href: '/aura-points?tab=rewards', icon: '🏪', description: 'Spend your points' },
    ],
  },
  {
    id: 'profile',
    label: 'Me',
    icon: '👤',
    color: 'from-indigo-500 to-purple-500',
    items: [
      { label: 'Profile', href: '/profile', icon: '📊', description: 'Your wellness stats' },
      { label: 'Settings', href: '/settings', icon: '⚙️', description: 'App preferences' },
      { label: 'Therapy Support', href: '/therapy-support', icon: '🫂', description: 'Professional help' },
      { label: 'Help', href: '/settings#help', icon: '❓', description: 'Support & export' },
    ],
  },
];

export default function SmartBottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);

  // Don't show on auth pages
  if (!user || pathname.includes('/login') || pathname.includes('/signup') || pathname.includes('/onboarding')) {
    return null;
  }

  // Determine active tab based on current route
  const getActiveTab = () => {
    if (pathname.startsWith('/journal') || pathname.startsWith('/toolkit') || pathname.startsWith('/recovery')) {
      return 'journal';
    }
    if (pathname.startsWith('/aura') || pathname.startsWith('/friends') || pathname.startsWith('/groups') || pathname.startsWith('/soulchat')) {
      return 'connect';
    }
    if (pathname.startsWith('/aura-points') || pathname.startsWith('/squads')) {
      return 'points';
    }
    if (pathname.startsWith('/profile') || pathname.startsWith('/settings') || pathname.startsWith('/therapy-support')) {
      return 'profile';
    }
    return 'journal'; // default
  };

  const activeTab = getActiveTab();

  const handleTabClick = (tabId: string) => {
    if (activeOverlay === tabId) {
      setActiveOverlay(null);
    } else {
      setActiveOverlay(tabId);
    }
  };

  return (
    <>
      {/* Overlay Menu */}
      {activeOverlay && (
        <div className="fixed inset-0 z-40" onClick={() => setActiveOverlay(null)}>
          <div className="absolute bottom-20 left-0 right-0 bg-white/95 dark:bg-black/95 backdrop-blur-lg border-t border-white/20 p-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">
                  {NAV_TABS.find(tab => tab.id === activeOverlay)?.icon} {NAV_TABS.find(tab => tab.id === activeOverlay)?.label}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">Choose what you want to do</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {NAV_TABS.find(tab => tab.id === activeOverlay)?.items.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setActiveOverlay(null)}
                    className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition text-center group"
                  >
                    <div className="text-4xl mb-3 group-hover:scale-110 transition">{item.icon}</div>
                    <h3 className="font-bold text-lg mb-2">{item.label}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-lg border-t border-white/20 safe-area-bottom">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-around">
            {NAV_TABS.map(tab => {
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${
                    isActive 
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg` 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="relative">
                    <span className="text-2xl">{tab.icon}</span>
                    
                    {/* Active indicator dot */}
                    {isActive && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                    )}
                  </div>
                  
                  <span className={`text-xs font-medium ${isActive ? 'font-bold' : ''}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* iOS safe area */}
        <div className="h-safe-area-inset-bottom bg-white/95 dark:bg-black/95"></div>
      </nav>

      {/* Content padding for bottom nav */}
      <style jsx global>{`
        body {
          padding-bottom: 90px;
        }
        
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          body {
            padding-bottom: calc(90px + env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </>
  );
}