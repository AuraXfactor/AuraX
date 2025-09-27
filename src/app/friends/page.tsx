'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  searchUsersByUsername, 
  getAllUsersForDiscovery,
  getFriendSuggestions, 
  sendFriendRequest, 
  acceptFriendRequest, 
  declineFriendRequest,
  removeFriend,
  listenToFriendRequests,
  FriendRequest 
} from '@/lib/friends';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Friend {
  uid: string;
  name: string;
  username?: string;
  avatar?: string;
  lastInteraction?: { toDate?: () => Date } | null;
  mutualFriends?: number;
}

interface SearchResult {
  uid: string;
  name: string;
  username: string;
  avatar?: string;
  mutualFriends?: number;
  isFriend?: boolean;
  requestSent?: boolean;
}

interface FriendSuggestion {
  uid: string;
  name: string;
  username?: string;
  avatar?: string;
  mutualFriends: number;
  sharedInterests: string[];
  reason: string;
}

const tabs = [
  { id: 'friends', label: 'Friends', icon: '👥' },
  { id: 'discover', label: 'Discover', icon: '🔍' },
  { id: 'requests', label: 'Requests', icon: '📬' },
  { id: 'suggestions', label: 'Suggestions', icon: '✨' },
];

export default function FriendsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadFriends();
    loadSuggestions();
    loadDiscoverableUsers();
    
    // Listen to friend requests
    const unsubscribe = listenToFriendRequests(user.uid, setFriendRequests);
    return () => unsubscribe();
  }, [user, router]);

  const loadFriends = async () => {
    if (!user) return;
    try {
      // Friends are stored globally in `/friends` with `accepted` status
      const acceptedFrom = await getDocs(query(collection(db, 'friends'), where('fromUid', '==', user.uid), where('status', '==', 'accepted')));
      const acceptedTo = await getDocs(query(collection(db, 'friends'), where('toUid', '==', user.uid), where('status', '==', 'accepted')));
      const list: Friend[] = [];
      acceptedFrom.docs.forEach((d) => {
        const data = d.data() as any;
        list.push({
          uid: data.toUid,
          name: data.toUserName,
          username: undefined,
          avatar: data.toUserAvatar,
          lastInteraction: data.updatedAt || null,
        });
      });
      acceptedTo.docs.forEach((d) => {
        const data = d.data() as any;
        list.push({
          uid: data.fromUid,
          name: data.fromUserName,
          username: undefined,
          avatar: data.fromUserAvatar,
          lastInteraction: data.updatedAt || null,
        });
      });
      
      setFriends(list);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async () => {
    if (!user) return;
    try {
      const suggestions = await getFriendSuggestions(user.uid);
      setSuggestions(suggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const loadDiscoverableUsers = async () => {
    if (!user) return;
    try {
      // Discovery disabled under strict rules; clear results
      if (searchResults.length === 0 && !searchQuery) setSearchResults([]);
    } catch (error) {
      console.error('Error loading discoverable users:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // Show discoverable users when search is empty
      await loadDiscoverableUsers();
      return;
    }

    setSearching(true);
    try {
      // Search disabled due to rules; show empty
      setSearchResults([]);
    } catch (error) {
      console.error('Error searching users:', error);
      alert('Error searching users. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSendFriendRequest = async (toUser: SearchResult | FriendSuggestion) => {
    if (!user) return;
    setActionLoading(toUser.uid);
    
    try {
      await sendFriendRequest({
        fromUser: user,
        toUid: toUser.uid,
        toUserName: toUser.name,
        toUserAvatar: toUser.avatar,
        message: `Hi ${toUser.name}, I'd like to connect with you on AuraX!`,
      });
      
      // Update UI to show request sent
      if (activeTab === 'discover') {
        setSearchResults(prev => prev.map(result => 
          result.uid === toUser.uid ? { ...result, requestSent: true } : result
        ));
      } else if (activeTab === 'suggestions') {
        setSuggestions(prev => prev.filter(suggestion => suggestion.uid !== toUser.uid));
      }
      
      alert('Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    if (!user) return;
    setActionLoading(request.id);
    
    try {
      await acceptFriendRequest({
        user,
        requestId: request.id,
        fromUid: request.fromUid,
        fromUserName: request.fromUserName,
        fromUserAvatar: request.fromUserAvatar,
      });
      
      // Refresh friends list
      await loadFriends();
      alert('Friend request accepted!');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Failed to accept friend request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineRequest = async (request: FriendRequest) => {
    if (!user) return;
    setActionLoading(request.id);
    
    try {
      await declineFriendRequest({
        user,
        requestId: request.id,
        fromUid: request.fromUid,
      });
      
      alert('Friend request declined');
    } catch (error) {
      console.error('Error declining friend request:', error);
      alert('Failed to decline friend request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = async (friend: Friend) => {
    if (!user || !confirm(`Remove ${friend.name} from your friends?`)) return;
    setActionLoading(friend.uid);
    
    try {
      await removeFriend({
        user,
        friendUid: friend.uid,
      });
      
      // Refresh friends list
      await loadFriends();
      alert('Friend removed');
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Failed to remove friend');
    } finally {
      setActionLoading(null);
    }
  };

  const renderFriendsList = () => (
    <div className="space-y-4">
      {friends.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold mb-2">No friends yet</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Start by discovering people or searching for friends!
          </p>
        </div>
      ) : (
        friends.map(friend => (
          <div key={friend.uid} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                {friend.avatar ? (
                  <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold">{friend.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h3 className="font-semibold">{friend.name}</h3>
                {friend.username && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">@{friend.username}</p>
                )}
                {friend.mutualFriends && friend.mutualFriends > 0 && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {friend.mutualFriends} mutual friends
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/soulchat/${friend.uid}`)}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
              >
                Message
              </button>
              <button
                onClick={() => handleRemoveFriend(friend)}
                disabled={actionLoading === friend.uid}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm disabled:opacity-50"
              >
                {actionLoading === friend.uid ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderDiscoverTab = () => (
    <div className="space-y-6">
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search by username..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50"
        >
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {searchResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Search Results</h3>
          {searchResults.map(result => (
            <div key={result.uid} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  {result.avatar ? (
                    <img src={result.avatar} alt={result.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold">{result.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold">{result.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">@{result.username}</p>
                  {result.mutualFriends && result.mutualFriends > 0 && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {result.mutualFriends} mutual friends
                    </p>
                  )}
                </div>
              </div>
              <div>
                {result.isFriend ? (
                  <button
                    onClick={() => router.push(`/soulchat/${result.uid}`)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg"
                  >
                    Message
                  </button>
                ) : result.requestSent ? (
                  <button disabled className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed">
                    Request Sent
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendFriendRequest(result)}
                    disabled={actionLoading === result.uid}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50"
                  >
                    {actionLoading === result.uid ? 'Sending...' : 'Add Friend'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderRequestsTab = () => (
    <div className="space-y-4">
      {friendRequests.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📬</div>
          <h3 className="text-xl font-semibold mb-2">No friend requests</h3>
          <p className="text-gray-600 dark:text-gray-400">
            When someone sends you a friend request, it will appear here.
          </p>
        </div>
      ) : (
        friendRequests.map(request => (
          <div key={request.id} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  {request.fromUserAvatar ? (
                    <img src={request.fromUserAvatar} alt={request.fromUserName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold">{request.fromUserName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold">{request.fromUserName}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">wants to be friends</p>
                  {request.message && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">&ldquo;{request.message}&rdquo;</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAcceptRequest(request)}
                  disabled={actionLoading === request.id}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                >
                  {actionLoading === request.id ? 'Accepting...' : 'Accept'}
                </button>
                <button
                  onClick={() => handleDeclineRequest(request)}
                  disabled={actionLoading === request.id}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                >
                  {actionLoading === request.id ? 'Declining...' : 'Decline'}
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderSuggestionsTab = () => (
    <div className="space-y-4">
      {suggestions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✨</div>
          <h3 className="text-xl font-semibold mb-2">No suggestions yet</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Add some friends first to get personalized suggestions!
          </p>
        </div>
      ) : (
        suggestions.map(suggestion => (
          <div key={suggestion.uid} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  {suggestion.avatar ? (
                    <img src={suggestion.avatar} alt={suggestion.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold">{suggestion.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold">{suggestion.name}</h4>
                  {suggestion.username && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">@{suggestion.username}</p>
                  )}
                  <p className="text-sm text-purple-600 dark:text-purple-400">{suggestion.reason}</p>
                  {suggestion.mutualFriends > 0 && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {suggestion.mutualFriends} mutual friends
                    </p>
                  )}
                  {suggestion.sharedInterests.length > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Shared interests: {suggestion.sharedInterests.join(', ')}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleSendFriendRequest(suggestion)}
                disabled={actionLoading === suggestion.uid}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50"
              >
                {actionLoading === suggestion.uid ? 'Sending...' : 'Add Friend'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Friends</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Connect with others and build your support network
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
              {tab.id === 'requests' && friendRequests.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                  {friendRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
          {activeTab === 'friends' && renderFriendsList()}
          {activeTab === 'discover' && renderDiscoverTab()}
          {activeTab === 'requests' && renderRequestsTab()}
          {activeTab === 'suggestions' && renderSuggestionsTab()}
        </div>
      </div>
    </div>
  );
}