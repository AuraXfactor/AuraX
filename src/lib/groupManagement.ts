// Enhanced Group Management System
// Provides comprehensive group management features including member management, permissions, and settings

import { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteField,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Group } from './socialSystem';

export type GroupPermission = 'everyone' | 'admins_only';
export type GroupRole = 'member' | 'admin' | 'owner';

export interface GroupMember {
  userId: string;
  role: GroupRole;
  joinedAt: any;
  addedBy?: string;
}

export interface GroupSettings {
  messagePermission: GroupPermission;
  invitePermission: GroupPermission;
  allowMemberInvites: boolean;
  allowFileSharing: boolean;
  description?: string;
}

// Add member to group
export async function addGroupMember(params: {
  groupId: string;
  userId: string;
  addedBy: string;
  role?: GroupRole;
}): Promise<void> {
  const { groupId, userId, addedBy, role = 'member' } = params;
  
  try {
    const batch = writeBatch(db);
    const groupRef = doc(db, 'groups', groupId);
    
    // Add to members
    batch.update(groupRef, {
      [`members.${userId}`]: true,
      [`memberRoles.${userId}`]: role,
      [`memberJoinedAt.${userId}`]: serverTimestamp(),
      [`memberAddedBy.${userId}`]: addedBy,
      memberCount: arrayUnion(userId),
      lastActivity: serverTimestamp(),
    });
    
    // If making admin, add to admins
    if (role === 'admin') {
      batch.update(groupRef, {
        [`admins.${userId}`]: true,
      });
    }
    
    await batch.commit();
    
    // Send system message to group chat if it exists
    try {
      const { sendGroupChatMessage } = await import('./groupChatSystem');
      await sendGroupChatMessage({
        user: { uid: addedBy } as User,
        groupId,
        content: `New member added to the group`,
        type: 'system',
      });
    } catch (chatError) {
      console.warn('Could not send system message:', chatError);
    }
    
  } catch (error) {
    console.error('Error adding group member:', error);
    throw error;
  }
}

// Remove member from group
export async function removeGroupMember(params: {
  groupId: string;
  userId: string;
  removedBy: string;
}): Promise<void> {
  const { groupId, userId, removedBy } = params;
  
  try {
    const batch = writeBatch(db);
    const groupRef = doc(db, 'groups', groupId);
    
    // Remove from members and admins
    batch.update(groupRef, {
      [`members.${userId}`]: deleteField(),
      [`memberRoles.${userId}`]: deleteField(),
      [`memberJoinedAt.${userId}`]: deleteField(),
      [`memberAddedBy.${userId}`]: deleteField(),
      [`admins.${userId}`]: deleteField(),
      memberCount: arrayRemove(userId),
      lastActivity: serverTimestamp(),
    });
    
    await batch.commit();
    
    // Send system message to group chat if it exists
    try {
      const { sendGroupChatMessage } = await import('./groupChatSystem');
      await sendGroupChatMessage({
        user: { uid: removedBy } as User,
        groupId,
        content: `Member removed from the group`,
        type: 'system',
      });
    } catch (chatError) {
      console.warn('Could not send system message:', chatError);
    }
    
  } catch (error) {
    console.error('Error removing group member:', error);
    throw error;
  }
}

// Make member admin
export async function makeGroupAdmin(params: {
  groupId: string;
  userId: string;
  promotedBy: string;
}): Promise<void> {
  const { groupId, userId, promotedBy } = params;
  
  try {
    const batch = writeBatch(db);
    const groupRef = doc(db, 'groups', groupId);
    
    batch.update(groupRef, {
      [`admins.${userId}`]: true,
      [`memberRoles.${userId}`]: 'admin',
      lastActivity: serverTimestamp(),
    });
    
    await batch.commit();
    
    // Send system message
    try {
      const { sendGroupChatMessage } = await import('./groupChatSystem');
      await sendGroupChatMessage({
        user: { uid: promotedBy } as User,
        groupId,
        content: `Member promoted to admin`,
        type: 'system',
      });
    } catch (chatError) {
      console.warn('Could not send system message:', chatError);
    }
    
  } catch (error) {
    console.error('Error making group admin:', error);
    throw error;
  }
}

