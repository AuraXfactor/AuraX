'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, Timestamp, FieldValue } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface MoodEntry {
  id?: string;
  userId: string;
  timestamp: Timestamp | FieldValue;
  dateKey: string;
  mood: {
    value: string;
    intensity: number;
    customLabel?: string;
  };
  emotions: string[];
  triggers: string[];
  activities: string[];
  notes?: string;
  energyLevel: number;
  stressLevel: number;
  sleepQuality: number;
  socialInteraction: number;
  weather?: string;
  location?: string;
}

interface WeeklyTrends {
  averageMood: number;
  moodStability: number;
  topEmotions: { emotion: string; count: number }[];
  topTriggers: { trigger: string; count: number }[];
  topActivities: { activity: string; count: number }[];
  energyTrend: number[];
  stressTrend: number[];
  sleepTrend: number[];
  socialTrend: number[];
  moodPatterns: {
    dayOfWeek: string;
    averageMood: number;
    count: number;
  }[];
  insights: string[];
  recommendations: string[];
}

const MOOD_OPTIONS = [
  { emoji: '😢', label: 'Very Sad', value: 'very_sad', color: 'from-blue-400 to-blue-600', intensity: 1 },
  { emoji: '😔', label: 'Sad', value: 'sad', color: 'from-blue-500 to-blue-700', intensity: 2 },
  { emoji: '😐', label: 'Neutral', value: 'neutral', color: 'from-gray-400 to-gray-600', intensity: 3 },
  { emoji: '🙂', label: 'Okay', value: 'okay', color: 'from-yellow-400 to-yellow-600', intensity: 4 },
  { emoji: '😊', label: 'Happy', value: 'happy', color: 'from-green-400 to-green-600', intensity: 5 },
  { emoji: '🥰', label: 'Loved', value: 'loved', color: 'from-pink-400 to-pink-600', intensity: 6 },
  { emoji: '🤩', label: 'Amazing', value: 'amazing', color: 'from-purple-400 to-purple-600', intensity: 7 },
  { emoji: '😍', label: 'Ecstatic', value: 'ecstatic', color: 'from-red-400 to-red-600', intensity: 8 },
];

const EMOTION_OPTIONS = [
  'Joy', 'Sadness', 'Anger', 'Fear', 'Surprise', 'Disgust', 'Love', 'Anxiety',
  'Excitement', 'Calm', 'Frustrated', 'Grateful', 'Lonely', 'Confident', 'Overwhelmed', 'Peaceful'
];

const TRIGGER_OPTIONS = [
  'Work stress', 'Relationship issues', 'Health concerns', 'Financial worries',
  'Social situations', 'Family dynamics', 'Weather', 'Sleep quality',
  'Exercise', 'Social media', 'News', 'Personal goals', 'Unexpected events'
];

const ACTIVITY_OPTIONS = [
  'Exercise', 'Meditation', 'Reading', 'Music', 'Art/Creativity', 'Cooking',
  'Socializing', 'Nature walk', 'Gaming', 'Learning', 'Resting', 'Cleaning',
  'Shopping', 'Traveling', 'Work', 'Family time'
];

