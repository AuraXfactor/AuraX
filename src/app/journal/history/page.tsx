'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  DocumentData,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const defaultActivities: { key: string; label: string }[] = [
  { key: 'talk_friend', label: 'Talking to a friend/loved one' },
  { key: 'exercise', label: 'Exercise / workout' },
  { key: 'meditation', label: 'Meditation / prayer' },
  { key: 'journaling', label: 'Journaling / writing' },
  { key: 'reading', label: 'Reading' },
  { key: 'listening', label: 'Listening to music / podcast' },
  { key: 'outdoors', label: 'Going for a walk / time outdoors' },
  { key: 'gratitude', label: 'Practicing gratitude' },
  { key: 'healthy_eating', label: 'Eating healthy meal(s)' },
  { key: 'rest', label: 'Resting / sleeping well' },
];

const moods = [
  { label: '🤩', value: 'excited', color: 'from-pink-500 to-rose-500' },
  { label: '😊', value: 'happy', color: 'from-yellow-400 to-amber-500' },
  { label: '😌', value: 'calm', color: 'from-teal-400 to-emerald-500' },
  { label: '😐', value: 'neutral', color: 'from-slate-300 to-slate-400' },
  { label: '😔', value: 'sad', color: 'from-blue-300 to-indigo-400' },
  { label: '😩', value: 'stressed', color: 'from-orange-400 to-red-400' },
  { label: '😡', value: 'angry', color: 'from-red-500 to-rose-600' },
];

type JournalEntry = {
  id: string;
  entryText: string;
  moodTag: string;
  createdAt?: Timestamp | null;
  voiceMemoUrl?: string | null;
  activities?: string[];
  affirmation?: string | null;
  auraScore?: number | null;
  dateKey?: string | null;
};

