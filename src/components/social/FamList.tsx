'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  getFamMembers,
  getFamStats,
  listenToFamChanges,
  removeFamMember,
  searchFamMembers,
  sortFamMembers,
  FamMember,
  FamStats
} from '@/lib/famTrackingSystem';

interface FamListProps {
  onMemberRemoved?: () => void;
}

export default function FamList({ onMemberRemoved }: FamListProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [famMembers, setFamMembers] = useState<FamMember[]>([]);
  const [stats, setStats] = useState<FamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'auraPoints' | 'recent' | 'online'>('recent');

  const loadFamMembers = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('🔄 Loading fam members...');
      const [members, famStats] = await Promise.all([
        getFamMembers(user.uid),
        getFamStats(user.uid)
      ]);
      setFamMembers(members);
      setStats(famStats);
      console.log('✅ Fam members loaded:', members.length);
    } catch (error) {
      console.error('Error loading fam members:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFamMembers();
    }
  }, [user, loadFamMembers]);

  // Listen for fam changes
  useEffect(() => {
    if (!user) return;

    const unsubscribe = listenToFamChanges(user.uid, (members, famStats) => {
      setFamMembers(members);
      setStats(famStats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen for custom fam update events
  useEffect(() => {
    const handleFamUpdate = () => {
      if (user) {
        console.log('🔄 Fam update event received, refreshing...');
        loadFamMembers();
      }
    };

    window.addEventListener('famUpdated', handleFamUpdate);
    return () => window.removeEventListener('famUpdated', handleFamUpdate);
  }, [user, loadFamMembers]);

  const handleRemoveMember = async (member: FamMember) => {
    if (!user || !confirm(`Remove ${member.name} from your Aura Fam?`)) {
      return;
    }
    
    setActionLoading(member.userId);
    try {
      await removeFamMember({
        userId: user.uid,
        famUserId: member.userId,
      });
      
      onMemberRemoved?.();
    } catch (error) {
      console.error('Error removing fam member:', error);
      alert('Failed to remove fam member');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartChat = (memberId: string) => {
    console.log('🚀 Starting chat from fam list', { memberId });
    router.push(`/soulchat/${memberId}`);
  };

  const handleViewProfile = (memberId: string) => {
    router.push(`/profile/${memberId}`);
  };

  // Filter and sort fam members
  const filteredAndSortedMembers = React.useMemo(() => {
    const filtered = searchFamMembers(famMembers, searchQuery);
    return sortFamMembers(filtered, sortBy);
  }, [famMembers, searchQuery, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fam Stats */}
      {stats && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-4">Aura Fam Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.totalMembers}</div>
              <div className="text-sm opacity-90">Total Fam</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.activeMembers}</div>
              <div className="text-sm opacity-90">Active Now</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.newMembersThisWeek}</div>
              <div className="text-sm opacity-90">New This Week</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.pendingRequests}</div>
              <div className="text-sm opacity-90">Pending Requests</div>
            </div>
          </div>
        </div>
      )}

      {/* Header with Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Aura Fam..."
            className="w-full px-4 py-2.5 pl-10 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="recent">Recent Activity</option>
          <option value="name">Name</option>
          <option value="auraPoints">Aura Points</option>
          <option value="online">Online Status</option>
        </select>
      </div>

      {/* Fam Members List */}
      {filteredAndSortedMembers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">
            {famMembers.length === 0 ? '👨‍👩‍👧‍👦' : '🔍'}
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            {famMembers.length === 0 ? 'No Aura Fam yet' : 'No fam found'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {famMembers.length === 0 
              ? 'Start by discovering your Aura Fam or searching for connections!'
              : 'Try adjusting your search or sort criteria'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAndSortedMembers.map((member) => (
            <div 
              key={member.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      {member.avatar ? (
                        <img 
                          src={member.avatar} 
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-lg">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {member.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {member.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      @{member.username}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-purple-600 dark:text-purple-400">
                        {member.auraPoints.toLocaleString()} aura points
                      </span>
                      {member.mutualConnections > 0 && (
                        <span className="text-sm text-gray-500">
                          {member.mutualConnections} mutual connections
                        </span>
                      )}
                    </div>
                    {member.sharedInterests.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {member.sharedInterests.slice(0, 3).map((interest, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded-full"
                          >
                            {interest}
                          </span>
                        ))}
                        {member.sharedInterests.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{member.sharedInterests.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartChat(member.userId)}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm"
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => handleViewProfile(member.userId)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => handleRemoveMember(member)}
                    disabled={actionLoading === member.userId}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm disabled:opacity-50"
                  >
                    {actionLoading === member.userId ? '...' : 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}