'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface MoodEntry {
  id: string;
  mood: string;
  intensity: number;
  triggers: string[];
  notes: string;
  timestamp: Date;
  energy: number;
  sleep: number;
  stress: number;
}

interface MoodInsight {
  type: 'pattern' | 'trend' | 'suggestion';
  title: string;
  description: string;
  action?: string;
}

const MOOD_OPTIONS = [
  { emoji: '😊', label: 'Happy', value: 'happy', color: 'from-yellow-400 to-orange-400' },
  { emoji: '😌', label: 'Calm', value: 'calm', color: 'from-blue-400 to-cyan-400' },
  { emoji: '😔', label: 'Sad', value: 'sad', color: 'from-gray-400 to-slate-400' },
  { emoji: '😰', label: 'Anxious', value: 'anxious', color: 'from-red-400 to-pink-400' },
  { emoji: '😤', label: 'Angry', value: 'angry', color: 'from-red-500 to-orange-500' },
  { emoji: '😴', label: 'Tired', value: 'tired', color: 'from-purple-400 to-indigo-400' },
  { emoji: '🤗', label: 'Grateful', value: 'grateful', color: 'from-green-400 to-emerald-400' },
  { emoji: '😟', label: 'Worried', value: 'worried', color: 'from-yellow-500 to-amber-500' },
  { emoji: '😍', label: 'Excited', value: 'excited', color: 'from-pink-400 to-rose-400' },
  { emoji: '😐', label: 'Neutral', value: 'neutral', color: 'from-gray-300 to-gray-400' },
];

const TRIGGER_OPTIONS = [
  'Work stress', 'Relationships', 'Health', 'Finances', 'Weather', 
  'Social media', 'Sleep', 'Exercise', 'Food', 'News', 'Family', 'Other'
];

