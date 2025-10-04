// Unified Fam Tracking System
// Complete rebuild of friend tracking as a simple, reliable fam system
// Replaces all existing friend systems with one unified approach

import { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query as firestoreQuery,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  Unsubscribe,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { getPublicProfile } from './socialSystem';

export type FamMember = {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatar?: string;
  joinedAt: any;
  auraPoints: number;
  lastActivity: any;
  isOnline: boolean;
  mutualConnections: number;
  sharedInterests: string[];
  status: 'active' | 'inactive';
};

export type FamRequest = {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromName: string;
  toName: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  createdAt: any;
  updatedAt?: any;
};

export type FamStats = {
  totalMembers: number;
  activeMembers: number;
  totalAuraPoints: number;
  averageAuraPoints: number;
  newMembersThisWeek: number;
  pendingRequests: number;
  sentRequests: number;
  acceptedRequests: number;
  declinedRequests: number;
};

// Get all fam members for a user
export async function getFamMembers(userId: string): Promise<FamMember[]> {
  try {
    console.log('🔄 Loading fam members for user:', userId);
    
    // Get fam members from the unified fam collection
    // Remove orderBy to avoid index issues, we'll sort in memory
    const famQuery = firestoreQuery(
      collection(db, 'famMembers'),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    
    const famSnapshot = await getDocs(famQuery);
    const famMembers: FamMember[] = [];
    
    for (const famDoc of famSnapshot.docs) {
      const famData = famDoc.data();
      console.log('📄 Fam doc data:', famData);
      
      // Handle both old and new data structures
      const member: FamMember = {
        id: famDoc.id,
        userId: famData.userId || userId,
        name: famData.name || famData.famName || 'Unknown',
        username: famData.username || famData.famUsername || 'unknown',
        avatar: famData.avatar || famData.famAvatar || '',
        joinedAt: famData.joinedAt || new Date(),
        auraPoints: famData.auraPoints || 0,
        lastActivity: famData.lastActivity || new Date(),
        isOnline: famData.isOnline || false,
        mutualConnections: famData.mutualConnections || 0,
        sharedInterests: famData.sharedInterests || [],
        status: famData.status || 'active',
      };
      
      famMembers.push(member);
    }
    
    // Sort by joinedAt in memory
    famMembers.sort((a, b) => {
      const aTime = a.joinedAt?.toDate ? a.joinedAt.toDate().getTime() : 0;
      const bTime = b.joinedAt?.toDate ? b.joinedAt.toDate().getTime() : 0;
      return bTime - aTime;
    });
    
    console.log('✅ Fam members loaded:', famMembers.length);
    return famMembers;
  } catch (error) {
    console.error('Error loading fam members:', error);
    return [];
  }
}

// Get fam statistics
export async function getFamStats(userId: string): Promise<FamStats> {
  try {
    const famMembers = await getFamMembers(userId);
    
    const totalMembers = famMembers.length;
    const activeMembers = famMembers.filter(member => member.isOnline).length;
    const totalAuraPoints = famMembers.reduce((sum, member) => sum + member.auraPoints, 0);
    const averageAuraPoints = totalMembers > 0 ? totalAuraPoints / totalMembers : 0;
    
    // Calculate new members this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newMembersThisWeek = famMembers.filter(member => {
      if (!member.joinedAt) return false;
      try {
        const joinedDate = member.joinedAt.toDate ? member.joinedAt.toDate() : new Date(member.joinedAt);
        return joinedDate > oneWeekAgo;
      } catch (error) {
        return false;
      }
    }).length;

    // Get all request counts (pending, sent, received, accepted, declined)
    const [pendingReceivedQuery, pendingSentQuery, allReceivedQuery, allSentQuery] = await Promise.all([
      getDocs(firestoreQuery(
        collection(db, 'famRequests'),
        where('toUserId', '==', userId),
        where('status', '==', 'pending')
      )),
      getDocs(firestoreQuery(
        collection(db, 'famRequests'),
        where('fromUserId', '==', userId),
        where('status', '==', 'pending')
      )),
      getDocs(firestoreQuery(
        collection(db, 'famRequests'),
        where('toUserId', '==', userId)
      )),
      getDocs(firestoreQuery(
        collection(db, 'famRequests'),
        where('fromUserId', '==', userId)
      ))
    ]);

    const pendingRequests = pendingReceivedQuery.docs.length;
    const sentRequests = pendingSentQuery.docs.length;
    
    // Count accepted and declined requests from received requests
    const acceptedRequests = allReceivedQuery.docs.filter(doc => doc.data().status === 'accepted').length;
    const declinedRequests = allReceivedQuery.docs.filter(doc => doc.data().status === 'declined').length;

    return {
      totalMembers,
      activeMembers,
      totalAuraPoints,
      averageAuraPoints,
      newMembersThisWeek,
      pendingRequests,
      sentRequests,
      acceptedRequests,
      declinedRequests,
    };
  } catch (error) {
    console.error('Error loading fam stats:', error);
    return {
      totalMembers: 0,
      activeMembers: 0,
      totalAuraPoints: 0,
      averageAuraPoints: 0,
      newMembersThisWeek: 0,
      pendingRequests: 0,
      sentRequests: 0,
      acceptedRequests: 0,
      declinedRequests: 0,
    };
  }
}

