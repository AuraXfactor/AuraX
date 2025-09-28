'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  createOrGetChatSession,
  sendEncryptedMessage,
  listenToEncryptedChat,
  markMessageAsRead,
  setTypingStatus,
  listenToChatSession,
  EncryptedChatMessage,
  ChatSession
} from '@/lib/enhancedChat';
import { getPublicProfile, PublicProfile } from '@/lib/socialSystem';

interface EnhancedChatInterfaceProps {
  otherUserId: string;
  onClose?: () => void;
}

export default function EnhancedChatInterface({ otherUserId, onClose }: EnhancedChatInterfaceProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Array<EncryptedChatMessage & { decryptedContent?: string }>>([]);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [otherUserProfile, setOtherUserProfile] = useState<PublicProfile | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatId, setChatId] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;
    
    initializeChat();
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [user, otherUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!chatId || !user) return;
    
    // Listen to messages
    const unsubscribeMessages = listenToEncryptedChat(chatId, user.uid, (newMessages) => {
      setMessages(newMessages);
      setLoading(false);
      
      // Mark unread messages as read
      newMessages.forEach(message => {
        if (message.senderId !== user.uid && !message.readBy[user.uid]) {
          markMessageAsRead(chatId, message.id, user.uid);
        }
      });
    });
    
    // Listen to chat session for typing indicators
    const unsubscribeSession = listenToChatSession(chatId, (session) => {
      setChatSession(session);
      const otherParticipant = session.participants[otherUserId];
      setOtherUserTyping(otherParticipant?.isTyping || false);
    });
    
    return () => {
      unsubscribeMessages();
      unsubscribeSession();
    };
  }, [chatId, user, otherUserId]);

  const initializeChat = async () => {
    if (!user) return;
    
    try {
      // Load other user's profile
      const profile = await getPublicProfile(otherUserId);
      setOtherUserProfile(profile);
      
      // Create or get chat session
      const sessionId = await createOrGetChatSession(user.uid, otherUserId);
      setChatId(sessionId);
      
    } catch (error) {
      console.error('Error initializing chat:', error);
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!user || !newMessage.trim() || !chatId) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');
    
    try {
      await sendEncryptedMessage({
        user,
        chatId,
        content: messageContent,
        type: 'text',
      });

      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        await setTypingStatus(chatId, user.uid, false);
      }

      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent); // Restore message on error
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = async (value: string) => {
    setNewMessage(value);
    
    if (!chatId || !user) return;
    
    // Handle typing indicators
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      await setTypingStatus(chatId, user.uid, true);
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      await setTypingStatus(chatId, user.uid, false);
    }
    
    // Clear typing after 3 seconds of no input
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(async () => {
      if (isTyping) {
        setIsTyping(false);
        await setTypingStatus(chatId, user.uid, false);
      }
    }, 3000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!timestamp || !timestamp.toDate) return '';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getLastSeenText = (lastSeen: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!lastSeen || !lastSeen.toDate) return 'Offline';
    
    const date = lastSeen.toDate();
    const now = new Date();
    const diffInMinutes = Math.abs(now.getTime() - date.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 5) return 'Online';
    if (diffInMinutes < 60) return `Active ${Math.floor(diffInMinutes)} minutes ago`;
    if (diffInMinutes < 1440) return `Active ${Math.floor(diffInMinutes / 60)} hours ago`;
    return `Active ${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const renderMessage = (message: EncryptedChatMessage & { decryptedContent?: string }, index: number) => {
    const isOwnMessage = message.senderId === user?.uid;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showSender = !prevMessage || 
      prevMessage.senderId !== message.senderId ||
      (message.timestamp && prevMessage.timestamp &&
       typeof message.timestamp === 'object' && 'toDate' in message.timestamp &&
       typeof prevMessage.timestamp === 'object' && 'toDate' in prevMessage.timestamp &&
       Math.abs(message.timestamp.toDate().getTime() - prevMessage.timestamp.toDate().getTime()) > 5 * 60 * 1000);

    const content = message.decryptedContent || message.encryptedContent;
    const isRead = message.readBy && Object.keys(message.readBy).length > 1;
    
    return (
      <div
        key={message.id}
        className={`flex gap-3 mb-4 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
      >
        {/* Avatar */}
        {!isOwnMessage && showSender && (
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            {otherUserProfile?.avatar ? (
              <img 
                src={otherUserProfile.avatar} 
                alt={otherUserProfile.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span className="text-white font-bold">
                {otherUserProfile?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            )}
          </div>
        )}
        
        {/* Spacer for grouped messages */}
        {!isOwnMessage && !showSender && <div className="w-10"></div>}
        
        <div className={`flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg ${isOwnMessage ? 'flex justify-end' : ''}`}>
          {/* Message bubble */}
          <div
            className={`px-4 py-3 rounded-2xl relative ${
              isOwnMessage
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
            } ${
              showSender ? (isOwnMessage ? 'rounded-tr-md' : 'rounded-tl-md') : 'rounded-2xl'
            }`}
          >
            {message.type === 'text' && (
              <div>
                <p className="whitespace-pre-wrap break-words leading-relaxed">
                  {content}
                </p>
                
                {/* Encryption indicator */}
                {message.iv && (
                  <div className={`flex items-center gap-1 mt-2 text-xs ${
                    isOwnMessage ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span>Encrypted</span>
                  </div>
                )}
              </div>
            )}
            
            {message.type === 'system' && (
              <p className="text-sm italic opacity-75">{content}</p>
            )}
            
            <div className={`flex items-center justify-between mt-2 text-xs ${
              isOwnMessage ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
            }`}>
              <span>{formatMessageTime(message.timestamp)}</span>
              {isOwnMessage && (
                <span className="flex items-center gap-1">
                  {isRead ? (
                    <>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <svg className="w-3 h-3 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </>
                  ) : (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <div className="flex items-center gap-4">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              {otherUserProfile?.avatar ? (
                <img 
                  src={otherUserProfile.avatar} 
                  alt={otherUserProfile.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span className="text-white font-bold">
                  {otherUserProfile?.name?.charAt(0).toUpperCase() || '?'}
                </span>
              )}
            </div>
            {otherUserProfile?.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
            )}
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
              {otherUserProfile?.name || 'Unknown User'}
            </h3>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {otherUserTyping ? (
                  <span className="flex items-center gap-1">
                    <span className="flex gap-1">
                      <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce"></span>
                      <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                      <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    </span>
                    typing...
                  </span>
                ) : (
                  getLastSeenText(chatSession?.participants[otherUserId]?.lastSeen)
                )}
              </p>
              {chatSession?.encryptionEnabled && (
                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>End-to-end encrypted</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(`/profile/${otherUserId}`, '_blank')}
            className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition"
            title="View Profile"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
          
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <span>{messages.length} messages</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Start the conversation!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Send a message to {otherUserProfile?.name} to begin your encrypted chat.
            </p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${otherUserProfile?.name || 'user'}...`}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none placeholder-gray-500 dark:placeholder-gray-400"
              rows={1}
              style={{
                minHeight: '48px',
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
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg flex items-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Send</span>
              </>
            )}
          </button>
        </div>
        
        {/* Input Footer */}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span>Press Enter to send, Shift+Enter for new line</span>
            {chatSession?.encryptionEnabled && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Messages are encrypted</span>
              </div>
            )}
          </div>
          
          <span>
            {newMessage.length}/1000
          </span>
        </div>
      </div>
    </div>
  );
}