// Remove admin privileges
export async function removeGroupAdmin(params: {
  groupId: string;
  userId: string;
  demotedBy: string;
}): Promise<void> {
  const { groupId, userId, demotedBy } = params;
  
  try {
    const batch = writeBatch(db);
    const groupRef = doc(db, 'groups', groupId);
    
    batch.update(groupRef, {
      [`admins.${userId}`]: deleteField(),
      [`memberRoles.${userId}`]: 'member',
      lastActivity: serverTimestamp(),
    });
    
    await batch.commit();
    
    // Send system message
    try {
      const { sendGroupChatMessage } = await import('./groupChatSystem');
      await sendGroupChatMessage({
        user: { uid: demotedBy } as User,
        groupId,
        content: `Admin privileges removed`,
        type: 'system',
      });
    } catch (chatError) {
      console.warn('Could not send system message:', chatError);
    }
    
  } catch (error) {
    console.error('Error removing group admin:', error);
    throw error;
  }
}

// Update group settings
export async function updateGroupSettings(
  groupId: string,
  settings: Partial<GroupSettings>,
  updatedBy: string
): Promise<void> {
  try {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      ...settings,
      lastActivity: serverTimestamp(),
    });
    
    // Send system message
    try {
      const { sendGroupChatMessage } = await import('./groupChatSystem');
      await sendGroupChatMessage({
        user: { uid: updatedBy } as User,
        groupId,
        content: `Group settings updated`,
        type: 'system',
      });
    } catch (chatError) {
      console.warn('Could not send system message:', chatError);
    }
    
  } catch (error) {
    console.error('Error updating group settings:', error);
    throw error;
  }
}

// Get group members with roles
export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (!groupDoc.exists()) {
      return [];
    }
    
    const groupData = groupDoc.data() as Group;
    const members: GroupMember[] = [];
    
    for (const [userId, isMember] of Object.entries(groupData.members)) {
      if (isMember) {
        const role = groupData.admins?.[userId] ? 'admin' : 'member';
        const isOwner = groupData.ownerId === userId;
        
        members.push({
          userId,
          role: isOwner ? 'owner' : role,
          joinedAt: groupData.memberJoinedAt?.[userId],
          addedBy: groupData.memberAddedBy?.[userId],
        });
      }
    }
    
    return members;
  } catch (error) {
    console.error('Error getting group members:', error);
    return [];
  }
}

// Check if user can send messages
export async function canUserSendMessages(groupId: string, userId: string): Promise<boolean> {
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (!groupDoc.exists()) {
      return false;
    }
    
    const groupData = groupDoc.data() as Group;
    
    // Check if user is a member
    if (!groupData.members[userId]) {
      return false;
    }
    
    // Check message permission
    const messagePermission = groupData.messagePermission || 'everyone';
    
    if (messagePermission === 'everyone') {
      return true;
    }
    
    if (messagePermission === 'admins_only') {
      return groupData.admins?.[userId] || groupData.ownerId === userId;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking message permission:', error);
    return false;
  }
}

// Check if user can invite members
export async function canUserInviteMembers(groupId: string, userId: string): Promise<boolean> {
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (!groupDoc.exists()) {
      return false;
    }
    
    const groupData = groupDoc.data() as Group;
    
    // Check if user is a member
    if (!groupData.members[userId]) {
      return false;
    }
    
    // Check invite permission
    const invitePermission = groupData.invitePermission || 'admins_only';
    
    if (invitePermission === 'everyone') {
      return true;
    }
    
    if (invitePermission === 'admins_only') {
      return groupData.admins?.[userId] || groupData.ownerId === userId;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking invite permission:', error);
    return false;
  }
}