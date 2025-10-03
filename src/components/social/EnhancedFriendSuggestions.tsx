'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ProfileLink from './ProfileLink';
import { 
  getFriendSuggestions,
  sendFriendRequest,
  PublicProfile
} from '@/lib/enhancedFriendSystem';

interface EnhancedFriendSuggestionsProps {
  limit?: number;
  onRequestSent?: () => void;
}

export default function EnhancedFriendSuggestions({ 
  limit = 10, 
  onRequestSent 
}: EnhancedFriendSuggestionsProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadSuggestions = async () => {
      try {
        setLoading(true);
        const friendSuggestions = await getFriendSuggestions({
          userId: user.uid,
          limitCount: limit,
        });
        setSuggestions(friendSuggestions);
      } catch (error) {
        console.error('Error loading friend suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSuggestions();
  }, [user, limit]);

  const handleSendRequest = async (userId: string) => {
    if (!user) return;
    
    setActionLoading(userId);
    try {
      await sendFriendRequest({
        fromUser: user,
        toUserId: userId,
      });
      
      // Remove from suggestions
      setSuggestions(prev => prev.filter(suggestion => suggestion.userId !== userId));
      onRequestSent?.();
      
      console.log('Friend request sent successfully');
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👥</div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
          No suggestions available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          We couldn't find any new people to suggest based on your interests.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Suggested Friends ({suggestions.length})
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Based on your interests and focus areas
        </p>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <div 
            key={suggestion.userId} 
            className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800/50 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div 
                    className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform" 
                    onClick={() => handleViewProfile(suggestion.userId)}
                  >
                    {suggestion.avatar ? (
                      <img 
                        src={suggestion.avatar} 
                        alt={suggestion.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-white font-bold text-lg">
                        {suggestion.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {suggestion.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <ProfileLink 
                      userId={suggestion.userId}
                      name={suggestion.name}
                      className="font-semibold text-gray-900 dark:text-white text-lg"
                    >
                      {suggestion.name}
                    </ProfileLink>
                    {suggestion.username && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        @{suggestion.username}
                      </span>
                    )}
                  </div>
                  
                  {suggestion.bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {suggestion.bio}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {suggestion.friendsCount > 0 && (
                      <span>👥 {suggestion.friendsCount} friends</span>
                    )}
                    {suggestion.location && (
                      <span>📍 {suggestion.location}</span>
                    )}
                    {suggestion.isOnline ? (
                      <span className="text-green-600 dark:text-green-400">🟢 Online</span>
                    ) : (
                      <span>⚫ Offline</span>
                    )}
                  </div>
                  
                  {suggestion.interests && suggestion.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {suggestion.interests.slice(0, 3).map((interest, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full"
                        >
                          {interest}
                        </span>
                      ))}
                      {suggestion.interests.length > 3 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                          +{suggestion.interests.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleSendRequest(suggestion.userId)}
                  disabled={actionLoading === suggestion.userId}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 font-medium shadow-sm text-sm"
                >
                  {actionLoading === suggestion.userId ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </div>
                  ) : (
                    'Add Fam'
                  )}
                </button>
                
                <button
                  onClick={() => handleViewProfile(suggestion.userId)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
                >
                  View Profile
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}