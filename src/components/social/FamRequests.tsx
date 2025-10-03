'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  getFriendRequests,
  respondToFriendRequest,
  SimpleRequest
} from '@/lib/simpleRequestSystem';

interface FamRequestsProps {
  onRequestHandled?: () => void;
}

export default function FamRequests({ onRequestHandled }: FamRequestsProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<{
    received: SimpleRequest[];
    sent: SimpleRequest[];
    accepted: SimpleRequest[];
    declined: SimpleRequest[];
  }>({ received: [], sent: [], accepted: [], declined: [] });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'accepted' | 'declined'>('received');

  const loadRequests = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('🔄 Loading friend requests...');
      const friendRequests = await getFriendRequests(user.uid);
      setRequests(friendRequests);
      console.log('✅ Friend requests loaded:', friendRequests);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);

  const handleRespondToRequest = async (requestId: string, response: 'accepted' | 'declined') => {
    if (!user) return;
    
    setActionLoading(requestId);
    try {
      console.log('📝 Responding to fam request:', { requestId, response });
      
      await respondToFriendRequest({
        requestId,
        response,
        responderUserId: user.uid,
      });
      
      // Show success message
      const message = response === 'accepted' 
        ? '🎉 Welcome to the Aura Fam! Start aura farming together! ✈️'
        : '❌ Fam request declined';
      
      // Create animated success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm';
      successDiv.innerHTML = `
        <div class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-6 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce max-w-md mx-4 text-center">
          <div class="text-4xl">${response === 'accepted' ? '🎉' : '❌'}</div>
          <div class="text-lg font-semibold">${message}</div>
        </div>
      `;
      document.body.appendChild(successDiv);
      
      // Remove the message after 5 seconds
      setTimeout(() => {
        successDiv.remove();
      }, 5000);
      
      // Refresh requests
      await loadRequests();
      onRequestHandled?.();
      
    } catch (error) {
      console.error('Error responding to fam request:', error);
      alert('Failed to respond to fam request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const getCurrentRequests = () => {
    switch (activeTab) {
      case 'received':
        return requests.received.filter(req => req.status === 'pending');
      case 'sent':
        return requests.sent.filter(req => req.status === 'pending');
      case 'accepted':
        return requests.received.filter(req => req.status === 'accepted');
      case 'declined':
        return requests.received.filter(req => req.status === 'declined');
      default:
        return [];
    }
  };

  const getTabCounts = () => {
    return {
      received: requests.received.filter(req => req.status === 'pending').length,
      sent: requests.sent.filter(req => req.status === 'pending').length,
      accepted: requests.received.filter(req => req.status === 'accepted').length,
      declined: requests.received.filter(req => req.status === 'declined').length,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const counts = getTabCounts();
  const currentRequests = getCurrentRequests();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Fam Requests
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your Aura Fam connections and requests
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
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
        <button
          onClick={() => setActiveTab('accepted')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === 'accepted'
              ? 'border-green-500 text-green-600 dark:text-green-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Accepted ({counts.accepted})
        </button>
        <button
          onClick={() => setActiveTab('declined')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === 'declined'
              ? 'border-red-500 text-red-600 dark:text-red-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Declined ({counts.declined})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'received' && (
        currentRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📬</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              No fam requests
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              When someone sends you a fam request, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentRequests.map((request) => (
              <div 
                key={request.id} 
                className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800/50 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center cursor-pointer" onClick={() => handleViewProfile(request.fromUserId)}>
                        <span className="text-white font-bold text-xl">
                          {request.fromName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {request.fromName}
                        </h3>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Wants to join your Aura Fam
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
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRespondToRequest(request.id, 'accepted')}
                      disabled={actionLoading === request.id}
                      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium disabled:opacity-50"
                    >
                      {actionLoading === request.id ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleRespondToRequest(request.id, 'declined')}
                      disabled={actionLoading === request.id}
                      className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium disabled:opacity-50"
                    >
                      {actionLoading === request.id ? 'Declining...' : 'Decline'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
      
      {activeTab === 'sent' && (
        currentRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📤</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              No sent requests
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Fam requests you send will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentRequests.map((request) => (
              <div 
                key={request.id} 
                className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900/20 dark:to-blue-900/20 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-r from-gray-500 to-blue-500 flex items-center justify-center cursor-pointer" onClick={() => handleViewProfile(request.toUserId)}>
                        <span className="text-white font-bold text-xl">
                          {request.toName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {request.toName}
                        </h3>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Fam request pending
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
                </div>
              </div>
            ))}
          </div>
        )
      )}
      
      {activeTab === 'accepted' && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            Accepted Requests ({counts.accepted})
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            These are your accepted fam members. They should appear in your Aura Fam list.
          </p>
        </div>
      )}
      
      {activeTab === 'declined' && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            Declined Requests ({counts.declined})
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            These are requests that were declined. You can send a new request if you want to try again.
          </p>
        </div>
      )}
    </div>
  );
}