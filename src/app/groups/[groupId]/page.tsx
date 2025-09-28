'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  sendGroupMessage, 
  listenToGroupMessages,
  GroupChat,
  GroupMessage 
} from '@/lib/friends';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function GroupChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ groupId: string }>();
  const groupId = decodeURIComponent(params.groupId);
  
  const [group, setGroup] = useState<GroupChat | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    loadGroup();
    
    // Listen to messages
    const unsubscribe = listenToGroupMessages(groupId, (newMessages) => {
      setMessages(newMessages);
    });
    
    return () => unsubscribe();
  }, [user, router, groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadGroup = async () => {
    try {
      const groupDoc = await getDoc(doc(db, 'groupChats', groupId));
      if (groupDoc.exists()) {
        const groupData = { id: groupDoc.id, ...groupDoc.data() } as GroupChat;
        
        // Check if user is a member
        if (!groupData.members.includes(user?.uid || '')) {
          router.push('/groups');
          return;
        }
        
        setGroup(groupData);
      } else {
        router.push('/groups');
      }
    } catch (error) {
      console.error('Error loading group:', error);
      router.push('/groups');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    console.log('🚀 Group chat send clicked', { 
      hasUser: !!user, 
      hasMessage: !!newMessage.trim(), 
      groupId,
      messageLength: newMessage.trim().length
    });

    if (!user) {
      alert('❌ Please log in to send messages');
      return;
    }
    
    if (!newMessage.trim()) {
      alert('❌ Please type a message');
      return;
    }
    
    setSending(true);
    const messageContent = newMessage.trim();
    console.log('📤 Sending group message...', { groupId, messageContent });
    
    try {
      const messageId = await sendGroupMessage({
        user,
        groupId,
        content: messageContent,
        type: 'text',
      });
      
      console.log('✅ Group message sent successfully', { messageId });
      setNewMessage('');
    } catch (error) {
      console.error('❌ Group message send failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`❌ Failed to send message: ${errorMessage}`);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setSending(true);
    try {
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      await sendGroupMessage({
        user,
        groupId,
        content: `Shared ${type}`,
        type,
        file,
      });
    } catch (error) {
      console.error('Error sending file:', error);
      alert('Failed to send file');
    } finally {
      setSending(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!user || !group || !confirm('Are you sure you want to leave this group?')) return;
    
    try {
      await updateDoc(doc(db, 'groupChats', groupId), {
        members: arrayRemove(user.uid),
      });
      
      router.push('/groups');
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('Failed to leave group');
    }
  };

  const formatMessageTime = (timestamp: { toDate?: () => Date } | null) => {
    if (!timestamp?.toDate) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const renderMembersModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Group Members</h2>
            <button
              onClick={() => setShowMembers(false)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            {group?.members.map(memberId => (
              <div key={memberId} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {memberId.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Member {memberId.slice(0, 8)}...</p>
                  {group?.admins.includes(memberId) && (
                    <p className="text-sm text-purple-600 dark:text-purple-400">Admin</p>
                  )}
                </div>
                {memberId === user?.uid && (
                  <span className="text-sm text-gray-500">You</span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowMembers(false)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Close
            </button>
            <button
              onClick={handleLeaveGroup}
              className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
            >
              Leave Group
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

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Group not found</h2>
          <Link href="/groups" className="text-purple-500 hover:underline">
            Back to Groups
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur border-b border-white/20 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/groups" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              ← Back
            </Link>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              {group.avatar ? (
                <img src={group.avatar} alt={group.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-white font-bold">{group.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h1 className="font-bold text-lg">{group.name}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {group.members.length} members
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowMembers(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
          >
            Members
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">Start the conversation</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Be the first to send a message in this group!
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwnMessage = message.fromUid === user?.uid;
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showAvatar = !prevMessage || prevMessage.fromUid !== message.fromUid;
              const displayName = message.fromName && message.fromName !== 'Anonymous' 
                ? message.fromName 
                : message.fromUid.slice(0, 8) + '...';

              return (
                <div key={message.id} className={`flex items-end gap-2 mb-4 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  {!isOwnMessage && (
                    <div className={`flex-shrink-0 ${showAvatar ? '' : 'invisible'}`}>
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                        {message.fromAvatar ? (
                          <img 
                            src={message.fromAvatar} 
                            alt={displayName} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span className="text-white font-semibold text-xs">
                            {displayName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Message Content */}
                  <div className={`flex flex-col max-w-xs sm:max-w-sm lg:max-w-md ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                    {/* Sender Name */}
                    {!isOwnMessage && showAvatar && (
                      <div className="mb-1 px-1">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {displayName}
                        </span>
                      </div>
                    )}
                    
                    {/* Message Bubble */}
                    <div className={`px-4 py-2 rounded-2xl shadow-sm relative ${
                      isOwnMessage
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md'
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-bl-md'
                    }`}>
                      {/* Message Content */}
                      {message.type === 'text' && (
                        <p className="text-sm leading-relaxed break-words">{message.content}</p>
                      )}
                      
                      {message.type === 'image' && message.mediaUrl && (
                        <div className="space-y-2">
                          {message.content && (
                            <p className="text-sm leading-relaxed break-words">{message.content}</p>
                          )}
                          <img 
                            src={message.mediaUrl} 
                            alt="Shared image" 
                            className="max-w-full h-auto rounded-lg"
                          />
                        </div>
                      )}
                      
                      {message.type === 'video' && message.mediaUrl && (
                        <div className="space-y-2">
                          {message.content && (
                            <p className="text-sm leading-relaxed break-words">{message.content}</p>
                          )}
                          <video 
                            src={message.mediaUrl} 
                            className="max-w-full h-auto rounded-lg" 
                            controls
                          />
                        </div>
                      )}
                      
                      {message.replyToPostId && (
                        <div className="text-xs opacity-75 mb-2 p-2 bg-black/10 rounded-md">
                          💫 Replying to an Aura post
                        </div>
                      )}
                    </div>
                    
                    {/* Timestamp */}
                    <div className={`mt-1 px-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatMessageTime(message.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3 bg-white dark:bg-gray-700 rounded-2xl p-3 shadow-lg border border-gray-100 dark:border-gray-600">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*"
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 disabled:opacity-50"
              title="Attach file"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message..."
                className="w-full px-0 py-2 bg-transparent border-none outline-none resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                rows={1}
                style={{
                  minHeight: '24px',
                  maxHeight: '120px',
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                }}
                disabled={sending}
              />
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={sending || !newMessage.trim()}
              className="flex-shrink-0 p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Typing indicator placeholder */}
          <div className="mt-2 px-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>

      {/* Members Modal */}
      {showMembers && renderMembersModal()}
    </div>
  );
}