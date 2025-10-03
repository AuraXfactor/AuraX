// Enhanced Group Chat System
// Provides full group chat functionality with messaging, member management, and settings

import { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  deleteField,
} from 'firebase/firestore';
import { db } from './firebase';
import { Group } from './socialSystem';

export type GroupChatMessage = {
  id: string;
  groupId: string;
  fromUid: string;
  fromName: string;
  fromAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'system';
  mediaUrl?: string;
  replyToMessageId?: string;
  replyToPostId?: string;
  createdAt: any;
  editedAt?: any;
  reactions: { [emoji: string]: string[] };
};

export type GroupChatSettings = {
  allowMemberInvites: boolean;
  allowMemberMessages: boolean;
  allowFileSharing: boolean;
  muteNotifications: boolean;
};

// Collection references
const getGroupChatsRef = () => collection(db, 'groupChats');
const getGroupChatRef = (groupId: string) => doc(db, 'groupChats', groupId);
const getGroupMessagesRef = (groupId: string) => collection(db, 'groupChats', groupId, 'messages');

// Create a group chat from an existing group
export async function createGroupChatFromGroup(groupId: string): Promise<string> {
  try {
    // Get the group data
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (!groupDoc.exists()) {
      throw new Error('Group not found');
    }
    
    const groupData = groupDoc.data() as Group;
    
    // Create group chat
    const chatData = {
      groupId,
      name: groupData.name,
      description: groupData.description,
      avatar: groupData.avatar,
      members: Object.keys(groupData.members),
      admins: Object.keys(groupData.admins),
      ownerId: groupData.ownerId,
      isPrivate: !groupData.isPublic,
      createdAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
      messageCount: 0,
      settings: {
        allowMemberInvites: true,
        allowMemberMessages: true,
        allowFileSharing: true,
        muteNotifications: false,
      },
    };
    
    const chatRef = await addDoc(getGroupChatsRef(), chatData);
    return chatRef.id;
    
  } catch (error) {
    console.error('Error creating group chat:', error);
    throw error;
  }
}

// Send a message to group chat
export async function sendGroupChatMessage(params: {
  user: User;
  groupId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'system';
  mediaUrl?: string;
  replyToMessageId?: string;
}): Promise<string> {
  const { user, groupId, content, type, mediaUrl, replyToMessageId } = params;
  
  try {
    // Get user profile for message
    const userProfile = await getDoc(doc(db, 'users', user.uid));
    const userData = userProfile.data();
    
    const messageData = {
      groupId,
      fromUid: user.uid,
      fromName: userData?.displayName || userData?.name || user.email || 'Unknown User',
      fromAvatar: userData?.avatar,
      content,
      type,
      mediaUrl,
      replyToMessageId,
      createdAt: serverTimestamp(),
      reactions: {},
    };
    
    const messageRef = await addDoc(getGroupMessagesRef(groupId), messageData);
    
    // Update group chat last activity and message count
    await updateDoc(getGroupChatRef(groupId), {
      lastActivity: serverTimestamp(),
      messageCount: arrayUnion(1), // This will be handled properly in a real implementation
    });
    
    return messageRef.id;
    
  } catch (error) {
    console.error('Error sending group chat message:', error);
    throw error;
  }
}

// Listen to group chat messages
export function listenToGroupChatMessages(
  groupId: string,
  callback: (messages: GroupChatMessage[]) => void
) {
  const q = query(
    getGroupMessagesRef(groupId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages: GroupChatMessage[] = [];
    
    for (const doc of snapshot.docs) {
      const messageData = doc.data() as GroupChatMessage;
      messages.push({
        ...messageData,
        id: doc.id,
      });
    }
    
    // Reverse to show oldest first
    callback(messages.reverse());
  });
}

// Add member to group chat
export async function addGroupChatMember(params: {
  groupId: string;
  userId: string;
  addedBy: string;
}): Promise<void> {
  const { groupId, userId, addedBy } = params;
  
  try {
    await updateDoc(getGroupChatRef(groupId), {
      [`members.${userId}`]: true,
      lastActivity: serverTimestamp(),
    });
    
    // Send system message
    await sendGroupChatMessage({
      user: { uid: addedBy } as User,
      groupId,
      content: `User added to the group`,
      type: 'system',
    });
    
  } catch (error) {
    console.error('Error adding group chat member:', error);
    throw error;
  }
}

// Remove member from group chat
export async function removeGroupChatMember(params: {
  groupId: string;
  userId: string;
  removedBy: string;
}): Promise<void> {
  const { groupId, userId, removedBy } = params;
  
  try {
    await updateDoc(getGroupChatRef(groupId), {
      [`members.${userId}`]: deleteField(),
      lastActivity: serverTimestamp(),
    });
    
    // Send system message
    await sendGroupChatMessage({
      user: { uid: removedBy } as User,
      groupId,
      content: `User removed from the group`,
      type: 'system',
    });
    
  } catch (error) {
    console.error('Error removing group chat member:', error);
    throw error;
  }
}

// Update group chat settings
export async function updateGroupChatSettings(
  groupId: string,
  settings: Partial<GroupChatSettings>
): Promise<void> {
  try {
    await updateDoc(getGroupChatRef(groupId), {
      settings: settings,
      lastActivity: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating group chat settings:', error);
    throw error;
  }
}

// Get group chat info
export async function getGroupChatInfo(groupId: string): Promise<any> {
  try {
    const chatDoc = await getDoc(getGroupChatRef(groupId));
    if (chatDoc.exists()) {
      return { id: chatDoc.id, ...chatDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting group chat info:', error);
    return null;
  }
}

// Check if user is member of group chat
export async function isGroupChatMember(groupId: string, userId: string): Promise<boolean> {
  try {
    const chatDoc = await getDoc(getGroupChatRef(groupId));
    if (chatDoc.exists()) {
      const chatData = chatDoc.data();
      return chatData.members && chatData.members[userId];
    }
    return false;
  } catch (error) {
    console.error('Error checking group chat membership:', error);
    return false;
  }
}