export default function MoodTrackerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [sleep, setSleep] = useState(5);
  const [stress, setStress] = useState(5);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [insights, setInsights] = useState<MoodInsight[]>([]);
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Load mood history from localStorage (in a real app, this would be from a database)
    const savedHistory = localStorage.getItem(`mood_history_${user.uid}`);
    if (savedHistory) {
      setMoodHistory(JSON.parse(savedHistory));
    }
    
    generateInsights();
  }, [user, router]);

  const generateInsights = () => {
    const newInsights: MoodInsight[] = [];
    
    if (moodHistory.length >= 7) {
      const recentMoods = moodHistory.slice(-7);
      const avgMood = recentMoods.reduce((sum, entry) => sum + entry.intensity, 0) / 7;
      
      if (avgMood < 3) {
        newInsights.push({
          type: 'pattern',
          title: 'Low Mood Pattern Detected',
          description: 'You\'ve been experiencing lower moods recently. This is completely normal and temporary.',
          action: 'Try some mood-boosting activities'
        });
      }
      
      if (avgMood > 7) {
        newInsights.push({
          type: 'trend',
          title: 'Positive Mood Trend',
          description: 'Great news! You\'ve been feeling more positive lately. Keep up the good work!',
          action: 'Continue your current routine'
        });
      }
    }
    
    // Check for common triggers
    const triggerCounts: Record<string, number> = {};
    moodHistory.forEach(entry => {
      entry.triggers.forEach(trigger => {
        triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
      });
    });
    
    const topTrigger = Object.entries(triggerCounts).sort(([,a], [,b]) => b - a)[0];
    if (topTrigger && topTrigger[1] >= 3) {
      newInsights.push({
        type: 'suggestion',
        title: `Common Trigger: ${topTrigger[0]}`,
        description: `You've logged "${topTrigger[0]}" as a trigger ${topTrigger[1]} times recently.`,
        action: 'Consider strategies to manage this trigger'
      });
    }
    
    setInsights(newInsights);
  };

  const handleMoodSelection = (mood: string) => {
    setSelectedMood(mood);
  };

  const handleTriggerToggle = (trigger: string) => {
    setTriggers(prev => 
      prev.includes(trigger) 
        ? prev.filter(t => t !== trigger)
        : [...prev, trigger]
    );
  };

  const handleSaveMood = () => {
    if (!selectedMood || !user) return;
    
    const newEntry: MoodEntry = {
      id: Date.now().toString(),
      mood: selectedMood,
      intensity,
      energy,
      sleep,
      stress,
      triggers,
      notes,
      timestamp: new Date()
    };
    
    const updatedHistory = [...moodHistory, newEntry];
    setMoodHistory(updatedHistory);
    localStorage.setItem(`mood_history_${user.uid}`, JSON.stringify(updatedHistory));
    
    // Reset form
    setSelectedMood(null);
    setIntensity(5);
    setEnergy(5);
    setSleep(5);
    setStress(5);
    setTriggers([]);
    setNotes('');
    
    // Generate new insights
    setTimeout(() => {
      generateInsights();
    }, 1000);
  };

  const getMoodStats = () => {
    if (moodHistory.length === 0) return null;
    
    const last7Days = moodHistory.slice(-7);
    const avgMood = last7Days.reduce((sum, entry) => sum + entry.intensity, 0) / last7Days.length;
    const avgEnergy = last7Days.reduce((sum, entry) => sum + entry.energy, 0) / last7Days.length;
    const avgSleep = last7Days.reduce((sum, entry) => sum + entry.sleep, 0) / last7Days.length;
    
    return { avgMood, avgEnergy, avgSleep, totalEntries: moodHistory.length };
  };

  const stats = getMoodStats();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Mood Tracker 📊</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Track your emotional wellbeing and discover patterns
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.avgMood.toFixed(1)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Mood</div>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.avgEnergy.toFixed(1)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Energy</div>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.avgSleep.toFixed(1)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Sleep</div>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.totalEntries}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Entries</div>
            </div>
          </div>
        )}

        {/* Mood Selection */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">How are you feeling right now?</h2>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
            {MOOD_OPTIONS.map((mood) => (
              <button
                key={mood.value}
                onClick={() => handleMoodSelection(mood.value)}
                className={`p-4 rounded-xl transition-all hover:scale-105 ${
                  selectedMood === mood.value
                    ? `bg-gradient-to-r ${mood.color} text-white shadow-lg`
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <div className="text-2xl mb-1">{mood.emoji}</div>
                <div className="text-xs font-medium">{mood.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Intensity and Other Ratings */}
        {selectedMood && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Rate your current state</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Mood Intensity (1-10)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Very Low</span>
                  <span className="font-bold">{intensity}</span>
                  <span>Very High</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Energy Level (1-10)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Exhausted</span>
                  <span className="font-bold">{energy}</span>
                  <span>Energized</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sleep Quality (1-10)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sleep}
                  onChange={(e) => setSleep(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Poor</span>
                  <span className="font-bold">{sleep}</span>
                  <span>Excellent</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Stress Level (1-10)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={stress}
                  onChange={(e) => setStress(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Relaxed</span>
                  <span className="font-bold">{stress}</span>
                  <span>Very Stressed</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Triggers */}
        {selectedMood && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">What might be affecting your mood?</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {TRIGGER_OPTIONS.map((trigger) => (
                <button
                  key={trigger}
                  onClick={() => handleTriggerToggle(trigger)}
                  className={`p-2 rounded-lg text-sm transition ${
                    triggers.includes(trigger)
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {trigger}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {selectedMood && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Additional notes (optional)</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What's on your mind? Any specific thoughts or feelings you'd like to remember?"
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
            />
          </div>
        )}

        {/* Save Button */}
        {selectedMood && (
          <div className="text-center mb-8">
            <button
              onClick={handleSaveMood}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition shadow-lg"
            >
              Save Mood Entry
            </button>
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">AI Insights</h3>
              <button
                onClick={() => setShowInsights(!showInsights)}
                className="text-purple-600 hover:text-purple-700 transition"
              >
                {showInsights ? 'Hide' : 'Show'} Insights
              </button>
            </div>
            
            <AnimatePresence>
              {showInsights && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  {insights.map((insight, index) => (
                    <div key={index} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="font-medium text-blue-800 dark:text-blue-200">{insight.title}</div>
                      <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">{insight.description}</div>
                      {insight.action && (
                        <div className="text-sm text-blue-600 dark:text-blue-400 mt-2 font-medium">
                          💡 {insight.action}
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/chat" className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl text-center hover:from-blue-600 hover:to-cyan-600 transition">
            <div className="text-2xl mb-2">🤖</div>
            <div className="font-semibold">AI Chat Support</div>
            <div className="text-sm opacity-90">Get personalized guidance</div>
          </Link>
          
          <Link href="/journal" className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl text-center hover:from-green-600 hover:to-emerald-600 transition">
            <div className="text-2xl mb-2">📔</div>
            <div className="font-semibold">Journal Entry</div>
            <div className="text-sm opacity-90">Reflect on your day</div>
          </Link>
          
          <Link href="/toolkit/breathing" className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl text-center hover:from-purple-600 hover:to-pink-600 transition">
            <div className="text-2xl mb-2">🫁</div>
            <div className="font-semibold">Breathing Exercise</div>
            <div className="text-sm opacity-90">Calm your mind</div>
          </Link>
        </div>
      </div>
    </div>
  );
}