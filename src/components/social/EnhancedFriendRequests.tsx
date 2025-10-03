'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ProfileLink from './ProfileLink';
import { 
  listenToFriendRequests,
  respondToFriendRequest,
  getFriendRequestCounts,
  cancelFriendRequest,
  EnhancedFriendRequest,
  FriendRequestCounts
} from '@/lib/enhancedFriendSystem';
import { addAuraFamilyMember } from '@/lib/auraFamilySystem';

interface EnhancedFriendRequestsProps {
  onRequestHandled?: () => void;
  showCounts?: boolean;
}

export default function EnhancedFriendRequests({ 
  onRequestHandled, 
  showCounts = true 
}: EnhancedFriendRequestsProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<EnhancedFriendRequest[]>([]);
  const [counts, setCounts] = useState<FriendRequestCounts>({ pending: 0, sent: 0, received: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  useEffect(() => {
    if (!user) return;

    const unsubscribe = listenToFriendRequests(user.uid, (newRequests, newCounts) => {
      setRequests(newRequests);
      setCounts(newCounts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRequest = async (requestId: string, response: 'accepted' | 'rejected') => {
    if (!user) return;
    
    setActionLoading(requestId);
    try {
      // Find the request to get the fromName
      const request = receivedRequests.find(r => r.id === requestId);
      const fromName = request?.fromProfile?.name || 'Unknown';
      
      await respondToFriendRequest({
        user,
        requestId,
        response,
      });
      
      // If accepted, add to Aura Family
      if (response === 'accepted' && request) {
        try {
          await addAuraFamilyMember({
            currentUserId: user.uid,
            newMemberId: request.fromUserId,
            newMemberName: fromName,
          });
        } catch (familyError) {
          console.error('Error adding to Aura Family:', familyError);
        }
      }
      
      onRequestHandled?.();
      
      // Show success message with toast notification
      const message = response === 'accepted' 
        ? `🎉 <strong>${fromName}</strong> is now your fam🎉, start aura farming together✈️`
        : '❌ Friend request declined';
      
      // Create a temporary success message element with Aura Family styling
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 z-50 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-pulse';
      successDiv.innerHTML = `
        <span>${response === 'accepted' ? '🎉' : '❌'}</span>
        <span>${message}</span>
      `;
      document.body.appendChild(successDiv);
      
      // Remove the message after 4 seconds
      setTimeout(() => {
        successDiv.remove();
      }, 4000);
      
    } catch (error) {
      console.error(`Error ${response} friend request:`, error);
      
      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2';
      errorDiv.innerHTML = `
        <span>❌</span>
        <span>Failed to ${response} friend request</span>
      `;
      document.body.appendChild(errorDiv);
      
      setTimeout(() => {
        errorDiv.remove();
      }, 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!user) return;
    
    setActionLoading(requestId);
    try {
      await cancelFriendRequest(requestId);
      onRequestHandled?.();
    } catch (error) {
      console.error('Error canceling friend request:', error);
      alert('Failed to cancel friend request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const receivedRequests = requests.filter(req => req.direction === 'received');
  const sentRequests = requests.filter(req => req.direction === 'sent');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with counts */}
      {showCounts && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Friend Requests
          </h2>
          <div className="flex items-center gap-4 text-sm">
            {counts.received > 0 && (
              <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full">
                {counts.received} received
              </span>
            )}
            {counts.sent > 0 && (
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                {counts.sent} sent
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === 'received'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Received ({counts.received})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === 'sent'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Sent ({counts.sent})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'received' ? (
        receivedRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📬</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              No friend requests
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              When someone sends you a friend request, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {receivedRequests.map((request) => (
              <div 
                key={request.id} 
                className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800/50 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center cursor-pointer" onClick={() => handleViewProfile(request.fromUserId)}>
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
                        <ProfileLink 
                          userId={request.fromUserId}
                          name={request.fromProfile?.name || 'Unknown User'}
                          className="font-semibold text-gray-900 dark:text-white text-lg"
                        >
                          {request.fromProfile?.name || 'Unknown User'}
                        </ProfileLink>
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
                        {request.createdAt && typeof request.createdAt === 'object' && 'toDate' in request.createdAt && (
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
        )
      ) : (
        sentRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📤</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              No sent requests
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Friend requests you send will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sentRequests.map((request) => (
              <div 
                key={request.id} 
                className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900/20 dark:to-blue-900/20 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-r from-gray-500 to-blue-500 flex items-center justify-center cursor-pointer" onClick={() => handleViewProfile(request.toUserId)}>
                        {request.toProfile?.avatar ? (
                          <img 
                            src={request.toProfile.avatar} 
                            alt={request.toProfile.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span className="text-white font-bold text-xl">
                            {request.toProfile?.name.charAt(0).toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      {request.toProfile?.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <ProfileLink 
                          userId={request.toUserId}
                          name={request.toProfile?.name || 'Unknown User'}
                          className="font-semibold text-gray-900 dark:text-white text-lg"
                        >
                          {request.toProfile?.name || 'Unknown User'}
                        </ProfileLink>
                        {request.toProfile?.username && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            @{request.toProfile.username}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Friend request pending
                      </p>
                      
                      {request.message && (
                        <div className="mt-2 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                            &ldquo;{request.message}&rdquo;
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {request.createdAt && typeof request.createdAt === 'object' && 'toDate' in request.createdAt && (
                          <span>
                            ⏰ Sent {new Date(request.createdAt.toDate()).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => handleCancelRequest(request.id)}
                      disabled={actionLoading === request.id}
                      className="px-6 py-2.5 bg-gradient-to-r from-gray-500 to-slate-500 text-white rounded-lg hover:from-gray-600 hover:to-slate-600 transition-all disabled:opacity-50 font-medium shadow-sm"
                    >
                      {actionLoading === request.id ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Canceling...
                        </div>
                      ) : (
                        'Cancel'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}