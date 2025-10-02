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
  activities: string[];
  copingStrategies: string[];
  gratitude: string[];
  challenges: string[];
  victories: string[];
}

interface MoodInsight {
  type: 'pattern' | 'trend' | 'suggestion' | 'reflection' | 'motivation';
  title: string;
  description: string;
  action?: string;
  motivationalQuestion?: string;
}

interface MotivationalPrompt {
  id: string;
  question: string;
  category: 'values' | 'goals' | 'strengths' | 'change' | 'support';
  followUp?: string;
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

const ACTIVITY_OPTIONS = [
  'Exercise', 'Meditation', 'Reading', 'Music', 'Art/Creativity', 'Nature walk',
  'Social time', 'Cooking', 'Gaming', 'Learning', 'Volunteering', 'Rest'
];

const COPING_STRATEGIES = [
  'Deep breathing', 'Journaling', 'Talking to someone', 'Exercise', 'Meditation',
  'Creative expression', 'Nature time', 'Music therapy', 'Mindfulness', 'Self-care'
];

const MOTIVATIONAL_PROMPTS: MotivationalPrompt[] = [
  {
    id: 'values_1',
    question: 'What values are most important to you in life?',
    category: 'values',
    followUp: 'How does your current mood align with these values?'
  },
  {
    id: 'goals_1',
    question: 'What would you like to achieve in the next month?',
    category: 'goals',
    followUp: 'What small step could you take today toward this goal?'
  },
  {
    id: 'strengths_1',
    question: 'What strengths have helped you through difficult times?',
    category: 'strengths',
    followUp: 'How can you use these strengths right now?'
  },
  {
    id: 'change_1',
    question: 'What would you like to change about your current situation?',
    category: 'change',
    followUp: 'What would that change look like for you?'
  },
  {
    id: 'support_1',
    question: 'Who are the people that support you most?',
    category: 'support',
    followUp: 'How could you reach out to them today?'
  }
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
  const [activities, setActivities] = useState<string[]>([]);
  const [copingStrategies, setCopingStrategies] = useState<string[]>([]);
  const [gratitude, setGratitude] = useState<string[]>([]);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [victories, setVictories] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [insights, setInsights] = useState<MoodInsight[]>([]);
  const [showInsights, setShowInsights] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<MotivationalPrompt | null>(null);
  const [promptResponse, setPromptResponse] = useState('');
  const [showMotivationalSection, setShowMotivationalSection] = useState(false);

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
          action: 'Try some mood-boosting activities',
          motivationalQuestion: 'What has helped you feel better in the past?'
        });
      }
      
      if (avgMood > 7) {
        newInsights.push({
          type: 'trend',
          title: 'Positive Mood Trend',
          description: 'Great news! You\'ve been feeling more positive lately. Keep up the good work!',
          action: 'Continue your current routine',
          motivationalQuestion: 'What\'s contributing to this positive energy?'
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
        action: 'Consider strategies to manage this trigger',
        motivationalQuestion: 'What would help you feel more prepared for this trigger?'
      });
    }
    
    // Add motivational insights
    newInsights.push({
      type: 'motivation',
      title: 'Reflection Opportunity',
      description: 'Take a moment to reflect on your journey and what matters most to you.',
      action: 'Try a motivational prompt',
      motivationalQuestion: 'What would you like to focus on improving in your life?'
    });
    
    setInsights(newInsights);
  };

  const startMotivationalPrompt = () => {
    const randomPrompt = MOTIVATIONAL_PROMPTS[Math.floor(Math.random() * MOTIVATIONAL_PROMPTS.length)];
    setCurrentPrompt(randomPrompt);
    setPromptResponse('');
    setShowMotivationalSection(true);
  };

  const handleMotivationalResponse = () => {
    if (!currentPrompt || !promptResponse.trim()) return;
    
    // Add to insights
    const newInsight: MoodInsight = {
      type: 'reflection',
      title: `Reflection: ${currentPrompt.category}`,
      description: promptResponse,
      action: currentPrompt.followUp
    };
    
    setInsights(prev => [...prev, newInsight]);
    setCurrentPrompt(null);
    setPromptResponse('');
    setShowMotivationalSection(false);
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
      activities,
      copingStrategies,
      gratitude,
      challenges,
      victories,
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
    setActivities([]);
    setCopingStrategies([]);
    setGratitude([]);
    setChallenges([]);
    setVictories([]);
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

        {/* Activities */}
        {selectedMood && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">What activities did you do today?</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ACTIVITY_OPTIONS.map((activity) => (
                <button
                  key={activity}
                  onClick={() => setActivities(prev => 
                    prev.includes(activity) 
                      ? prev.filter(a => a !== activity)
                      : [...prev, activity]
                  )}
                  className={`p-2 rounded-lg text-sm transition ${
                    activities.includes(activity)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {activity}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Coping Strategies */}
        {selectedMood && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">What helped you cope today?</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {COPING_STRATEGIES.map((strategy) => (
                <button
                  key={strategy}
                  onClick={() => setCopingStrategies(prev => 
                    prev.includes(strategy) 
                      ? prev.filter(s => s !== strategy)
                      : [...prev, strategy]
                  )}
                  className={`p-2 rounded-lg text-sm transition ${
                    copingStrategies.includes(strategy)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {strategy}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Gratitude, Challenges, Victories */}
        {selectedMood && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Reflection & Growth</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">What are you grateful for today?</label>
                <textarea
                  value={gratitude.join(', ')}
                  onChange={(e) => setGratitude(e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                  placeholder="e.g., good weather, a friend's call, completing a task"
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">What challenges did you face?</label>
                <textarea
                  value={challenges.join(', ')}
                  onChange={(e) => setChallenges(e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                  placeholder="e.g., work stress, difficult conversation"
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">What victories did you have?</label>
                <textarea
                  value={victories.join(', ')}
                  onChange={(e) => setVictories(e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                  placeholder="e.g., finished a project, helped someone, learned something new"
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={2}
                />
              </div>
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

        {/* Motivational Interviewing Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">💭 Motivational Reflection</h3>
            <button
              onClick={startMotivationalPrompt}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition"
            >
              Start Reflection
            </button>
          </div>
          
          {currentPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
            >
              <div className="font-medium text-purple-800 dark:text-purple-200 mb-2">
                {currentPrompt.question}
              </div>
              <textarea
                value={promptResponse}
                onChange={(e) => setPromptResponse(e.target.value)}
                placeholder="Take a moment to reflect on this question..."
                className="w-full p-3 rounded-lg border border-purple-300 dark:border-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mt-2"
                rows={3}
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleMotivationalResponse}
                  disabled={!promptResponse.trim()}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50"
                >
                  Save Reflection
                </button>
                <button
                  onClick={() => {
                    setCurrentPrompt(null);
                    setPromptResponse('');
                  }}
                  className="px-4 py-2 border border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
                >
                  Skip
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Enhanced Insights */}
        {insights.length > 0 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">🧠 Personalized Insights</h3>
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
                    <div key={index} className={`p-4 rounded-lg border ${
                      insight.type === 'motivation' ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' :
                      insight.type === 'reflection' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                      'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    }`}>
                      <div className={`font-medium ${
                        insight.type === 'motivation' ? 'text-purple-800 dark:text-purple-200' :
                        insight.type === 'reflection' ? 'text-green-800 dark:text-green-200' :
                        'text-blue-800 dark:text-blue-200'
                      }`}>
                        {insight.title}
                      </div>
                      <div className={`text-sm mt-1 ${
                        insight.type === 'motivation' ? 'text-purple-700 dark:text-purple-300' :
                        insight.type === 'reflection' ? 'text-green-700 dark:text-green-300' :
                        'text-blue-700 dark:text-blue-300'
                      }`}>
                        {insight.description}
                      </div>
                      {insight.action && (
                        <div className={`text-sm mt-2 font-medium ${
                          insight.type === 'motivation' ? 'text-purple-600 dark:text-purple-400' :
                          insight.type === 'reflection' ? 'text-green-600 dark:text-green-400' :
                          'text-blue-600 dark:text-blue-400'
                        }`}>
                          💡 {insight.action}
                        </div>
                      )}
                      {insight.motivationalQuestion && (
                        <div className="text-sm mt-2 p-2 bg-white/50 dark:bg-black/20 rounded border-l-4 border-purple-400">
                          <strong>Reflection prompt:</strong> {insight.motivationalQuestion}
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
            <div className="font-semibold">Auraz AI</div>
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