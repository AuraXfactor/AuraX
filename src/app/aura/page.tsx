'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  createAuraPost, 
  getAuraFeed, 
  addAuraReaction, 
  addAuraReply,
  listenToAuraFeed,
  AuraPost
} from '@/lib/friends';
import { Timestamp } from 'firebase/firestore';
import { awardAuraPoints } from '@/lib/auraPoints';
import { updateQuestProgress } from '@/lib/weeklyQuests';
import { updateSquadChallengeProgress } from '@/lib/auraSquads';

const moods = [
  { label: '🌟', value: 'grateful', color: 'from-yellow-400 to-amber-500' },
  { label: '💪', value: 'motivated', color: 'from-orange-400 to-red-500' },
  { label: '😌', value: 'peaceful', color: 'from-green-400 to-emerald-500' },
  { label: '🎉', value: 'excited', color: 'from-pink-400 to-rose-500' },
  { label: '🤗', value: 'loved', color: 'from-purple-400 to-indigo-500' },
  { label: '🌱', value: 'growing', color: 'from-teal-400 to-cyan-500' },
  { label: '✨', value: 'inspired', color: 'from-indigo-400 to-purple-500' },
  { label: '🔥', value: 'determined', color: 'from-red-400 to-orange-500' },
];

const reactions = [
  { type: 'like', emoji: '❤️', label: 'Love' },
  { type: 'support', emoji: '🤗', label: 'Support' },
  { type: 'hug', emoji: '🫂', label: 'Hug' },
  { type: 'love', emoji: '💫', label: 'Inspire' },
];

