'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { createAuraSquad } from '@/lib/auraSquads';
import { searchUsers, sendFriendRequest, discoverFriends, PublicProfile } from '@/lib/socialSystem';

export default function CreateSquadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [squadData, setSquadData] = useState({
    name: '',
    description: '',
    isPrivate: false
  });
  const [inviteUsers, setInviteUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PublicProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sendingInvites, setSendingInvites] = useState<string[]>([]);

  const handleSearchUsers = async () => {
    if (!user || !searchTerm.trim()) return;
    
    try {
      setSearching(true);
      const friendDiscovery = await discoverFriends({
        userId: user.uid,
        searchTerm: searchTerm,
        limitCount: 10,
        includeSuggestions: false
      });
      setSearchResults(friendDiscovery.searchResults);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddToInvites = (userId: string) => {
    if (!inviteUsers.includes(userId)) {
      setInviteUsers([...inviteUsers, userId]);
    }
  };

  const handleRemoveFromInvites = (userId: string) => {
    setInviteUsers(inviteUsers.filter(id => id !== userId));
  };

  const handleSendFriendRequest = async (userId: string) => {
    if (!user) return;
    
    try {
      setSendingInvites([...sendingInvites, userId]);
      await sendFriendRequest({
        fromUser: user,
        toUserId: userId,
        message: 'Let\'s connect and support each other\'s wellness journey! 🌟'
      });
      alert('Friend request sent! 🎉');
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request');
    } finally {
      setSendingInvites(sendingInvites.filter(id => id !== userId));
    }
  };

  const handleCreateSquad = async () => {
    if (!user || !squadData.name.trim()) return;
    
    try {
      setCreating(true);
      const squadId = await createAuraSquad({
        creator: user,
        name: squadData.name,
        description: squadData.description,
        isPrivate: squadData.isPrivate,
        initialMembers: inviteUsers
      });
      
      alert('Squad created successfully! 🎉');
      router.push(`/squads/${squadId}`);
    } catch (error) {
      console.error('Error creating squad:', error);
      alert('Failed to create squad');
    } finally {
      setCreating(false);
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Aura Squad 👥</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Build your wellness tribe and start group challenges together
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Squad Details */}
          <div className="space-y-6">
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold mb-4">Squad Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Squad Name *</label>
                  <input
                    type="text"
                    value={squadData.name}
                    onChange={(e) => setSquadData({ ...squadData, name: e.target.value })}
                    placeholder="Enter squad name"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={squadData.description}
                    onChange={(e) => setSquadData({ ...squadData, description: e.target.value })}
                    placeholder="Describe your squad's purpose and goals"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={squadData.isPrivate}
                    onChange={(e) => setSquadData({ ...squadData, isPrivate: e.target.checked })}
                    className="mr-3"
                  />
                  <label htmlFor="isPrivate" className="text-sm">
                    Private squad (invite only)
                  </label>
                </div>
              </div>
            </div>

            {/* Invite Members */}
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold mb-4">Invite Members</h2>
              
              {/* Search Users */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search users to invite..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={handleSearchUsers}
                    disabled={searching || !searchTerm.trim()}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50"
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Search Results</h3>
                  <div className="space-y-2">
                    {searchResults.map(user => (
                      <div key={user.userId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {user.interests?.slice(0, 2).join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleAddToInvites(user.userId)}
                            disabled={inviteUsers.includes(user.userId)}
                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition disabled:opacity-50"
                          >
                            {inviteUsers.includes(user.userId) ? 'Added' : 'Add'}
                          </button>
                          <button
                            onClick={() => handleSendFriendRequest(user.userId)}
                            disabled={sendingInvites.includes(user.userId)}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50"
                          >
                            {sendingInvites.includes(user.userId) ? 'Sending...' : 'Add Friend'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Invites */}
              {inviteUsers.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Selected Members ({inviteUsers.length})</h3>
                  <div className="space-y-2">
                    {inviteUsers.map(userId => {
                      const user = searchResults.find(u => u.userId === userId);
                      return user ? (
                        <div key={userId} className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-sm">{user.name}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveFromInvites(userId)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview & Create */}
          <div className="space-y-6">
            {/* Squad Preview */}
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold mb-4">Squad Preview</h2>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {squadData.name.charAt(0).toUpperCase() || 'S'}
                  </div>
                  <div>
                    <h3 className="font-bold">{squadData.name || 'Squad Name'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {inviteUsers.length + 1} members
                    </p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  {squadData.description || 'Squad description will appear here'}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Level 1 • 0 pts</span>
                  <span>{squadData.isPrivate ? 'Private' : 'Public'}</span>
                </div>
              </div>
            </div>

            {/* Squad Benefits */}
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold mb-4">Squad Benefits</h2>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400">🏆</span>
                  </div>
                  <div>
                    <p className="font-medium">Group Challenges</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Work together on wellness goals
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400">💪</span>
                  </div>
                  <div>
                    <p className="font-medium">Shared Rewards</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Earn points together as a team
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-400">🤝</span>
                  </div>
                  <div>
                    <p className="font-medium">Support Network</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Motivate each other daily
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreateSquad}
              disabled={creating || !squadData.name.trim()}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
            >
              {creating ? 'Creating Squad...' : 'Create Squad 🚀'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}