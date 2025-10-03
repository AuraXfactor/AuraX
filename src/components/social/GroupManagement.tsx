'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getGroupMembers,
  addGroupMember,
  removeGroupMember,
  makeGroupAdmin,
  removeGroupAdmin,
  updateGroupSettings,
  canUserSendMessages,
  canUserInviteMembers,
  GroupMember,
  GroupSettings
} from '@/lib/groupManagement';
import { searchUsers } from '@/lib/socialSystem';

interface GroupManagementProps {
  groupId: string;
  onMemberUpdate?: () => void;
}

export default function GroupManagement({ groupId, onMemberUpdate }: GroupManagementProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState<GroupSettings>({
    messagePermission: 'everyone',
    invitePermission: 'admins_only',
    allowMemberInvites: true,
    allowFileSharing: true,
    description: '',
  });

  useEffect(() => {
    if (groupId) {
      loadMembers();
    }
  }, [groupId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const groupMembers = await getGroupMembers(groupId);
      setMembers(groupMembers);
    } catch (error) {
      console.error('Error loading group members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async (query: string) => {
    if (!query.trim() || !user) return;
    
    setSearching(true);
    try {
      const results = await searchUsers({
        query,
        currentUserId: user.uid,
        limitCount: 10,
      });
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!user) return;
    
    setActionLoading(userId);
    try {
      await addGroupMember({
        groupId,
        userId,
        addedBy: user.uid,
      });
      
      await loadMembers();
      onMemberUpdate?.();
      setShowAddMember(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!user || !confirm(`Remove ${memberName} from the group?`)) return;
    
    setActionLoading(userId);
    try {
      await removeGroupMember({
        groupId,
        userId,
        removedBy: user.uid,
      });
      
      await loadMembers();
      onMemberUpdate?.();
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    if (!user) return;
    
    setActionLoading(userId);
    try {
      await makeGroupAdmin({
        groupId,
        userId,
        promotedBy: user.uid,
      });
      
      await loadMembers();
      onMemberUpdate?.();
    } catch (error) {
      console.error('Error making admin:', error);
      alert('Failed to make admin');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!user) return;
    
    setActionLoading(userId);
    try {
      await removeGroupAdmin({
        groupId,
        userId,
        demotedBy: user.uid,
      });
      
      await loadMembers();
      onMemberUpdate?.();
    } catch (error) {
      console.error('Error removing admin:', error);
      alert('Failed to remove admin');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateSettings = async () => {
    if (!user) return;
    
    try {
      await updateGroupSettings(groupId, settings, user.uid);
      setShowSettings(false);
      onMemberUpdate?.();
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Group Management
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddMember(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          >
            + Add Member
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Members ({members.length})
        </h3>
        
        {members.map((member) => (
          <div 
            key={member.userId} 
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {member.userId.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {member.userId.slice(0, 8)}...
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {member.role}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {member.role === 'member' && member.userId !== user?.uid && (
                <button
                  onClick={() => handleMakeAdmin(member.userId)}
                  disabled={actionLoading === member.userId}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition disabled:opacity-50"
                >
                  {actionLoading === member.userId ? '...' : 'Make Admin'}
                </button>
              )}
              
              {member.role === 'admin' && member.userId !== user?.uid && (
                <button
                  onClick={() => handleRemoveAdmin(member.userId)}
                  disabled={actionLoading === member.userId}
                  className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition disabled:opacity-50"
                >
                  {actionLoading === member.userId ? '...' : 'Remove Admin'}
                </button>
              )}
              
              {member.userId !== user?.uid && (
                <button
                  onClick={() => handleRemoveMember(member.userId, member.userId.slice(0, 8))}
                  disabled={actionLoading === member.userId}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition disabled:opacity-50"
                >
                  {actionLoading === member.userId ? '...' : 'Remove'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Add Member</h3>
            
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearchUsers(e.target.value);
                  }}
                  placeholder="Search users..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              {searching && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                </div>
              )}
              
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {searchResults.map((result) => (
                    <div 
                      key={result.userId}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                          <span className="text-white font-bold text-xs">
                            {result.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{result.name}</p>
                          <p className="text-sm text-gray-500">@{result.username}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddMember(result.userId)}
                        disabled={actionLoading === result.userId}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition disabled:opacity-50"
                      >
                        {actionLoading === result.userId ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddMember(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Group Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={settings.description}
                  onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Group description..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Who can send messages?</label>
                <select
                  value={settings.messagePermission}
                  onChange={(e) => setSettings(prev => ({ ...prev, messagePermission: e.target.value as 'everyone' | 'admins_only' }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="everyone">Everyone</option>
                  <option value="admins_only">Admins Only</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Who can invite members?</label>
                <select
                  value={settings.invitePermission}
                  onChange={(e) => setSettings(prev => ({ ...prev, invitePermission: e.target.value as 'everyone' | 'admins_only' }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="everyone">Everyone</option>
                  <option value="admins_only">Admins Only</option>
                </select>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="allowFileSharing"
                  checked={settings.allowFileSharing}
                  onChange={(e) => setSettings(prev => ({ ...prev, allowFileSharing: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="allowFileSharing" className="text-sm">
                  Allow file sharing
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSettings}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}