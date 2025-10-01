'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  searchPublicSquads, 
  joinSquad, 
  createAuraSquad, 
  AuraSquad,
  getSquadDetails,
  getSquadLeaderboards
} from '@/lib/auraSquads';
import { 
  searchUsers, 
  sendFriendRequest, 
  getFriendSuggestions,
  discoverFriends,
  PublicProfile 
} from '@/lib/socialSystem';

export default function SquadDiscoverPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [squads, setSquads] = useState<AuraSquad[]>([]);
  const [friendSuggestions, setFriendSuggestions] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningSquad, setJoiningSquad] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSquadData, setNewSquadData] = useState({
    name: '',
    description: '',
    isPrivate: false
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    loadData();
  }, [user, router]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load public squads and enhanced friend suggestions in parallel
      const [publicSquads, friendDiscovery] = await Promise.all([
        searchPublicSquads(''),
        discoverFriends({ 
          userId: user.uid, 
          limitCount: 10, 
          includeSuggestions: true 
        })
      ]);
      
      setSquads(publicSquads);
      setFriendSuggestions(friendDiscovery.suggestions);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Search both squads and users with enhanced discovery
      const [squadResults, friendDiscovery] = await Promise.all([
        searchPublicSquads(searchTerm),
        discoverFriends({ 
          userId: user.uid, 
          searchTerm: searchTerm,
          limitCount: 10, 
          includeSuggestions: false 
        })
      ]);
      
      setSquads(squadResults);
      setFriendSuggestions(friendDiscovery.searchResults);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSquad = async (squadId: string) => {
    if (!user) return;
    
    try {
      setJoiningSquad(squadId);
      const result = await joinSquad(user, squadId);
      
      if (result.success) {
        alert(result.message);
        await loadData(); // Refresh data
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error joining squad:', error);
      alert('Failed to join squad');
    } finally {
      setJoiningSquad(null);
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    if (!user) return;
    
    try {
      setSendingRequest(userId);
      await sendFriendRequest({
        fromUser: user,
        toUserId: userId,
        message: 'Let\'s connect and support each other\'s wellness journey! 🌟'
      });
      
      alert('Friend request sent! 🎉');
      await loadData(); // Refresh suggestions
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request');
    } finally {
      setSendingRequest(null);
    }
  };

  const handleCreateSquad = async () => {
    if (!user || !newSquadData.name.trim()) return;
    
    try {
      const squadId = await createAuraSquad({
        creator: user,
        name: newSquadData.name,
        description: newSquadData.description,
        isPrivate: newSquadData.isPrivate
      });
      
      alert('Squad created successfully! 🎉');
      setShowCreateModal(false);
      setNewSquadData({ name: '', description: '', isPrivate: false });
      
      // Redirect to the new squad
      router.push(`/squads/${squadId}`);
    } catch (error) {
      console.error('Error creating squad:', error);
      alert('Failed to create squad');
    }
  };

  if (loading && squads.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Discover Squads 👥</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Find your wellness tribe and connect with like-minded people
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition"
            >
              Create Squad
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search squads by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
            >
              Search
            </button>
          </div>
        </div>

        {/* Friend Suggestions */}
        {friendSuggestions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Suggested Friends 🤝</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friendSuggestions.map(friend => (
                <div key={friend.userId} className="p-4 bg-white/60 dark:bg-white/5 backdrop-blur rounded-xl border border-white/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {friend.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{friend.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {friend.interests?.slice(0, 2).join(', ')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {friend.friendsCount} friends
                    </div>
                    <button
                      onClick={() => handleSendFriendRequest(friend.userId)}
                      disabled={sendingRequest === friend.userId}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                    >
                      {sendingRequest === friend.userId ? 'Sending...' : 'Add Friend'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Public Squads */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Public Squads 🌟</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {squads.map(squad => (
              <div key={squad.id} className="p-6 bg-white/60 dark:bg-white/5 backdrop-blur rounded-xl border border-white/20 hover:shadow-lg transition">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {squad.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{squad.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {squad.members.length} members
                    </p>
                  </div>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">
                  {squad.description}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Level {squad.level} • {squad.totalPoints.toLocaleString()} pts
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {squad.isPrivate ? 'Private' : 'Public'}
                  </div>
                </div>
                
                {squad.currentChallenge && (
                  <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Active Challenge
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {squad.currentChallenge.title}
                    </p>
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1 mt-2">
                      <div 
                        className="bg-blue-500 h-1 rounded-full"
                        style={{ width: `${(squad.currentChallenge.currentProgress / squad.currentChallenge.target) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => handleJoinSquad(squad.id)}
                  disabled={joiningSquad === squad.id}
                  className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50"
                >
                  {joiningSquad === squad.id ? 'Joining...' : 'Join Squad'}
                </button>
              </div>
            ))}
          </div>
          
          {squads.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">No squads found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your search terms or create a new squad!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
              >
                Create First Squad
              </button>
            </div>
          )}
        </div>

        {/* Create Squad Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Create New Squad</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Squad Name</label>
                    <input
                      type="text"
                      value={newSquadData.name}
                      onChange={(e) => setNewSquadData({ ...newSquadData, name: e.target.value })}
                      placeholder="Enter squad name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={newSquadData.description}
                      onChange={(e) => setNewSquadData({ ...newSquadData, description: e.target.value })}
                      placeholder="Describe your squad's purpose"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPrivate"
                      checked={newSquadData.isPrivate}
                      onChange={(e) => setNewSquadData({ ...newSquadData, isPrivate: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="isPrivate" className="text-sm">
                      Private squad (invite only)
                    </label>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateSquad}
                    disabled={!newSquadData.name.trim()}
                    className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50"
                  >
                    Create Squad
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}