export default function AuraPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<AuraPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [selectedEmoji, setSelectedEmoji] = useState<string>('');
  const [postType, setPostType] = useState<'text' | 'image' | 'video'>('text');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyContent, setReplyContent] = useState<{ [postId: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    loadAuraFeed();
    
    // Listen to real-time updates
    const unsubscribe = listenToAuraFeed(user.uid, (newPosts) => {
      setPosts(newPosts);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [user, router]);

  const loadAuraFeed = async () => {
    if (!user) return;
    try {
      const feedPosts = await getAuraFeed({ userUid: user.uid });
      setPosts(feedPosts);
    } catch (error) {
      console.error('Error loading Aura feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (file.type.startsWith('image/')) {
      setPostType('image');
      
      // Image size validation
      if (file.size > 10 * 1024 * 1024) { // 10MB limit for images
        alert('Image file is too large. Please select a file under 10MB.');
        return;
      }
    } else if (file.type.startsWith('video/')) {
      setPostType('video');
      
      // Import video validation utility
      const { validateVideoFile } = await import('@/utils/videoValidation');
      const validation = await validateVideoFile(file);
      
      if (!validation.isValid) {
        alert(validation.error || 'Invalid video file');
        return;
      }
      
      console.log(`✅ Video validated: ${validation.duration?.toFixed(1)}s, ${(validation.size! / 1024 / 1024).toFixed(1)}MB`);
    } else {
      alert('Please select an image or video file.');
      return;
    }

    setMediaFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async () => {
    if (!user) {
      alert('Please log in to share an Aura');
      return;
    }
    
    if (!newPostContent.trim() && !mediaFile) {
      alert('Please add some content or media to your Aura');
      return;
    }
    
    setCreating(true);
    try {
      console.log('Creating Aura post...', { content: newPostContent, type: postType });
      
      const postId = await createAuraPost({
        user,
        content: newPostContent,
        type: postType,
        file: mediaFile || undefined,
        moodTag: selectedMood,
        emoji: selectedEmoji,
        visibility: 'friends',
      });

      console.log('Aura post created successfully:', postId);

      // Reset form
      setNewPostContent('');
      setSelectedMood('');
      setSelectedEmoji('');
      setPostType('text');
      setMediaFile(null);
      setMediaPreview('');
      setShowCreateModal(false);
      
      // Award Aura Points for sharing
      try {
        await awardAuraPoints({
          user,
          activity: 'aura_post',
          proof: {
            type: 'social_interaction',
            value: newPostContent.length,
            metadata: { 
              type: postType,
              moodTag: selectedMood,
              hasMedia: Boolean(mediaFile),
              length: newPostContent.length
            }
          },
          description: `✨ Shared an Aura with friends`,
          uniqueId: `aura-post-${user.uid}-${Date.now()}`
        });
        
        // Update quest progress
        await updateQuestProgress(user.uid, 'aura_post');
        
        // Update squad challenge progress
        await updateSquadChallengeProgress(user.uid, 'aura_post', 1);
      } catch (pointsError) {
        console.error('Error awarding points:', pointsError);
      }
      
      // Reload feed
      await loadAuraFeed();
      
      alert('Aura shared successfully! ✨');
    } catch (error) {
      console.error('Error creating Aura post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleReaction = async (post: AuraPost, reactionType: string, emoji: string) => {
    if (!user) return;
    
    try {
      await addAuraReaction({
        user,
        postId: post.id,
        type: reactionType as 'like' | 'love' | 'support' | 'hug',
        emoji,
      });
      
      // Award points for supporting a friend
      if (post.authorUid !== user.uid) {
        try {
          await awardAuraPoints({
            user,
            activity: 'friend_support',
            proof: {
              type: 'social_interaction',
              value: reactionType,
              metadata: { 
                postId: post.id,
                authorUid: post.authorUid,
                reactionType
              }
            },
            description: `🤗 Supported ${post.authorName}'s Aura`,
            uniqueId: `friend-support-${user.uid}-${post.id}-${reactionType}`
          });
          
          // Update quest progress
          await updateQuestProgress(user.uid, 'friend_support');
          
          // Update squad challenge progress
          await updateSquadChallengeProgress(user.uid, 'friend_support', 1);
        } catch (pointsError) {
          console.error('Error awarding support points:', pointsError);
        }
      }
      
      // Reload feed to show updated reactions
      await loadAuraFeed();
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleReply = async (postId: string) => {
    if (!user || !replyContent[postId]?.trim()) return;
    
    try {
      await addAuraReply({
        user,
        postId,
        content: replyContent[postId],
        isPrivate: false,
      });
      
      // Clear reply input
      setReplyContent(prev => ({ ...prev, [postId]: '' }));
      
      // Reload feed
      await loadAuraFeed();
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const toggleReplies = (postId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const formatTimeRemaining = (expiresAt: Timestamp | null) => {
    if (!expiresAt) return '';
    
    const now = Date.now();
    const expiry = expiresAt.toMillis();
    const remaining = expiry - now;
    
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  };

  const renderCreateModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Share an Aura ✨</h2>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Content Input */}
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="Share a glimpse of your inner world... 🌟"
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={4}
            maxLength={280}
          />
          
          <div className="text-right text-sm text-gray-500 mb-4">
            {newPostContent.length}/280
          </div>

          {/* Media Preview */}
          {mediaPreview && (
            <div className="mb-4 relative">
              {postType === 'image' ? (
                <img src={mediaPreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
              ) : (
                <video src={mediaPreview} className="w-full h-48 object-cover rounded-xl" controls />
              )}
              <button
                onClick={() => {
                  setMediaFile(null);
                  setMediaPreview('');
                  setPostType('text');
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          )}

          {/* Mood Selection */}
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">How are you feeling?</h3>
            <div className="grid grid-cols-4 gap-2">
              {moods.map(mood => (
                <button
                  key={mood.value}
                  onClick={() => {
                    setSelectedMood(mood.value);
                    setSelectedEmoji(mood.label);
                  }}
                  className={`p-3 rounded-xl border-2 transition ${
                    selectedMood === mood.value
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{mood.label}</div>
                  <div className="text-xs capitalize">{mood.value}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Media Upload */}
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/mp4,video/webm,video/mov,video/quicktime"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 transition flex items-center justify-center gap-2"
            >
              <span className="text-2xl">📷</span>
              <span>Add photo or video</span>
            </button>
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
              onClick={handleCreatePost}
              disabled={creating || (!newPostContent.trim() && !mediaFile)}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50"
            >
              {creating ? 'Sharing...' : 'Share Aura ✨'}
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
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Aura Feed ✨</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Share glimpses of your inner world with friends
          </p>
        </div>

        {/* Create Post Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-3xl hover:from-purple-600 hover:to-pink-600 transition mb-8 flex items-center justify-center gap-3"
        >
          <span className="text-2xl">✨</span>
          <span className="text-lg font-semibold">Share an Aura</span>
        </button>

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✨</div>
              <h3 className="text-xl font-semibold mb-2">No Auras yet</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Be the first to share a glimpse of your inner world!
              </p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 overflow-hidden">
                {/* Post Header */}
                <div className="p-6 pb-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        {post.authorAvatar ? (
                          <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-bold">{post.authorName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{post.authorName}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatTimeRemaining(post.expiresAt)}
                        </p>
                      </div>
                    </div>
                    {post.emoji && (
                      <div className="text-2xl">{post.emoji}</div>
                    )}
                  </div>

                  {/* Post Content */}
                  <div className="mb-4">
                    {post.content && (
                      <p className="text-lg mb-4">{post.content}</p>
                    )}
                    
                    {post.type === 'image' && post.mediaUrl && (
                      <img 
                        src={post.mediaUrl} 
                        alt="Aura post" 
                        className="w-full h-64 object-cover rounded-xl mb-4"
                      />
                    )}
                    
                    {post.type === 'video' && post.mediaUrl && (
                      <video 
                        src={post.mediaUrl} 
                        className="w-full h-64 object-cover rounded-xl mb-4" 
                        controls
                      />
                    )}

                    {post.moodTag && (
                      <div className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                        Feeling {post.moodTag}
                      </div>
                    )}
                  </div>
                </div>

                {/* Post Actions */}
                <div className="px-6 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {reactions.map(reaction => (
                        <button
                          key={reaction.type}
                          onClick={() => handleReaction(post, reaction.type, reaction.emoji)}
                          className="flex items-center gap-1 px-3 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                          title={reaction.label}
                        >
                          <span>{reaction.emoji}</span>
                          <span className="text-sm">{post.likeCount || 0}</span>
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleReplies(post.id)}
                        className="flex items-center gap-1 px-3 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      >
                        <span>💬</span>
                        <span className="text-sm">{post.replyCount || 0}</span>
                      </button>
                      
                      {post.authorUid !== user?.uid && (
                        <Link
                          href={`/soulchat/${post.authorUid}?replyToPost=${post.id}&postContent=${encodeURIComponent(post.content)}`}
                          className="flex items-center gap-1 px-3 py-2 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 transition text-purple-600 dark:text-purple-400"
                        >
                          <span>💭</span>
                          <span className="text-sm">Chat</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Reply Input */}
                  {expandedReplies.has(post.id) && (
                    <div className="mt-4 space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyContent[post.id] || ''}
                          onChange={(e) => setReplyContent(prev => ({
                            ...prev,
                            [post.id]: e.target.value
                          }))}
                          placeholder="Share your thoughts..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          onKeyPress={(e) => e.key === 'Enter' && handleReply(post.id)}
                        />
                        <button
                          onClick={() => handleReply(post.id)}
                          disabled={!replyContent[post.id]?.trim()}
                          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50"
                        >
                          Reply
                        </button>
                      </div>
                      
                      {/* Replies would be loaded here */}
                      <div className="text-sm text-gray-500">
                        Replies are being supported...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Post Modal */}
        {showCreateModal && renderCreateModal()}
      </div>
    </div>
  );
}