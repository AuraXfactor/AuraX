'use client';
import React from 'react';
import DirectMessageInterface from '@/components/messaging/DirectMessageInterface';
import GroupChatInterface from '@/components/messaging/GroupChatInterface';

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
  // If it's a group chat, use GroupChatInterface
  if (isGroup) {
    return (
      <div className="h-full">
        <GroupChatInterface
          groupId={chatId}
        />
      </div>
    );
  }
  
  // For direct messages, find the other user
  const otherUserId = participants.find(id => id !== chatId) || participants[0] || '';
  
  return (
    <div className="h-full">
      <DirectMessageInterface
        otherUserId={otherUserId}
      />
    </div>
  );
}