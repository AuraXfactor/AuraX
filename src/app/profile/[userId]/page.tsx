'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getPublicProfile,
  getFriends,
  sendFriendRequest,
  removeFriend,
  getSocialFeed,
  PublicProfile,
  SocialPost
} from '@/lib/socialSystem';

export default function UserProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const userId = decodeURIComponent(params.userId);
  
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [userPosts, setUserPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [mutualFriends, setMutualFriends] = useState<PublicProfile[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (userId === user.uid) {
      router.push('/profile');
      return;
    }
    
    loadUserProfile();
  }, [user, userId, router]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load user's public profile
      const publicProfile = await getPublicProfile(userId);
      if (!publicProfile) {
        setProfile(null);
        return;
      }
      setProfile(publicProfile);
      
      // Check if already friends
      const friends = await getFriends(user.uid);
      const friendship = friends.find(f => f.friendId === userId);
      setIsFriend(!!friendship);
      
      // Load user's posts (if friends or public)
      if (friendship || publicProfile.isOnline) {
        await loadUserPosts();
      }
      
      // Load mutual friends
      await loadMutualFriends();
      
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosts = async () => {
    try {
      // This is simplified - in practice you'd filter posts by author
      const feed = await getSocialFeed({ userId: userId, limitCount: 10 });
      const userPosts = feed.posts.filter(post => post.authorId === userId);
      setUserPosts(userPosts);
    } catch (error) {
      console.error('Error loading user posts:', error);
    }
  };

  const loadMutualFriends = async () => {
    if (!user) return;
    
    try {
      const myFriends = await getFriends(user.uid);
      const theirFriends = await getFriends(userId);
      
      const myFriendIds = new Set(myFriends.map(f => f.friendId));
      const mutualFriendIds = theirFriends
        .filter(f => myFriendIds.has(f.friendId))
        .map(f => f.friendId);
      
      const mutualProfiles: PublicProfile[] = [];
      for (const friendId of mutualFriendIds.slice(0, 5)) {
        const profile = await getPublicProfile(friendId);
        if (profile) mutualProfiles.push(profile);
      }
      
      setMutualFriends(mutualProfiles);
    } catch (error) {
      console.error('Error loading mutual friends:', error);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!user || !profile) return;
    
    setActionLoading(true);
    try {
      await sendFriendRequest({
        fromUser: user,
        toUserId: userId,
        message: `Hi ${profile.name}! I'd like to connect with you on AuraX! 🌟`,
      });
      
      setFriendRequestSent(true);
      alert(`✅ Friend request sent to ${profile.name}!`);
      
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Error sending friend request:', error);
      alert(`❌ ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!user || !profile || !confirm(`Remove ${profile.name} from your friends?`)) return;
    
    setActionLoading(true);
    try {
      await removeFriend({
        userId: user.uid,
        friendId: userId,
      });
      
      setIsFriend(false);
      alert(`✅ ${profile.name} removed from friends`);
      
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Error removing friend:', error);
      alert(`❌ ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartChat = () => {
    if (!isFriend) {
      alert('You need to be friends to start a chat');
      return;
    }
    
    console.log('🚀 Starting chat with friend', { userId, isFriend });
    
    // Use Soul Chat system which is working reliably
    router.push(`/soulchat/${userId}`);
  };

  const formatJoinDate = (timestamp: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!timestamp || !timestamp.toDate) return 'Recently';
    return `Joined ${timestamp.toDate().toLocaleDateString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">👤</div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            Profile Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This user&apos;s profile is not available or does not exist.
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Profile
          </h1>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-8">
          {/* Cover Photo Area */}
          <div className="h-32 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500"></div>
          
          {/* Profile Info */}
          <div className="relative px-8 py-6">
            {/* Avatar */}
            <div className="absolute -top-16 left-8">
              <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                {profile.avatar ? (
                  <img 
                    src={profile.avatar} 
                    alt={profile.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-white font-bold text-4xl">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {profile.isOnline && (
                <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-gray-800"></div>
              )}
            </div>
            
            {/* Profile Details */}
            <div className="pt-20">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {profile.name}
                    </h2>
                    {profile.username && (
                      <span className="text-xl text-gray-500 dark:text-gray-400">
                        @{profile.username}
                      </span>
                    )}
                  </div>
                  
                  {profile.bio && (
                    <p className="text-gray-700 dark:text-gray-300 text-lg mb-4 leading-relaxed">
                      {profile.bio}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      👥 {profile.friendsCount} friends
                    </span>
                    <span className="flex items-center gap-1">
                      📝 {profile.postsCount} posts
                    </span>
                    {profile.location && (
                      <span className="flex items-center gap-1">
                        📍 {profile.location}
                      </span>
                    )}
                    <span>{formatJoinDate(profile.joinedAt)}</span>
                  </div>
                  
                  {/* Interests */}
                  {profile.interests && profile.interests.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Interests
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.interests.map((interest, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Focus Areas */}
                  {profile.focusAreas && profile.focusAreas.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Focus Areas
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.focusAreas.map((area, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col gap-3 ml-6">
                  {isFriend ? (
                    <>
                      <button
                        onClick={handleStartChat}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all font-medium shadow-lg"
                      >
                        💬 Message
                      </button>
                      <button
                        onClick={handleRemoveFriend}
                        disabled={actionLoading}
                        className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 font-medium"
                      >
                        {actionLoading ? 'Removing...' : '🗑️ Remove Friend'}
                      </button>
                    </>
                  ) : friendRequestSent ? (
                    <button 
                      disabled
                      className="px-6 py-3 bg-gray-400 text-white rounded-xl cursor-not-allowed font-medium"
                    >
                      Request Sent
                    </button>
                  ) : (
                    <button
                      onClick={handleSendFriendRequest}
                      disabled={actionLoading}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 font-medium shadow-lg"
                    >
                      {actionLoading ? 'Sending...' : '➕ Add Friend'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mutual Friends */}
        {mutualFriends.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              👥 Mutual Friends ({mutualFriends.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {mutualFriends.map(friend => (
                <div 
                  key={friend.userId}
                  onClick={() => router.push(`/profile/${friend.userId}`)}
                  className="text-center cursor-pointer hover:scale-105 transition-transform"
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-2">
                    {friend.avatar ? (
                      <img 
                        src={friend.avatar} 
                        alt={friend.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-white font-bold">
                        {friend.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {friend.name}
                  </p>
                  {friend.username && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      @{friend.username}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Posts */}
        {(isFriend || profile.isOnline) && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              📱 Recent Posts
            </h3>
            
            {userPosts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-gray-500 dark:text-gray-400">
                  {isFriend ? 'No posts yet' : 'Posts visible to friends only'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {userPosts.map(post => (
                  <div key={post.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        {profile.avatar ? (
                          <img 
                            src={profile.avatar} 
                            alt={profile.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span className="text-white font-bold">
                            {profile.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {profile.name}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          {post.createdAt && typeof post.createdAt === 'object' && 'toDate' in post.createdAt && (
                            <span>{post.createdAt.toDate().toLocaleDateString()}</span>
                          )}
                          {post.mood && (
                            <>
                              <span>•</span>
                              <span>{post.mood}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed mb-4">
                      {post.content}
                    </p>
                    
                    {post.mediaUrl && post.type === 'image' && (
                      <div className="mb-4 rounded-lg overflow-hidden">
                        <img 
                          src={post.mediaUrl} 
                          alt="Post image" 
                          className="w-full h-auto max-h-96 object-cover"
                        />
                      </div>
                    )}
                    
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag, index) => (
                          <span 
                            key={index}
                            className="text-blue-600 dark:text-blue-400 text-sm hover:underline cursor-pointer"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-6 text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-2">
                        ❤️ {post.likes.length} likes
                      </span>
                      <span className="flex items-center gap-2">
                        💬 {post.comments} comments
                      </span>
                      <span className="flex items-center gap-2">
                        🔄 {post.shares} shares
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}