'use client';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auraAvatars, AuraAvatar, getAvatarsByCategory, getAvatarsByRarity } from '@/lib/auraAvatars';

interface AuraAvatarGalleryProps {
  selectedAvatarId?: string;
  onSelectAvatar: (avatar: AuraAvatar) => void;
  className?: string;
  showCategories?: boolean;
  showRarity?: boolean;
  userLevel?: number;
}

export default function AuraAvatarGallery({
  selectedAvatarId,
  onSelectAvatar,
  className = '',
  showCategories = true,
  showRarity = true,
  userLevel = 1
}: AuraAvatarGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<AuraAvatar['category'] | 'all'>('all');
  const [selectedRarity, setSelectedRarity] = useState<AuraAvatar['rarity'] | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: 'All', emoji: '🌟', count: auraAvatars.length },
    { id: 'nature', name: 'Nature', emoji: '🌿', count: getAvatarsByCategory('nature').length },
    { id: 'cosmic', name: 'Cosmic', emoji: '🌌', count: getAvatarsByCategory('cosmic').length },
    { id: 'energy', name: 'Energy', emoji: '⚡', count: getAvatarsByCategory('energy').length },
    { id: 'animal', name: 'Animal', emoji: '🦋', count: getAvatarsByCategory('animal').length },
    { id: 'mystical', name: 'Mystical', emoji: '🔮', count: getAvatarsByCategory('mystical').length },
    { id: 'minimal', name: 'Minimal', emoji: '⭕', count: getAvatarsByCategory('minimal').length },
  ];

  const rarities = [
    { id: 'all', name: 'All', color: 'gray', count: auraAvatars.length },
    { id: 'common', name: 'Common', color: 'green', count: getAvatarsByRarity('common').length },
    { id: 'rare', name: 'Rare', color: 'blue', count: getAvatarsByRarity('rare').length },
    { id: 'epic', name: 'Epic', color: 'purple', count: getAvatarsByRarity('epic').length },
    { id: 'legendary', name: 'Legendary', color: 'gold', count: getAvatarsByRarity('legendary').length },
  ];

  const filteredAvatars = useMemo(() => {
    let filtered = auraAvatars;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(avatar => avatar.category === selectedCategory);
    }

    // Filter by rarity
    if (selectedRarity !== 'all') {
      filtered = filtered.filter(avatar => avatar.rarity === selectedRarity);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(avatar =>
        avatar.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        avatar.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by user level (unlock level)
    filtered = filtered.filter(avatar => 
      !avatar.unlockLevel || avatar.unlockLevel <= userLevel
    );

    return filtered;
  }, [selectedCategory, selectedRarity, searchTerm, userLevel]);

  const getRarityColor = (rarity: AuraAvatar['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-green-600 dark:text-green-400';
      case 'rare': return 'text-blue-600 dark:text-blue-400';
      case 'epic': return 'text-purple-600 dark:text-purple-400';
      case 'legendary': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getRarityBgColor = (rarity: AuraAvatar['rarity']) => {
    switch (rarity) {
      case 'common': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'rare': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'epic': return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'legendary': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default: return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Aura Avatars™
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Choose your unique identity - express yourself while protecting your privacy ✨
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search avatars..."
          className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
      </div>

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

      {/* Avatar Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
        <AnimatePresence>
          {filteredAvatars.map((avatar) => (
            <motion.button
              key={avatar.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              onClick={() => onSelectAvatar(avatar)}
              className={`relative group p-3 rounded-xl border-2 transition-all duration-200 ${
                selectedAvatarId === avatar.id
                  ? 'border-purple-500 ring-2 ring-purple-200 dark:ring-purple-800 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/10'
              }`}
            >
              {/* Avatar Emoji */}
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">
                {avatar.emoji}
              </div>

              {/* Rarity Indicator */}
              <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${getRarityBgColor(avatar.rarity)}`}>
                <div className={`w-full h-full rounded-full ${getRarityColor(avatar.rarity)} flex items-center justify-center text-xs font-bold`}>
                  {avatar.rarity.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Premium Badge */}
              {avatar.isPremium && (
                <div className="absolute -top-1 -left-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                  <span className="text-xs text-white font-bold">$</span>
                </div>
              )}

              {/* Locked Indicator */}
              {avatar.unlockLevel && avatar.unlockLevel > userLevel && (
                <div className="absolute inset-0 bg-gray-900/50 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">🔒</span>
                </div>
              )}

              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                <div className="font-medium">{avatar.name}</div>
                <div className="text-xs opacity-80">{avatar.description}</div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Results Count */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredAvatars.length} of {auraAvatars.length} avatars
      </div>

      {/* Selected Avatar Details */}
      {selectedAvatarId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800"
        >
          {(() => {
            const selectedAvatar = auraAvatars.find(avatar => avatar.id === selectedAvatarId);
            if (!selectedAvatar) return null;
            
            return (
              <div className="flex items-center gap-4">
                <div className="text-4xl">{selectedAvatar.emoji}</div>
                <div>
                  <h3 className="font-semibold text-purple-800 dark:text-purple-200">
                    {selectedAvatar.name}
                  </h3>
                  <p className="text-sm text-purple-600 dark:text-purple-300">
                    {selectedAvatar.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${getRarityBgColor(selectedAvatar.rarity)} ${getRarityColor(selectedAvatar.rarity)}`}>
                      {selectedAvatar.rarity.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedAvatar.category}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}
    </div>
  );
}