'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  searchGroups, 
  getUserGroups, 
  createGroup, 
  joinGroup,
  leaveGroup,
  Group 
} from '@/lib/friends';

interface GroupBrowserProps {
  onGroupSelect?: (group: Group) => void;
}

export default function GroupBrowser({ onGroupSelect }: GroupBrowserProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my-groups' | 'discover'>('my-groups');
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newGroupData, setNewGroupData] = useState({
    name: '',
    description: '',
    isPublic: true,
    tags: [] as string[],
  });

  useEffect(() => {
    if (user) {
      loadMyGroups();
      loadPublicGroups();
    }
  }, [user]);

  const loadMyGroups = async () => {
    if (!user) return;
    try {
      const groups = await getUserGroups(user.uid);
      setMyGroups(groups);
    } catch (error) {
      console.error('Error loading user groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPublicGroups = async () => {
    try {
      const groups = await searchGroups('', 20);
      setPublicGroups(groups.filter(group => !myGroups.some(myGroup => myGroup.id === group.id)));
    } catch (error) {
      console.error('Error loading public groups:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadPublicGroups();
      return;
    }

    try {
      const results = await searchGroups(searchQuery);
      setPublicGroups(results.filter(group => !myGroups.some(myGroup => myGroup.id === group.id)));
    } catch (error) {
      console.error('Error searching groups:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !newGroupData.name.trim()) return;
    
    try {
      const groupId = await createGroup({
        user,
        name: newGroupData.name,
        description: newGroupData.description,
        isPublic: newGroupData.isPublic,
        tags: newGroupData.tags,
      });
      
      setShowCreateModal(false);
      setNewGroupData({ name: '', description: '', isPublic: true, tags: [] });
      await loadMyGroups();
      alert('Group created successfully!');
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group');
    }
  };

  const handleJoinGroup = async (group: Group) => {
    if (!user) return;
    setActionLoading(group.id);
    
    try {
      await joinGroup({ user, groupId: group.id });
      await loadMyGroups();
      await loadPublicGroups();
      alert(`Joined ${group.name}!`);
    } catch (error) {
      console.error('Error joining group:', error);
      alert(error instanceof Error ? error.message : 'Failed to join group');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeaveGroup = async (group: Group) => {
    if (!user || !confirm(`Leave ${group.name}?`)) return;
    setActionLoading(group.id);
    
    try {
      await leaveGroup({ user, groupId: group.id });
      await loadMyGroups();
      await loadPublicGroups();
      alert(`Left ${group.name}`);
    } catch (error) {
      console.error('Error leaving group:', error);
      alert(error instanceof Error ? error.message : 'Failed to leave group');
    } finally {
      setActionLoading(null);
    }
  };

  const renderGroupCard = (group: Group, isMember: boolean = false) => (
    <div key={group.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg">{group.name}</h3>
            {!group.isPublic && (
              <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                Private
              </span>
            )}
          </div>
          
          {group.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{group.description}</p>
          )}
          
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
              👥 {group.memberCount || 0} members
            </span>
            {group.challengeCount && group.challengeCount > 0 && (
              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                🏆 {group.challengeCount} challenges
              </span>
            )}
          </div>
          
          {group.tags && group.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {group.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
              {group.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{group.tags.length - 3} more</span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2 ml-4">
          {isMember ? (
            <>
              <button
                onClick={() => onGroupSelect?.(group)}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
              >
                View
              </button>
              {group.ownerId !== user?.uid && (
                <button
                  onClick={() => handleLeaveGroup(group)}
                  disabled={actionLoading === group.id}
                  className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm disabled:opacity-50"
                >
                  {actionLoading === group.id ? 'Leaving...' : 'Leave'}
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => handleJoinGroup(group)}
              disabled={actionLoading === group.id}
              className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm disabled:opacity-50"
            >
              {actionLoading === group.id ? 'Joining...' : 'Join'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Groups & Squads</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
        >
          Create Group
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('my-groups')}
          className={`flex-1 py-2 px-4 rounded-md transition ${
            activeTab === 'my-groups'
              ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          My Groups ({myGroups.length})
        </button>
        <button
          onClick={() => setActiveTab('discover')}
          className={`flex-1 py-2 px-4 rounded-md transition ${
            activeTab === 'discover'
              ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Discover
        </button>
      </div>

      {/* Search */}
      {activeTab === 'discover' && (
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search groups..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
          >
            Search
          </button>
        </div>
      )}

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'my-groups' ? (
          myGroups.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-2">No groups yet</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create or join groups to connect with like-minded people!
              </p>
            </div>
          ) : (
            myGroups.map(group => renderGroupCard(group, true))
          )
        ) : (
          publicGroups.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">No public groups found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try searching for specific interests or create your own group!
              </p>
            </div>
          ) : (
            publicGroups.map(group => renderGroupCard(group, false))
          )
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Create New Group</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Group Name</label>
                <input
                  type="text"
                  value={newGroupData.name}
                  onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700"
                  placeholder="Enter group name..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                <textarea
                  value={newGroupData.description}
                  onChange={(e) => setNewGroupData({ ...newGroupData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700"
                  rows={3}
                  placeholder="What's this group about?"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newGroupData.isPublic}
                  onChange={(e) => setNewGroupData({ ...newGroupData, isPublic: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isPublic" className="text-sm">
                  Make this group publicly discoverable
                </label>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupData.name.trim()}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}