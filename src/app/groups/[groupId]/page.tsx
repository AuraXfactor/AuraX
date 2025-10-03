'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Group } from '@/lib/socialSystem';
import { 
  sendGroupChatMessage, 
  listenToGroupChatMessages,
  createGroupChatFromGroup,
  GroupChatMessage 
} from '@/lib/groupChatSystem';
import { doc, getDoc, updateDoc, arrayRemove, deleteField } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function GroupChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ groupId: string }>();
  const groupId = decodeURIComponent(params.groupId);
  
  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
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
    
    // Listen to messages if chat exists
    let unsubscribe: (() => void) | null = null;
    
    if (chatId) {
      unsubscribe = listenToGroupChatMessages(chatId, (newMessages) => {
        setMessages(newMessages);
      });
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, router, groupId, chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadGroup = async () => {
    try {
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (groupDoc.exists()) {
        const groupData = { id: groupDoc.id, ...groupDoc.data() } as Group;
        
        // Check if user is a member
        if (!groupData.members[user?.uid || '']) {
          router.push('/groups');
          return;
        }
        
        setGroup(groupData);
        
        // Check if group chat exists, create if not
        try {
          const chatDoc = await getDoc(doc(db, 'groupChats', groupId));
          if (chatDoc.exists()) {
            setChatId(groupId);
          } else {
            // Create group chat
            const newChatId = await createGroupChatFromGroup(groupId);
            setChatId(newChatId);
          }
        } catch (chatError) {
          console.error('Error with group chat:', chatError);
          // Still show the group even if chat creation fails
        }
        
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
      chatId,
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
    
    if (!chatId) {
      alert('❌ Group chat not ready yet');
      return;
    }
    
    setSending(true);
    const messageContent = newMessage.trim();
    console.log('📤 Sending group message...', { chatId, messageContent });
    
    try {
      const messageId = await sendGroupChatMessage({
        user,
        groupId: chatId,
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
    if (!file || !user || !chatId) return;

    setSending(true);
    try {
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      await sendGroupChatMessage({
        user,
        groupId: chatId,
        content: `Shared ${type}`,
        type,
        mediaUrl: URL.createObjectURL(file), // In a real app, you'd upload to storage first
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
      await updateDoc(doc(db, 'groups', groupId), {
        [`members.${user.uid}`]: deleteField(),
        memberCount: arrayRemove(user.uid),
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
            {group && Object.keys(group.members).map(memberId => (
              <div key={memberId} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {memberId.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Member {memberId.slice(0, 8)}...</p>
                  {group.admins[memberId] && (
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
                {Object.keys(group.members).length} members
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
      <div className="flex-1 overflow-y-auto p-4">
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
            messages.map(message => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.fromUid === user?.uid ? 'justify-end' : ''}`}
              >
                {message.fromUid !== user?.uid && (
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                    {message.fromAvatar ? (
                      <img src={message.fromAvatar} alt={message.fromName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-xs">{message.fromName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                )}
                
                <div className={`max-w-xs lg:max-w-md ${message.fromUid === user?.uid ? 'order-first' : ''}`}>
                  {message.fromUid !== user?.uid && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{message.fromName}</p>
                  )}
                  
                  <div className={`p-3 rounded-2xl ${
                    message.fromUid === user?.uid
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white ml-auto'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    {message.type === 'text' && (
                      <p>{message.content}</p>
                    )}
                    
                    {message.type === 'image' && message.mediaUrl && (
                      <div>
                        <img 
                          src={message.mediaUrl} 
                          alt="Shared image" 
                          className="w-full h-48 object-cover rounded-lg mb-2"
                        />
                        {message.content && <p>{message.content}</p>}
                      </div>
                    )}
                    
                    {message.type === 'video' && message.mediaUrl && (
                      <div>
                        <video 
                          src={message.mediaUrl} 
                          className="w-full h-48 object-cover rounded-lg mb-2" 
                          controls
                        />
                        {message.content && <p>{message.content}</p>}
                      </div>
                    )}
                    
                    {message.replyToPostId && (
                      <div className="text-xs opacity-75 mb-2 p-2 bg-black/10 rounded">
                        Replying to an Aura post
                      </div>
                    )}
                  </div>
                  
                  <p className={`text-xs text-gray-500 mt-1 ${
                    message.fromUid === user?.uid ? 'text-right' : ''
                  }`}>
                    {formatMessageTime(message.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur border-t border-white/20 p-4">
        <div className="max-w-4xl mx-auto flex gap-3">
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
            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
            title="Attach file"
          >
            📎
          </button>
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={sending}
          />
          
          <button
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      {/* Members Modal */}
      {showMembers && renderMembersModal()}
    </div>
  );
}