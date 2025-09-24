'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  getAuraFeed, 
  AuraPost,
  FriendRequest,
  listenToFriendRequests 
} from '@/lib/friends';
import { getUserSquads, AuraSquad } from '@/lib/auraSquads';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Friend {
  uid: string;
  name: string;
  avatar?: string;
  lastSeen?: Date;
  isOnline?: boolean;
}

interface GroupChat {
  id: string;
  name: string;
  lastMessage?: string;
  lastActivity?: Date;
  unreadCount?: number;
  members: number;
}

const tabs = [
  { id: 'feed', label: 'Aura Feed', icon: '✨', href: '/aura' },
  { id: 'friends', label: 'Friends', icon: '👥', href: '/friends' },
  { id: 'groups', label: 'Groups', icon: '💬', href: '/groups' },
  { id: 'chat', label: 'Messages', icon: '💭', href: '/soulchat' },
];

function ConnectHubContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPageTitle, setBreadcrumbs } = useNavigation();
  const [activeTab, setActiveTab] = useState('feed');
  const [auraFeed, setAuraFeed] = useState<AuraPost[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [userSquads, setUserSquads] = useState<AuraSquad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const tab = searchParams.get('tab') || 'feed';
    setActiveTab(tab);
    
    loadData();
    updateNavigationState(tab);
    
    // Listen to friend requests
    const unsubscribe = listenToFriendRequests(user.uid, setFriendRequests);
    return () => unsubscribe();
  }, [user, router, searchParams]);

  const updateNavigationState = (tab: string) => {
    switch (tab) {
      case 'friends':
        setPageTitle('Friends');
        setBreadcrumbs([{ label: 'Connect' }, { label: 'Friends' }]);
        break;
      case 'groups':
        setPageTitle('Groups');
        setBreadcrumbs([{ label: 'Connect' }, { label: 'Groups' }]);
        break;
      case 'chat':
        setPageTitle('Messages');
        setBreadcrumbs([{ label: 'Connect' }, { label: 'Messages' }]);
        break;
      default:
        setPageTitle('Aura Feed');
        setBreadcrumbs([{ label: 'Connect' }, { label: 'Feed' }]);
    }
  };

  const loadData = async () => {
    if (!user) return;

    try {
      const [feedPosts, squads] = await Promise.all([
        getAuraFeed({ userUid: user.uid }),
        getUserSquads(user.uid),
      ]);

      setAuraFeed(feedPosts);
      setUserSquads(squads);
      
      // Load friends and groups
      await Promise.all([
        loadFriends(),
        loadGroups(),
      ]);
    } catch (error) {
      console.error('Error loading connect data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    if (!user) return;
    
    try {
      const friendsRef = collection(db, 'users', user.uid, 'friends');
      const q = query(friendsRef, orderBy('lastInteraction', 'desc'), limit(20));
      const snapshot = await getDocs(q);
      
      const friendsList = snapshot.docs.map(doc => ({
        uid: doc.id,
        name: doc.data().friendName,
        avatar: doc.data().friendAvatar,
        isOnline: Math.random() > 0.5, // Mock online status
      })) as Friend[];
      
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadGroups = async () => {
    if (!user) return;
    
    try {
      const groupsRef = collection(db, 'groupChats');
      const snapshot = await getDocs(query(groupsRef, limit(10)));
      
      const groupsList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((group: Record<string, unknown>) => (group.members as string[])?.includes(user.uid))
        .map((group: Record<string, unknown>) => ({
          id: group.id,
          name: group.name,
          lastMessage: 'Recent activity...',
          lastActivity: (group.lastActivity as { toDate?: () => Date })?.toDate ? (group.lastActivity as { toDate: () => Date }).toDate() : undefined,
          unreadCount: Math.floor(Math.random() * 5),
          members: (group.members as string[])?.length || 0,
        })) as GroupChat[];
      
      setGroups(groupsList);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const renderFeedTab = () => (
    <div className="space-y-6">
      {/* Create Aura Button */}
      <Link
        href="/aura"
        className="block p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-3xl hover:from-purple-600 hover:to-pink-600 transition"
      >
        <div className="flex items-center gap-4">
          <div className="text-4xl">✨</div>
          <div>
            <h3 className="text-xl font-bold">Share an Aura</h3>
            <p className="text-purple-100">Let friends see a glimpse of your world</p>
          </div>
        </div>
      </Link>

      {/* Recent Auras Preview */}
      <div className="space-y-4">
        {auraFeed.slice(0, 3).map(post => (
          <div key={post.id} className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                {post.authorAvatar ? (
                  <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-white font-bold text-sm">{post.authorName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h4 className="font-semibold">{post.authorName}</h4>
                <p className="text-sm text-gray-500">
                  {post.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                </p>
              </div>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">{post.content}</p>
            
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition">
                <span>❤️</span>
                <span className="text-sm">{post.likeCount || 0}</span>
              </button>
              <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition">
                <span>💬</span>
                <span className="text-sm">{post.replyCount || 0}</span>
              </button>
            </div>
          </div>
        ))}
        
        {auraFeed.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-xl font-semibold mb-2">No Auras yet</h3>
            <p className="text-gray-500 mb-4">Connect with friends to see their glimpses</p>
            <Link
              href="/friends"
              className="inline-block px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition"
            >
              Find Friends 👥
            </Link>
          </div>
        )}
      </div>

      {/* View All Button */}
      {auraFeed.length > 0 && (
        <div className="text-center">
          <Link
            href="/aura"
            className="inline-block px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition"
          >
            View Full Feed ✨
          </Link>
        </div>
      )}
    </div>
  );

  const renderFriendsTab = () => (
    <div className="space-y-6">
      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-6">
          <h2 className="text-lg font-bold mb-4">Friend Requests ({friendRequests.length})</h2>
          <div className="space-y-3">
            {friendRequests.slice(0, 2).map(request => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {request.fromUserName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{request.fromUserName}</p>
                    <p className="text-sm text-gray-500">wants to connect</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm">
                    Accept
                  </button>
                  <button className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition text-sm">
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/friends?tab=requests"
            className="block text-center mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View All Requests →
          </Link>
        </div>
      )}

      {/* Online Friends */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Friends ({friends.length})</h2>
          <Link
            href="/friends"
            className="text-purple-500 hover:text-purple-600 text-sm font-medium"
          >
            Manage →
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {friends.slice(0, 6).map(friend => (
            <Link
              key={friend.uid}
              href={`/soulchat/${friend.uid}`}
              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    {friend.avatar ? (
                      <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-white font-bold text-sm">{friend.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  {friend.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{friend.name}</p>
                  <p className="text-xs text-gray-500">
                    {friend.isOnline ? 'Online' : 'Recently'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {friends.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-gray-500 mb-4">No friends yet</p>
            <Link
              href="/friends?tab=discover"
              className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Find Friends
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/friends?tab=discover"
          className="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-600 transition text-center"
        >
          <div className="text-3xl mb-2">🔍</div>
          <div className="font-bold">Discover</div>
          <div className="text-blue-100 text-sm">Find new friends</div>
        </Link>
        
        <Link
          href="/groups/create"
          className="p-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl hover:from-indigo-600 hover:to-purple-600 transition text-center"
        >
          <div className="text-3xl mb-2">➕</div>
          <div className="font-bold">Create Group</div>
          <div className="text-indigo-100 text-sm">Start conversations</div>
        </Link>
      </div>
    </div>
  );

  const renderGroupsTab = () => (
    <div className="space-y-6">
      {/* Active Squads */}
      {userSquads.length > 0 && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">Your Aura Squads</h2>
          <div className="space-y-3">
            {userSquads.slice(0, 2).map(squad => (
              <Link
                key={squad.id}
                href={`/squads/${squad.id}`}
                className="block p-3 bg-white/20 hover:bg-white/30 rounded-xl transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{squad.name}</h3>
                    <p className="text-purple-100 text-sm">{squad.members.length} members</p>
                  </div>
                  {squad.currentChallenge && (
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      Challenge Active
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Group Chats */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Group Chats</h2>
          <Link
            href="/groups"
            className="text-purple-500 hover:text-purple-600 text-sm font-medium"
          >
            View All →
          </Link>
        </div>
        
        <div className="space-y-3">
          {groups.map(group => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold">{group.name}</h3>
                    <p className="text-sm text-gray-500">{group.lastMessage}</p>
                  </div>
                </div>
                <div className="text-right">
                  {group.unreadCount && group.unreadCount > 0 && (
                    <span className="inline-block w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center mb-1">
                      {group.unreadCount}
                    </span>
                  )}
                  <p className="text-xs text-gray-500">
                    {group.lastActivity?.toLocaleDateString() || 'Recently'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {groups.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-gray-500 mb-4">No group chats yet</p>
            <Link
              href="/groups/create"
              className="inline-block px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
            >
              Create First Group
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  const renderChatTab = () => (
    <div className="space-y-6">
      {/* Recent Conversations */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 p-6">
        <h2 className="text-lg font-bold mb-4">Recent Conversations</h2>
        
        <div className="space-y-3">
          {friends.slice(0, 5).map(friend => (
            <Link
              key={friend.uid}
              href={`/soulchat/${friend.uid}`}
              className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center">
                      {friend.avatar ? (
                        <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <span className="text-white font-bold">{friend.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    {friend.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{friend.name}</h3>
                    <p className="text-sm text-gray-500">
                      {friend.isOnline ? 'Online now' : 'Last seen recently'}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  💭
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {friends.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💭</div>
            <p className="text-gray-500 mb-4">No conversations yet</p>
            <Link
              href="/friends"
              className="inline-block px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
            >
              Add Friends to Chat
            </Link>
          </div>
        )}
      </div>

      {/* Chat Features */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-2xl text-center">
          <div className="text-3xl mb-2">🎙️</div>
          <div className="font-bold">Voice Messages</div>
          <div className="text-violet-100 text-sm">Express yourself</div>
        </div>
        
        <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl text-center">
          <div className="text-3xl mb-2">🤖</div>
          <div className="font-bold">Aura Coach</div>
          <div className="text-emerald-100 text-sm">AI assistance</div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 md:px-6 pt-6">
      <div className="max-w-4xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
          {tabs.map(tab => (
            <Link
              key={tab.id}
              href={tab.href}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="font-medium hidden sm:inline">{tab.label}</span>
              {tab.id === 'friends' && friendRequests.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                  {friendRequests.length}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'feed' && renderFeedTab()}
        {activeTab === 'friends' && renderFriendsTab()}
        {activeTab === 'groups' && renderGroupsTab()}
        {activeTab === 'chat' && renderChatTab()}
      </div>
    </div>
  );
}

export default function ConnectHubPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    }>
      <ConnectHubContent />
    </Suspense>
  );
}