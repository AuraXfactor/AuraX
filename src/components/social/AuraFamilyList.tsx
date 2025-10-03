'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  getAuraFamilyMembers,
  getAuraFamilyStats,
  listenToAuraFamily,
  removeAuraFamilyMember,
  searchAuraFamilyMembers,
  sortAuraFamilyMembers,
  AuraFamilyMember,
  AuraFamilyStats
} from '@/lib/auraFamilySystem';
import { getFriends } from '@/lib/socialSystem';

interface AuraFamilyListProps {
  onMemberRemoved?: () => void;
}

export default function AuraFamilyList({ onMemberRemoved }: AuraFamilyListProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [familyMembers, setFamilyMembers] = useState<AuraFamilyMember[]>([]);
  const [stats, setStats] = useState<AuraFamilyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'auraPoints' | 'recent' | 'online'>('recent');

  useEffect(() => {
    if (user) {
      loadAuraFamily();
    }
  }, [user]);

  // Listen for Aura Family updates
  useEffect(() => {
    if (!user) return;

    const unsubscribe = listenToAuraFamily(user.uid, (members, familyStats) => {
      setFamilyMembers(members);
      setStats(familyStats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen for custom Aura Family update events
  useEffect(() => {
    const handleAuraFamilyUpdate = () => {
      if (user) {
        loadAuraFamily();
      }
    };

    window.addEventListener('auraFamilyUpdated', handleAuraFamilyUpdate);
    return () => window.removeEventListener('auraFamilyUpdated', handleAuraFamilyUpdate);
  }, [user]);

  const loadAuraFamily = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Try the new Aura Family system first
      let members = await getAuraFamilyMembers(user.uid);
      
      // If no members found, fallback to the original friends system
      if (members.length === 0) {
        console.log('No Aura Family members found, trying fallback to friends system...');
        const friends = await getFriends(user.uid);
        
        // Convert friends to AuraFamilyMember format
        members = friends.map(friend => ({
          userId: friend.friendId,
          name: friend.friendProfile?.name || 'Unknown',
          username: friend.friendProfile?.username || 'unknown',
          avatar: friend.friendProfile?.avatar,
          joinedAt: friend.friendSince,
          auraPoints: 0, // Default aura points since it's not in PublicProfile
          lastActivity: friend.friendProfile?.lastSeen,
          isOnline: friend.friendProfile?.isOnline || false,
          mutualConnections: friend.mutualFriends || 0,
          sharedInterests: friend.sharedInterests || friend.friendProfile?.interests || [],
        }));
      }
      
      const familyStats = await getAuraFamilyStats(user.uid);
      setFamilyMembers(members);
      setStats(familyStats);
      
      console.log('Loaded Aura Family members:', members.length);
    } catch (error) {
      console.error('Error loading Aura Family:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (member: AuraFamilyMember) => {
    if (!user || !confirm(`Remove ${member.name} from your Aura Family?`)) {
      return;
    }
    
    setActionLoading(member.userId);
    try {
      await removeAuraFamilyMember({
        currentUserId: user.uid,
        memberId: member.userId,
        memberName: member.name,
      });
      
      onMemberRemoved?.();
    } catch (error) {
      console.error('Error removing Aura Family member:', error);
      alert('Failed to remove family member');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartChat = (memberId: string) => {
    console.log('🚀 Starting chat from Aura Family list', { memberId });
    router.push(`/soulchat/${memberId}`);
  };

  const handleViewProfile = (memberId: string) => {
    router.push(`/profile/${memberId}`);
  };

  // Filter and sort family members
  const filteredAndSortedMembers = React.useMemo(() => {
    const filtered = searchAuraFamilyMembers(familyMembers, searchQuery);
    return sortAuraFamilyMembers(filtered, sortBy);
  }, [familyMembers, searchQuery, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aura Family Stats */}
      {stats && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-4">Aura Fam Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.totalMembers}</div>
              <div className="text-sm opacity-90">Total Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.activeMembers}</div>
              <div className="text-sm opacity-90">Active Now</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.totalAuraPoints.toLocaleString()}</div>
              <div className="text-sm opacity-90">Total Aura Points</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.newMembersThisWeek}</div>
              <div className="text-sm opacity-90">New This Week</div>
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

      {/* Family Members List */}
      {filteredAndSortedMembers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">
            {familyMembers.length === 0 ? '👨‍👩‍👧‍👦' : '🔍'}
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            {familyMembers.length === 0 ? 'No Aura Fam yet' : 'No fam found'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {familyMembers.length === 0 
              ? 'Start by discovering your Aura Fam or searching for connections!'
              : 'Try adjusting your search or sort criteria'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAndSortedMembers.map((member) => (
            <div 
              key={member.userId}
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