'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  sendFamRequest,
  getFamMembers,
  searchPublicProfiles
} from '@/lib/famTrackingSystem';
import { 
  getFriendSuggestions, 
  FriendSuggestion 
} from '@/lib/friendSuggestions';
import { 
  getRequestStatuses, 
  RequestStatus 
} from '@/lib/requestStatus';

interface FamSearchProps {
  onRequestSent?: () => void;
}

export default function FamSearch({ onRequestSent }: FamSearchProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [existingFam, setExistingFam] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [requestStatuses, setRequestStatuses] = useState<Map<string, RequestStatus>>(new Map());

  const loadExistingFam = useCallback(async () => {
    if (!user) return;
    
    try {
      const famMembers = await getFamMembers(user.uid);
      const famUserIds = famMembers.map(member => member.userId);
      setExistingFam(famUserIds);
    } catch (error) {
      console.error('Error loading existing fam:', error);
    }
  }, [user]);

  const loadSuggestions = useCallback(async () => {
    if (!user) return;
    
    setSuggestionsLoading(true);
    try {
      console.log('🔍 Loading friend suggestions...');
      const friendSuggestions = await getFriendSuggestions(user.uid, {
        mutualFriends: true,
        sharedInterests: true,
        sharedGroups: true,
        similarJournals: true,
        location: true,
        maxResults: 10
      });
      
      // Filter out existing fam members
      const filteredSuggestions = friendSuggestions.filter(
        suggestion => !existingFam.includes(suggestion.userId)
      );
      
      setSuggestions(filteredSuggestions);
      
      // Load request statuses for suggestions
      if (filteredSuggestions.length > 0) {
        const userIds = filteredSuggestions.map(s => s.userId);
        const statuses = await getRequestStatuses(user.uid, userIds);
        const statusMap = new Map<string, RequestStatus>();
        statuses.forEach(status => {
          statusMap.set(status.userId, status);
        });
        setRequestStatuses(prev => new Map([...prev, ...statusMap]));
      }
      
      console.log('✅ Loaded', filteredSuggestions.length, 'suggestions');
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setSuggestionsLoading(false);
    }
  }, [user, existingFam]);

  const loadRequestStatuses = useCallback(async (userIds: string[]) => {
    if (!user || userIds.length === 0) return;
    
    try {
      const statuses = await getRequestStatuses(user.uid, userIds);
      const statusMap = new Map<string, RequestStatus>();
      statuses.forEach(status => {
        statusMap.set(status.userId, status);
      });
      setRequestStatuses(prev => new Map([...prev, ...statusMap]));
    } catch (error) {
      console.error('Error loading request statuses:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadExistingFam();
    }
  }, [user, loadExistingFam]);

  useEffect(() => {
    if (user && existingFam.length >= 0) {
      loadSuggestions();
    }
  }, [user, existingFam, loadSuggestions]);

  const handleSearch = async (query: string) => {
    if (!user || !query.trim()) {
      setSearchResults([]);
      setShowSuggestions(true);
      return;
    }
    
    setLoading(true);
    setShowSuggestions(false);
    try {
      console.log('🔍 Searching for fam members:', query);
      const profiles = await searchPublicProfiles(query);
      
      // Filter out current user and existing fam members
      const filteredProfiles = profiles.filter(profile => 
        profile.uid !== user.uid && !existingFam.includes(profile.uid)
      );
      
      setSearchResults(filteredProfiles);
      
      // Load request statuses for search results
      if (filteredProfiles.length > 0) {
        const userIds = filteredProfiles.map(p => p.uid);
        await loadRequestStatuses(userIds);
      }
      
      console.log('✅ Search results:', filteredProfiles.length);
    } catch (error) {
      console.error('Error searching for fam members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (targetUserId: string, targetName: string) => {
    if (!user) return;
    
    setActionLoading(targetUserId);
    try {
      console.log('📤 Sending fam request:', { targetUserId, targetName });
      
      await sendFamRequest({
        fromUserId: user.uid,
        toUserId: targetUserId,
        fromName: user.displayName || 'Unknown',
        toName: targetName,
        message: 'Wants to join your Aura Fam!',
      });
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm';
      successDiv.innerHTML = `
        <div class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-6 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce max-w-md mx-4 text-center">
          <div class="text-4xl">📤</div>
          <div class="text-lg font-semibold">Fam request sent to ${targetName}! 🎉</div>
        </div>
      `;
      document.body.appendChild(successDiv);
      
      // Remove the message after 3 seconds
      setTimeout(() => {
        successDiv.remove();
      }, 3000);
      
      onRequestSent?.();
      
    } catch (error) {
      console.error('Error sending fam request:', error);
      alert('Failed to send fam request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const renderActionButtons = (userId: string, userName: string) => {
    const requestStatus = requestStatuses.get(userId);
    
    if (!requestStatus) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewProfile(userId)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
          >
            Profile
          </button>
          <button
            onClick={() => handleSendRequest(userId, userName)}
            disabled={actionLoading === userId}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm disabled:opacity-50"
          >
            {actionLoading === userId ? 'Sending...' : 'Add Fam'}
          </button>
        </div>
      );
    }

    switch (requestStatus.status) {
      case 'friends':
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/soulchat/${userId}`)}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm"
            >
              Message
            </button>
            <button
              onClick={() => handleViewProfile(userId)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
            >
              Profile
            </button>
          </div>
        );
      
      case 'sent':
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleViewProfile(userId)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
            >
              Profile
            </button>
            <button
              disabled
              className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed text-sm"
            >
              Request Sent
            </button>
          </div>
        );
      
      case 'received':
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleViewProfile(userId)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
            >
              Profile
            </button>
            <button
              onClick={() => router.push('/friends?tab=requests')}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
            >
              Respond
            </button>
          </div>
        );
      
      default: // 'none'
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleViewProfile(userId)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
            >
              Profile
            </button>
            <button
              onClick={() => handleSendRequest(userId, userName)}
              disabled={actionLoading === userId}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm disabled:opacity-50"
            >
              {actionLoading === userId ? 'Sending...' : 'Add Fam'}
            </button>
          </div>
        );
    }
  };

  // Debounced search with optimized loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      }
    }, 300); // Reduced debounce time for faster response

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Discover Aura Fam
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Search for people to add to your Aura Fam
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, username, or interests..."
          className="w-full px-4 py-3 pl-12 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Friend Suggestions */}
      {showSuggestions && !searchQuery && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Friend Suggestions
            </h3>
            <button
              onClick={() => loadSuggestions()}
              disabled={suggestionsLoading}
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 disabled:opacity-50"
            >
              {suggestionsLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          
          {suggestionsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🤔</div>
              <p className="text-gray-600 dark:text-gray-400">No suggestions available right now</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {suggestions.map((suggestion) => (
                <div 
                  key={suggestion.userId}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center cursor-pointer" onClick={() => handleViewProfile(suggestion.userId)}>
                          {suggestion.avatar ? (
                            <img 
                              src={suggestion.avatar} 
                              alt={suggestion.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold text-lg">
                              {suggestion.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {suggestion.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {suggestion.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          @{suggestion.username}
                        </p>
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                          {suggestion.suggestionReason}
                        </p>
                        {suggestion.bio && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {suggestion.bio}
                          </p>
                        )}
                        {suggestion.sharedInterests.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {suggestion.sharedInterests.slice(0, 3).map((interest, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded-full"
                              >
                                {interest}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {renderActionButtons(suggestion.userId, suggestion.name)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Results */}
      {searchQuery && (
        <div className="space-y-4">
          {searchResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                {loading ? 'Searching...' : 'No results found'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {loading ? 'Looking for potential fam members...' : 'Try a different search term'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {searchResults.map((profile) => (
                <div 
                  key={profile.uid}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center cursor-pointer" onClick={() => handleViewProfile(profile.uid)}>
                          {profile.avatar ? (
                            <img 
                              src={profile.avatar} 
                              alt={profile.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold text-lg">
                              {profile.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {profile.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {profile.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          @{profile.username}
                        </p>
                        {profile.bio && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {profile.bio}
                          </p>
                        )}
                        {profile.interests && profile.interests.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {profile.interests.slice(0, 3).map((interest: string, index: number) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded-full"
                              >
                                {interest}
                              </span>
                            ))}
                            {profile.interests.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{profile.interests.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {renderActionButtons(profile.uid, profile.name)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No Search Query and No Suggestions */}
      {!searchQuery && !showSuggestions && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            Start Your Search
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Enter a name, username, or interest to find potential Aura Fam members
          </p>
        </div>
      )}
    </div>
  );
}