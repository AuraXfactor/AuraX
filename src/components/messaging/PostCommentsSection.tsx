'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  addPostComment,
  addCommentReaction,
  listenToPostComments,
  PostComment,
  ReactionType,
  getEmojiForReaction,
  formatMessageTime
} from '@/lib/messaging';
import { getPublicProfile, PublicProfile } from '@/lib/socialSystem';

interface PostCommentsSectionProps {
  postId: string;
  postAuthorId: string;
  initialCommentsCount?: number;
  onCommentsCountChange?: (count: number) => void;
}

export default function PostCommentsSection({ 
  postId, 
  postAuthorId, 
  initialCommentsCount = 0,
  onCommentsCountChange 
}: PostCommentsSectionProps) {
  const { user } = useAuth();
  
  // State
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  
  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  
  // Available reactions
  const availableReactions: ReactionType[] = ['like', 'love', 'laugh', 'wow', 'sad', 'angry', 'celebrate', 'support'];

  // Load comments
  useEffect(() => {
    if (!postId) return;
    
    console.log('🔄 Setting up comments listener for post:', postId);
    
    const unsubscribe = listenToPostComments(postId, (newComments) => {
      console.log('💬 Received comments update:', newComments.length);
      setComments(newComments);
      setLoading(false);
      
      // Update parent component with comment count
      if (onCommentsCountChange) {
        onCommentsCountChange(newComments.length);
      }
    });
    
    return () => {
      console.log('🔄 Cleaning up comments listener');
      unsubscribe();
    };
  }, [postId, onCommentsCountChange]);

  // Auto-scroll to bottom when new comments are added
  useEffect(() => {
    if (comments.length > 0) {
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [comments.length]);

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;
    
    setSending(true);
    setError(null);
    const commentContent = newComment.trim();
    
    // Clear input immediately
    setNewComment('');
    
    console.log('📤 Submitting comment...', { 
      postId, 
      replyTo, 
      contentLength: commentContent.length 
    });
    
    try {
      const commentId = await addPostComment({
        postId,
        authorId: user.uid,
        content: commentContent,
        parentCommentId: replyTo || undefined,
      });
      
      console.log('✅ Comment submitted successfully:', { commentId });
      
      // Clear reply state
      setReplyTo(null);
      
      // Focus input for next comment
      inputRef.current?.focus();
      
    } catch (error) {
      console.error('❌ Error submitting comment:', error);
      // Restore comment on error
      setNewComment(commentContent);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to post comment: ${errorMessage}`);
    } finally {
      setSending(false);
    }
  };

  const handleReactionClick = async (commentId: string, reactionType: ReactionType) => {
    if (!user) return;
    
    try {
      await addCommentReaction({
        postId,
        commentId,
        userId: user.uid,
        reactionType,
      });
      
      setShowReactionPicker(null);
    } catch (error) {
      console.error('❌ Error adding comment reaction:', error);
    }
  };

  const handleReplyClick = (comment: PostComment) => {
    setReplyTo(comment.id);
    setNewComment(`@${comment.authorProfile?.name || 'user'} `);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const renderComment = (comment: PostComment, isReply = false) => {
    const isOwnComment = comment.authorId === user?.uid;
    const isPostAuthor = comment.authorId === postAuthorId;
    const commentReactions = Object.entries(comment.reactions || {});
    const userReaction = comment.reactions?.[user?.uid || ''];
    
    // Get replies to this comment
    const replies = comments.filter(c => c.parentCommentId === comment.id);
    const hasReplies = replies.length > 0;
    const showReplies = expandedReplies.has(comment.id);
    
    return (
      <div
        key={comment.id}
        className={`${isReply ? 'ml-12 mt-3' : 'mb-6'} group`}
      >
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            {comment.authorProfile?.avatar ? (
              <img 
                src={comment.authorProfile.avatar} 
                alt={comment.authorProfile.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span className="text-white font-bold text-xs">
                {comment.authorProfile?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Comment bubble */}
            <div className="bg-white dark:bg-gray-700 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-600">
              {/* Author and timestamp */}
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                  {comment.authorProfile?.name || 'Unknown User'}
                </span>
                {isPostAuthor && (
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full font-medium">
                    Author
                  </span>
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatMessageTime(comment.timestamp)}
                </span>
                {comment.editedAt && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    (edited)
                  </span>
                )}
              </div>
              
              {/* Comment content */}
              <p className="text-gray-900 dark:text-white text-sm leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
            
            {/* Comment actions */}
            <div className="flex items-center gap-4 mt-2 text-xs">
              {/* Like button */}
              <button
                onClick={() => handleReactionClick(comment.id, 'like')}
                className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                  userReaction === 'like' 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <span>{userReaction === 'like' ? '👍' : '👍'}</span>
                <span>{comment.likesCount || 0}</span>
              </button>
              
              {/* Reply button */}
              {!isReply && (
                <button
                  onClick={() => handleReplyClick(comment)}
                  className="px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
                >
                  Reply
                </button>
              )}
              
              {/* More reactions button */}
              <button
                onClick={() => setShowReactionPicker(showReactionPicker === comment.id ? null : comment.id)}
                className="px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
              >
                React
              </button>
              
              {/* Delete button for own comments */}
              {isOwnComment && (
                <button className="px-2 py-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition">
                  Delete
                </button>
              )}
            </div>
            
            {/* Reactions display */}
            {commentReactions.length > 0 && (
              <div className="flex gap-1 mt-2">
                {commentReactions.map(([userId, reaction]) => (
                  <div
                    key={userId}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition ${
                      userId === user?.uid ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                    onClick={() => handleReactionClick(comment.id, reaction)}
                    title={userId === user?.uid ? 'You' : `User ${userId.slice(-4)}`}
                  >
                    <span className="mr-1">{getEmojiForReaction(reaction)}</span>
                    <span className="text-xs">
                      {userId === user?.uid ? 'You' : `User ${userId.slice(-4)}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Reaction picker */}
            {showReactionPicker === comment.id && (
              <div className="mt-2 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 p-2 flex gap-1 relative z-10">
                {availableReactions.map((reaction) => (
                  <button
                    key={reaction}
                    className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition ${
                      userReaction === reaction ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                    }`}
                    onClick={() => handleReactionClick(comment.id, reaction)}
                  >
                    <span className="text-lg">{getEmojiForReaction(reaction)}</span>
                  </button>
                ))}
              </div>
            )}
            
            {/* Replies toggle and display */}
            {hasReplies && (
              <>
                <button
                  onClick={() => toggleReplies(comment.id)}
                  className="flex items-center gap-2 mt-3 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition"
                >
                  <svg className={`w-3 h-3 transition-transform ${showReplies ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>
                    {showReplies ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                  </span>
                </button>
                
                {showReplies && (
                  <div className="mt-3">
                    {replies.map(reply => renderComment(reply, true))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700">
      {/* Comments Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Comments ({comments.filter(c => !c.parentCommentId).length})
        </h3>
      </div>
      
      {/* Comments List */}
      <div className="px-6 py-4 max-h-96 overflow-y-auto">
        {comments.filter(comment => !comment.parentCommentId).length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              No comments yet. Be the first to comment!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments
              .filter(comment => !comment.parentCommentId) // Only show top-level comments
              .map(comment => renderComment(comment))}
          </div>
        )}
        <div ref={commentsEndRef} />
      </div>
      
      {/* Comment Input */}
      <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800">
        {error && (
          <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        {replyTo && (
          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
            <span className="text-blue-600 dark:text-blue-400 text-sm">
              Replying to comment...
            </span>
            <button
              onClick={() => {
                setReplyTo(null);
                setNewComment('');
              }}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="flex gap-3">
          {/* User avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Your avatar" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span className="text-white font-bold text-xs">
                {user?.displayName?.charAt(0).toUpperCase() || '?'}
              </span>
            )}
          </div>
          
          {/* Comment input */}
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Write a comment..."
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none placeholder-gray-500 dark:placeholder-gray-400"
              rows={2}
              style={{
                minHeight: '44px',
                maxHeight: '120px',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Press Enter to post, Shift+Enter for new line
              </span>
              
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || sending}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Post</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}