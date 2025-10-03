'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  sendFamRequest
} from '@/lib/famTrackingSystem';
import { getFriendSuggestions, PublicProfile } from '@/lib/socialSystem';

interface FamSuggestionsProps {
  onRequestSent?: () => void;
}

export default function FamSuggestions({ onRequestSent }: FamSuggestionsProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSuggestions();
    }
  }, [user]);

  const loadSuggestions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('🔄 Loading fam suggestions...');
      const suggestionsList = await getFriendSuggestions({
        userId: user.uid,
        limitCount: 20
      });
      setSuggestions(suggestionsList);
      console.log('✅ Fam suggestions loaded:', suggestionsList.length);
    } catch (error) {
      console.error('Error loading fam suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (suggestion: PublicProfile) => {
    if (!user) return;
    
    setActionLoading(suggestion.userId);
    try {
      console.log('📤 Sending fam request to:', suggestion.name);
      
      await sendFamRequest({
        fromUserId: user.uid,
        toUserId: suggestion.userId,
        fromName: user.displayName || user.email || 'Anonymous',
        toName: suggestion.name,
        message: `Hey ${suggestion.name}! I'd love to connect and start aura farming together! 🌟`,
      });
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm';
      successDiv.innerHTML = `
        <div class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-6 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce max-w-md mx-4 text-center">
          <div class="text-4xl">🎉</div>
          <div class="text-lg font-semibold">Fam request sent to ${suggestion.name}!</div>
        </div>
      `;
      document.body.appendChild(successDiv);
      
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Fam Suggestions
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Discover potential Aura Fam members based on your interests and connections
        </p>
      </div>

      {/* Suggestions List */}
      {suggestions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💡</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            No suggestions available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            We'll find great Aura Fam members for you as you build your network!
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {suggestions.map((suggestion) => (
            <div 
              key={suggestion.userId} 
              className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800/50 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center cursor-pointer" onClick={() => handleViewProfile(suggestion.userId)}>
                      {suggestion.avatar ? (
                        <img 
                          src={suggestion.avatar} 
                          alt={suggestion.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className="text-white font-bold text-xl">
                          {suggestion.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {suggestion.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {suggestion.name}
                      </h3>
                      {suggestion.username && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          @{suggestion.username}
                        </span>
                      )}
                    </div>
                    
                    {suggestion.bio && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
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
                    onClick={() => handleSendRequest(suggestion)}
                    disabled={actionLoading === suggestion.userId}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 font-medium shadow-sm"
                  >
                    {actionLoading === suggestion.userId ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </div>
                    ) : (
                      'Add Fam'
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleViewProfile(suggestion.userId)}
                    className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-sm font-medium"
                  >
                    View Profile
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