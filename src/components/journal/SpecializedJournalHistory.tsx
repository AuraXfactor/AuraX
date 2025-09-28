'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SpecializedJournalEntry {
  id: string;
  journalType: string;
  userId: string;
  timestamp: Timestamp | null;
  dateKey: string;
  [key: string]: unknown; // Allow dynamic data based on journal type
}

interface SpecializedJournalHistoryProps {
  journalType: string;
  title: string;
  icon: string;
  renderEntry: (entry: any) => React.ReactNode; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export default function SpecializedJournalHistory({ 
  journalType, 
  title, 
  icon, 
  renderEntry 
}: SpecializedJournalHistoryProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<SpecializedJournalEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'specialized-journals', user.uid, journalType),
      orderBy('timestamp', 'desc')
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => {
        const data = d.data() as DocumentData;
        return {
          id: d.id,
          ...data,
        } as SpecializedJournalEntry;
      });
      setEntries(items);
    });
    
    return () => unsub();
  }, [user, journalType]);

  const filteredAndSortedEntries = useMemo(() => {
    let filtered = entries;
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => {
        const entryString = JSON.stringify(entry).toLowerCase();
        return entryString.includes(term);
      });
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
        if (!entry.timestamp) return false;
        return entry.timestamp.toDate() >= filterDate;
      });
    }
    
    // Sort entries
    const sorted = [...filtered].sort((a, b) => {
      const timeA = a.timestamp?.toMillis() ?? 0;
      const timeB = b.timestamp?.toMillis() ?? 0;
      
      return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
    });
    
    return sorted;
  }, [entries, searchTerm, dateFilter, sortBy]);

  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return 'Unknown';
    return timestamp.toDate().toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          {icon} {title} History
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {entries.length} entries
          </span>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition flex items-center gap-2"
          >
            {showHistory ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Hide History
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                View History ({entries.length})
              </>
            )}
          </button>
        </div>
      </div>

      {showHistory && (
        <>
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 dark:bg-gray-800/80"
              />
            </div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 dark:bg-gray-800/80"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 dark:bg-gray-800/80"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {/* Entry Count */}
          <div className="flex items-center justify-between mb-4 text-sm text-gray-600 dark:text-gray-400">
            <span>
              {filteredAndSortedEntries.length} of {entries.length} entries
              {(searchTerm || dateFilter !== 'all') && ' (filtered)'}
            </span>
          </div>

          {/* Journal Entries */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredAndSortedEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {entries.length === 0 
                  ? 'No journal entries yet. Create your first entry above!' 
                  : 'No entries match your filters'}
              </div>
            ) : (
              filteredAndSortedEntries.map((entry) => (
                <div key={entry.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 transition">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(entry.timestamp)}
                    </div>
                  </div>
                  
                  {renderEntry(entry)}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}