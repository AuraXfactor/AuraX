'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getSocialFeed,
  createPost,
  likePost,
  unlikePost,
  sendFriendRequest,
  SocialPost
} from '@/lib/socialSystem';
import { DocumentSnapshot } from 'firebase/firestore';
import PostCommentsSection from '@/components/messaging/PostCommentsSection';

interface SocialFeedProps {
  showCreatePost?: boolean;
}

export default function SocialFeed({ showCreatePost = true }: SocialFeedProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>();
  const [hasMore, setHasMore] = useState(true);
  
  // Create post state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState<'text' | 'image' | 'achievement'>('text');
  const [newPostVisibility, setNewPostVisibility] = useState<'friends' | 'public'>('friends');
  const [newPostFile, setNewPostFile] = useState<File | null>(null);
  const [newPostMood, setNewPostMood] = useState('');
  const [newPostTags, setNewPostTags] = useState<string[]>([]);
  const [creatingPost, setCreatingPost] = useState(false);
  const [showComments, setShowComments] = useState<Set<string>>(new Set());
  const [sendingFriendRequests, setSendingFriendRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadFeed();
    }
  }, [user]);

  const loadFeed = async (refresh = false) => {
    if (!user) return;
    
    if (refresh) {
      setLoading(true);
      setPosts([]);
      setLastDoc(undefined);
      setHasMore(true);
    }
    
    try {
      const result = await getSocialFeed({
        userId: user.uid,
        limitCount: 10,
        lastDoc: refresh ? undefined : lastDoc,
      });
      
      if (refresh) {
        setPosts(result.posts);
      } else {
        setPosts(prev => [...prev, ...result.posts]);
      }
      
      setLastDoc(result.lastDoc);
      setHasMore(result.posts.length === 10);
      
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMorePosts = async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    await loadFeed();
  };

  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim()) return;
    
    setCreatingPost(true);
    try {
      await createPost({
        user,
        content: newPostContent,
        type: newPostType,
        visibility: newPostVisibility,
        file: newPostFile || undefined,
        tags: newPostTags,
        mood: newPostMood || undefined,
      });
      
      // Reset form
      setNewPostContent('');
      setNewPostFile(null);
      setNewPostMood('');
      setNewPostTags([]);
      setShowCreateForm(false);
      
      // Refresh feed
      await loadFeed(true);
      
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    } finally {
      setCreatingPost(false);
    }
  };

  const handleLikePost = async (postId: string, isLiked: boolean) => {
    if (!user) return;
    
    try {
      if (isLiked) {
        await unlikePost({ userId: user.uid, postId });
      } else {
        await likePost({ userId: user.uid, postId });
      }
      
      // Update local state
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          const newLikes = isLiked 
            ? post.likes.filter(id => id !== user.uid)
            : [...post.likes, user.uid];
          return { ...post, likes: newLikes };
        }
        return post;
      }));
      
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const toggleComments = (postId: string) => {
    setShowComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleSendFriendRequest = async (authorId: string) => {
    if (!user || user.uid === authorId) return;
    
    try {
      setSendingFriendRequests(prev => new Set(prev).add(authorId));
      await sendFriendRequest({
        fromUser: user,
        toUserId: authorId,
        message: 'I saw your post and would like to connect!'
      });
      alert('Friend request sent successfully!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request. Please try again.');
    } finally {
      setSendingFriendRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(authorId);
        return newSet;
      });
    }
  };

  const handleCommentsCountChange = (postId: string, count: number) => {
    // Update the post's comment count in local state
    setPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, comments: count } : post
    ));
  };

  const formatTimeAgo = (timestamp: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!timestamp || !timestamp.toDate) return 'Unknown';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const renderCreatePostForm = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Your avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-bold">
              {user?.displayName?.charAt(0).toUpperCase() || '?'}
            </span>
          )}
        </div>
        
        <div className="flex-1 space-y-4">
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="What's on your mind? Share your journey, achievements, or thoughts..."
            className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            rows={3}
          />
          
          <div className="flex flex-wrap gap-4">
            <select
              value={newPostType}
              onChange={(e) => setNewPostType(e.target.value as 'text' | 'image' | 'achievement')}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="text">📝 Text Post</option>
              <option value="image">🖼️ Image Post</option>
              <option value="achievement">🏆 Achievement</option>
            </select>
            
            <select
              value={newPostVisibility}
              onChange={(e) => setNewPostVisibility(e.target.value as 'friends' | 'public')}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="friends">👥 Friends Only</option>
              <option value="public">🌍 Public</option>
            </select>
            
            <input
              type="text"
              value={newPostMood}
              onChange={(e) => setNewPostMood(e.target.value)}
              placeholder="Mood (optional)"
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          
          {newPostType === 'image' && (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewPostFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
          )}
          
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
            >
              Cancel
            </button>
            
            <button
              onClick={handleCreatePost}
              disabled={!newPostContent.trim() || creatingPost}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 font-medium"
            >
              {creatingPost ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Posting...
                </div>
              ) : (
                'Share Post'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPost = (post: SocialPost) => {
    const isLiked = post.likes.includes(user?.uid || '');
    
    return (
      <div key={post.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        {/* Post Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            {post.authorProfile?.avatar ? (
              <img 
                src={post.authorProfile.avatar} 
                alt={post.authorProfile.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span className="text-white font-bold">
                {post.authorProfile?.name.charAt(0).toUpperCase() || '?'}
              </span>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {post.authorProfile?.name || 'Unknown User'}
              </h4>
              {post.authorProfile?.username && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  @{post.authorProfile.username}
                </span>
              )}
              {post.mood && (
                <span className="text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                  {post.mood}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>{formatTimeAgo(post.createdAt)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {post.visibility === 'public' ? '🌍' : '👥'}
                {post.visibility === 'public' ? 'Public' : 'Friends'}
              </span>
              {post.type === 'achievement' && (
                <>
                  <span>•</span>
                  <span>🏆 Achievement</span>
                </>
              )}
            </div>
          </div>
          
          {/* Friend Request Button */}
          {user && post.authorId !== user.uid && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSendFriendRequest(post.authorId)}
                disabled={sendingFriendRequests.has(post.authorId)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors"
              >
                {sendingFriendRequests.has(post.authorId) ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>👋</span>
                    <span>Add Friend</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        
        {/* Post Content */}
        <div className="mb-4">
          <p className="text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
          
          {post.mediaUrl && post.type === 'image' && (
            <div className="mt-4 rounded-lg overflow-hidden">
              <img 
                src={post.mediaUrl} 
                alt="Post image" 
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          )}
          
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
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
        </div>
        
        {/* Post Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleLikePost(post.id, isLiked)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                isLiked 
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span>
              <span className="text-sm font-medium">
                {post.likes.length} {post.likes.length === 1 ? 'Like' : 'Likes'}
              </span>
            </button>
            
            <button 
              onClick={() => toggleComments(post.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition"
            >
              <span className="text-lg">💬</span>
              <span className="text-sm font-medium">
                {post.comments} {post.comments === 1 ? 'Comment' : 'Comments'}
              </span>
            </button>
            
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition">
              <span className="text-lg">🔄</span>
              <span className="text-sm font-medium">
                {post.shares} {post.shares === 1 ? 'Share' : 'Shares'}
              </span>
            </button>
          </div>
          
          {post.location && (
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <span>📍</span>
              <span>{post.location}</span>
            </div>
          )}
        </div>
        
        {/* Comments Section */}
        {showComments.has(post.id) && (
          <PostCommentsSection
            postId={post.id}
            postAuthorId={post.authorId}
            initialCommentsCount={post.comments}
            onCommentsCountChange={(count) => handleCommentsCountChange(post.id, count)}
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Create Post */}
      {showCreatePost && (
        <div className="mb-6">
          {showCreateForm ? (
            renderCreatePostForm()
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Your avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold">
                      {user?.displayName?.charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex-1 text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                >
                  What&apos;s on your mind?
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Posts Feed */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📱</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            No posts yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Connect with friends to see their posts, or create your first post!
          </p>
        </div>
      ) : (
        <>
          {posts.map(renderPost)}
          
          {/* Load More Button */}
          {hasMore && (
            <div className="text-center py-6">
              <button
                onClick={loadMorePosts}
                disabled={loadingMore}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 font-medium"
              >
                {loadingMore ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading more...
                  </div>
                ) : (
                  'Load More Posts'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}