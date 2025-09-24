'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  createGroupChat, 
  GroupChat 
} from '@/lib/friends';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Friend {
  uid: string;
  name: string;
  username?: string;
  avatar?: string;
}

export default function GroupsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadGroups();
    loadFriends();
  }, [user, router]);

  const loadGroups = async () => {
    if (!user) return;
    try {
      const groupsRef = collection(db, 'groupChats');
      const q = query(
        groupsRef,
        where('members', 'array-contains', user.uid),
        orderBy('lastActivity', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const groupsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as GroupChat[];
      
      setGroups(groupsList);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    if (!user) return;
    try {
      const friendsRef = collection(db, 'users', user.uid, 'friends');
      const snapshot = await getDocs(friendsRef);
      
      const friendsList = snapshot.docs.map(doc => ({
        uid: doc.id,
        name: doc.data().friendName,
        username: doc.data().friendUsername,
        avatar: doc.data().friendAvatar,
      })) as Friend[];
      
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim() || selectedFriends.size === 0) return;
    
    setCreating(true);
    try {
      const groupId = await createGroupChat({
        user,
        name: groupName,
        description: groupDescription,
        memberUids: Array.from(selectedFriends),
        isPrivate: true,
      });
      
      // Reset form
      setGroupName('');
      setGroupDescription('');
      setSelectedFriends(new Set());
      setShowCreateModal(false);
      
      // Reload groups
      await loadGroups();
      
      // Navigate to the new group
      router.push(`/groups/${groupId}`);
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const toggleFriendSelection = (friendUid: string) => {
    setSelectedFriends(prev => {
      const newSet = new Set(prev);
      if (newSet.has(friendUid)) {
        newSet.delete(friendUid);
      } else {
        newSet.add(friendUid);
      }
      return newSet;
    });
  };

  const renderCreateModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Create Group Chat</h2>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Group Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={50}
            />
          </div>

          {/* Group Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Description (optional)</label>
            <textarea
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="What's this group about?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={200}
            />
          </div>

          {/* Friends Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Add Friends ({selectedFriends.size} selected)
            </label>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {friends.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  You need friends to create a group chat.
                  <br />
                  <Link href="/friends" className="text-purple-500 hover:underline">
                    Add some friends first!
                  </Link>
                </p>
              ) : (
                friends.map(friend => (
                  <label
                    key={friend.uid}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFriends.has(friend.uid)}
                      onChange={() => toggleFriendSelection(friend.uid)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      {friend.avatar ? (
                        <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-sm">{friend.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{friend.name}</p>
                      {friend.username && (
                        <p className="text-sm text-gray-500">@{friend.username}</p>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateModal(false)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={creating || !groupName.trim() || selectedFriends.size === 0}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </div>
      </div>
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
          <h1 className="text-4xl font-bold mb-2">Group Chats</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Connect with multiple friends and build supportive communities
          </p>
        </div>

        {/* Create Group Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-3xl hover:from-purple-600 hover:to-pink-600 transition mb-8 flex items-center justify-center gap-3"
        >
          <span className="text-2xl">👥</span>
          <span className="text-lg font-semibold">Create New Group</span>
        </button>

        {/* Groups List */}
        <div className="space-y-4">
          {groups.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">No group chats yet</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create your first group chat to start building community!
              </p>
            </div>
          ) : (
            groups.map(group => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="block p-6 bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 hover:shadow-xl transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    {group.avatar ? (
                      <img src={group.avatar} alt={group.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-white font-bold text-xl">{group.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold">{group.name}</h3>
                      <span className="text-sm text-gray-500">
                        {group.lastActivity?.toDate?.()?.toLocaleDateString() || 'Recently'}
                      </span>
                    </div>
                    
                    {group.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-2">{group.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {group.members.length} members
                        </span>
                        {group.messageCount > 0 && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-500">
                              {Array.isArray(group.messageCount) ? group.messageCount.length : group.messageCount} messages
                            </span>
                          </>
                        )}
                      </div>
                      
                      {group.isPrivate && (
                        <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                          Private
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Create Group Modal */}
        {showCreateModal && renderCreateModal()}
      </div>
    </div>
  );
}