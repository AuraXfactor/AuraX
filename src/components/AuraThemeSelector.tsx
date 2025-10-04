'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auraThemes, AuraTheme, getThemesByCategory, getFreeThemes, getPremiumThemes } from '@/lib/auraThemes';

interface AuraThemeSelectorProps {
  selectedThemeId?: string;
  onSelectTheme: (theme: AuraTheme) => void;
  className?: string;
  showCategories?: boolean;
  userLevel?: number;
}

export default function AuraThemeSelector({
  selectedThemeId,
  onSelectTheme,
  className = '',
  showCategories = true,
  userLevel = 1
}: AuraThemeSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<AuraTheme['category'] | 'all'>('all');
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  const categories = [
    { id: 'all', name: 'All', emoji: '🎨', count: auraThemes.length },
    { id: 'light', name: 'Light', emoji: '☀️', count: getThemesByCategory('light').length },
    { id: 'dark', name: 'Dark', emoji: '🌙', count: getThemesByCategory('dark').length },
    { id: 'pastel', name: 'Pastel', emoji: '🌸', count: getThemesByCategory('pastel').length },
    { id: 'neon', name: 'Neon', emoji: '⚡', count: getThemesByCategory('neon').length },
    { id: 'minimal', name: 'Minimal', emoji: '⚪', count: getThemesByCategory('minimal').length },
    { id: 'nature', name: 'Nature', emoji: '🌿', count: getThemesByCategory('nature').length },
    { id: 'cosmic', name: 'Cosmic', emoji: '🌌', count: getThemesByCategory('cosmic').length },
    { id: 'gradient', name: 'Gradient', emoji: '🌈', count: getThemesByCategory('gradient').length },
  ];

  const filteredThemes = React.useMemo(() => {
    let filtered = auraThemes;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(theme => theme.category === selectedCategory);
    }

    // Filter by free/premium
    if (showFreeOnly) {
      filtered = filtered.filter(theme => !theme.isPremium);
    }

    return filtered;
  }, [selectedCategory, showFreeOnly]);

  const applyThemePreview = (theme: AuraTheme) => {
    const root = document.documentElement;
    
    // Apply CSS custom properties
    root.style.setProperty('--theme-primary', theme.colors.primary);
    root.style.setProperty('--theme-secondary', theme.colors.secondary);
    root.style.setProperty('--theme-accent', theme.colors.accent);
    root.style.setProperty('--theme-background', theme.colors.background);
    root.style.setProperty('--theme-surface', theme.colors.surface);
    root.style.setProperty('--theme-text', theme.colors.text);
    root.style.setProperty('--theme-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--theme-border', theme.colors.border);
    root.style.setProperty('--theme-success', theme.colors.success);
    root.style.setProperty('--theme-warning', theme.colors.warning);
    root.style.setProperty('--theme-error', theme.colors.error);
    root.style.setProperty('--theme-info', theme.colors.info);
  };

  const resetThemePreview = () => {
    const root = document.documentElement;
    const properties = [
      '--theme-primary', '--theme-secondary', '--theme-accent',
      '--theme-background', '--theme-surface', '--theme-text',
      '--theme-text-secondary', '--theme-border', '--theme-success',
      '--theme-warning', '--theme-error', '--theme-info'
    ];
    
    properties.forEach(prop => root.style.removeProperty(prop));
  };

  useEffect(() => {
    return () => {
      resetThemePreview();
    };
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Aura Flex Themes 🎨
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Express your style with custom color themes
        </p>
      </div>

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

        {/* Free/Premium Filter */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showFreeOnly}
              onChange={(e) => setShowFreeOnly(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Show only free themes
            </span>
          </label>
        </div>
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredThemes.map((theme) => (
            <motion.div
              key={theme.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`relative group cursor-pointer rounded-xl border-2 transition-all duration-200 ${
                selectedThemeId === theme.id
                  ? 'border-purple-500 ring-2 ring-purple-200 dark:ring-purple-800'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
              }`}
              onClick={() => onSelectTheme(theme)}
              onMouseEnter={() => applyThemePreview(theme)}
              onMouseLeave={() => resetThemePreview()}
            >
              {/* Theme Preview */}
              <div className="p-4 space-y-3">
                {/* Color Palette */}
                <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
                  <div 
                    className="flex-1" 
                    style={{ backgroundColor: theme.colors.primary }}
                  ></div>
                  <div 
                    className="flex-1" 
                    style={{ backgroundColor: theme.colors.secondary }}
                  ></div>
                  <div 
                    className="flex-1" 
                    style={{ backgroundColor: theme.colors.accent }}
                  ></div>
                  <div 
                    className="flex-1" 
                    style={{ backgroundColor: theme.colors.success }}
                  ></div>
                  <div 
                    className="flex-1" 
                    style={{ backgroundColor: theme.colors.warning }}
                  ></div>
                </div>

                {/* Theme Info */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                      {theme.name}
                    </h3>
                    {theme.isPremium && (
                      <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full font-medium">
                        PREMIUM
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {theme.description}
                  </p>
                </div>

                {/* Category Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                    {theme.category}
                  </span>
                </div>
              </div>

              {/* Premium Lock */}
              {theme.isPremium && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">$</span>
                </div>
              )}

              {/* Selected Indicator */}
              {selectedThemeId === theme.id && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Results Count */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredThemes.length} of {auraThemes.length} themes
      </div>

      {/* Theme Stats */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
            {getFreeThemes().length}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">
            Free Themes
          </div>
        </div>
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
            {getPremiumThemes().length}
          </div>
          <div className="text-sm text-yellow-700 dark:text-yellow-300">
            Premium Themes
          </div>
        </div>
      </div>
    </div>
  );
}