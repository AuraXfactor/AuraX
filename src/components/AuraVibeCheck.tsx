'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface AuraVibeCheckProps {
  className?: string;
  onUpdate?: (vibe: string) => void;
}

const vibeOptions = [
  { emoji: '😎', text: 'Chilling', color: 'blue' },
  { emoji: '✨', text: 'Feeling grateful', color: 'purple' },
  { emoji: '🔥', text: 'On fire', color: 'red' },
  { emoji: '🌊', text: 'Flowing', color: 'cyan' },
  { emoji: '🌟', text: 'Shining bright', color: 'yellow' },
  { emoji: '💪', text: 'Strong & ready', color: 'green' },
  { emoji: '🎯', text: 'Focused', color: 'indigo' },
  { emoji: '🌈', text: 'Colorful vibes', color: 'pink' },
  { emoji: '☁️', text: 'Floating', color: 'gray' },
  { emoji: '⚡', text: 'Electric energy', color: 'orange' },
  { emoji: '🦋', text: 'Transforming', color: 'teal' },
  { emoji: '🌙', text: 'Mystical', color: 'slate' },
];

export default function AuraVibeCheck({ className = '', onUpdate }: AuraVibeCheckProps) {
  const { user } = useAuth();
  const [currentVibe, setCurrentVibe] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    // Load current vibe from localStorage
    if (typeof window !== 'undefined') {
      const savedVibe = localStorage.getItem(`aura_vibe_${user?.uid}`);
      const savedTimestamp = localStorage.getItem(`aura_vibe_timestamp_${user?.uid}`);
      
      if (savedVibe && savedTimestamp) {
        const timestamp = new Date(savedTimestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
        
        // Auto-reset after 48 hours
        if (hoursDiff >= 48) {
          localStorage.removeItem(`aura_vibe_${user?.uid}`);
          localStorage.removeItem(`aura_vibe_timestamp_${user?.uid}`);
          setCurrentVibe('');
          setLastUpdated(null);
        } else {
          setCurrentVibe(savedVibe);
          setLastUpdated(timestamp);
        }
      }
    }
  }, [user]);

  const updateVibe = async (vibe: string) => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      // Update in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        auraVibeCheck: vibe,
        auraVibeCheckUpdated: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setCurrentVibe(vibe);
      setLastUpdated(new Date());
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`aura_vibe_${user.uid}`, vibe);
        localStorage.setItem(`aura_vibe_timestamp_${user.uid}`, new Date().toISOString());
      }

      setShowPicker(false);
      onUpdate?.(vibe);
    } catch (error) {
      console.error('Error updating vibe check:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getVibeData = (vibe: string) => {
    return vibeOptions.find(option => option.text === vibe) || vibeOptions[0];
  };

  const getTimeUntilReset = () => {
    if (!lastUpdated) return null;
    
    const now = new Date();
    const resetTime = new Date(lastUpdated.getTime() + (48 * 60 * 60 * 1000)); // 48 hours
    const timeDiff = resetTime.getTime() - now.getTime();
    
    if (timeDiff <= 0) return null;
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
  };

  const timeUntilReset = getTimeUntilReset();

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Aura Vibe Check 🔮
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Share your current vibe with the Aura fam
        </p>
      </div>

      {currentVibe ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getVibeData(currentVibe).emoji}</span>
                <div>
                  <div className="font-semibold text-purple-800 dark:text-purple-200">
                    {currentVibe}
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-300">
                    {lastUpdated ? `Updated ${lastUpdated.toLocaleDateString()}` : 'Just updated'}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowPicker(true)}
                disabled={isUpdating}
                className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition text-sm font-medium disabled:opacity-50"
              >
                Update
              </button>
            </div>
            
            {timeUntilReset && (
              <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700">
                <div className="flex items-center justify-between text-xs text-purple-600 dark:text-purple-300">
                  <span>Auto-resets in:</span>
                  <span className="font-medium">
                    {timeUntilReset.hours}h {timeUntilReset.minutes}m
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="text-center">
          <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-3">🔮</div>
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
              No vibe set yet
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Share your current mood with the Aura community
            </p>
            <button
              onClick={() => setShowPicker(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition font-medium"
            >
              Set Your Vibe
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg"
          >
            <div className="text-center mb-4">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                What's your vibe right now?
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose how you're feeling (auto-resets in 48 hours)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {vibeOptions.map((option) => (
                <button
                  key={option.text}
                  onClick={() => updateVibe(option.text)}
                  disabled={isUpdating}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition disabled:opacity-50"
                >
                  <span className="text-xl">{option.emoji}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {option.text}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowPicker(false)}
                className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}