// Send fam request
export async function sendFamRequest(params: {
  fromUserId: string;
  toUserId: string;
  fromName: string;
  toName: string;
  message?: string;
}): Promise<string> {
  const { fromUserId, toUserId, fromName, toName, message } = params;
  
  try {
    console.log('📤 Sending fam request:', { fromUserId, toUserId });
    
    // Prevent self-requests
    if (fromUserId === toUserId) {
      throw new Error('Cannot send fam request to yourself');
    }
    
    // Check if request already exists (any status)
    const existingQuery = firestoreQuery(
      collection(db, 'famRequests'),
      where('fromUserId', '==', fromUserId),
      where('toUserId', '==', toUserId)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      const existingRequest = existingSnapshot.docs[0].data() as FamRequest;
      if (existingRequest.status === 'pending') {
        throw new Error('Fam request already sent');
      } else if (existingRequest.status === 'accepted') {
        throw new Error('Already fam with this user');
      } else if (existingRequest.status === 'declined') {
        throw new Error('Previous fam request was declined');
      }
    }
    
    // Check if already fam members
    const famQuery = firestoreQuery(
      collection(db, 'famMembers'),
      where('userId', '==', fromUserId),
      where('famUserId', '==', toUserId),
      where('status', '==', 'active')
    );
    const famSnapshot = await getDocs(famQuery);
    
    if (!famSnapshot.empty) {
      throw new Error('Already fam with this user');
    }
    
    // Create fam request
    const famRequestRef = await addDoc(collection(db, 'famRequests'), {
      fromUserId,
      toUserId,
      fromName,
      toName,
      status: 'pending',
      message: message || '',
      createdAt: serverTimestamp(),
    });
    
    console.log('✅ Fam request sent:', famRequestRef.id);
    return famRequestRef.id;
  } catch (error) {
    console.error('Error sending fam request:', error);
    throw error;
  }
}

// Respond to fam request
export async function respondToFamRequest(params: {
  requestId: string;
  response: 'accepted' | 'declined';
  responderUserId: string;
}): Promise<void> {
  const { requestId, response, responderUserId } = params;
  
  try {
    console.log('📝 Responding to fam request:', { requestId, response });
    
    const batch = writeBatch(db);
    const requestRef = doc(db, 'famRequests', requestId);
    
    // Get request details first
    const requestDoc = await getDoc(requestRef);
    if (!requestDoc.exists()) {
      throw new Error('Fam request not found');
    }
    
    const requestData = requestDoc.data() as FamRequest;
    
    // Verify the responder is the recipient
    if (requestData.toUserId !== responderUserId) {
      throw new Error('Unauthorized: You can only respond to requests sent to you');
    }
    
    // Update request status
    batch.update(requestRef, {
      status: response,
      updatedAt: serverTimestamp(),
    });
    
    if (response === 'accepted') {
      // Create fam relationship for both users
      const timestamp = serverTimestamp();
      
      // Add to requester's fam list
      const requesterFamRef = doc(collection(db, 'famMembers'));
      batch.set(requesterFamRef, {
        userId: requestData.fromUserId,
        famUserId: requestData.toUserId,
        name: requestData.toName,
        username: requestData.toName.toLowerCase().replace(/\s+/g, ''),
        avatar: '',
        joinedAt: timestamp,
        auraPoints: 0,
        lastActivity: timestamp,
        isOnline: false,
        mutualConnections: 0,
        sharedInterests: [],
        status: 'active',
      });
      
      // Add to responder's fam list
      const responderFamRef = doc(collection(db, 'famMembers'));
      batch.set(responderFamRef, {
        userId: requestData.toUserId,
        famUserId: requestData.fromUserId,
        name: requestData.fromName,
        username: requestData.fromName.toLowerCase().replace(/\s+/g, ''),
        avatar: '',
        joinedAt: timestamp,
        auraPoints: 0,
        lastActivity: timestamp,
        isOnline: false,
        mutualConnections: 0,
        sharedInterests: [],
        status: 'active',
      });

      // ALSO create friendship records in socialSystem structure for compatibility
      // This ensures that both FamList and FriendsList components work
      const friendship1Ref = doc(db, 'friends', requestData.fromUserId, 'friendships', requestData.toUserId);
      const friendship2Ref = doc(db, 'friends', requestData.toUserId, 'friendships', requestData.fromUserId);
      
      batch.set(friendship1Ref, {
        userId: requestData.fromUserId,
        friendId: requestData.toUserId,
        friendSince: timestamp,
        lastInteraction: timestamp,
      });

      batch.set(friendship2Ref, {
        userId: requestData.toUserId,
        friendId: requestData.fromUserId,
        friendSince: timestamp,
        lastInteraction: timestamp,
      });
    }
    
    await batch.commit();
    console.log('✅ Fam request responded:', response);
    
    // Trigger fam update event
    const event = new CustomEvent('famUpdated', {
      detail: { action: response === 'accepted' ? 'memberAdded' : 'requestDeclined' }
    });
    window.dispatchEvent(event);

    // Also trigger friends list refresh for socialSystem compatibility
    if (response === 'accepted') {
      const friendsEvent = new CustomEvent('refreshFriendsList');
      window.dispatchEvent(friendsEvent);
      
      // Trigger immediate UI update for better UX
      setTimeout(() => {
        const immediateUpdate = new CustomEvent('famUpdated', {
          detail: { action: 'immediateUpdate' }
        });
        window.dispatchEvent(immediateUpdate);
      }, 100);
    }
    
  } catch (error) {
    console.error('Error responding to fam request:', error);
    throw error;
  }
}

