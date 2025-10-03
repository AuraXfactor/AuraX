// Simple Request System
// A lightweight friend request system that works with the existing chat structure

import { 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface SimpleRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromName: string;
  toName: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  createdAt: any;
  updatedAt?: any;
}

// Send a friend request
export async function sendFriendRequest(params: {
  fromUserId: string;
  toUserId: string;
  fromName: string;
  toName: string;
  message?: string;
}): Promise<string> {
  const { fromUserId, toUserId, fromName, toName, message } = params;
  
  try {
    console.log('📤 Sending friend request:', { fromUserId, toUserId });
    
    // Check if request already exists
    const existingQuery = query(
      collection(db, 'friendRequests'),
      where('fromUserId', '==', fromUserId),
      where('toUserId', '==', toUserId)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      throw new Error('Friend request already exists');
    }
    
    // Create friend request
    const requestRef = await addDoc(collection(db, 'friendRequests'), {
      fromUserId,
      toUserId,
      fromName,
      toName,
      status: 'pending',
      message: message || '',
      createdAt: serverTimestamp(),
    });
    
    console.log('✅ Friend request sent:', requestRef.id);
    return requestRef.id;
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
}

// Get friend requests for a user
export async function getFriendRequests(userId: string): Promise<{
  received: SimpleRequest[];
  sent: SimpleRequest[];
  accepted: SimpleRequest[];
  declined: SimpleRequest[];
}> {
  try {
    console.log('🔄 Loading friend requests for user:', userId);
    
    // Get received requests
    const receivedQuery = query(
      collection(db, 'friendRequests'),
      where('toUserId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const receivedSnapshot = await getDocs(receivedQuery);
    const received: SimpleRequest[] = receivedSnapshot.docs.map(doc => ({
      ...doc.data() as SimpleRequest,
      id: doc.id,
    }));
    
    // Get sent requests
    const sentQuery = query(
      collection(db, 'friendRequests'),
      where('fromUserId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const sentSnapshot = await getDocs(sentQuery);
    const sent: SimpleRequest[] = sentSnapshot.docs.map(doc => ({
      ...doc.data() as SimpleRequest,
      id: doc.id,
    }));
    
    // Filter by status
    const accepted = received.filter(req => req.status === 'accepted');
    const declined = received.filter(req => req.status === 'declined');
    
    console.log('✅ Friend requests loaded:', { 
      received: received.length, 
      sent: sent.length, 
      accepted: accepted.length, 
      declined: declined.length 
    });
    
    return { received, sent, accepted, declined };
  } catch (error) {
    console.error('Error loading friend requests:', error);
    return { received: [], sent: [], accepted: [], declined: [] };
  }
}

// Respond to a friend request
export async function respondToFriendRequest(params: {
  requestId: string;
  response: 'accepted' | 'declined';
  responderUserId: string;
}): Promise<void> {
  const { requestId, response, responderUserId } = params;
  
  try {
    console.log('📝 Responding to friend request:', { requestId, response });
    
    const requestRef = doc(db, 'friendRequests', requestId);
    
    // Update request status
    await updateDoc(requestRef, {
      status: response,
      updatedAt: serverTimestamp(),
    });
    
    if (response === 'accepted') {
      // Get request details
      const requestDoc = await getDoc(requestRef);
      if (!requestDoc.exists()) {
        throw new Error('Friend request not found');
      }
      
      const requestData = requestDoc.data() as SimpleRequest;
      
      // Create a simple chat between the users
      // This will make them appear as friends in the chat system
      const sortedUserIds = [requestData.fromUserId, requestData.toUserId].sort();
      const chatId = `dm_${sortedUserIds[0]}_${sortedUserIds[1]}`;
      
      // Check if chat already exists
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (!chatDoc.exists()) {
        // Create a simple chat
        await updateDoc(chatRef, {
          id: chatId,
          type: 'direct',
          participants: {
            [requestData.fromUserId]: {
              userId: requestData.fromUserId,
              role: 'member',
              joinedAt: serverTimestamp(),
            },
            [requestData.toUserId]: {
              userId: requestData.toUserId,
              role: 'member',
              joinedAt: serverTimestamp(),
            },
          },
          createdBy: requestData.fromUserId,
          createdAt: serverTimestamp(),
          lastActivity: serverTimestamp(),
          messageCount: 0,
          isEncrypted: false,
          settings: {
            allowInvites: false,
            showTypingIndicators: true,
            allowReactions: true,
            autoDeleteMessages: false,
          },
        });
        
        console.log('✅ Chat created for new friends:', chatId);
      }
    }
    
    console.log('✅ Friend request responded:', response);
    
    // Trigger fam update event
    const event = new CustomEvent('famUpdated', {
      detail: { action: response === 'accepted' ? 'memberAdded' : 'requestDeclined' }
    });
    window.dispatchEvent(event);
    
  } catch (error) {
    console.error('Error responding to friend request:', error);
    throw error;
  }
}

// Delete a friend request
export async function deleteFriendRequest(requestId: string): Promise<void> {
  try {
    console.log('🗑️ Deleting friend request:', requestId);
    
    const requestRef = doc(db, 'friendRequests', requestId);
    await deleteDoc(requestRef);
    
    console.log('✅ Friend request deleted');
  } catch (error) {
    console.error('Error deleting friend request:', error);
    throw error;
  }
}