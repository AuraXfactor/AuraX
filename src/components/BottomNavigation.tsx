'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation, MainTab, NAVIGATION_CONFIG } from '@/contexts/NavigationContext';
import { getUserAuraStats, listenToUserAuraStats, UserAuraStats } from '@/lib/auraPoints';
import { useEffect } from 'react';

export default function BottomNavigation() {
  const { user } = useAuth();
  const { state, setActiveTab, getNavigationConfig } = useNavigation();
  const [userStats, setUserStats] = useState<UserAuraStats | null>(null);
  const [showSubMenu, setShowSubMenu] = useState<MainTab | null>(null);
  const config = getNavigationConfig();

  useEffect(() => {
    if (!user) return;

    // Listen to user stats for points display
    const unsubscribe = listenToUserAuraStats(user.uid, (stats) => {
      setUserStats(stats);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) return null;

  const handleTabClick = (tab: MainTab) => {
    if (showSubMenu === tab) {
      setShowSubMenu(null);
    } else {
      setShowSubMenu(tab);
      setActiveTab(tab);
    }
  };

  const handleSubTabClick = (tab: MainTab, subTab: string) => {
    setActiveTab(tab, subTab);
    setShowSubMenu(null);
  };

  return (
    <>
      {/* Sub-menu overlay */}
      {showSubMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowSubMenu(null)}>
          <div className="absolute bottom-20 left-0 right-0 bg-white/95 dark:bg-black/95 backdrop-blur-lg border-t border-white/20 p-4">
            <div className="max-w-md mx-auto">
              <h3 className="font-bold text-lg mb-4 text-center">
                {config[showSubMenu].icon} {config[showSubMenu].label}
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {config[showSubMenu].subTabs.map(subTab => (
                  <Link
                    key={subTab.id}
                    href={subTab.href}
                    onClick={() => handleSubTabClick(showSubMenu, subTab.id)}
                    className={`p-4 rounded-xl border transition ${
                      state.subTab === subTab.id && state.activeTab === showSubMenu
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">{subTab.icon}</div>
                      <div className="font-medium text-sm">{subTab.label}</div>
                      {subTab.description && (
                        <div className="text-xs text-gray-500 mt-1">{subTab.description}</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-lg border-t border-white/20">
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex items-center justify-around">
            {(Object.keys(config) as MainTab[]).map(tab => {
              const tabConfig = config[tab];
              const isActive = state.activeTab === tab;
              
              return (
                <button
                  key={tab}
                  onClick={() => handleTabClick(tab)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-purple-500'
                  }`}
                >
                  <div className="relative">
                    <span className="text-xl">{tabConfig.icon}</span>
                    
                    {/* Special indicators */}
                    {tab === 'points' && userStats?.availablePoints && userStats.availablePoints > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {userStats.availablePoints > 999 ? '9+' : Math.floor(userStats.availablePoints / 100) || ''}
                      </span>
                    )}
                    
                    {tab === 'connect' && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></span>
                    )}
                  </div>
                  
                  <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                    {tabConfig.label}
                  </span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="w-1 h-1 bg-purple-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom safe area for iOS */}
        <div className="h-safe-bottom bg-white/95 dark:bg-black/95"></div>
      </nav>

      {/* Content padding to account for bottom nav */}
      <div className="h-20"></div>
    </>
  );
}