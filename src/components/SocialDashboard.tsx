'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  getEnrichedFriendsList, 
  listenToFriendRequests, 
  getUserGroups,
  FriendRequest 
} from '@/lib/friends';
import { Group } from '@/lib/friends';

interface Friend {
  uid: string;
  name: string;
  username?: string;
  avatar?: string;
  isOnline?: boolean;
}

export default function SocialDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
      
      // Listen to friend requests
      const unsubscribe = listenToFriendRequests(user.uid, setFriendRequests);
      return () => unsubscribe();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      const [friendsList, groupsList] = await Promise.all([
        getEnrichedFriendsList(user.uid),
        getUserGroups(user.uid)
      ]);
      
      setFriends(friendsList.slice(0, 6)); // Show top 6 friends
      setGroups(groupsList.slice(0, 4)); // Show top 4 groups
    } catch (error) {
      console.error('Error loading social data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Social Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Friends</p>
              <p className="text-2xl font-bold">{friends.length}</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Groups</p>
              <p className="text-2xl font-bold">{groups.length}</p>
            </div>
            <div className="text-3xl">🏘️</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Requests</p>
              <p className="text-2xl font-bold">{friendRequests.length}</p>
            </div>
            <div className="text-3xl">📬</div>
          </div>
        </div>
      </div>

      {/* Friend Requests Alert */}
      {friendRequests.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">📬</div>
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                  {friendRequests.length} new friend request{friendRequests.length > 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  People want to connect with you!
                </p>
              </div>
            </div>
            <Link
              href="/friends?tab=requests"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              View Requests
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/friends"
          className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition text-center"
        >
          <div className="text-2xl mb-2">🔍</div>
          <p className="font-medium">Find Friends</p>
        </Link>
        
        <Link
          href="/groups"
          className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition text-center"
        >
          <div className="text-2xl mb-2">👥</div>
          <p className="font-medium">Join Groups</p>
        </Link>
        
        <button
          onClick={() => router.push('/social-feed')}
          className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition text-center"
        >
          <div className="text-2xl mb-2">🌟</div>
          <p className="font-medium">Social Feed</p>
        </button>
        
        <Link
          href="/friends?tab=suggestions"
          className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition text-center"
        >
          <div className="text-2xl mb-2">✨</div>
          <p className="font-medium">Suggestions</p>
        </Link>
      </div>

      {/* Recent Friends & Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Friends */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Friends</h3>
            <Link
              href="/friends"
              className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
            >
              View all
            </Link>
          </div>
          
          {friends.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">👋</div>
              <p className="text-gray-500">No friends yet</p>
              <Link
                href="/friends"
                className="text-sm text-purple-600 hover:underline"
              >
                Find friends to connect with
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map(friend => (
                <div key={friend.uid} className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    {friend.avatar ? (
                      <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-sm">{friend.name.charAt(0).toUpperCase()}</span>
                    )}
                    {friend.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{friend.name}</p>
                    {friend.username && (
                      <p className="text-sm text-gray-500">@{friend.username}</p>
                    )}
                  </div>
                  <button
                    onClick={() => router.push(`/soulchat/${friend.uid}`)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Chat
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Groups */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">My Groups</h3>
            <Link
              href="/groups"
              className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
            >
              View all
            </Link>
          </div>
          
          {groups.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🏘️</div>
              <p className="text-gray-500">No groups yet</p>
              <Link
                href="/groups"
                className="text-sm text-purple-600 hover:underline"
              >
                Join communities
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map(group => (
                <div key={group.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{group.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{group.name}</p>
                    <p className="text-sm text-gray-500">{group.memberCount || 0} members</p>
                  </div>
                  <Link
                    href={`/groups/${group.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}