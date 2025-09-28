'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  getFriends,
  removeFriend,
  Friendship
} from '@/lib/socialSystem';

interface FriendsListProps {
  onFriendRemoved?: () => void;
}

export default function FriendsList({ onFriendRemoved }: FriendsListProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'mutual'>('recent');

  useEffect(() => {
    if (user) {
      loadFriends();
    }
  }, [user]);

  const loadFriends = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const friendsList = await getFriends(user.uid);
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (friend: Friendship) => {
    if (!user || !confirm(`Remove ${friend.friendProfile?.name || 'this user'} from your friends?`)) {
      return;
    }
    
    setActionLoading(friend.friendId);
    try {
      await removeFriend({
        userId: user.uid,
        friendId: friend.friendId,
      });
      
      await loadFriends();
      onFriendRemoved?.();
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Failed to remove friend');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartChat = (friendId: string) => {
    router.push(`/chat/${friendId}`);
  };

  const handleViewProfile = (friendId: string) => {
    router.push(`/profile/${friendId}`);
  };

  const filteredAndSortedFriends = friends
    .filter(friend => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        friend.friendProfile?.name.toLowerCase().includes(query) ||
        friend.friendProfile?.username?.toLowerCase().includes(query) ||
        friend.friendProfile?.bio?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.friendProfile?.name || '').localeCompare(b.friendProfile?.name || '');
        case 'mutual':
          return (b.mutualFriends || 0) - (a.mutualFriends || 0);
        case 'recent':
        default:
          if (!a.lastInteraction || !b.lastInteraction) return 0;
          if (typeof a.lastInteraction === 'object' && 'toDate' in a.lastInteraction &&
              typeof b.lastInteraction === 'object' && 'toDate' in b.lastInteraction) {
            return b.lastInteraction.toDate().getTime() - a.lastInteraction.toDate().getTime();
          }
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search friends..."
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
          onChange={(e) => setSortBy(e.target.value as 'name' | 'recent' | 'mutual')}
          className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="recent">Recently Active</option>
          <option value="name">Name (A-Z)</option>
          <option value="mutual">Mutual Friends</option>
        </select>
      </div>

      {/* Friends Count */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Friends ({filteredAndSortedFriends.length})
        </h2>
      </div>

      {/* Friends List */}
      {filteredAndSortedFriends.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">
            {friends.length === 0 ? '👥' : '🔍'}
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            {friends.length === 0 ? 'No friends yet' : 'No friends found'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {friends.length === 0 
              ? 'Start by discovering people or searching for friends!'
              : 'Try adjusting your search or sort criteria'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAndSortedFriends.map((friend) => (
            <div 
              key={friend.friendId} 
              className="flex items-center justify-between p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    {friend.friendProfile?.avatar ? (
                      <img 
                        src={friend.friendProfile.avatar} 
                        alt={friend.friendProfile.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-white font-bold text-xl">
                        {friend.friendProfile?.name.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  {friend.friendProfile?.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {friend.friendProfile?.name || 'Unknown User'}
                    </h3>
                    {friend.friendProfile?.username && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        @{friend.friendProfile.username}
                      </span>
                    )}
                  </div>
                  
                  {friend.friendProfile?.bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                      {friend.friendProfile.bio}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {friend.friendSince && typeof friend.friendSince === 'object' && 'toDate' in friend.friendSince && (
                      <span>
                        🤝 Friends since {new Date(friend.friendSince.toDate()).toLocaleDateString()}
                      </span>
                    )}
                    {friend.mutualFriends && friend.mutualFriends > 0 && (
                      <span>👥 {friend.mutualFriends} mutual friends</span>
                    )}
                    {friend.friendProfile?.location && (
                      <span>📍 {friend.friendProfile.location}</span>
                    )}
                  </div>
                  
                  {friend.sharedInterests && friend.sharedInterests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {friend.sharedInterests.slice(0, 3).map((interest, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full"
                        >
                          {interest}
                        </span>
                      ))}
                      {friend.sharedInterests.length > 3 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                          +{friend.sharedInterests.length - 3} shared
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleStartChat(friend.friendId)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all text-sm font-medium shadow-sm"
                >
                  💬 Message
                </button>
                
                <button
                  onClick={() => handleViewProfile(friend.friendId)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-sm font-medium"
                >
                  👤 Profile
                </button>
                
                <button
                  onClick={() => handleRemoveFriend(friend)}
                  disabled={actionLoading === friend.friendId}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50 text-sm font-medium"
                >
                  {actionLoading === friend.friendId ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Removing...
                    </div>
                  ) : (
                    '🗑️ Remove'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}