'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface MotivationalContent {
  quotes: string[];
  affirmations: string[];
  musicRecommendations: string[];
  vibeScore: number;
  auraColor: string;
  streak: number;
  achievements: string[];
}

interface SwagSocialLayerProps {
  currentMood?: string;
  onContentLoaded?: (content: MotivationalContent) => void;
}

export default function SwagSocialLayer({ 
  currentMood, 
  onContentLoaded 
}: SwagSocialLayerProps) {
  const { user } = useAuth();
  const [content, setContent] = useState<MotivationalContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'quotes' | 'music' | 'vibe' | 'achievements'>('quotes');
  const [showFlexMode, setShowFlexMode] = useState(false);

  useEffect(() => {
    if (user && currentMood) {
      loadMotivationalContent();
    }
  }, [user, currentMood]);

  const loadMotivationalContent = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/aura-ai/motivational-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.uid,
          mood: currentMood,
          context: 'swag_social'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to load motivational content');
      }
      
      const data = await response.json();
      const motivationalContent: MotivationalContent = {
        quotes: data.content || [],
        affirmations: data.content || [],
        musicRecommendations: [
          "Lizzo - Good as Hell",
          "Beyoncé - Formation", 
          "Ariana Grande - 7 rings",
          "Dua Lipa - Levitating",
          "Doja Cat - Say So"
        ],
        vibeScore: Math.floor(Math.random() * 100),
        auraColor: getAuraColor(currentMood || 'neutral'),
        streak: Math.floor(Math.random() * 30) + 1,
        achievements: [
          "🔥 7-day journal streak",
          "💪 Positive mindset champion",
          "🌟 Gratitude guru",
          "🎯 Goal crusher",
          "✨ Self-care superstar"
        ]
      };
      
      setContent(motivationalContent);
      onContentLoaded?.(motivationalContent);
    } catch (err) {
      console.error('Error loading motivational content:', err);
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const getAuraColor = (mood: string) => {
    const colors: Record<string, string> = {
      'excited': 'from-pink-500 to-rose-500',
      'happy': 'from-yellow-400 to-orange-500',
      'fine': 'from-teal-400 to-emerald-500',
      'neutral': 'from-slate-300 to-slate-400',
      'sad': 'from-blue-300 to-indigo-400',
      'stressed': 'from-orange-400 to-red-400',
      'anxious': 'from-cyan-400 to-blue-500',
      'angry': 'from-red-500 to-rose-600'
    };
    return colors[mood] || 'from-purple-500 to-pink-500';
  };

  const getVibeEmoji = (score: number) => {
    if (score >= 80) return '🤩';
    if (score >= 60) return '😊';
    if (score >= 40) return '😌';
    if (score >= 20) return '😐';
    return '😔';
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥🔥🔥';
    if (streak >= 14) return '🔥🔥';
    if (streak >= 7) return '🔥';
    return '💪';
  };

  if (loading) {
    return (
      <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading your vibe...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
        <div className="text-center py-4">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={loadMotivationalContent}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          ✨ Swag & Social
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('quotes')}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              activeTab === 'quotes' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Quotes
          </button>
          <button
            onClick={() => setActiveTab('music')}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              activeTab === 'music' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Music
          </button>
          <button
            onClick={() => setActiveTab('vibe')}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              activeTab === 'vibe' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Vibe
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              activeTab === 'achievements' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Flex
          </button>
        </div>
      </div>

      {activeTab === 'quotes' && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">💫</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Motivation</h3>
          </div>
          
          <div className="space-y-3">
            {content.quotes.slice(0, 3).map((quote, index) => (
              <div key={index} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✨</span>
                  <p className="text-gray-800 dark:text-gray-200 italic">"{quote}"</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={loadMotivationalContent}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:scale-105 transition"
            >
              Get New Quotes 🔄
            </button>
          </div>
        </div>
      )}

      {activeTab === 'music' && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🎵</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Vibe Playlist</h3>
          </div>
          
          <div className="space-y-2">
            {content.musicRecommendations.map((song, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <span className="text-2xl">🎶</span>
                <span className="text-gray-800 dark:text-gray-200 font-medium">{song}</span>
                <button className="ml-auto text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200">
                  ▶️
                </button>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:scale-105 transition">
              Open in Spotify 🎧
            </button>
          </div>
        </div>
      )}

      {activeTab === 'vibe' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-4">{getVibeEmoji(content.vibeScore)}</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Your Vibe Score
            </h3>
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {content.vibeScore}/100
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700 text-center">
              <div className="text-2xl mb-2">{getStreakEmoji(content.streak)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Streak</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">{content.streak} days</div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700 text-center">
              <div className="text-2xl mb-2">🌈</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Aura</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                {currentMood || 'neutral'}
              </div>
            </div>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${content.vibeScore}%` }}
            ></div>
          </div>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🏆</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Flex</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Share your wins safely</p>
          </div>
          
          <div className="space-y-3">
            {content.achievements.map((achievement, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                <span className="text-2xl">🏆</span>
                <span className="text-gray-800 dark:text-gray-200 font-medium">{achievement}</span>
                <button 
                  onClick={() => setShowFlexMode(true)}
                  className="ml-auto text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
                >
                  Share ✨
                </button>
              </div>
            ))}
          </div>

          {showFlexMode && (
            <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <div className="text-center">
                <div className="text-2xl mb-2">🎉</div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Flex Mode</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Share your progress with your squad (anonymously if you prefer)
                </p>
                <div className="flex gap-2 justify-center">
                  <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition">
                    Share Anonymously 🔒
                  </button>
                  <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:scale-105 transition">
                    Share with Squad 👥
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}