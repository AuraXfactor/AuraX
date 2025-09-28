'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  getGroups,
  createGroup,
  joinGroup,
  leaveGroup,
  Group
} from '@/lib/socialSystem';

interface GroupBrowserProps {
  showMyGroups?: boolean;
}

export default function GroupBrowser({ showMyGroups = false }: GroupBrowserProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'my-groups' | 'create'>(showMyGroups ? 'my-groups' : 'browse');
  
  // Create group state
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupIsPublic, setGroupIsPublic] = useState(true);
  const [groupTags, setGroupTags] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPublic, setFilterPublic] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (user) {
      loadGroups();
      loadMyGroups();
    }
  }, [user]);

  const loadGroups = async () => {
    try {
      const publicGroups = await getGroups({ 
        isPublic: filterPublic, 
        limitCount: 20 
      });
      setGroups(publicGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadMyGroups = async () => {
    if (!user) return;
    
    try {
      const userGroups = await getGroups({ 
        userId: user.uid, 
        limitCount: 20 
      });
      setMyGroups(userGroups);
    } catch (error) {
      console.error('Error loading my groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim()) return;
    
    setCreatingGroup(true);
    try {
      const groupId = await createGroup({
        user,
        name: groupName,
        description: groupDescription,
        isPublic: groupIsPublic,
        tags: groupTags.split(',').map(tag => tag.trim()).filter(Boolean),
      });
      
      // Reset form
      setGroupName('');
      setGroupDescription('');
      setGroupTags('');
      setActiveTab('my-groups');
      
      // Reload groups
      await Promise.all([loadGroups(), loadMyGroups()]);
      
      // Navigate to the new group
      router.push(`/groups/${groupId}`);
      
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;
    
    setActionLoading(groupId);
    try {
      await joinGroup({ userId: user.uid, groupId });
      
      // Reload groups
      await Promise.all([loadGroups(), loadMyGroups()]);
      
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Failed to join group');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeaveGroup = async (groupId: string, groupName: string) => {
    if (!user || !confirm(`Leave "${groupName}"?`)) return;
    
    setActionLoading(groupId);
    try {
      await leaveGroup({ userId: user.uid, groupId });
      
      // Reload groups
      await Promise.all([loadGroups(), loadMyGroups()]);
      
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('Failed to leave group');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewGroup = (groupId: string) => {
    router.push(`/groups/${groupId}`);
  };

  const filteredGroups = groups.filter(group => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      group.name.toLowerCase().includes(query) ||
      group.description.toLowerCase().includes(query) ||
      group.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  const filteredMyGroups = myGroups.filter(group => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      group.name.toLowerCase().includes(query) ||
      group.description.toLowerCase().includes(query)
    );
  });

  const renderGroupCard = (group: Group, isMyGroup = false) => {
    const isMember = user && group.members[user.uid];
    const isOwner = user && group.ownerId === user.uid;
    
    return (
      <div 
        key={group.id} 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              {group.avatar ? (
                <img 
                  src={group.avatar} 
                  alt={group.name} 
                  className="w-full h-full object-cover rounded-full" 
                />
              ) : (
                <span className="text-white font-bold text-xl">
                  {group.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {group.name}
                </h3>
                {group.isPublic ? (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                    🌍 Public
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                    🔒 Private
                  </span>
                )}
                {isOwner && (
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs rounded-full">
                    👑 Owner
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                {group.description}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <span>👥 {group.memberCount} members</span>
                {group.createdAt && typeof group.createdAt === 'object' && 'toDate' in group.createdAt && (
                  <span>📅 Created {new Date(group.createdAt.toDate()).toLocaleDateString()}</span>
                )}
                {group.lastActivity && typeof group.lastActivity === 'object' && 'toDate' in group.lastActivity && (
                  <span>🕐 Active {new Date(group.lastActivity.toDate()).toLocaleDateString()}</span>
                )}
              </div>
              
              {group.tags && group.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {group.tags.slice(0, 3).map((tag, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                  {group.tags.length > 3 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                      +{group.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => handleViewGroup(group.id)}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all text-sm font-medium"
          >
            View Group
          </button>
          
          {isMember ? (
            isMyGroup && !isOwner && (
              <button
                onClick={() => handleLeaveGroup(group.id, group.name)}
                disabled={actionLoading === group.id}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50 text-sm font-medium"
              >
                {actionLoading === group.id ? 'Leaving...' : 'Leave'}
              </button>
            )
          ) : (
            <button
              onClick={() => handleJoinGroup(group.id)}
              disabled={actionLoading === group.id}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all disabled:opacity-50 text-sm font-medium"
            >
              {actionLoading === group.id ? 'Joining...' : 'Join'}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderCreateGroupForm = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Create New Group
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Group Name *
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name..."
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            placeholder="Describe your group's purpose and goals..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={groupTags}
            onChange={(e) => setGroupTags(e.target.value)}
            placeholder="wellness, support, meditation..."
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isPublic"
            checked={groupIsPublic}
            onChange={(e) => setGroupIsPublic(e.target.checked)}
            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
            Make this group public (anyone can find and join)
          </label>
        </div>
        
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => setActiveTab('browse')}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
          >
            Cancel
          </button>
          
          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || creatingGroup}
            className="flex-1 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 font-medium"
          >
            {creatingGroup ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </div>
            ) : (
              'Create Group'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('browse')}
          className={`flex-1 px-4 py-2 rounded-md transition font-medium ${
            activeTab === 'browse'
              ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          🔍 Browse Groups
        </button>
        
        <button
          onClick={() => setActiveTab('my-groups')}
          className={`flex-1 px-4 py-2 rounded-md transition font-medium ${
            activeTab === 'my-groups'
              ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          👥 My Groups ({myGroups.length})
        </button>
        
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 px-4 py-2 rounded-md transition font-medium ${
            activeTab === 'create'
              ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          ➕ Create Group
        </button>
      </div>

      {/* Search and Filters */}
      {(activeTab === 'browse' || activeTab === 'my-groups') && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groups..."
              className="w-full px-4 py-2.5 pl-10 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {activeTab === 'browse' && (
            <select
              value={filterPublic === undefined ? 'all' : filterPublic.toString()}
              onChange={(e) => {
                const value = e.target.value;
                setFilterPublic(value === 'all' ? undefined : value === 'true');
                loadGroups();
              }}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Groups</option>
              <option value="true">Public Only</option>
              <option value="false">Private Only</option>
            </select>
          )}
        </div>
      )}

      {/* Content */}
      {activeTab === 'create' ? (
        renderCreateGroupForm()
      ) : (
        <div className="grid gap-6">
          {activeTab === 'browse' ? (
            filteredGroups.length > 0 ? (
              filteredGroups.map(group => renderGroupCard(group))
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  No groups found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search or create a new group!
                </p>
              </div>
            )
          ) : (
            filteredMyGroups.length > 0 ? (
              filteredMyGroups.map(group => renderGroupCard(group, true))
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  No groups yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Join some groups or create your own to get started!
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}