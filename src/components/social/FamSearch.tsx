'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  sendFamRequest,
  getFamMembers,
  searchPublicProfiles
} from '@/lib/famTrackingSystem';

interface FamSearchProps {
  onRequestSent?: () => void;
}

export default function FamSearch({ onRequestSent }: FamSearchProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [existingFam, setExistingFam] = useState<string[]>([]);

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

  useEffect(() => {
    if (user) {
      loadExistingFam();
    }
  }, [user, loadExistingFam]);

  const handleSearch = async (query: string) => {
    if (!user || !query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔍 Searching for fam members:', query);
      const profiles = await searchPublicProfiles(query);
      
      // Filter out current user and existing fam members
      const filteredProfiles = profiles.filter(profile => 
        profile.uid !== user.uid && !existingFam.includes(profile.uid)
      );
      
      setSearchResults(filteredProfiles);
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

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);

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
      </div>

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
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewProfile(profile.uid)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => handleSendRequest(profile.uid, profile.name)}
                        disabled={actionLoading === profile.uid}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm disabled:opacity-50"
                      >
                        {actionLoading === profile.uid ? 'Sending...' : 'Add Fam'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No Search Query */}
      {!searchQuery && (
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