// Get fam requests
export async function getFamRequests(userId: string): Promise<{
  received: FamRequest[];
  sent: FamRequest[];
  accepted: FamRequest[];
  declined: FamRequest[];
}> {
  try {
    console.log('🔄 Loading fam requests for user:', userId);
    
    // Get received requests (remove orderBy to avoid index issues)
    const receivedQuery = firestoreQuery(
      collection(db, 'famRequests'),
      where('toUserId', '==', userId)
    );
    const receivedSnapshot = await getDocs(receivedQuery);
    const received: FamRequest[] = receivedSnapshot.docs.map((doc: any) => ({
      ...doc.data() as FamRequest,
      id: doc.id,
    }));
    
    // Get sent requests (remove orderBy to avoid index issues)
    const sentQuery = firestoreQuery(
      collection(db, 'famRequests'),
      where('fromUserId', '==', userId)
    );
    const sentSnapshot = await getDocs(sentQuery);
    const sent: FamRequest[] = sentSnapshot.docs.map((doc: any) => ({
      ...doc.data() as FamRequest,
      id: doc.id,
    }));
    
    // Sort in memory by createdAt
    received.sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return bTime - aTime;
    });
    
    sent.sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return bTime - aTime;
    });
    
    // Filter by status for received requests
    const accepted = received.filter(req => req.status === 'accepted');
    const declined = received.filter(req => req.status === 'declined');
    
    console.log('✅ Fam requests loaded:', { 
      received: received.length, 
      sent: sent.length, 
      accepted: accepted.length, 
      declined: declined.length 
    });
    
    return { received, sent, accepted, declined };
  } catch (error) {
    console.error('Error loading fam requests:', error);
    return { received: [], sent: [], accepted: [], declined: [] };
  }
}

// Remove fam member
export async function removeFamMember(params: {
  userId: string;
  famUserId: string;
}): Promise<void> {
  const { userId, famUserId } = params;
  
  try {
    console.log('🗑️ Removing fam member:', { userId, famUserId });
    
    const batch = writeBatch(db);
    
    // Remove from both users' fam lists
    const famQuery1 = firestoreQuery(
      collection(db, 'famMembers'),
      where('userId', '==', userId),
      where('famUserId', '==', famUserId)
    );
    const famSnapshot1 = await getDocs(famQuery1);
    famSnapshot1.docs.forEach((doc: any) => batch.delete(doc.ref));
    
    const famQuery2 = firestoreQuery(
      collection(db, 'famMembers'),
      where('userId', '==', famUserId),
      where('famUserId', '==', userId)
    );
    const famSnapshot2 = await getDocs(famQuery2);
    famSnapshot2.docs.forEach((doc: any) => batch.delete(doc.ref));
    
    await batch.commit();
    console.log('✅ Fam member removed');
    
    // Trigger fam update event
    const event = new CustomEvent('famUpdated', {
      detail: { action: 'memberRemoved' }
    });
    window.dispatchEvent(event);
    
  } catch (error) {
    console.error('Error removing fam member:', error);
    throw error;
  }
}