export default function MoodTracker() {
  const { user } = useAuth();
  const [currentMood, setCurrentMood] = useState<MoodEntry | null>(null);
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrends | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTrends, setShowTrends] = useState(false);

  // Form state
  const [selectedMood, setSelectedMood] = useState('');
  const [moodIntensity, setMoodIntensity] = useState(5);
  const [customMoodLabel, setCustomMoodLabel] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [energyLevel, setEnergyLevel] = useState(5);
  const [stressLevel, setStressLevel] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [socialInteraction, setSocialInteraction] = useState(5);
  const [weather, setWeather] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (user) {
      loadTodayMood();
      loadWeeklyTrends();
    }
  }, [user]);

  const loadTodayMood = async () => {
    if (!user) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const moodRef = collection(db, 'mood-entries');
      const q = query(
        moodRef,
        where('userId', '==', user.uid),
        where('dateKey', '==', today)
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setCurrentMood({ id: doc.id, ...doc.data() } as MoodEntry);
        
        // Populate form with existing data
        const data = doc.data() as MoodEntry;
        setSelectedMood(data.mood.value);
        setMoodIntensity(data.mood.intensity);
        setCustomMoodLabel(data.mood.customLabel || '');
        setSelectedEmotions(data.emotions);
        setSelectedTriggers(data.triggers);
        setSelectedActivities(data.activities);
        setNotes(data.notes || '');
        setEnergyLevel(data.energyLevel);
        setStressLevel(data.stressLevel);
        setSleepQuality(data.sleepQuality);
        setSocialInteraction(data.socialInteraction);
        setWeather(data.weather || '');
        setLocation(data.location || '');
      }
    } catch (error) {
      console.error('Error loading today\'s mood:', error);
    }
  };

  const loadWeeklyTrends = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const moodRef = collection(db, 'mood-entries');
      const q = query(
        moodRef,
        where('userId', '==', user.uid),
        where('timestamp', '>=', Timestamp.fromDate(oneWeekAgo)),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const entries: MoodEntry[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MoodEntry));

      if (entries.length === 0) {
        setWeeklyTrends(null);
        return;
      }

      // Calculate trends
      const trends = calculateWeeklyTrends(entries);
      setWeeklyTrends(trends);
    } catch (error) {
      console.error('Error loading weekly trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklyTrends = (entries: MoodEntry[]): WeeklyTrends => {
    const moodValues = entries.map(e => e.mood.intensity);
    const averageMood = moodValues.reduce((sum, val) => sum + val, 0) / moodValues.length;
    
    // Calculate mood stability (lower standard deviation = more stable)
    const variance = moodValues.reduce((sum, val) => sum + Math.pow(val - averageMood, 2), 0) / moodValues.length;
    const moodStability = Math.max(0, 10 - Math.sqrt(variance));

    // Count emotions, triggers, and activities
    const emotionCounts: { [key: string]: number } = {};
    const triggerCounts: { [key: string]: number } = {};
    const activityCounts: { [key: string]: number } = {};

    entries.forEach(entry => {
      entry.emotions.forEach(emotion => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
      entry.triggers.forEach(trigger => {
        triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
      });
      entry.activities.forEach(activity => {
        activityCounts[activity] = (activityCounts[activity] || 0) + 1;
      });
    });

    const topEmotions = Object.entries(emotionCounts)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topTriggers = Object.entries(triggerCounts)
      .map(([trigger, count]) => ({ trigger, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topActivities = Object.entries(activityCounts)
      .map(([activity, count]) => ({ activity, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate trends over time
    const energyTrend = entries.map(e => e.energyLevel);
    const stressTrend = entries.map(e => e.stressLevel);
    const sleepTrend = entries.map(e => e.sleepQuality);
    const socialTrend = entries.map(e => e.socialInteraction);

    // Calculate mood patterns by day of week
    const dayPatterns: { [key: string]: { sum: number; count: number } } = {};
    entries.forEach(entry => {
      const date = entry.timestamp instanceof Timestamp ? entry.timestamp.toDate() : new Date();
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      if (!dayPatterns[dayOfWeek]) {
        dayPatterns[dayOfWeek] = { sum: 0, count: 0 };
      }
      dayPatterns[dayOfWeek].sum += entry.mood.intensity;
      dayPatterns[dayOfWeek].count += 1;
    });

    const moodPatterns = Object.entries(dayPatterns).map(([dayOfWeek, data]) => ({
      dayOfWeek,
      averageMood: data.sum / data.count,
      count: data.count
    }));

    // Generate insights and recommendations
    const insights = generateInsights(averageMood, moodStability, topEmotions, topTriggers, moodPatterns);
    const recommendations = generateRecommendations(averageMood, moodStability, topEmotions, topTriggers, moodPatterns);

    return {
      averageMood,
      moodStability,
      topEmotions,
      topTriggers,
      topActivities,
      energyTrend,
      stressTrend,
      sleepTrend,
      socialTrend,
      moodPatterns,
      insights,
      recommendations
    };
  };

  const generateInsights = (
    averageMood: number,
    moodStability: number,
    topEmotions: { emotion: string; count: number }[],
    topTriggers: { trigger: string; count: number }[],
    moodPatterns: { dayOfWeek: string; averageMood: number; count: number }[]
  ): string[] => {
    const insights: string[] = [];

    // Mood level insights
    if (averageMood >= 6) {
      insights.push("You've been feeling quite positive this week! 🌟");
    } else if (averageMood <= 4) {
      insights.push("This week has been challenging for your mood. Consider reaching out for support. 💙");
    } else {
      insights.push("Your mood has been relatively balanced this week. 📊");
    }

    // Stability insights
    if (moodStability >= 7) {
      insights.push("Your mood has been very stable - great emotional regulation! 🎯");
    } else if (moodStability <= 4) {
      insights.push("Your mood has been quite variable. Consider stress management techniques. 🌊");
    }

    // Emotion insights
    if (topEmotions.length > 0) {
      const topEmotion = topEmotions[0];
      insights.push(`Your most common emotion this week was ${topEmotion.emotion} (${topEmotion.count} times).`);
    }

    // Trigger insights
    if (topTriggers.length > 0) {
      const topTrigger = topTriggers[0];
      insights.push(`Your most frequent trigger was ${topTrigger.trigger} (${topTrigger.count} times).`);
    }

    // Day pattern insights
    const bestDay = moodPatterns.reduce((best, current) => 
      current.averageMood > best.averageMood ? current : best
    );
    const worstDay = moodPatterns.reduce((worst, current) => 
      current.averageMood < worst.averageMood ? current : worst
    );

    if (bestDay && worstDay && bestDay.averageMood - worstDay.averageMood > 2) {
      insights.push(`You tend to feel better on ${bestDay.dayOfWeek}s and worse on ${worstDay.dayOfWeek}s.`);
    }

    return insights;
  };

  const generateRecommendations = (
    averageMood: number,
    moodStability: number,
    topEmotions: { emotion: string; count: number }[],
    topTriggers: { trigger: string; count: number }[],
    moodPatterns: { dayOfWeek: string; averageMood: number; count: number }[]
  ): string[] => {
    const recommendations: string[] = [];

    // Mood-based recommendations
    if (averageMood < 5) {
      recommendations.push("Try incorporating more activities that bring you joy into your daily routine.");
      recommendations.push("Consider practicing gratitude journaling to shift your perspective.");
    }

    // Stability recommendations
    if (moodStability < 5) {
      recommendations.push("Practice mindfulness and breathing exercises to help stabilize your mood.");
      recommendations.push("Consider establishing a consistent daily routine to provide structure.");
    }

    // Trigger-based recommendations
    if (topTriggers.length > 0) {
      const topTrigger = topTriggers[0];
      recommendations.push(`Since ${topTrigger.trigger} is a frequent trigger, consider developing coping strategies for this specific situation.`);
    }

    // Activity recommendations
    recommendations.push("Try to engage in activities that align with your positive emotions more often.");
    recommendations.push("Consider tracking your sleep, exercise, and social interactions to see their impact on your mood.");

    return recommendations;
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const entryData: Omit<MoodEntry, 'id'> = {
        userId: user.uid,
        timestamp: serverTimestamp(),
        dateKey: new Date().toISOString().split('T')[0],
        mood: {
          value: selectedMood,
          intensity: moodIntensity,
          customLabel: customMoodLabel.trim() || undefined
        },
        emotions: selectedEmotions,
        triggers: selectedTriggers,
        activities: selectedActivities,
        notes: notes.trim() || undefined,
        energyLevel,
        stressLevel,
        sleepQuality,
        socialInteraction,
        weather: weather.trim() || undefined,
        location: location.trim() || undefined
      };

      if (currentMood?.id) {
        // Update existing entry
        const { updateDoc, doc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'mood-entries', currentMood.id), entryData);
      } else {
        // Create new entry
        await addDoc(collection(db, 'mood-entries'), entryData);
      }

      alert('Mood entry saved successfully! 📊');
      loadTodayMood();
      loadWeeklyTrends();
    } catch (error) {
      console.error('Error saving mood entry:', error);
      alert('Failed to save mood entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayItem = (array: string[], setArray: (items: string[]) => void, item: string) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          📊 Mood Tracker
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your daily mood and discover patterns in your emotional well-being
        </p>
      </div>

      {/* Current Mood Entry */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">How are you feeling today?</h2>
        
        {/* Mood Selection */}
        <div className="mb-8">
          <label className="block text-lg font-semibold mb-4">Select your mood:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {MOOD_OPTIONS.map((mood) => (
              <button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  selectedMood === mood.value
                    ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                }`}
              >
                <div className="text-3xl mb-2">{mood.emoji}</div>
                <div className="text-sm font-medium">{mood.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Mood Intensity */}
        {selectedMood && (
          <div className="mb-6">
            <label className="block text-lg font-semibold mb-2">
              Intensity: {moodIntensity}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={moodIntensity}
              onChange={(e) => setMoodIntensity(Number(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        )}

        {/* Custom Mood Label */}
        <div className="mb-6">
          <label className="block text-lg font-semibold mb-2">Custom mood description (optional):</label>
          <input
            type="text"
            value={customMoodLabel}
            onChange={(e) => setCustomMoodLabel(e.target.value)}
            placeholder="e.g., 'Grateful and peaceful'"
            className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
        </div>

        {/* Emotions */}
        <div className="mb-6">
          <label className="block text-lg font-semibold mb-3">What emotions are you experiencing?</label>
          <div className="flex flex-wrap gap-2">
            {EMOTION_OPTIONS.map((emotion) => (
              <button
                key={emotion}
                onClick={() => toggleArrayItem(selectedEmotions, setSelectedEmotions, emotion)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedEmotions.includes(emotion)
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                }`}
              >
                {emotion}
              </button>
            ))}
          </div>
        </div>

        {/* Triggers */}
        <div className="mb-6">
          <label className="block text-lg font-semibold mb-3">What might be affecting your mood?</label>
          <div className="flex flex-wrap gap-2">
            {TRIGGER_OPTIONS.map((trigger) => (
              <button
                key={trigger}
                onClick={() => toggleArrayItem(selectedTriggers, setSelectedTriggers, trigger)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedTriggers.includes(trigger)
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                }`}
              >
                {trigger}
              </button>
            ))}
          </div>
        </div>

        {/* Activities */}
        <div className="mb-6">
          <label className="block text-lg font-semibold mb-3">What activities have you been doing?</label>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_OPTIONS.map((activity) => (
              <button
                key={activity}
                onClick={() => toggleArrayItem(selectedActivities, setSelectedActivities, activity)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedActivities.includes(activity)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30'
                }`}
              >
                {activity}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Energy Level: {energyLevel}/10</label>
            <input
              type="range"
              min="1"
              max="10"
              value={energyLevel}
              onChange={(e) => setEnergyLevel(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Stress Level: {stressLevel}/10</label>
            <input
              type="range"
              min="1"
              max="10"
              value={stressLevel}
              onChange={(e) => setStressLevel(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Sleep Quality: {sleepQuality}/10</label>
            <input
              type="range"
              min="1"
              max="10"
              value={sleepQuality}
              onChange={(e) => setSleepQuality(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Social Interaction: {socialInteraction}/10</label>
            <input
              type="range"
              min="1"
              max="10"
              value={socialInteraction}
              onChange={(e) => setSocialInteraction(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-lg font-semibold mb-2">Additional notes (optional):</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional thoughts about your mood today..."
            rows={3}
            className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
        </div>

        {/* Save Button */}
        <div className="text-center">
          <button
            onClick={handleSave}
            disabled={loading || !selectedMood}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 font-bold text-lg shadow-lg"
          >
            {loading ? 'Saving...' : 'Save Mood Entry 📊'}
          </button>
        </div>
      </div>

      {/* Weekly Trends */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">📈 Weekly Trends</h2>
          <button
            onClick={() => setShowTrends(!showTrends)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            {showTrends ? 'Hide Trends' : 'Show Trends'}
          </button>
        </div>

        {showTrends && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading trends...</p>
              </div>
            ) : weeklyTrends ? (
              <>
                {/* Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 p-4 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {weeklyTrends.averageMood.toFixed(1)}/10
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Average Mood</div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 p-4 rounded-xl">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {weeklyTrends.moodStability.toFixed(1)}/10
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Mood Stability</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 p-4 rounded-xl">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {weeklyTrends.topEmotions.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Top Emotions</div>
                  </div>
                </div>

                {/* Top Emotions */}
                {weeklyTrends.topEmotions.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Most Common Emotions</h3>
                    <div className="space-y-2">
                      {weeklyTrends.topEmotions.map((emotion, index) => (
                        <div key={emotion.emotion} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="font-medium">{emotion.emotion}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{emotion.count} times</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Triggers */}
                {weeklyTrends.topTriggers.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Most Common Triggers</h3>
                    <div className="space-y-2">
                      {weeklyTrends.topTriggers.map((trigger, index) => (
                        <div key={trigger.trigger} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="font-medium">{trigger.trigger}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{trigger.count} times</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Insights */}
                {weeklyTrends.insights.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">💡 Insights</h3>
                    <div className="space-y-2">
                      {weeklyTrends.insights.map((insight, index) => (
                        <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                          <p className="text-blue-800 dark:text-blue-200">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {weeklyTrends.recommendations.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">🎯 Recommendations</h3>
                    <div className="space-y-2">
                      {weeklyTrends.recommendations.map((recommendation, index) => (
                        <div key={index} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                          <p className="text-green-800 dark:text-green-200">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">No mood data available for the past week.</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Start tracking your mood to see trends!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}