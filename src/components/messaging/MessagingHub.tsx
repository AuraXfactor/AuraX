'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Chat } from '@/lib/messaging';
import ChatList from './ChatList';
import DirectMessageInterface from './DirectMessageInterface';
import GroupChatInterface from './GroupChatInterface';
import { searchUsers, PublicProfile } from '@/lib/socialSystem';
import { profileCache } from '@/lib/profileCache';
import { measurePerformance, debounce } from '@/lib/chatOptimizations';

type ViewMode = 'list' | 'direct' | 'group' | 'new-dm' | 'new-group';

interface MessagingHubProps {
  className?: string;
  initialChatId?: string;
  initialOtherUserId?: string; // For direct message
}

export default function MessagingHub({ 
  className = '',
  initialChatId,
  initialOtherUserId
}: MessagingHubProps) {
  const { user } = useAuth();
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [selectedOtherUserId, setSelectedOtherUserId] = useState<string | null>(initialOtherUserId || null);
  const [isMobile, setIsMobile] = useState(false);
  
  // New DM/Group creation state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicProfile[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle initial parameters
  useEffect(() => {
    if (initialChatId) {
      // TODO: Load specific chat by ID
      setViewMode('direct'); // or 'group' based on chat type
    } else if (initialOtherUserId) {
      setSelectedOtherUserId(initialOtherUserId);
      setViewMode('direct');
    }
  }, [initialChatId, initialOtherUserId]);

  // Debounced search for users when creating new DM/Group
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || !user || viewMode === 'list') {
        setSearchResults([]);
        return;
      }
      
      setSearchLoading(true);
      try {
        const results = await measurePerformance(
          'User Search',
          () => searchUsers({
            query,
            currentUserId: user.uid,
            limitCount: 10,
          })
        );
        
        // Filter out already selected participants
        const filteredResults = results.filter(profile => 
          !selectedParticipants.includes(profile.userId) && 
          profile.userId !== user.uid
        );
        
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300),
    [user, selectedParticipants, viewMode]
  );

  // Search for users when creating new DM/Group
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    if (chat.type === 'direct') {
      // Find the other user in direct chat
      const otherUserId = Object.keys(chat.participants).find(id => id !== user?.uid);
      setSelectedOtherUserId(otherUserId || null);
      setViewMode('direct');
    } else {
      setViewMode('group');
    }
  };

  const handleNewDirectMessage = () => {
    setViewMode('new-dm');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedParticipants([]);
  };

  const handleNewGroupChat = () => {
    setViewMode('new-group');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedParticipants([]);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedChat(null);
    setSelectedOtherUserId(null);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedParticipants([]);
  };

  const handleStartDirectMessage = (userId: string) => {
    setSelectedOtherUserId(userId);
    setViewMode('direct');
  };

  const handleStartGroupChat = (participantIds: string[]) => {
    setSelectedParticipants(participantIds);
    setViewMode('new-group');
  };

  const renderUserSearchResults = () => (
    <div className="p-4">
      {searchLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
        </div>
      ) : searchResults.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {searchQuery.trim() ? 'No users found' : 'Search for users to start chatting'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {searchResults.map(profile => (
            <button
              key={profile.userId}
              onClick={() => {
                if (viewMode === 'new-dm') {
                  handleStartDirectMessage(profile.userId);
                } else if (viewMode === 'new-group') {
                  setSelectedParticipants(prev => [...prev, profile.userId]);
                  setSearchQuery('');
                }
              }}
              className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                {profile.avatar ? (
                  <img 
                    src={profile.avatar} 
                    alt={profile.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-white font-bold text-sm">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              <div className="flex-1 text-left">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {profile.name}
                </h3>
                {profile.username && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{profile.username}
                  </p>
                )}
              </div>
              
              {profile.isOnline && (
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderNewDirectMessage = () => (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleBackToList}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Message</h2>
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
            placeholder="Search for users..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            autoFocus
          />
        </div>
      </div>
      
      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {renderUserSearchResults()}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (viewMode) {
      case 'list':
        return (
          <ChatList
            onChatSelect={handleChatSelect}
            onNewDirectMessage={handleNewDirectMessage}
            onNewGroupChat={handleNewGroupChat}
            selectedChatId={selectedChat?.id}
          />
        );
      
      case 'direct':
        if (!selectedOtherUserId) {
          return renderNewDirectMessage();
        }
        return (
          <DirectMessageInterface
            otherUserId={selectedOtherUserId}
            onClose={isMobile ? handleBackToList : undefined}
          />
        );
      
      case 'group':
        if (!selectedChat?.id) {
          return (
            <GroupChatInterface
              initialParticipants={selectedParticipants}
              onClose={isMobile ? handleBackToList : undefined}
            />
          );
        }
        return (
          <GroupChatInterface
            groupId={selectedChat.id}
            onClose={isMobile ? handleBackToList : undefined}
          />
        );
      
      case 'new-dm':
        return renderNewDirectMessage();
      
      case 'new-group':
        return (
          <GroupChatInterface
            initialParticipants={selectedParticipants}
            onClose={handleBackToList}
          />
        );
      
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-white dark:bg-gray-800 rounded-2xl">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Please log in
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            You need to be logged in to access messaging.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden ${className}`}>
      {/* Desktop: Show chat list on left, content on right */}
      {!isMobile ? (
        <>
          <div className="w-80 border-r border-gray-200 dark:border-gray-700">
            <ChatList
              onChatSelect={handleChatSelect}
              onNewDirectMessage={handleNewDirectMessage}
              onNewGroupChat={handleNewGroupChat}
              selectedChatId={selectedChat?.id}
            />
          </div>
          
          <div className="flex-1">
            {viewMode === 'list' ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Select a chat
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose a conversation from the sidebar to start messaging.
                  </p>
                </div>
              </div>
            ) : (
              renderContent()
            )}
          </div>
        </>
      ) : (
        /* Mobile: Show only current view */
        <div className="flex-1">
          {renderContent()}
        </div>
      )}
    </div>
  );
}