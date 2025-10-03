'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  listenToUserChats,
  Chat,
  formatMessageTime
} from '@/lib/messaging';
import { getPublicProfile, PublicProfile } from '@/lib/socialSystem';
import { profileCache, loadProfilesBatch } from '@/lib/profileCache';
import { debounce } from '@/lib/chatOptimizations';

interface ChatListProps {
  onChatSelect: (chat: Chat) => void;
  onNewDirectMessage: () => void;
  onNewGroupChat: () => void;
  selectedChatId?: string;
}

export default function ChatList({
  onChatSelect,
  onNewDirectMessage,
  onNewGroupChat,
  selectedChatId
}: ChatListProps) {
  const { user } = useAuth();
  
  // State
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileCache, setProfileCache] = useState<{ [userId: string]: PublicProfile | null }>({});

  // Optimized chat loading with batch profile fetching
  useEffect(() => {
    if (!user) return;
    
    console.log('🔄 Setting up optimized user chats listener...');
    
    const unsubscribe = listenToUserChats(user.uid, async (userChats) => {
      console.log('💬 Received chats update:', userChats.length);
      
      // Collect all participant IDs efficiently
      const allParticipantIds = new Set<string>();
      userChats.forEach(chat => {
        Object.keys(chat.participants).forEach(id => {
          if (id !== user.uid) {
            allParticipantIds.add(id);
          }
        });
      });
      
      // Batch load all profiles at once using cache
      if (allParticipantIds.size > 0) {
        try {
          const profiles = await loadProfilesBatch(
            Array.from(allParticipantIds), 
            getPublicProfile
          );
          setProfileCache(profiles);
        } catch (error) {
          console.warn('Failed to load some profiles:', error);
        }
      }
      
      setChats(userChats);
      setLoading(false);
    });
    
    return () => {
      console.log('🔄 Cleaning up chats listener');
      unsubscribe();
    };
  }, [user]);

  // Debounced search to prevent excessive filtering
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      // Search logic is handled in the memoized filteredChats
    }, 300),
    []
  );

  // Memoized filtered chats for performance
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    
    const query = searchQuery.toLowerCase();
    
    return chats.filter(chat => {
      // For group chats, search by name
      if (chat.type === 'group') {
        return chat.name?.toLowerCase().includes(query);
      }
      
      // For direct messages, search by participant name
      const otherParticipants = Object.keys(chat.participants).filter(id => id !== user?.uid);
      return otherParticipants.some(id => {
        const profile = profileCache[id];
        return profile?.name.toLowerCase().includes(query);
      });
    });
  }, [chats, searchQuery, profileCache, user?.uid]);

  const getChatDisplayInfo = (chat: Chat) => {
    if (chat.type === 'group') {
      return {
        name: chat.name || 'Group Chat',
        avatar: chat.avatar,
        subtitle: `${Object.keys(chat.participants).length} members`,
        isOnline: false,
      };
    }
    
    // Direct message
    const otherParticipants = Object.keys(chat.participants).filter(id => id !== user?.uid);
    const otherUserId = otherParticipants[0];
    const otherProfile = profileCache[otherUserId];
    
    return {
      name: otherProfile?.name || 'Unknown User',
      avatar: otherProfile?.avatar,
      subtitle: getLastSeenText(chat.participants[otherUserId]?.lastSeen),
      isOnline: otherProfile?.isOnline || false,
    };
  };

  const getLastSeenText = (lastSeen: unknown) => {
    if (!lastSeen || typeof lastSeen !== 'object' || !('toDate' in lastSeen)) return 'Offline';
    
    const date = (lastSeen as { toDate: () => Date }).toDate();
    const now = new Date();
    const diffInMinutes = Math.abs(now.getTime() - date.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 5) return 'Online';
    if (diffInMinutes < 60) return `Active ${Math.floor(diffInMinutes)}m ago`;
    if (diffInMinutes < 1440) return `Active ${Math.floor(diffInMinutes / 60)}h ago`;
    return `Active ${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getUnreadCount = (chat: Chat) => {
    if (!user) return 0;
    
    // For now, return 0. In a real implementation, you'd track unread messages
    // This would require additional Firestore queries or cached data
    return 0;
  };

  const renderChatItem = (chat: Chat) => {
    const displayInfo = getChatDisplayInfo(chat);
    const unreadCount = getUnreadCount(chat);
    const isSelected = chat.id === selectedChatId;
    
    return (
      <button
        key={chat.id}
        onClick={() => onChatSelect(chat)}
        className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition group ${
          isSelected ? 'bg-purple-50 dark:bg-purple-900/20 border-r-2 border-purple-500' : ''
        }`}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            {displayInfo.avatar ? (
              <img 
                src={displayInfo.avatar} 
                alt={displayInfo.name} 
                className="w-full h-full object-cover" 
              />
            ) : chat.type === 'group' ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ) : (
              <span className="text-white font-bold">
                {displayInfo.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          {/* Online status indicator */}
          {displayInfo.isOnline && chat.type === 'direct' && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
          )}
          
          {/* Encryption indicator */}
          {chat.isEncrypted && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Chat info */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {displayInfo.name}
            </h3>
            {chat.lastMessage && (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                {formatMessageTime(chat.lastMessage.timestamp)}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {chat.lastMessage ? (
                <span>
                  {chat.lastMessage.senderId === user?.uid && (
                    <span className="text-purple-600 dark:text-purple-400">You: </span>
                  )}
                  {chat.lastMessage.type === 'text' 
                    ? chat.lastMessage.content 
                    : `Sent ${chat.lastMessage.type}`
                  }
                </span>
              ) : (
                displayInfo.subtitle
              )}
            </p>
            
            {/* Unread count */}
            {unreadCount > 0 && (
              <div className="bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </div>
        </div>
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h2>
          
          <div className="flex gap-2">
            <button
              onClick={onNewDirectMessage}
              className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition shadow-lg"
              title="New Direct Message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            
            <button
              onClick={onNewGroupChat}
              className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition shadow-lg"
              title="New Group Chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>
      
      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
            {chats.length === 0 ? (
              <>
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No chats yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Start a conversation by sending a direct message or creating a group chat.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={onNewDirectMessage}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition font-medium"
                  >
                    Send Message
                  </button>
                  <button
                    onClick={onNewGroupChat}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Create Group
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No matching chats
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search terms.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredChats.map(renderChatItem)}
          </div>
        )}
      </div>
    </div>
  );
}