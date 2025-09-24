'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { getUserAuraStats, listenToUserAuraStats, UserAuraStats } from '@/lib/auraPoints';

export default function AuraPointsWidget() {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserAuraStats | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastPoints, setLastPoints] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Listen to real-time stats updates
    const unsubscribe = listenToUserAuraStats(user.uid, (stats) => {
      if (stats) {
        // Check for point increase to trigger celebration
        if (lastPoints > 0 && stats.totalPoints > lastPoints) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }
        setLastPoints(stats.totalPoints);
        setUserStats(stats);
      }
    });

    return () => unsubscribe();
  }, [user, lastPoints]);

  if (!user || !userStats) return null;

  return (
    <>
      {/* Main Widget */}
      <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        isMinimized ? 'w-16 h-16' : 'w-64 h-auto'
      }`}>
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl shadow-lg">
          {isMinimized ? (
            <button
              onClick={() => setIsMinimized(false)}
              className="w-full h-full flex items-center justify-center text-2xl font-bold"
            >
              ✨
            </button>
          ) : (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">Aura Points</h3>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="text-white/80 hover:text-white text-xl"
                >
                  ⚊
                </button>
              </div>
              
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-purple-100">Available:</span>
                  <span className="font-bold text-xl">{userStats.availablePoints.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-purple-100">Streak:</span>
                  <span className="font-bold">{userStats.currentStreak} 🔥</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-purple-100">Level:</span>
                  <span className="font-bold">{userStats.level}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-purple-100 text-sm">Daily:</span>
                  <span className="text-sm">{userStats.dailyPointsEarned}/50</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Link
                  href="/aura-points"
                  className="flex-1 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-center text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/aura-points?tab=rewards"
                  className="flex-1 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-center text-sm font-medium"
                >
                  Store
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
          <div className="animate-bounce text-6xl">
            ✨ +{userStats.totalPoints - lastPoints} pts! ✨
          </div>
        </div>
      )}
    </>
  );
}