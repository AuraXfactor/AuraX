'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  createGroupChat,
  sendMessage,
  listenToMessages,
  listenToChat,
  listenToTypingIndicators,
  markMessageAsRead,
  setTypingStatus,
  addReaction,
  removeReaction,
  addParticipantsToGroup,
  removeParticipantFromGroup,
  Message,
  Chat,
  ReactionType,
  getEmojiForReaction,
  formatMessageTime
} from '@/lib/messaging';
import { getPublicProfile, PublicProfile, searchUsers } from '@/lib/socialSystem';

interface GroupChatInterfaceProps {
  groupId?: string; // If provided, join existing group
  initialParticipants?: string[]; // If creating new group
  onClose?: () => void;
}

export default function GroupChatInterface({ 
  groupId, 
  initialParticipants = [], 
  onClose 
}: GroupChatInterfaceProps) {
  const { user } = useAuth();
  
  // State
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participantProfiles, setParticipantProfiles] = useState<{ [userId: string]: PublicProfile }>({});
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatId, setChatId] = useState<string>(groupId || '');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Group creation/management state
  const [isCreatingGroup, setIsCreatingGroup] = useState(!groupId);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupAvatar, setGroupAvatar] = useState<File | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(initialParticipants);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicProfile[]>([]);
  const [showParticipantSearch, setShowParticipantSearch] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  // Available reactions
  const availableReactions: ReactionType[] = ['like', 'love', 'laugh', 'wow', 'sad', 'angry', 'celebrate', 'support'];

  // Initialize chat or group creation
  useEffect(() => {
    if (!user) return;
    
    if (groupId) {
      initializeExistingGroup();
    } else {
      // Creating new group - load initial participant profiles
      loadParticipantProfiles();
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [user, groupId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up real-time listeners for existing groups
  useEffect(() => {
    if (!chatId || !user || isCreatingGroup) return;
    
    console.log('🔄 Setting up group chat listeners...', { chatId });
    
    // Listen to messages
    const unsubscribeMessages = listenToMessages(chatId, user.uid, (newMessages) => {
      console.log('📬 Received group messages update:', newMessages.length);
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
      console.log('💬 Group chat updated:', updatedChat);
      if (updatedChat) {
        setChat(updatedChat);
        loadParticipantProfiles(Object.keys(updatedChat.participants));
      }
    });
    
    // Listen to typing indicators
    const unsubscribeTyping = listenToTypingIndicators(chatId, user.uid, (typingUserIds) => {
      console.log('⌨️ Typing users in group:', typingUserIds);
      setTypingUsers(typingUserIds);
    });
    
    return () => {
      console.log('🔄 Cleaning up group chat listeners...');
      unsubscribeMessages();
      unsubscribeChat();
      unsubscribeTyping();
    };
  }, [chatId, user, isCreatingGroup]);

  // Search for users to add to group
  useEffect(() => {
    if (!searchQuery.trim() || !user) {
      setSearchResults([]);
      return;
    }
    
    const searchTimeout = setTimeout(async () => {
      try {
        const results = await searchUsers({
          query: searchQuery,
          currentUserId: user.uid,
          limitCount: 10,
        });
        
        // Filter out already selected participants
        const filteredResults = results.filter(profile => 
          !selectedParticipants.includes(profile.userId) && 
          profile.userId !== user.uid
        );
        
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Error searching users:', error);
      }
    }, 300);
    
    return () => clearTimeout(searchTimeout);
  }, [searchQuery, user, selectedParticipants]);

  const initializeExistingGroup = async () => {
    if (!user || !groupId) {
      setLoading(false);
      return;
    }
    
    console.log('🔄 Initializing existing group chat...', { groupId });
    
    try {
      setError(null);
      setLoading(true);
      setChatId(groupId);
      console.log('✅ Group chat initialization completed');
    } catch (error) {
      console.error('❌ Error initializing group chat:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to initialize group chat: ${errorMessage}`);
      setLoading(false);
    }
  };

  const loadParticipantProfiles = async (participantIds?: string[]) => {
    if (!user) return;
    
    const ids = participantIds || selectedParticipants;
    if (ids.length === 0) return;
    
    console.log('👥 Loading participant profiles...', { participantIds: ids });
    
    try {
      const profiles = await Promise.all(
        ids.map(id => getPublicProfile(id))
      );
      
      const profileMap: { [userId: string]: PublicProfile } = {};
      profiles.forEach((profile, index) => {
        if (profile) {
          profileMap[ids[index]] = profile;
        }
      });
      
      setParticipantProfiles(prev => ({ ...prev, ...profileMap }));
      console.log('✅ Participant profiles loaded');
    } catch (error) {
      console.error('❌ Error loading participant profiles:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim() || selectedParticipants.length === 0) {
      setError('Please provide a group name and select at least one participant');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    console.log('🔄 Creating group chat...', { 
      groupName, 
      participantCount: selectedParticipants.length 
    });
    
    try {
      const newGroupId = await createGroupChat({
        creatorId: user.uid,
        name: groupName,
        description: groupDescription,
        participantIds: selectedParticipants,
        isEncrypted: true,
        avatar: groupAvatar || undefined,
      });
      
      console.log('✅ Group chat created successfully:', { groupId: newGroupId });
      
      setChatId(newGroupId);
      setIsCreatingGroup(false);
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Error creating group chat:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to create group: ${errorMessage}`);
      setLoading(false);
    }
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSendMessage = async () => {
    if (!user || (!newMessage.trim() && !selectedFile) || !chatId || isCreatingGroup) {
      return;
    }

    setSending(true);
    setError(null);
    const messageContent = newMessage.trim();
    const fileToSend = selectedFile;
    
    // Clear input immediately for better UX
    setNewMessage('');
    setSelectedFile(null);
    
    console.log('📤 Sending group message...', { 
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

      console.log('✅ Group message sent successfully:', { messageId });

      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        await setTypingStatus({
          chatId,
          userId: user.uid,
          isTyping: false,
        });
      }

      inputRef.current?.focus();
      
    } catch (error) {
      console.error('❌ Error sending group message:', error);
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
    
    if (!chatId || !user || isCreatingGroup) return;
    
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
    
    // Clear typing after 3 seconds
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
      if (isCreatingGroup) {
        handleCreateGroup();
      } else {
        handleSendMessage();
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Avatar size must be less than 5MB');
        return;
      }
      setGroupAvatar(file);
    }
  };

  const handleReactionClick = async (messageId: string, reactionType: ReactionType) => {
    if (!user || !chatId) return;
    
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;
      
      const userReaction = message.reactions[user.uid];
      
      if (userReaction === reactionType) {
        await removeReaction({ chatId, messageId, userId: user.uid });
      } else {
        await addReaction({ chatId, messageId, userId: user.uid, reactionType });
      }
      
      setShowReactionPicker(null);
    } catch (error) {
      console.error('❌ Error handling reaction:', error);
    }
  };

  const handleAddParticipant = async (userId: string) => {
    if (!user || !chatId || !chat) return;
    
    try {
      await addParticipantsToGroup({
        chatId,
        addedBy: user.uid,
        participantIds: [userId],
      });
      
      setShowParticipantSearch(false);
      setSearchQuery('');
    } catch (error) {
      console.error('❌ Error adding participant:', error);
      setError('Failed to add participant');
    }
  };

  const handleRemoveParticipant = async (userId: string) => {
    if (!user || !chatId) return;
    
    const isLeaving = userId === user.uid;
    const confirmMessage = isLeaving 
      ? 'Are you sure you want to leave this group?' 
      : `Remove ${participantProfiles[userId]?.name || 'this user'} from the group?`;
    
    if (!confirm(confirmMessage)) return;
    
    try {
      await removeParticipantFromGroup({
        chatId,
        removedBy: user.uid,
        participantId: userId,
      });
      
      if (isLeaving && onClose) {
        onClose();
      }
    } catch (error) {
      console.error('❌ Error removing participant:', error);
      setError('Failed to remove participant');
    }
  };

  const getTypingText = () => {
    if (typingUsers.length === 0) return '';
    
    const typingNames = typingUsers
      .slice(0, 2)
      .map(userId => participantProfiles[userId]?.name || 'Someone')
      .join(', ');
    
    if (typingUsers.length === 1) {
      return `${typingNames} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingNames} are typing...`;
    } else {
      return `${typingNames} and ${typingUsers.length - 2} others are typing...`;
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const isOwnMessage = message.senderId === user?.uid;
    const senderProfile = participantProfiles[message.senderId];
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
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            {senderProfile?.avatar ? (
              <img 
                src={senderProfile.avatar} 
                alt={senderProfile.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span className="text-white font-bold text-xs">
                {senderProfile?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            )}
          </div>
        )}
        
        {/* Spacer for grouped messages */}
        {!isOwnMessage && !showSender && <div className="w-8"></div>}
        
        <div className={`flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg ${isOwnMessage ? 'flex justify-end' : ''}`}>
          {/* Sender name for group messages */}
          {!isOwnMessage && showSender && (
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 px-2">
              {senderProfile?.name || 'Unknown User'}
            </p>
          )}
          
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
              {/* Message content rendering (same as DirectMessage) */}
              {message.type === 'text' && (
                <p className="whitespace-pre-wrap break-words leading-relaxed">
                  {message.content}
                </p>
              )}
              
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
                    <span className="text-xs">
                      Read by {Object.keys(message.readBy).length - 1}
                    </span>
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

  // Group creation UI
  if (isCreatingGroup) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Group Chat</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}
          
          {/* Group Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                {groupAvatar ? (
                  <img src={URL.createObjectURL(groupAvatar)} alt="Group avatar" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="hidden"
              />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Group Avatar</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload an image</p>
            </div>
          </div>
          
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              maxLength={50}
            />
          </div>
          
          {/* Group Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="What's this group about?"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
              rows={3}
              maxLength={200}
            />
          </div>
          
          {/* Selected Participants */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Participants ({selectedParticipants.length})
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedParticipants.map(userId => {
                const profile = participantProfiles[userId];
                return (
                  <div key={userId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        {profile?.avatar ? (
                          <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-bold text-xs">
                            {profile?.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {profile?.name || 'Unknown User'}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedParticipants(prev => prev.filter(id => id !== userId))}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
                    >
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (onClose) onClose();
              }}
              className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedParticipants.length === 0 || loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </div>
              ) : (
                'Create Group'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading group chat...</p>
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
            Group Chat Error
          </h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              if (groupId) {
                initializeExistingGroup();
              }
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
      {/* Group Chat Header */}
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
              {chat?.avatar ? (
                <img 
                  src={chat.avatar} 
                  alt={chat.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
              {chat?.name || 'Group Chat'}
            </h3>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {typingUsers.length > 0 ? (
                  <span className="flex items-center gap-1">
                    <span className="flex gap-1">
                      <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce"></span>
                      <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                      <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    </span>
                    {getTypingText()}
                  </span>
                ) : (
                  `${Object.keys(chat?.participants || {}).length} members`
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
            onClick={() => setShowGroupSettings(!showGroupSettings)}
            className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition"
            title="Group Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Welcome to {chat?.name}!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Start the conversation with your group members.
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
              placeholder={`Message ${chat?.name || 'group'}...`}
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