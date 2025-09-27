'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getAuraFeed, 
  createAuraPost, 
  addAuraReaction,
  AuraPost 
} from '@/lib/friends';

interface SocialFeedProps {
  className?: string;
}

export default function SocialFeed({ className = '' }: SocialFeedProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<AuraPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMood, setNewPostMood] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const moods = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '💪', label: 'Strong' },
    { emoji: '🌟', label: 'Motivated' },
    { emoji: '🤗', label: 'Grateful' },
    { emoji: '😌', label: 'Peaceful' },
    { emoji: '💚', label: 'Hopeful' },
    { emoji: '🎯', label: 'Focused' },
    { emoji: '🌈', label: 'Optimistic' },
  ];

  const reactions = [
    { emoji: '❤️', label: 'Love' },
    { emoji: '💪', label: 'Strength' },
    { emoji: '🤗', label: 'Hug' },
    { emoji: '🙏', label: 'Support' },
    { emoji: '🌟', label: 'Inspire' },
    { emoji: '👏', label: 'Celebrate' },
  ];

  useEffect(() => {
    if (user) {
      loadFeed();
    }
  }, [user]);

  const loadFeed = async () => {
    if (!user) return;
    
    try {
      const feedPosts = await getAuraFeed({ userUid: user.uid });
      setPosts(feedPosts);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim()) return;
    
    setActionLoading('create-post');
    try {
      await createAuraPost({
        user,
        content: newPostContent,
        type: 'text',
        moodTag: newPostMood,
        emoji: moods.find(m => m.label === newPostMood)?.emoji,
        visibility: 'friends',
      });
      
      setNewPostContent('');
      setNewPostMood('');
      setShowCreatePost(false);
      await loadFeed();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReaction = async (post: AuraPost, reactionType: string, emoji: string) => {
    if (!user) return;
    
    setActionLoading(`reaction-${post.id}`);
    try {
      await addAuraReaction({
        user,
        postId: post.id,
        type: reactionType as 'like' | 'love' | 'support' | 'hug',
        emoji,
      });
      
      await loadFeed();
    } catch (error) {
      console.error('Error adding reaction:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatTimeAgo = (timestamp: { toDate?: () => Date } | Date | null) => {
    if (!timestamp) return '';
    
    const date = timestamp && typeof timestamp === 'object' && 'toDate' in timestamp 
      ? timestamp.toDate?.() || new Date() 
      : new Date(timestamp as Date);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Social Feed</h2>
        <button
          onClick={() => setShowCreatePost(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition"
        >
          Share Moment
        </button>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Share Your Moment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">How are you feeling?</label>
                <div className="grid grid-cols-4 gap-2">
                  {moods.map(mood => (
                    <button
                      key={mood.label}
                      onClick={() => setNewPostMood(newPostMood === mood.label ? '' : mood.label)}
                      className={`p-2 rounded-lg border-2 transition ${
                        newPostMood === mood.label
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900'
                          : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                      }`}
                    >
                      <div className="text-2xl">{mood.emoji}</div>
                      <div className="text-xs">{mood.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">What&apos;s on your mind?</label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700"
                  rows={4}
                  placeholder="Share your thoughts, progress, or ask for support..."
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowCreatePost(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || actionLoading === 'create-post'}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50"
              >
                {actionLoading === 'create-post' ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌟</div>
            <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Connect with friends and start sharing your journey!
            </p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              {/* Author */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  {post.authorAvatar ? (
                    <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold">{post.authorName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{post.authorName}</h4>
                    {post.emoji && (
                      <span className="text-lg">{post.emoji}</span>
                    )}
                    {post.moodTag && (
                      <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                        {post.moodTag}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{formatTimeAgo(post.createdAt)}</p>
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded-full">
                  {post.isEphemeral ? '24h' : 'Permanent'}
                </div>
              </div>

              {/* Content */}
              <div className="mb-4">
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{post.content}</p>
                {post.mediaUrl && (
                  <div className="mt-3">
                    <img 
                      src={post.mediaUrl} 
                      alt="Post media" 
                      className="rounded-lg max-w-full h-auto"
                    />
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                <span>👁️ {post.viewCount || 0} views</span>
                <span>❤️ {post.likeCount || 0} reactions</span>
                <span>💬 {post.replyCount || 0} replies</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                {reactions.map(reaction => (
                  <button
                    key={reaction.label}
                    onClick={() => handleReaction(post, reaction.label.toLowerCase(), reaction.emoji)}
                    disabled={actionLoading === `reaction-${post.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
                    title={reaction.label}
                  >
                    <span>{reaction.emoji}</span>
                    <span className="text-xs">{reaction.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}