export default function JournalHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMood, setFilterMood] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highestAura'>('newest');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const q = query(
      collection(db, 'journals', user.uid, 'entries'),
      orderBy('createdAt', 'desc')
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => {
        const data = d.data() as DocumentData;
        return {
          id: d.id,
          entryText: (data.entryText as string) ?? '',
          moodTag: (data.moodTag as string) ?? 'neutral',
          createdAt: (data.createdAt as Timestamp | null) ?? null,
          voiceMemoUrl: (data.voiceMemoUrl as string | null) ?? null,
          activities: (data.activities as string[] | undefined) ?? [],
          affirmation: (data.affirmation as string | null) ?? null,
          auraScore: (data.auraScore as number | null) ?? null,
          dateKey: (data.dateKey as string | null) ?? null,
        } satisfies JournalEntry;
      });
      setEntries(items);
      setLoading(false);
    });
    
    return () => unsub();
  }, [user, router]);

  const filteredAndSortedEntries = useMemo(() => {
    let filtered = entries;
    
    // Filter by mood
    if (filterMood !== 'all') {
      filtered = filtered.filter(entry => entry.moodTag === filterMood);
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.entryText.toLowerCase().includes(term) ||
        entry.affirmation?.toLowerCase().includes(term) ||
        entry.activities?.some(activity => 
          defaultActivities.find(d => d.key === activity)?.label.toLowerCase().includes(term) ||
          activity.toLowerCase().includes(term)
        )
      );
    }
    
    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      let filterDate: Date;
      
      switch (dateFilter) {
        case 'today':
          filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          filterDate = new Date(0);
      }
      
      filtered = filtered.filter(entry => {
        if (!entry.createdAt) return false;
        return entry.createdAt.toDate() >= filterDate;
      });
    }
    
    // Sort entries
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0);
        case 'highestAura':
          return (b.auraScore ?? 0) - (a.auraScore ?? 0);
        case 'newest':
        default:
          return (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0);
      }
    });
    
    return sorted;
  }, [entries, filterMood, searchTerm, dateFilter, sortBy]);

  const stats = useMemo(() => {
    const totalAura = entries.reduce((sum, entry) => sum + (entry.auraScore ?? 0), 0);
    const moodCounts = entries.reduce((acc, entry) => {
      acc[entry.moodTag] = (acc[entry.moodTag] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const activityCounts = entries.reduce((acc, entry) => {
      entry.activities?.forEach(activity => {
        const label = defaultActivities.find(d => d.key === activity)?.label ?? activity;
        acc[label] = (acc[label] ?? 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalEntries: entries.length,
      totalAura,
      averageAura: entries.length > 0 ? Math.round(totalAura / entries.length) : 0,
      moodCounts,
      activityCounts,
      topMood: Object.entries(moodCounts).sort(([,a], [,b]) => b - a)[0]?.[0],
      topActivity: Object.entries(activityCounts).sort(([,a], [,b]) => b - a)[0]?.[0],
    };
  }, [entries]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              📖 Journal History
            </h1>
          </div>
          <button
            onClick={() => router.push('/journal')}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition"
          >
            New Entry
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Filters and Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Stats */}
            <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
              <h2 className="text-lg font-semibold mb-4">📊 Statistics</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Total Entries:</span>
                  <span className="font-bold">{stats.totalEntries}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Aura:</span>
                  <span className="font-bold text-purple-600">+{stats.totalAura}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Aura:</span>
                  <span className="font-bold text-purple-600">+{stats.averageAura}</span>
                </div>
                {stats.topMood && (
                  <div className="flex justify-between items-center">
                    <span>Top Mood:</span>
                    <div className="flex items-center gap-1">
                      <span>{moods.find(m => m.value === stats.topMood)?.label}</span>
                      <span className="text-xs">{stats.moodCounts[stats.topMood]}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
              <h2 className="text-lg font-semibold mb-4">🔍 Filters</h2>
              
              <div className="space-y-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Search entries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 dark:bg-gray-800/80 text-sm"
                  />
                </div>

                {/* Mood Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Mood</label>
                  <select
                    value={filterMood}
                    onChange={(e) => setFilterMood(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 dark:bg-gray-800/80 text-sm"
                  >
                    <option value="all">All Moods</option>
                    {moods.map(mood => (
                      <option key={mood.value} value={mood.value}>
                        {mood.label} {mood.value.charAt(0).toUpperCase() + mood.value.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Time Period</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 dark:bg-gray-800/80 text-sm"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 dark:bg-gray-800/80 text-sm"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highestAura">Highest Aura</option>
                  </select>
                </div>

                {/* Clear Filters */}
                {(filterMood !== 'all' || searchTerm || dateFilter !== 'all' || sortBy !== 'newest') && (
                  <button
                    onClick={() => {
                      setFilterMood('all');
                      setSearchTerm('');
                      setDateFilter('all');
                      setSortBy('newest');
                    }}
                    className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Journal Entries */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20 mb-6">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Showing {filteredAndSortedEntries.length} of {entries.length} entries
                  {(filterMood !== 'all' || searchTerm || dateFilter !== 'all') && ' (filtered)'}
                </span>
                <span>Total Aura: +{stats.totalAura}</span>
              </div>
            </div>

            {/* Journal Entries */}
            <div className="space-y-6">
              {filteredAndSortedEntries.length === 0 ? (
                <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-12 border border-white/20 text-center">
                  <div className="text-6xl mb-4">📔</div>
                  <h3 className="text-xl font-semibold mb-2">
                    {entries.length === 0 ? 'No Entries Yet' : 'No Matching Entries'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {entries.length === 0 
                      ? 'Start your wellness journey by creating your first journal entry!'
                      : 'Try adjusting your filters to find the entries you\'re looking for.'
                    }
                  </p>
                  <button
                    onClick={() => router.push('/journal')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition"
                  >
                    {entries.length === 0 ? 'Create First Entry' : 'Create New Entry'}
                  </button>
                </div>
              ) : (
                filteredAndSortedEntries.map((entry) => (
                  <div key={entry.id} className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20 hover:bg-white/80 dark:hover:bg-white/20 transition">
                    {/* Entry Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">
                          {moods.find((m) => m.value === entry.moodTag)?.label ?? '😐'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-700 dark:text-gray-300">
                            {moods.find((m) => m.value === entry.moodTag)?.value.charAt(0).toUpperCase() + 
                             moods.find((m) => m.value === entry.moodTag)?.value.slice(1) ?? 'Neutral'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {entry.createdAt?.toDate?.().toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) ?? 'Pending sync'}
                          </div>
                        </div>
                      </div>
                      
                      {typeof entry.auraScore === 'number' && (
                        <div className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-full font-medium">
                          +{entry.auraScore} Aura
                        </div>
                      )}
                    </div>

                    {/* Affirmation */}
                    {entry.affirmation && (
                      <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border-l-4 border-purple-500">
                        <div className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">💫 Affirmation</div>
                        <div className="text-purple-700 dark:text-purple-300 italic">"{entry.affirmation}"</div>
                      </div>
                    )}

                    {/* Activities */}
                    {entry.activities && entry.activities.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">🎯 Activities</div>
                        <div className="flex flex-wrap gap-2">
                          {entry.activities.map((activity) => {
                            const label = defaultActivities.find((d) => d.key === activity)?.label || 
                                         activity.replace(/^custom_/, '').replace(/_/g, ' ');
                            return (
                              <span key={activity} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Entry Text */}
                    <div className="prose prose-gray dark:prose-invert max-w-none mb-4">
                      <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">
                        {entry.entryText}
                      </div>
                    </div>
                    
                    {/* Voice Memo */}
                    {entry.voiceMemoUrl && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">🎤 Voice Memo</div>
                        <audio src={entry.voiceMemoUrl} controls className="w-full" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}