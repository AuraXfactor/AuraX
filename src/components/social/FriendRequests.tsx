'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  listenToFriendRequests,
  respondToFriendRequest,
  EnhancedFriendRequest
} from '@/lib/socialSystem';

interface FriendRequestsProps {
  onRequestHandled?: () => void;
}

export default function FriendRequests({ onRequestHandled }: FriendRequestsProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<EnhancedFriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = listenToFriendRequests(user.uid, (newRequests) => {
      setRequests(newRequests);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRequest = async (requestId: string, response: 'accepted' | 'rejected') => {
    if (!user) return;
    
    setActionLoading(requestId);
    try {
      await respondToFriendRequest({
        user,
        requestId,
        response,
      });
      
      onRequestHandled?.();
      
      // Show success message
      const message = response === 'accepted' 
        ? 'Friend request accepted!' 
        : 'Friend request declined';
      
      // You could implement a toast notification here
      console.log(message);
      
    } catch (error) {
      console.error(`Error ${response} friend request:`, error);
      alert(`Failed to ${response} friend request`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📬</div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
          No friend requests
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          When someone sends you a friend request, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Friend Requests ({requests.length})
        </h2>
      </div>

      {requests.map((request) => (
        <div 
          key={request.id} 
          className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800/50 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  {request.fromProfile?.avatar ? (
                    <img 
                      src={request.fromProfile.avatar} 
                      alt={request.fromProfile.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-white font-bold text-xl">
                      {request.fromProfile?.name.charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                {request.fromProfile?.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                    {request.fromProfile?.name || 'Unknown User'}
                  </h4>
                  {request.fromProfile?.username && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      @{request.fromProfile.username}
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  wants to be friends
                </p>
                
                {request.message && (
                  <div className="mt-2 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                      &ldquo;{request.message}&rdquo;
                    </p>
                  </div>
                )}
                
                {request.fromProfile?.bio && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {request.fromProfile.bio}
                  </p>
                )}
                
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {request.fromProfile?.friendsCount && request.fromProfile.friendsCount > 0 && (
                    <span>👥 {request.fromProfile.friendsCount} friends</span>
                  )}
                  {request.fromProfile?.location && (
                    <span>📍 {request.fromProfile.location}</span>
                  )}
                  {request.createdAt && (
                    <span>
                      ⏰ {new Date(request.createdAt.toDate()).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                {request.fromProfile?.interests && request.fromProfile.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {request.fromProfile.interests.slice(0, 3).map((interest, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full"
                      >
                        {interest}
                      </span>
                    ))}
                    {request.fromProfile.interests.length > 3 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                        +{request.fromProfile.interests.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleRequest(request.id, 'accepted')}
                disabled={actionLoading === request.id}
                className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 font-medium shadow-sm"
              >
                {actionLoading === request.id ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Accepting...
                  </div>
                ) : (
                  'Accept'
                )}
              </button>
              
              <button
                onClick={() => handleRequest(request.id, 'rejected')}
                disabled={actionLoading === request.id}
                className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all disabled:opacity-50 font-medium shadow-sm"
              >
                {actionLoading === request.id ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Declining...
                  </div>
                ) : (
                  'Decline'
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}