// Listen to fam changes
export function listenToFamChanges(
  userId: string,
  callback: (members: FamMember[], stats: FamStats) => void
): Unsubscribe {
  const famQuery = firestoreQuery(
    collection(db, 'famMembers'),
    where('userId', '==', userId),
    where('status', '==', 'active')
  );
  
  return onSnapshot(famQuery, async (snapshot: any) => {
    try {
      const members: FamMember[] = snapshot.docs.map((doc: any) => {
        const famData = doc.data();
        console.log('📄 Listener fam doc data:', famData);
        
        // Handle both old and new data structures
        return {
          id: doc.id,
          userId: famData.userId || userId,
          name: famData.name || famData.famName || 'Unknown',
          username: famData.username || famData.famUsername || 'unknown',
          avatar: famData.avatar || famData.famAvatar || '',
          joinedAt: famData.joinedAt || new Date(),
          auraPoints: famData.auraPoints || 0,
          lastActivity: famData.lastActivity || new Date(),
          isOnline: famData.isOnline || false,
          mutualConnections: famData.mutualConnections || 0,
          sharedInterests: famData.sharedInterests || [],
          status: famData.status || 'active',
        } as FamMember;
      });
      
      // Sort by joinedAt in memory
      members.sort((a, b) => {
        const aTime = a.joinedAt?.toDate ? a.joinedAt.toDate().getTime() : 0;
        const bTime = b.joinedAt?.toDate ? b.joinedAt.toDate().getTime() : 0;
        return bTime - aTime;
      });
      
      const stats = await getFamStats(userId);
      callback(members, stats);
    } catch (error) {
      console.error('Error in fam listener:', error);
      callback([], {
        totalMembers: 0,
        activeMembers: 0,
        totalAuraPoints: 0,
        averageAuraPoints: 0,
        newMembersThisWeek: 0,
        pendingRequests: 0,
        sentRequests: 0,
        acceptedRequests: 0,
        declinedRequests: 0,
      });
    }
  });
}

// Search fam members
export function searchFamMembers(
  members: FamMember[],
  query: string
): FamMember[] {
  if (!query.trim()) return members;
  
  const lowercaseQuery = query.toLowerCase();
  return members.filter(member => 
    member.name.toLowerCase().includes(lowercaseQuery) ||
    member.username.toLowerCase().includes(lowercaseQuery) ||
    member.sharedInterests.some(interest => 
      interest.toLowerCase().includes(lowercaseQuery)
    )
  );
}

// Sort fam members
export function sortFamMembers(
  members: FamMember[],
  sortBy: 'name' | 'auraPoints' | 'recent' | 'online'
): FamMember[] {
  return [...members].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'auraPoints':
        return b.auraPoints - a.auraPoints;
      case 'online':
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return 0;
      case 'recent':
      default:
        if (!a.lastActivity || !b.lastActivity) return 0;
        const aTime = a.lastActivity.toDate ? a.lastActivity.toDate().getTime() : 0;
        const bTime = b.lastActivity.toDate ? b.lastActivity.toDate().getTime() : 0;
        return bTime - aTime;
    }
  });
}

// Search public profiles for fam discovery
export async function searchPublicProfiles(query: string): Promise<any[]> {
  try {
    console.log('🔍 Searching public profiles:', query);
    
    // For now, we'll use a simple approach
    // In a real app, you'd want to implement proper search indexing
    const profilesQuery = firestoreQuery(
      collection(db, 'publicProfiles'),
      orderBy('name')
    );
    
    const snapshot = await getDocs(profilesQuery);
    const profiles = snapshot.docs.map((doc: any) => ({
      ...doc.data(),
      uid: doc.id,
    })) as any[];
    
    // Filter by search query
    const lowercaseQuery = query.toLowerCase();
    const filteredProfiles = profiles.filter(profile => 
      profile.name?.toLowerCase().includes(lowercaseQuery) ||
      profile.username?.toLowerCase().includes(lowercaseQuery) ||
      profile.interests?.some((interest: string) => 
        interest.toLowerCase().includes(lowercaseQuery)
      )
    );
    
    console.log('✅ Search results:', filteredProfiles.length);
    return filteredProfiles;
  } catch (error) {
    console.error('Error searching public profiles:', error);
    return [];
  }
}