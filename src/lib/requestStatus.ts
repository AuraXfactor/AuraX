// Request Status System
// Tracks and manages friend request statuses

import { 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from './firebase';

export interface RequestStatus {
  userId: string;
  status: 'none' | 'sent' | 'received' | 'friends';
  requestId?: string;
}

// Get request status for a user
export async function getRequestStatus(
  currentUserId: string, 
  targetUserId: string
): Promise<RequestStatus> {
  try {
    // Check if already friends
    const friendshipDoc = await getDoc(doc(db, 'friendships', `${currentUserId}_${targetUserId}`));
    if (friendshipDoc.exists()) {
      const friendshipData = friendshipDoc.data();
      if (friendshipData.status === 'accepted') {
        return {
          userId: targetUserId,
          status: 'friends'
        };
      }
    }

    // Check for sent requests
    const sentRequestsSnapshot = await getDocs(
      query(
        collection(db, 'friendRequests'),
        where('fromUserId', '==', currentUserId),
        where('toUserId', '==', targetUserId),
        where('status', '==', 'pending')
      )
    );

    if (!sentRequestsSnapshot.empty) {
      const requestDoc = sentRequestsSnapshot.docs[0];
      return {
        userId: targetUserId,
        status: 'sent',
        requestId: requestDoc.id
      };
    }

    // Check for received requests
    const receivedRequestsSnapshot = await getDocs(
      query(
        collection(db, 'friendRequests'),
        where('fromUserId', '==', targetUserId),
        where('toUserId', '==', currentUserId),
        where('status', '==', 'pending')
      )
    );

    if (!receivedRequestsSnapshot.empty) {
      const requestDoc = receivedRequestsSnapshot.docs[0];
      return {
        userId: targetUserId,
        status: 'received',
        requestId: requestDoc.id
      };
    }

    return {
      userId: targetUserId,
      status: 'none'
    };

  } catch (error) {
    console.error('Error getting request status:', error);
    return {
      userId: targetUserId,
      status: 'none'
    };
  }
}

// Get request statuses for multiple users
export async function getRequestStatuses(
  currentUserId: string, 
  targetUserIds: string[]
): Promise<RequestStatus[]> {
  try {
    const statuses: RequestStatus[] = [];
    
    // Get all friendships
    const friendshipPromises = targetUserIds.map(async (targetUserId) => {
      const friendshipDoc = await getDoc(doc(db, 'friendships', `${currentUserId}_${targetUserId}`));
      if (friendshipDoc.exists()) {
        const friendshipData = friendshipDoc.data();
        if (friendshipData.status === 'accepted') {
          return {
            userId: targetUserId,
            status: 'friends' as const
          };
        }
      }
      return null;
    });

    const friendshipResults = await Promise.all(friendshipPromises);
    
    // Get sent requests
    const sentRequestsSnapshot = await getDocs(
      query(
        collection(db, 'friendRequests'),
        where('fromUserId', '==', currentUserId),
        where('toUserId', 'in', targetUserIds),
        where('status', '==', 'pending')
      )
    );

    const sentRequestsMap = new Map<string, string>();
    sentRequestsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      sentRequestsMap.set(data.toUserId, doc.id);
    });

    // Get received requests
    const receivedRequestsSnapshot = await getDocs(
      query(
        collection(db, 'friendRequests'),
        where('fromUserId', 'in', targetUserIds),
        where('toUserId', '==', currentUserId),
        where('status', '==', 'pending')
      )
    );

    const receivedRequestsMap = new Map<string, string>();
    receivedRequestsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      receivedRequestsMap.set(data.fromUserId, doc.id);
    });

    // Build status array
    for (const targetUserId of targetUserIds) {
      const friendshipResult = friendshipResults.find(result => result?.userId === targetUserId);
      if (friendshipResult) {
        statuses.push(friendshipResult);
        continue;
      }

      if (sentRequestsMap.has(targetUserId)) {
        statuses.push({
          userId: targetUserId,
          status: 'sent',
          requestId: sentRequestsMap.get(targetUserId)
        });
        continue;
      }

      if (receivedRequestsMap.has(targetUserId)) {
        statuses.push({
          userId: targetUserId,
          status: 'received',
          requestId: receivedRequestsMap.get(targetUserId)
        });
        continue;
      }

      statuses.push({
        userId: targetUserId,
        status: 'none'
      });
    }

    return statuses;

  } catch (error) {
    console.error('Error getting request statuses:', error);
    return targetUserIds.map(userId => ({
      userId,
      status: 'none' as const
    }));
  }
}