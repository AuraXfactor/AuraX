'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  searchUsers, 
  sendFriendRequest, 
  getFriendSuggestions,
  PublicProfile
} from '@/lib/socialSystem';
import { User } from 'firebase/auth';

interface FriendSearchProps {
  onRequestSent?: (userId: string) => void;
}

interface SearchResult extends PublicProfile {
  isFriend?: boolean;
  requestSent?: boolean;
}

export default function FriendSearch({ onRequestSent }: FriendSearchProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'suggestions'>('search');

  useEffect(() => {
    if (user) {
      loadSuggestions();
      if (!searchQuery.trim()) {
        loadDiscoverableUsers();
      }
    }
  }, [user]);

  const loadSuggestions = async () => {
    if (!user) return;
    
    try {
      const suggestions = await getFriendSuggestions({ userId: user.uid });
      setSuggestions(suggestions.map(profile => ({
        ...profile,
        isFriend: false,
        requestSent: false,
      })));
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const loadDiscoverableUsers = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const results = await searchUsers({ 
        query: '', 
        currentUserId: user.uid, 
        limitCount: 10 
      });
      
      setSearchResults(results.map(profile => ({
        ...profile,
        isFriend: false,
        requestSent: false,
      })));
    } catch (error) {
      console.error('Error loading discoverable users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const results = await searchUsers({ 
        query: searchQuery, 
        currentUserId: user.uid, 
        limitCount: 20 
      });
      
      setSearchResults(results.map(profile => ({
        ...profile,
        isFriend: false,
        requestSent: false,
      })));
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (profile: SearchResult) => {
    if (!user) {
      alert('Please sign in to send friend requests');
      return;
    }
    
    console.log('🚀 Attempting to send friend request to:', profile);
    console.log('👤 Current user:', { uid: user.uid, email: user.email });
    
    setSendingRequest(profile.userId);
    try {
      const requestId = await sendFriendRequest({
        fromUser: user,
        toUserId: profile.userId,
        message: `Hi ${profile.name}, I'd like to connect with you on AuraX!`,
      });
      
      console.log('✅ Friend request sent successfully with ID:', requestId);
      
      // Update UI to show request sent
      if (activeTab === 'search') {
        setSearchResults(prev => prev.map(result => 
          result.userId === profile.userId 
            ? { ...result, requestSent: true } 
            : result
        ));
      } else {
        setSuggestions(prev => prev.map(result => 
          result.userId === profile.userId 
            ? { ...result, requestSent: true } 
            : result
        ));
      }
      
      onRequestSent?.(profile.userId);
      alert(`✅ Friend request sent to ${profile.name}!`);
      
    } catch (error) {
      console.error('❌ Error sending friend request:', error);
      
      let errorMessage = 'Failed to send friend request';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide more specific error messages
        if (error.message.includes('permission')) {
          errorMessage = 'Permission denied. Please make sure your profile is set up properly.';
        } else if (error.message.includes('already sent')) {
          errorMessage = 'Friend request already sent to this user.';
        } else if (error.message.includes('already friends')) {
          errorMessage = 'You are already friends with this user.';
        }
      }
      
      alert(`❌ ${errorMessage}`);
    } finally {
      setSendingRequest(null);
    }
  };

  const renderUserCard = (profile: SearchResult) => (
    <div 
      key={profile.userId} 
      className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            {profile.avatar ? (
              <img 
                src={profile.avatar} 
                alt={profile.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span className="text-white font-bold text-lg">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {profile.isOnline && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {profile.name}
            </h3>
            {profile.username && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                @{profile.username}
              </span>
            )}
          </div>
          
          {profile.bio && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
              {profile.bio}
            </p>
          )}
          
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
            {profile.friendsCount > 0 && (
              <span>👥 {profile.friendsCount} friends</span>
            )}
            {profile.postsCount > 0 && (
              <span>📝 {profile.postsCount} posts</span>
            )}
            {profile.location && (
              <span>📍 {profile.location}</span>
            )}
          </div>
          
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {profile.interests.slice(0, 3).map((interest, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full"
                >
                  {interest}
                </span>
              ))}
              {profile.interests.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                  +{profile.interests.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        {profile.isFriend ? (
          <button 
            className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium"
            disabled
          >
            Friends ✓
          </button>
        ) : profile.requestSent ? (
          <button 
            className="px-4 py-2 bg-gray-400 text-white rounded-lg text-sm font-medium cursor-not-allowed"
            disabled
          >
            Request Sent
          </button>
        ) : (
          <button
            onClick={() => handleSendFriendRequest(profile)}
            disabled={sendingRequest === profile.userId}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendingRequest === profile.userId ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </div>
            ) : (
              'Add Fam'
            )}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by name, username, or interests..."
            className="w-full px-4 py-3 pl-12 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 font-medium"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 px-4 py-2 rounded-md transition font-medium ${
            activeTab === 'search'
              ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          🔍 Search Results
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`flex-1 px-4 py-2 rounded-md transition font-medium ${
            activeTab === 'suggestions'
              ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          ✨ Suggestions ({suggestions.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'search' ? (
            searchResults.length > 0 ? (
              searchResults.map(renderUserCard)
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  {searchQuery ? 'No users found' : 'Discover new friends'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery 
                    ? 'Try searching with different keywords'
                    : 'Search for people by name, username, or interests'
                  }
                </p>
              </div>
            )
          ) : (
            suggestions.length > 0 ? (
              suggestions.map(renderUserCard)
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">✨</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  No suggestions yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Add some friends and update your interests to get personalized suggestions!
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}