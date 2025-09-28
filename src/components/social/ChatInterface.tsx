'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  sendMessage,
  listenToChatMessages,
  ChatMessage,
  getPublicProfile,
  PublicProfile
} from '@/lib/socialSystem';

interface ChatInterfaceProps {
  chatId: string;
  participants: string[];
  chatTitle?: string;
  isGroup?: boolean;
}

export default function ChatInterface({ 
  chatId, 
  participants, 
  chatTitle,
  isGroup = false 
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [participantProfiles, setParticipantProfiles] = useState<{ [key: string]: PublicProfile | undefined }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!user) return;

    // Load participant profiles
    loadParticipantProfiles();

    // Listen to messages
    const unsubscribe = listenToChatMessages(chatId, (newMessages) => {
      setMessages(newMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, chatId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    scrollToBottom();
  }, [messages]);

  const loadParticipantProfiles = async () => {
    const profiles: { [key: string]: PublicProfile | undefined } = {};
    
    for (const participantId of participants) {
      if (participantId !== user?.uid) {
        const profile = await getPublicProfile(participantId);
        if (profile) {
          profiles[participantId] = profile;
        }
      }
    }
    
    setParticipantProfiles(profiles);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!user || !newMessage.trim()) return;

    setSending(true);
    try {
      await sendMessage({
        user,
        chatId,
        content: newMessage.trim(),
        type: 'text',
        participants,
      });

      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isOwnMessage = message.senderId === user?.uid;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showSender = !isOwnMessage && (
      !prevMessage || 
      prevMessage.senderId !== message.senderId ||
      (message.timestamp && prevMessage.timestamp && 
       Math.abs(message.timestamp.toDate().getTime() - prevMessage.timestamp.toDate().getTime()) > 5 * 60 * 1000)
    );

    const senderProfile = participantProfiles[message.senderId];
    
    return (
      <div
        key={message.id}
        className={`flex gap-3 mb-4 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
      >
        {/* Avatar */}
        {!isOwnMessage && showSender && (
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            {senderProfile?.avatar ? (
              <img 
                src={senderProfile.avatar} 
                alt={senderProfile.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span className="text-white font-bold text-sm">
                {senderProfile?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            )}
          </div>
        )}
        
        {/* Spacer for grouped messages */}
        {!isOwnMessage && !showSender && <div className="w-8"></div>}
        
        <div className={`flex-1 max-w-xs sm:max-w-sm md:max-w-md ${isOwnMessage ? 'flex justify-end' : ''}`}>
          {/* Sender name for group chats */}
          {!isOwnMessage && showSender && isGroup && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-2">
              {senderProfile?.name || 'Unknown User'}
            </p>
          )}
          
          {/* Message bubble */}
          <div
            className={`px-4 py-2 rounded-2xl ${
              isOwnMessage
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
            } ${
              showSender ? 'rounded-tl-md' : isOwnMessage ? 'rounded-tr-2xl' : 'rounded-tl-2xl'
            }`}
          >
            {message.type === 'text' && (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}
            
            {message.type === 'image' && message.mediaUrl && (
              <div className="space-y-2">
                {message.content && (
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                )}
                <img 
                  src={message.mediaUrl} 
                  alt="Shared image" 
                  className="max-w-full h-auto rounded-lg"
                />
              </div>
            )}
            
            {message.type === 'system' && (
              <p className="text-sm italic opacity-75">{message.content}</p>
            )}
            
            <div className={`text-xs mt-1 ${isOwnMessage ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
              {formatMessageTime(message.timestamp)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getChatTitle = () => {
    if (chatTitle) return chatTitle;
    
    if (isGroup) {
      return 'Group Chat';
    }
    
    // For 1-on-1 chats, show the other participant's name
    const otherParticipant = participants.find(p => p !== user?.uid);
    const profile = otherParticipant ? participantProfiles[otherParticipant] : null;
    return profile?.name || 'Chat';
  };

  const getOnlineStatus = () => {
    if (isGroup) return null;
    
    const otherParticipant = participants.find(p => p !== user?.uid);
    const profile = otherParticipant ? participantProfiles[otherParticipant] : null;
    return profile?.isOnline;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            {isGroup ? (
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold">👥</span>
              </div>
            ) : (
              <>
                {participants
                  .filter(p => p !== user?.uid)
                  .slice(0, 1)
                  .map(participantId => {
                    const profile = participantProfiles[participantId];
                    return (
                      <div key={participantId} className="relative">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                          {profile?.avatar ? (
                            <img 
                              src={profile.avatar} 
                              alt={profile.name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <span className="text-white font-bold">
                              {profile?.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          )}
                        </div>
                        {getOnlineStatus() && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                        )}
                      </div>
                    );
                  })}
              </>
            )}
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {getChatTitle()}
            </h3>
            {!isGroup && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getOnlineStatus() ? 'Online' : 'Offline'}
              </p>
            )}
            {isGroup && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {participants.length} members
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-gray-500 dark:text-gray-400">
              Start a conversation!
            </p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              rows={1}
              style={{
                minHeight: '40px',
                maxHeight: '120px',
                height: 'auto',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </div>
  );
}