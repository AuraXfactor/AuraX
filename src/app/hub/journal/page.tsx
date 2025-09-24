'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUserAuraStats, UserAuraStats } from '@/lib/auraPoints';

interface JournalEntry {
  id: string;
  entryText: string;
  moodTag: string;
  createdAt: Timestamp | null;
  dateKey: string;
  auraScore?: number;
}

interface JournalCollection {
  id: string;
  name: string;
  entryCount: number;
  lastEntry?: Date;
  color: string;
}

const tabs = [
  { id: 'write', label: 'Write', icon: '✍️', href: '/journal' },
  { id: 'recent', label: 'Recent', icon: '📄', href: '/hub/journal?tab=recent' },
  { id: 'library', label: 'Library', icon: '📚', href: '/hub/journal?tab=library' },
  { id: 'toolkit', label: 'Toolkit', icon: '🧰', href: '/toolkit' },
];

export default function JournalHubPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPageTitle, setBreadcrumbs } = useNavigation();
  const [activeTab, setActiveTab] = useState('write');
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [journalCollections, setJournalCollections] = useState<JournalCollection[]>([]);
  const [userStats, setUserStats] = useState<UserAuraStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const tab = searchParams.get('tab') || 'write';
    setActiveTab(tab);
    
    loadData();
    updateNavigationState(tab);
  }, [user, router, searchParams]);

  const updateNavigationState = (tab: string) => {
    switch (tab) {
      case 'recent':
        setPageTitle('Recent Entries');
        setBreadcrumbs([{ label: 'Journal' }, { label: 'Recent Entries' }]);
        break;
      case 'library':
        setPageTitle('Journal Library');
        setBreadcrumbs([{ label: 'Journal' }, { label: 'Library' }]);
        break;
      case 'toolkit':
        setPageTitle('Wellness Toolkit');
        setBreadcrumbs([{ label: 'Journal' }, { label: 'Toolkit' }]);
        break;
      default:
        setPageTitle('My Journal');
        setBreadcrumbs([{ label: 'Journal' }]);
    }
  };

  const loadData = async () => {
    if (!user) return;

    try {
      const [entries, stats] = await Promise.all([
        loadRecentEntries(),
        getUserAuraStats(user.uid),
      ]);

      setRecentEntries(entries);
      setUserStats(stats);
      loadJournalCollections();
    } catch (error) {
      console.error('Error loading journal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentEntries = async (): Promise<JournalEntry[]> => {
    if (!user) return [];
    
    try {
      const entriesRef = collection(db, 'journals', user.uid, 'entries');
      const q = query(entriesRef, orderBy('createdAt', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as JournalEntry[];
    } catch (error) {
      console.error('Error loading recent entries:', error);
      return [];
    }
  };

  const loadJournalCollections = () => {
    // Mock collections for now - would be dynamic in real implementation
    const collections: JournalCollection[] = [
      { id: 'personal', name: 'Personal Journal', entryCount: 15, color: 'from-rose-500 to-pink-500' },
      { id: 'work', name: 'Work & Career', entryCount: 8, color: 'from-blue-500 to-indigo-500' },
      { id: 'health', name: 'Health & Wellness', entryCount: 12, color: 'from-green-500 to-emerald-500' },
      { id: 'relationships', name: 'Relationships', entryCount: 6, color: 'from-purple-500 to-violet-500' },
      { id: 'growth', name: 'Personal Growth', entryCount: 9, color: 'from-orange-500 to-red-500' },
      { id: 'gratitude', name: 'Gratitude Journal', entryCount: 20, color: 'from-yellow-500 to-amber-500' },
    ];
    setJournalCollections(collections);
  };

  const renderWriteTab = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl">
          <div className="text-2xl font-bold">{userStats?.currentStreak || 0}</div>
          <div className="text-purple-100 text-sm">Day Streak 🔥</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl">
          <div className="text-2xl font-bold">{recentEntries.length}</div>
          <div className="text-blue-100 text-sm">Recent Entries</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl">
          <div className="text-2xl font-bold">{userStats?.availablePoints || 0}</div>
          <div className="text-green-100 text-sm">Aura Points</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/journal"
          className="p-6 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-3xl hover:from-rose-600 hover:to-orange-600 transition group"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl group-hover:scale-110 transition">✍️</div>
            <div>
              <h3 className="text-xl font-bold">Write New Entry</h3>
              <p className="text-rose-100">Capture your thoughts and mood</p>
            </div>
          </div>
        </Link>

        <Link
          href="/journal/voice"
          className="p-6 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-3xl hover:from-purple-600 hover:to-indigo-600 transition group"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl group-hover:scale-110 transition">🎙️</div>
            <div>
              <h3 className="text-xl font-bold">Voice Journal</h3>
              <p className="text-purple-100">Record your thoughts</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Today's Mood Check */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
        <h2 className="text-xl font-bold mb-4">How are you feeling today?</h2>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {[
            { emoji: '🤩', mood: 'excited', color: 'from-pink-500 to-rose-500' },
            { emoji: '😊', mood: 'happy', color: 'from-yellow-400 to-amber-500' },
            { emoji: '😌', mood: 'calm', color: 'from-teal-400 to-emerald-500' },
            { emoji: '😐', mood: 'neutral', color: 'from-slate-300 to-slate-400' },
            { emoji: '😔', mood: 'sad', color: 'from-blue-300 to-indigo-400' },
            { emoji: '😩', mood: 'stressed', color: 'from-orange-400 to-red-400' },
            { emoji: '😰', mood: 'anxious', color: 'from-cyan-400 to-blue-500' },
            { emoji: '😡', mood: 'angry', color: 'from-red-500 to-rose-600' },
          ].map(mood => (
            <Link
              key={mood.mood}
              href={`/journal?mood=${mood.mood}`}
              className={`p-3 rounded-xl bg-gradient-to-r ${mood.color} text-white text-center hover:scale-105 transition`}
            >
              <div className="text-2xl mb-1">{mood.emoji}</div>
              <div className="text-xs capitalize">{mood.mood}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Entries Preview */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent Entries</h2>
          <Link
            href="/hub/journal?tab=recent"
            className="text-purple-500 hover:text-purple-600 text-sm font-medium"
          >
            View All →
          </Link>
        </div>
        
        <div className="space-y-3">
          {recentEntries.slice(0, 3).map(entry => (
            <div key={entry.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">
                  {entry.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                </span>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                  {entry.moodTag}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                {entry.entryText.slice(0, 120)}...
              </p>
            </div>
          ))}
          
          {recentEntries.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📔</div>
              <p className="text-gray-500">No journal entries yet</p>
              <Link
                href="/journal"
                className="inline-block mt-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
              >
                Write Your First Entry
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderRecentTab = () => (
    <div className="space-y-4">
      {recentEntries.map(entry => (
        <div key={entry.id} className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="font-medium">
                {entry.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                {entry.moodTag}
              </span>
              {entry.auraScore && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  +{entry.auraScore} pts
                </span>
              )}
            </div>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {entry.entryText}
          </p>
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500">
              {entry.entryText.split(' ').length} words
            </span>
            <button className="text-purple-500 hover:text-purple-600 text-sm font-medium">
              Edit Entry
            </button>
          </div>
        </div>
      ))}
      
      {recentEntries.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📔</div>
          <h3 className="text-xl font-semibold mb-2">No entries yet</h3>
          <p className="text-gray-500 mb-4">Start your wellness journey by writing your first entry</p>
          <Link
            href="/journal"
            className="inline-block px-6 py-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl hover:from-rose-600 hover:to-orange-600 transition"
          >
            Write First Entry ✍️
          </Link>
        </div>
      )}
    </div>
  );

  const renderLibraryTab = () => (
    <div className="space-y-6">
      {/* Collections Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {journalCollections.map(collection => (
          <div
            key={collection.id}
            className={`p-6 bg-gradient-to-r ${collection.color} text-white rounded-3xl hover:scale-105 transition cursor-pointer`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">{collection.name}</h3>
              <span className="text-2xl">📚</span>
            </div>
            <div className="space-y-1">
              <p className="text-white/80">{collection.entryCount} entries</p>
              {collection.lastEntry && (
                <p className="text-white/60 text-sm">
                  Last: {collection.lastEntry.toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
        <h2 className="text-xl font-bold mb-4">Journal Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition">
            <div className="text-3xl mb-2">➕</div>
            <div className="font-medium">Create Collection</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Organize your thoughts</div>
          </button>
          
          <button className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition">
            <div className="text-3xl mb-2">📤</div>
            <div className="font-medium">Export Data</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Download your entries</div>
          </button>
          
          <button className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition">
            <div className="text-3xl mb-2">📊</div>
            <div className="font-medium">Analytics</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Mood insights</div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderToolkitTab = () => (
    <div className="space-y-6">
      {/* Wellness Tools Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[
          { href: '/toolkit/breathing', title: 'Breathing', icon: '🌬️', color: 'from-cyan-400 to-blue-500', points: 15 },
          { href: '/toolkit/meditations', title: 'Meditations', icon: '🧘', color: 'from-emerald-400 to-teal-500', points: 15 },
          { href: '/toolkit/workouts', title: 'Workouts', icon: '💪', color: 'from-pink-400 to-rose-500', points: 15 },
          { href: '/toolkit/gratitude', title: 'Gratitude', icon: '🙏', color: 'from-green-500 to-emerald-500', points: 5 },
          { href: '/toolkit/affirmations', title: 'Affirmations', icon: '✨', color: 'from-purple-500 to-violet-500', points: 5 },
          { href: '/toolkit/grounding', title: 'Grounding', icon: '🪨', color: 'from-amber-400 to-orange-500', points: 10 },
          { href: '/toolkit/panic', title: 'Panic Relief', icon: '🆘', color: 'from-rose-500 to-red-500', points: 20 },
          { href: '/toolkit/sleep', title: 'Sleep Tools', icon: '😴', color: 'from-slate-500 to-gray-700', points: 10 },
        ].map(tool => (
          <Link
            key={tool.title}
            href={tool.href}
            className={`p-4 bg-gradient-to-r ${tool.color} text-white rounded-2xl hover:scale-105 transition group`}
          >
            <div className="text-center">
              <div className="text-3xl mb-2 group-hover:scale-110 transition">{tool.icon}</div>
              <div className="font-bold text-sm">{tool.title}</div>
              <div className="text-xs opacity-80">+{tool.points} pts</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Featured Content */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
        <h2 className="text-xl font-bold mb-4">Recommended for You</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-2xl">
            <h3 className="font-bold mb-2">🌬️ 4-7-8 Breathing</h3>
            <p className="text-cyan-100 text-sm mb-3">Perfect for anxiety relief</p>
            <Link
              href="/toolkit/breathing"
              className="inline-block px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-sm font-medium"
            >
              Start Session
            </Link>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-2xl">
            <h3 className="font-bold mb-2">🧘 5-Minute Meditation</h3>
            <p className="text-emerald-100 text-sm mb-3">Quick mindfulness reset</p>
            <Link
              href="/toolkit/meditations"
              className="inline-block px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-sm font-medium"
            >
              Begin Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 md:px-6 pt-6">
      <div className="max-w-4xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
          {tabs.map(tab => (
            <Link
              key={tab.id}
              href={tab.href}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="font-medium hidden sm:inline">{tab.label}</span>
            </Link>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'write' && renderWriteTab()}
        {activeTab === 'recent' && renderRecentTab()}
        {activeTab === 'library' && renderLibraryTab()}
        {activeTab === 'toolkit' && renderToolkitTab()}
      </div>
    </div>
  );
}