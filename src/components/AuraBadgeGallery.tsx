'use client';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auraBadges, AuraBadge, getBadgesByCategory, getBadgesByRarity, getUnlockedBadges, getNextBadge } from '@/lib/auraBadges';

interface AuraBadgeGalleryProps {
  userStats?: {
    journalEntries?: number;
    streakDays?: number;
    auraPoints?: number;
    friendsAdded?: number;
    vibeChecks?: number;
    focusGoals?: number;
    daysActive?: number;
    isEarlyAdopter?: boolean;
    unlockedAvatars?: number;
    completedFocusAreas?: number;
  };
  className?: string;
  showCategories?: boolean;
  showRarity?: boolean;
  showProgress?: boolean;
}

export default function AuraBadgeGallery({
  userStats = {},
  className = '',
  showCategories = true,
  showRarity = true,
  showProgress = true
}: AuraBadgeGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<AuraBadge['category'] | 'all'>('all');
  const [selectedRarity, setSelectedRarity] = useState<AuraBadge['rarity'] | 'all'>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  const categories = [
    { id: 'all', name: 'All', emoji: '🏆', count: auraBadges.length },
    { id: 'wellness', name: 'Wellness', emoji: '🌱', count: getBadgesByCategory('wellness').length },
    { id: 'social', name: 'Social', emoji: '👥', count: getBadgesByCategory('social').length },
    { id: 'achievement', name: 'Achievement', emoji: '💎', count: getBadgesByCategory('achievement').length },
    { id: 'streak', name: 'Streak', emoji: '🔥', count: getBadgesByCategory('streak').length },
    { id: 'milestone', name: 'Milestone', emoji: '📅', count: getBadgesByCategory('milestone').length },
    { id: 'special', name: 'Special', emoji: '✨', count: getBadgesByCategory('special').length },
  ];

  const rarities = [
    { id: 'all', name: 'All', color: 'gray', count: auraBadges.length },
    { id: 'common', name: 'Common', color: 'green', count: getBadgesByRarity('common').length },
    { id: 'rare', name: 'Rare', color: 'blue', count: getBadgesByRarity('rare').length },
    { id: 'epic', name: 'Epic', color: 'purple', count: getBadgesByRarity('epic').length },
    { id: 'legendary', name: 'Legendary', color: 'gold', count: getBadgesByRarity('legendary').length },
  ];

  const unlockedBadges = useMemo(() => getUnlockedBadges(userStats), [userStats]);
  const nextBadge = useMemo(() => getNextBadge(userStats), [userStats]);

  const filteredBadges = useMemo(() => {
    let filtered = auraBadges;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(badge => badge.category === selectedCategory);
    }

    // Filter by rarity
    if (selectedRarity !== 'all') {
      filtered = filtered.filter(badge => badge.rarity === selectedRarity);
    }

    // Filter by unlocked status
    if (showUnlockedOnly) {
      filtered = filtered.filter(badge => 
        unlockedBadges.some(unlocked => unlocked.id === badge.id)
      );
    }

    return filtered;
  }, [selectedCategory, selectedRarity, showUnlockedOnly, unlockedBadges]);

  const getRarityColor = (rarity: AuraBadge['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-green-600 dark:text-green-400';
      case 'rare': return 'text-blue-600 dark:text-blue-400';
      case 'epic': return 'text-purple-600 dark:text-purple-400';
      case 'legendary': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getRarityBgColor = (rarity: AuraBadge['rarity']) => {
    switch (rarity) {
      case 'common': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'rare': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'epic': return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'legendary': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default: return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getProgress = (badge: AuraBadge) => {
    if (unlockedBadges.some(unlocked => unlocked.id === badge.id)) {
      return { current: badge.requirement.value, total: badge.requirement.value, percentage: 100 };
    }

    let current = 0;
    switch (badge.requirement.type) {
      case 'journal_entries':
        current = userStats.journalEntries || 0;
        break;
      case 'streak_days':
        current = userStats.streakDays || 0;
        break;
      case 'aura_points':
        current = userStats.auraPoints || 0;
        break;
      case 'friends_added':
        current = userStats.friendsAdded || 0;
        break;
      case 'vibe_checks':
        current = userStats.vibeChecks || 0;
        break;
      case 'focus_goals':
        current = userStats.focusGoals || 0;
        break;
      case 'special':
        switch (badge.id) {
          case 'first-week':
            current = userStats.daysActive || 0;
            break;
          case 'first-month':
            current = userStats.daysActive || 0;
            break;
          case 'first-year':
            current = userStats.daysActive || 0;
            break;
          default:
            current = 0;
        }
        break;
    }

    const percentage = Math.min((current / badge.requirement.value) * 100, 100);
    return { current, total: badge.requirement.value, percentage };
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Aura Badge System 🎖️
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Celebrate your wellness journey milestones and achievements
        </p>
        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400 font-semibold">
              {unlockedBadges.length}
            </span>
            <span className="text-gray-600 dark:text-gray-400">unlocked</span>
          </div>
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">
              {auraBadges.length - unlockedBadges.length}
            </span>
            <span className="text-gray-600 dark:text-gray-400">remaining</span>
          </div>
        </div>
      </div>

      {/* Next Badge Preview */}
      {nextBadge && showProgress && (
        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{nextBadge.emoji}</span>
            <div>
              <h3 className="font-semibold text-purple-800 dark:text-purple-200">
                Next Badge: {nextBadge.name}
              </h3>
              <p className="text-sm text-purple-600 dark:text-purple-300">
                {nextBadge.description}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-purple-700 dark:text-purple-300">
              <span>{nextBadge.requirement.description}</span>
              <span>{getProgress(nextBadge).current}/{getProgress(nextBadge).total}</span>
            </div>
            <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgress(nextBadge).percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-4">
        {/* Category Filter */}
        {showCategories && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition ${
                    selectedCategory === category.id
                      ? 'bg-purple-100 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{category.emoji}</span>
                  <span className="text-sm font-medium">{category.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">({category.count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Rarity Filter */}
        {showRarity && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Rarity</h3>
            <div className="flex flex-wrap gap-2">
              {rarities.map((rarity) => (
                <button
                  key={rarity.id}
                  onClick={() => setSelectedRarity(rarity.id as any)}
                  className={`px-3 py-2 rounded-lg border transition ${
                    selectedRarity === rarity.id
                      ? 'bg-purple-100 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-sm font-medium">{rarity.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({rarity.count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Unlocked Filter */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showUnlockedOnly}
              onChange={(e) => setShowUnlockedOnly(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Show only unlocked badges
            </span>
          </label>
        </div>
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredBadges.map((badge) => {
            const isUnlocked = unlockedBadges.some(unlocked => unlocked.id === badge.id);
            const progress = getProgress(badge);
            
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                  isUnlocked
                    ? 'border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                } ${!isUnlocked ? 'opacity-60' : ''}`}
              >
                {/* Badge Icon */}
                <div className="text-center mb-3">
                  <div className={`text-4xl mb-2 ${!isUnlocked ? 'grayscale' : ''}`}>
                    {badge.emoji}
                  </div>
                  <h3 className={`font-semibold ${isUnlocked ? 'text-purple-800 dark:text-purple-200' : 'text-gray-600 dark:text-gray-400'}`}>
                    {badge.name}
                  </h3>
                </div>

                {/* Badge Description */}
                <p className={`text-sm mb-3 ${isUnlocked ? 'text-purple-600 dark:text-purple-300' : 'text-gray-500 dark:text-gray-400'}`}>
                  {badge.description}
                </p>

                {/* Rarity Badge */}
                <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRarityBgColor(badge.rarity)} ${getRarityColor(badge.rarity)}`}>
                  {badge.rarity.toUpperCase()}
                </div>

                {/* Progress Bar */}
                {showProgress && !isUnlocked && (
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{badge.requirement.description}</span>
                      <span>{progress.current}/{progress.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Unlocked Indicator */}
                {isUnlocked && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}

                {/* Locked Indicator */}
                {!isUnlocked && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">🔒</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Results Count */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredBadges.length} of {auraBadges.length} badges
      </div>
    </div>
  );
}