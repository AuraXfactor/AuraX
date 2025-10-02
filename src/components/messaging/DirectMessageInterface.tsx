'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  createDirectChat,
  createSimpleChat,
  sendMessage,
  listenToMessages,
  listenToChat,
  listenToTypingIndicators,
  markMessageAsRead,
  setTypingStatus,
  addReaction,
  removeReaction,
  Message,
  Chat,
  ReactionType,
  getEmojiForReaction,
  formatMessageTime
} from '@/lib/messaging';
import { getPublicProfile, PublicProfile } from '@/lib/socialSystem';

interface DirectMessageInterfaceProps {
  otherUserId: string;
  onClose?: () => void;
  initialMessage?: string;
}

export default function DirectMessageInterface({ 
  otherUserId, 
  onClose, 
  initialMessage 
}: DirectMessageInterfaceProps) {
  const { user } = useAuth();
  
  // State
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUserProfile, setOtherUserProfile] = useState<PublicProfile | null>(null);
  const [newMessage, setNewMessage] = useState(initialMessage || '');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatId, setChatId] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Available reactions
  const availableReactions: ReactionType[] = ['like', 'love', 'laugh', 'wow', 'sad', 'angry', 'celebrate', 'support'];

  // Initialize chat
  useEffect(() => {
    if (!user || !otherUserId) return;
    
    initializeChat();
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [user, otherUserId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up real-time listeners
  useEffect(() => {
    if (!chatId || !user) return;
    
    console.log('🔄 Setting up real-time listeners...', { chatId });
    
    // Listen to messages
    const unsubscribeMessages = listenToMessages(chatId, user.uid, (newMessages) => {
      console.log('📬 Received messages update:', newMessages.length);
      setMessages(newMessages);
      setLoading(false);
      
      // Mark unread messages as read
      newMessages.forEach(message => {
        if (message.senderId !== user.uid && !message.readBy[user.uid]) {
          markMessageAsRead({
            chatId,
            messageId: message.id,
            userId: user.uid,
          });
        }
      });
    });
    
    // Listen to chat updates
    const unsubscribeChat = listenToChat(chatId, (updatedChat) => {
      console.log('💬 Chat updated:', updatedChat);
      if (updatedChat) {
        setChat(updatedChat);
      }
    });
    
    // Listen to typing indicators
    const unsubscribeTyping = listenToTypingIndicators(chatId, user.uid, (typingUsers) => {
      console.log('⌨️ Typing users:', typingUsers);
      setOtherUserTyping(typingUsers.includes(otherUserId));
    });
    
    return () => {
      console.log('🔄 Cleaning up listeners...');
      unsubscribeMessages();
      unsubscribeChat();
      unsubscribeTyping();
    };
  }, [chatId, user, otherUserId]);

  const initializeChat = async () => {
    if (!user) {
      console.error('❌ Cannot initialize chat: user not logged in');
      setLoading(false);
      return;
    }
    
    // Prevent users from messaging themselves
    if (user.uid === otherUserId) {
      console.error('❌ Cannot message yourself');
      setError('You cannot message yourself');
      setLoading(false);
      return;
    }
    
    console.log('🔄 Initializing direct message chat...', { 
      currentUserId: user.uid, 
      otherUserId 
    });
    
    try {
      setError(null);
      setLoading(true);
      
      // Load other user's profile
      console.log('👤 Loading other user profile...', { otherUserId });
      try {
        const profile = await getPublicProfile(otherUserId);
        setOtherUserProfile(profile);
        console.log('✅ Profile loaded:', profile?.name || 'No name');
      } catch (profileError) {
        console.warn('⚠️ Profile loading failed, continuing without profile:', profileError);
        setOtherUserProfile(null);
      }
      
      // Create or get direct chat
      console.log('💬 Creating/getting direct chat...');
      const sessionId = await createDirectChat(user.uid, otherUserId);
      console.log('✅ Direct chat ready:', { sessionId });
      
      setChatId(sessionId);
      console.log('🎉 Chat initialization completed successfully');
      
    } catch (error) {
      console.error('❌ Error initializing chat:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to initialize chat: ${errorMessage}`);
      setLoading(false);
    }
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSendMessage = async () => {
    console.log('🚀 Send button clicked', { 
      hasUser: !!user, 
      hasMessage: !!newMessage.trim(), 
      hasChatId: !!chatId,
      hasFile: !!selectedFile,
      chatId,
      messageLength: newMessage.trim().length
    });

    if (!user) {
      setError('Please log in to send messages');
      return;
    }
    
    if (!newMessage.trim() && !selectedFile) {
      setError('Please type a message or select a file');
      return;
    }
    
    if (!chatId) {
      setError('Chat session not initialized. Please refresh the page.');
      return;
    }

    setSending(true);
    setError(null);
    const messageContent = newMessage.trim();
    const fileToSend = selectedFile;
    
    // Clear input immediately for better UX
    setNewMessage('');
    setSelectedFile(null);
    setShowImageUpload(false);
    
    console.log('📤 Attempting to send message...', { 
      chatId, 
      messageContent, 
      hasFile: !!fileToSend 
    });
    
    try {
      const messageId = await sendMessage({
        chatId,
        senderId: user.uid,
        content: messageContent || (fileToSend ? `Sent ${fileToSend.type.startsWith('image/') ? 'image' : 'file'}` : ''),
        type: fileToSend ? (fileToSend.type.startsWith('image/') ? 'image' : 'file') : 'text',
        file: fileToSend || undefined,
      });

      console.log('✅ Message sent successfully:', { messageId });

      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        await setTypingStatus({
          chatId,
          userId: user.uid,
          isTyping: false,
        });
      }

      // Focus input for next message
      inputRef.current?.focus();
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Restore message on error
      setNewMessage(messageContent);
      setSelectedFile(fileToSend);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to send message: ${errorMessage}`);
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
      await setTypingStatus({
        chatId,
        userId: user.uid,
        isTyping: true,
      });
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      await setTypingStatus({
        chatId,
        userId: user.uid,
        isTyping: false,
      });
    }
    
    // Clear typing after 3 seconds of no input
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(async () => {
      if (isTyping) {
        setIsTyping(false);
        await setTypingStatus({
          chatId,
          userId: user.uid,
          isTyping: false,
        });
      }
    }, 3000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      setShowImageUpload(false);
    }
  };

  const handleReactionClick = async (messageId: string, reactionType: ReactionType) => {
    if (!user || !chatId) return;
    
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;
      
      const userReaction = message.reactions[user.uid];
      
      if (userReaction === reactionType) {
        // Remove reaction if clicking the same one
        await removeReaction({
          chatId,
          messageId,
          userId: user.uid,
        });
      } else {
        // Add or change reaction
        await addReaction({
          chatId,
          messageId,
          userId: user.uid,
          reactionType,
        });
      }
      
      setShowReactionPicker(null);
    } catch (error) {
      console.error('❌ Error handling reaction:', error);
    }
  };

  const getLastSeenText = (lastSeen: unknown) => {
    if (!lastSeen || typeof lastSeen !== 'object' || !('toDate' in lastSeen)) return 'Offline';
    
    const date = (lastSeen as { toDate: () => Date }).toDate();
    const now = new Date();
    const diffInMinutes = Math.abs(now.getTime() - date.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 5) return 'Online';
    if (diffInMinutes < 60) return `Active ${Math.floor(diffInMinutes)} minutes ago`;
    if (diffInMinutes < 1440) return `Active ${Math.floor(diffInMinutes / 60)} hours ago`;
    return `Active ${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const renderMessage = (message: Message, index: number) => {
    const isOwnMessage = message.senderId === user?.uid;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showSender = !prevMessage || 
      prevMessage.senderId !== message.senderId ||
      (message.timestamp && prevMessage.timestamp &&
       typeof message.timestamp === 'object' && 'toDate' in message.timestamp &&
       typeof prevMessage.timestamp === 'object' && 'toDate' in prevMessage.timestamp &&
       Math.abs(message.timestamp.toDate().getTime() - prevMessage.timestamp.toDate().getTime()) > 5 * 60 * 1000);

    const messageReactions = Object.entries(message.reactions);
    const userReaction = message.reactions[user?.uid || ''];
    
    return (
      <div
        key={message.id}
        className={`flex gap-3 mb-4 group ${isOwnMessage ? 'flex-row-reverse' : ''}`}
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
              <span className="text-white font-bold text-sm">
                {otherUserProfile?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            )}
          </div>
        )}
        
        {/* Spacer for grouped messages */}
        {!isOwnMessage && !showSender && <div className="w-10"></div>}
        
        <div className={`flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg ${isOwnMessage ? 'flex justify-end' : ''}`}>
          {/* Message bubble */}
          <div className="relative">
            <div
              className={`px-4 py-3 rounded-2xl relative ${
                isOwnMessage
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
              } ${
                showSender ? (isOwnMessage ? 'rounded-tr-md' : 'rounded-tl-md') : 'rounded-2xl'
              }`}
            >
              {/* Text content */}
              {message.type === 'text' && (
                <p className="whitespace-pre-wrap break-words leading-relaxed">
                  {message.content}
                </p>
              )}
              
              {/* Image content */}
              {message.type === 'image' && (
                <div>
                  {message.content && message.content !== `Sent image` && (
                    <p className="whitespace-pre-wrap break-words leading-relaxed mb-2">
                      {message.content}
                    </p>
                  )}
                  {message.mediaUrl && (
                    <div className="rounded-lg overflow-hidden max-w-full">
                      <img 
                        src={message.mediaUrl} 
                        alt="Sent image" 
                        className="max-w-full h-auto max-h-96 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(message.mediaUrl, '_blank')}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* File content */}
              {message.type === 'file' && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{message.fileName || 'File'}</p>
                    <p className="text-xs opacity-75">
                      {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                    </p>
                  </div>
                  {message.mediaUrl && (
                    <a
                      href={message.mediaUrl}
                      download
                      className="p-2 hover:bg-black/10 rounded-lg transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </a>
                  )}
                </div>
              )}
              
              {/* System message */}
              {message.type === 'system' && (
                <p className="text-sm italic opacity-75 text-center">
                  {message.content}
                </p>
              )}
              
              {/* Encryption indicator */}
              {message.encryptionIV && message.type !== 'system' && (
                <div className={`flex items-center gap-1 mt-2 text-xs ${
                  isOwnMessage ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Encrypted</span>
                </div>
              )}
              
              {/* Timestamp and read status */}
              <div className={`flex items-center justify-between mt-2 text-xs ${
                isOwnMessage ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
              }`}>
                <span>{formatMessageTime(message.timestamp)}</span>
                {isOwnMessage && (
                  <div className="flex items-center gap-1">
                    {Object.keys(message.readBy).length > 1 ? (
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
                  </div>
                )}
              </div>
            </div>
            
            {/* Reactions */}
            {messageReactions.length > 0 && (
              <div className={`flex gap-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                {messageReactions.map(([userId, reaction]) => (
                  <div
                    key={userId}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition ${
                      userId === user?.uid ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                    onClick={() => handleReactionClick(message.id, reaction)}
                  >
                    <span className="mr-1">{getEmojiForReaction(reaction)}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Reaction button */}
            <button
              className={`absolute top-0 ${
                isOwnMessage ? 'left-0 -translate-x-8' : 'right-0 translate-x-8'
              } opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white dark:bg-gray-700 rounded-full shadow-lg border border-gray-200 dark:border-gray-600`}
              onClick={() => setShowReactionPicker(showReactionPicker === message.id ? null : message.id)}
            >
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            {/* Reaction picker */}
            {showReactionPicker === message.id && (
              <div className={`absolute top-8 ${
                isOwnMessage ? 'right-0' : 'left-0'
              } bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 p-2 flex gap-1 z-10`}>
                {availableReactions.map((reaction) => (
                  <button
                    key={reaction}
                    className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition ${
                      userReaction === reaction ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                    }`}
                    onClick={() => handleReactionClick(message.id, reaction)}
                  >
                    <span className="text-lg">{getEmojiForReaction(reaction)}</span>
                  </button>
                ))}
              </div>
            )}
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Chat Error
          </h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              initializeChat();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Try Again
          </button>
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
                  getLastSeenText(chat?.participants[otherUserId]?.lastSeen)
                )}
              </p>
              {chat?.isEncrypted && (
                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Encrypted</span>
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

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex gap-4 items-end">
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition flex items-center justify-center"
              title="Attach file"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
          </div>
          
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
            disabled={(!newMessage.trim() && !selectedFile) || sending}
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
            {chat?.isEncrypted && (
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