'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { awardAuraPoints } from '@/lib/auraPoints';
import SpecializedJournalHistory from '@/components/journal/SpecializedJournalHistory';

const MOOD_OPTIONS = [
  { emoji: '😢', label: 'Very Sad', value: 'very_sad', color: 'from-blue-400 to-blue-600' },
  { emoji: '😐', label: 'Neutral', value: 'neutral', color: 'from-gray-400 to-gray-600' },
  { emoji: '😊', label: 'Happy', value: 'happy', color: 'from-yellow-400 to-yellow-600' },
  { emoji: '🥰', label: 'Loved', value: 'loved', color: 'from-pink-400 to-pink-600' },
  { emoji: '🤩', label: 'Amazing', value: 'amazing', color: 'from-green-400 to-green-600' },
];

const SELF_CARE_ACTIVITIES = [
  'Meditation',
  'Exercise', 
  'Healthy Eating',
  'Social Connection',
  'Rest',
  'Reading',
  'Music',
  'Nature Time'
];

export default function DailyCheckInJournal() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Form state
  const [selectedMood, setSelectedMood] = useState('');
  const [customMoodLabel, setCustomMoodLabel] = useState('');
  const [heartSpeak, setHeartSpeak] = useState('');
  const [gratitude1, setGratitude1] = useState('');
  const [gratitude2, setGratitude2] = useState('');
  const [gratitude3, setGratitude3] = useState('');
  const [challenges, setChallenges] = useState('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [customActivity, setCustomActivity] = useState('');
  const [noteToSelf, setNoteToSelf] = useState('');
  const [freeThoughts, setFreeThoughts] = useState('');
  const [lettingGo, setLettingGo] = useState('');
  const [todoItems, setTodoItems] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);

  if (!user) {
    router.push('/login');
    return null;
  }

  const toggleActivity = (activity: string) => {
    setSelectedActivities(prev => 
      prev.includes(activity) 
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  const addTodoItem = () => {
    setTodoItems(prev => [...prev, '']);
  };

  const updateTodoItem = (index: number, value: string) => {
    setTodoItems(prev => prev.map((item, i) => i === index ? value : item));
  };

  const removeTodoItem = (index: number) => {
    setTodoItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Validation
    if (!selectedMood) {
      alert('Please select your mood for today');
      return;
    }

    setSaving(true);
    try {
      const entryData = {
        journalType: 'daily-checkin',
        userId: user.uid,
        timestamp: serverTimestamp(),
        dateKey: new Date().toISOString().split('T')[0],
        
        // Core data
        mood: {
          value: selectedMood,
          customLabel: customMoodLabel || null
        },
        heartSpeak: heartSpeak.trim() || null,
        gratitude: [gratitude1, gratitude2, gratitude3].filter(g => g.trim()),
        challenges: challenges.trim() || null,
        selfCareActivities: selectedActivities,
        customActivity: customActivity.trim() || null,
        noteToSelf: noteToSelf.trim() || null,
        freeThoughts: freeThoughts.trim() || null,
        lettingGo: lettingGo.trim() || null,
        todoForTomorrow: todoItems.filter(item => item.trim()),
        
        // Metadata
        wordCount: [heartSpeak, challenges, noteToSelf, freeThoughts, lettingGo].join(' ').split(' ').length,
        completionScore: calculateCompletionScore(),
      };

      // Save to Firestore
      await addDoc(collection(db, 'specialized-journals', user.uid, 'daily-checkin'), entryData);

      // Award points
      try {
        await awardAuraPoints({
          user,
          activity: 'journal_entry',
          proof: {
            type: 'journal_length',
            value: entryData.wordCount,
            metadata: {
              journalType: 'daily-checkin',
              completionScore: entryData.completionScore,
              activitiesCount: selectedActivities.length
            }
          },
          description: `📔 Daily Check-In completed (${entryData.completionScore}% complete)`,
          uniqueId: `daily-checkin-${user.uid}-${new Date().toISOString().split('T')[0]}`
        });
      } catch (pointsError) {
        console.error('Error awarding points:', pointsError);
      }

      alert('Daily Check-In saved successfully! 🎉');
      
      // Reset form
      resetForm();
      
    } catch (error) {
      console.error('Error saving daily check-in:', error);
      alert('Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const calculateCompletionScore = () => {
    let completed = 0;
    const total = 10;
    
    if (selectedMood) completed++;
    if (heartSpeak.trim()) completed++;
    if ([gratitude1, gratitude2, gratitude3].some(g => g.trim())) completed++;
    if (challenges.trim()) completed++;
    if (selectedActivities.length > 0) completed++;
    if (noteToSelf.trim()) completed++;
    if (freeThoughts.trim()) completed++;
    if (lettingGo.trim()) completed++;
    if (todoItems.some(item => item.trim())) completed++;
    if (customActivity.trim()) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const resetForm = () => {
    setSelectedMood('');
    setCustomMoodLabel('');
    setHeartSpeak('');
    setGratitude1('');
    setGratitude2('');
    setGratitude3('');
    setChallenges('');
    setSelectedActivities([]);
    setCustomActivity('');
    setNoteToSelf('');
    setFreeThoughts('');
    setLettingGo('');
    setTodoItems(['']);
  };

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/journals"
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              ←
            </Link>
            <div>
              <h1 className="text-3xl font-bold">📔 Daily Check-In</h1>
              <p className="text-gray-600 dark:text-gray-400">How are you feeling today?</p>
            </div>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving || !selectedMood}
            className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:from-rose-600 hover:to-pink-600 transition disabled:opacity-50 font-semibold"
          >
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>

        {/* Auto Date/Time Display */}
        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
          <p className="text-blue-800 dark:text-blue-200 font-medium">
            📅 {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <p className="text-blue-600 dark:text-blue-300 text-sm">
            🕐 {new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>

        <div className="space-y-8">
          {/* Mood Tracker */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">🎭 Mood Tracker</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">How are you feeling right now?</p>
            
            <div className="grid grid-cols-5 gap-4 mb-4">
              {MOOD_OPTIONS.map(mood => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`p-4 rounded-2xl border-2 transition ${
                    selectedMood === mood.value
                      ? `border-${mood.color.split('-')[1]}-500 bg-gradient-to-r ${mood.color} text-white`
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  <div className="text-4xl mb-2">{mood.emoji}</div>
                  <div className="text-sm font-medium">{mood.label}</div>
                </button>
              ))}
            </div>
            
            <input
              type="text"
              value={customMoodLabel}
              onChange={(e) => setCustomMoodLabel(e.target.value)}
              placeholder="Add your own mood description..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </section>

          {/* Heart Speak */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">💖 Heart Speak</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">If your heart could speak today, what would it say?</p>
            <textarea
              value={heartSpeak}
              onChange={(e) => setHeartSpeak(e.target.value)}
              placeholder="Let your heart express itself freely..."
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
              rows={4}
            />
          </section>

          {/* Gratitude Section */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">🙏 Gratitude</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">List 3 things you are grateful for today</p>
            
            <div className="space-y-3">
              <input
                type="text"
                value={gratitude1}
                onChange={(e) => setGratitude1(e.target.value)}
                placeholder="1. I'm grateful for..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
              <input
                type="text"
                value={gratitude2}
                onChange={(e) => setGratitude2(e.target.value)}
                placeholder="2. I'm grateful for..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
              <input
                type="text"
                value={gratitude3}
                onChange={(e) => setGratitude3(e.target.value)}
                placeholder="3. I'm grateful for..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </section>

          {/* Challenge Tracker */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">⚡ Challenge Tracker</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">What challenged you today?</p>
            <textarea
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              placeholder="Describe any challenges you faced and how you handled them..."
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={4}
            />
          </section>

          {/* Self-Care Activities */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">🌟 Self-Care Activities</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">What did you do to take care of yourself today?</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {SELF_CARE_ACTIVITIES.map(activity => (
                <label
                  key={activity}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition ${
                    selectedActivities.includes(activity)
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedActivities.includes(activity)}
                    onChange={() => toggleActivity(activity)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm font-medium">{activity}</span>
                </label>
              ))}
            </div>
            
            <input
              type="text"
              value={customActivity}
              onChange={(e) => setCustomActivity(e.target.value)}
              placeholder="Add your own self-care activity..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </section>

          {/* Note to Self */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">💌 Note to Self</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">A kind note to myself today...</p>
            <textarea
              value={noteToSelf}
              onChange={(e) => setNoteToSelf(e.target.value)}
              placeholder="Write yourself a loving, encouraging message..."
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
            />
          </section>

          {/* Free Thoughts */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">💭 Free Thoughts</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Notes & free-flow thoughts</p>
            <textarea
              value={freeThoughts}
              onChange={(e) => setFreeThoughts(e.target.value)}
              placeholder="Let your thoughts flow freely here... no judgment, just expression."
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={6}
            />
          </section>

          {/* Letting Go */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">🕊️ Letting Go</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">One thing I want to release today...</p>
            <input
              type="text"
              value={lettingGo}
              onChange={(e) => setLettingGo(e.target.value)}
              placeholder="What would you like to let go of today?"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </section>

          {/* To-Do List */}
          <section className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4">📝 Tomorrow&apos;s Intentions</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Simple task list for tomorrow</p>
            
            <div className="space-y-3">
              {todoItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateTodoItem(index, e.target.value)}
                    placeholder={`Task ${index + 1}...`}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  {todoItems.length > 1 && (
                    <button
                      onClick={() => removeTodoItem(index)}
                      className="px-3 py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              
              <button
                onClick={addTodoItem}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 transition text-gray-600 dark:text-gray-400"
              >
                + Add Another Task
              </button>
            </div>
          </section>

          {/* Completion Progress */}
          <section className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-3xl p-6">
            <h2 className="text-xl font-bold mb-4">📊 Completion Progress</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="w-full bg-white/20 rounded-full h-4">
                  <div 
                    className="bg-white h-4 rounded-full transition-all duration-500"
                    style={{ width: `${calculateCompletionScore()}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-2xl font-bold">{calculateCompletionScore()}%</span>
            </div>
            <p className="text-white/80 text-sm mt-2">
              Complete more sections to earn bonus Aura Points! ✨
            </p>
          </section>

          {/* Save Button */}
          <div className="text-center">
            <button
              onClick={handleSave}
              disabled={saving || !selectedMood}
              className="px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl hover:from-rose-600 hover:to-pink-600 transition disabled:opacity-50 font-bold text-lg shadow-lg"
            >
              {saving ? 'Saving Your Check-In...' : 'Complete Daily Check-In 🎉'}
            </button>
            
            {!selectedMood && (
              <p className="text-sm text-gray-500 mt-2">Please select your mood to save</p>
            )}
          </div>
        </div>

        {/* Journal History */}
        <SpecializedJournalHistory
          journalType="daily-checkin"
          title="Daily Check-In"
          icon="📔"
          renderEntry={(entry) => (
            <div className="space-y-3">
              {entry.mood && (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {MOOD_OPTIONS.find(m => m.value === entry.mood.value)?.emoji || '😐'}
                  </span>
                  <div>
                    <div className="font-medium text-gray-700 dark:text-gray-300">
                      {MOOD_OPTIONS.find(m => m.value === entry.mood.value)?.label || 'Unknown Mood'}
                    </div>
                    {entry.mood.customLabel && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        &ldquo;{entry.mood.customLabel}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {entry.heartSpeak && (
                <div className="p-3 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-lg border-l-4 border-rose-500">
                  <div className="text-sm font-medium text-rose-800 dark:text-rose-300 mb-1">💝 Heart Speak</div>
                  <div className="text-rose-700 dark:text-rose-300">{entry.heartSpeak}</div>
                </div>
              )}
              
              {entry.gratitude && entry.gratitude.length > 0 && (
                <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg border-l-4 border-yellow-500">
                  <div className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">🙏 Gratitude</div>
                  <ul className="space-y-1">
                    {entry.gratitude.map((item: string, index: number) => (
                      <li key={index} className="text-yellow-700 dark:text-yellow-300">• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {entry.selfCareActivities && entry.selfCareActivities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {entry.selfCareActivities.map((activity: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                      {activity}
                    </span>
                  ))}
                </div>
              )}
              
              {entry.challenges && (
                <div className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Challenges: </span>
                  {entry.challenges}
                </div>
              )}
            </div>
          )}
        />
      </div>
    </div>
  );
}