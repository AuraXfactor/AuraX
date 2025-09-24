import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  query,
  serverTimestamp,
  updateDoc,
  getDoc,
  getDocs,
  where,
  Timestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AuraSquad, getAuraStatsRef, awardAuraPoints } from './auraPoints';

// Re-export AuraSquad for external use
export type { AuraSquad };

// Squad Challenge Templates
const SQUAD_CHALLENGE_TEMPLATES = [
  {
    id: 'meditation_minutes',
    title: 'Squad Meditation Marathon',
    description: 'Collectively meditate for 300 minutes this week',
    target: 300, // minutes
    reward: 200, // points to split
    type: 'meditation_minutes' as const,
    duration: 7, // days
  },
  {
    id: 'journal_entries',
    title: 'Squad Journal Sprint',
    description: 'Write 35 journal entries together this week',
    target: 35, // entries
    reward: 350, // points to split
    type: 'journal_entries' as const,
    duration: 7,
  },
  {
    id: 'aura_posts',
    title: 'Squad Sharing Spree',
    description: 'Share 20 Aura posts together this week',
    target: 20, // posts
    reward: 150, // points to split
    type: 'aura_posts' as const,
    duration: 7,
  },
  {
    id: 'friend_support',
    title: 'Squad Support Squad',
    description: 'Support 50 friends together this week',
    target: 50, // support actions
    reward: 250, // points to split
    type: 'friend_support' as const,
    duration: 7,
  },
  {
    id: 'consistency_challenge',
    title: 'Squad Consistency Challenge',
    description: 'Every member completes 3 activities daily for 5 days',
    target: 5, // days
    reward: 400, // points to split
    type: 'journal_entries' as const, // uses journal as base activity
    duration: 7,
  },
];

// Create a new Aura Squad
export async function createAuraSquad(params: {
  creator: User;
  name: string;
  description: string;
  isPrivate?: boolean;
  initialMembers?: string[]; // UIDs to invite
}): Promise<string> {
  const { creator, name, description, isPrivate = true, initialMembers = [] } = params;
  
  try {
    const squadData = {
      name,
      description,
      members: [creator.uid, ...initialMembers],
      admins: [creator.uid],
      totalPoints: 0,
      achievements: [],
      level: 1,
      isPrivate,
      createdAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'auraSquads'), squadData);
    
    // Update creator's stats to include this squad
    const creatorStatsRef = getAuraStatsRef(creator.uid);
    await updateDoc(creatorStatsRef, {
      joinedSquads: arrayUnion(docRef.id),
    });
    
    // Update initial members' stats
    for (const memberUid of initialMembers) {
      const memberStatsRef = getAuraStatsRef(memberUid);
      await updateDoc(memberStatsRef, {
        joinedSquads: arrayUnion(docRef.id),
      });
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating Aura Squad:', error);
    throw error;
  }
}

// Join a squad (for public squads or via invitation)
export async function joinSquad(user: User, squadId: string): Promise<{ success: boolean; message: string }> {
  try {
    const squadRef = doc(db, 'auraSquads', squadId);
    const squadDoc = await getDoc(squadRef);
    
    if (!squadDoc.exists()) {
      return { success: false, message: 'Squad not found' };
    }
    
    const squad = squadDoc.data() as AuraSquad;
    
    if (squad.members.includes(user.uid)) {
      return { success: false, message: 'Already a member of this squad' };
    }
    
    if (squad.members.length >= 8) {
      return { success: false, message: 'Squad is full (max 8 members)' };
    }
    
    const batch = writeBatch(db);
    
    // Add user to squad
    batch.update(squadRef, {
      members: arrayUnion(user.uid),
      lastActivity: serverTimestamp(),
    });
    
    // Update user's stats
    const userStatsRef = getAuraStatsRef(user.uid);
    batch.update(userStatsRef, {
      joinedSquads: arrayUnion(squadId),
    });
    
    await batch.commit();
    
    return { success: true, message: `Welcome to ${squad.name}! 🎉` };
  } catch (error) {
    console.error('Error joining squad:', error);
    return { success: false, message: 'Failed to join squad' };
  }
}

// Leave a squad
export async function leaveSquad(user: User, squadId: string): Promise<{ success: boolean; message: string }> {
  try {
    const squadRef = doc(db, 'auraSquads', squadId);
    const squadDoc = await getDoc(squadRef);
    
    if (!squadDoc.exists()) {
      return { success: false, message: 'Squad not found' };
    }
    
    const squad = squadDoc.data() as AuraSquad;
    
    if (!squad.members.includes(user.uid)) {
      return { success: false, message: 'Not a member of this squad' };
    }
    
    const batch = writeBatch(db);
    
    // Remove user from squad
    batch.update(squadRef, {
      members: arrayRemove(user.uid),
      admins: arrayRemove(user.uid), // Remove from admins too if they were one
      lastActivity: serverTimestamp(),
    });
    
    // Update user's stats
    const userStatsRef = getAuraStatsRef(user.uid);
    batch.update(userStatsRef, {
      joinedSquads: arrayRemove(squadId),
    });
    
    await batch.commit();
    
    return { success: true, message: `Left ${squad.name}` };
  } catch (error) {
    console.error('Error leaving squad:', error);
    return { success: false, message: 'Failed to leave squad' };
  }
}

// Start a squad challenge
export async function startSquadChallenge(
  adminUser: User,
  squadId: string,
  challengeTemplateId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const squadRef = doc(db, 'auraSquads', squadId);
    const squadDoc = await getDoc(squadRef);
    
    if (!squadDoc.exists()) {
      return { success: false, message: 'Squad not found' };
    }
    
    const squad = squadDoc.data() as AuraSquad;
    
    if (!squad.admins.includes(adminUser.uid)) {
      return { success: false, message: 'Only squad admins can start challenges' };
    }
    
    if (squad.currentChallenge) {
      return { success: false, message: 'Squad already has an active challenge' };
    }
    
    const template = SQUAD_CHALLENGE_TEMPLATES.find(t => t.id === challengeTemplateId);
    if (!template) {
      return { success: false, message: 'Challenge template not found' };
    }
    
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + template.duration);
    
    const challenge = {
      id: `${squadId}_${Date.now()}`,
      title: template.title,
      description: template.description,
      target: template.target,
      currentProgress: 0,
      reward: template.reward,
      deadline: Timestamp.fromDate(deadline),
      type: template.type,
    };
    
    await updateDoc(squadRef, {
      currentChallenge: challenge,
      lastActivity: serverTimestamp(),
    });
    
    return { success: true, message: `${template.title} challenge started! 🚀` };
  } catch (error) {
    console.error('Error starting squad challenge:', error);
    return { success: false, message: 'Failed to start challenge' };
  }
}

// Update squad challenge progress
export async function updateSquadChallengeProgress(
  userUid: string,
  activityType: string,
  value: number = 1
): Promise<void> {
  try {
    // Get user's squads
    const userStatsDoc = await getDoc(getAuraStatsRef(userUid));
    if (!userStatsDoc.exists()) return;
    
    const userStats = userStatsDoc.data();
    const squadIds = userStats.joinedSquads || [];
    
    for (const squadId of squadIds) {
      const squadRef = doc(db, 'auraSquads', squadId);
      const squadDoc = await getDoc(squadRef);
      
      if (!squadDoc.exists()) continue;
      
      const squad = squadDoc.data() as AuraSquad;
      const challenge = squad.currentChallenge;
      
      if (!challenge || new Date() > challenge.deadline.toDate()) continue;
      
      // Check if this activity contributes to the challenge
      let contributes = false;
      let progressToAdd = 0;
      
      switch (challenge.type) {
        case 'meditation_minutes':
          if (activityType === 'meditation_complete') {
            contributes = true;
            progressToAdd = value; // minutes meditated
          }
          break;
        case 'journal_entries':
          if (activityType === 'journal_entry') {
            contributes = true;
            progressToAdd = 1;
          }
          break;
        case 'aura_posts':
          if (activityType === 'aura_post') {
            contributes = true;
            progressToAdd = 1;
          }
          break;
        case 'friend_support':
          if (activityType === 'friend_support') {
            contributes = true;
            progressToAdd = 1;
          }
          break;
      }
      
      if (!contributes) continue;
      
      const newProgress = challenge.currentProgress + progressToAdd;
      const completed = newProgress >= challenge.target;
      
      // Update challenge progress
      const updateData: Record<string, unknown> = {
        'currentChallenge.currentProgress': newProgress,
        lastActivity: serverTimestamp(),
      };
      
      if (completed) {
        // Challenge completed! Award points to all members
        updateData.currentChallenge = null; // Remove the challenge
        updateData.totalPoints = squad.totalPoints + challenge.reward;
        updateData.achievements = arrayUnion(challenge.id);
        
        // Award points to each member
        const pointsPerMember = Math.floor(challenge.reward / squad.members.length);
        for (const memberUid of squad.members) {
          const user = { uid: memberUid } as User;
          await awardAuraPoints({
            user,
            activity: 'group_challenge',
            description: `🏆 Squad "${squad.name}" completed ${challenge.title}!`,
            squadId,
          });
        }
      }
      
      await updateDoc(squadRef, updateData);
    }
  } catch (error) {
    console.error('Error updating squad challenge progress:', error);
  }
}

// Get squad leaderboards
export async function getSquadLeaderboards(): Promise<{
  topSquads: Array<AuraSquad & { rank: number }>;
  categories: {
    mostPoints: AuraSquad[];
    mostActive: AuraSquad[];
    longestStreak: AuraSquad[];
  };
}> {
  try {
    // Get top squads by total points
    const topSquadsQuery = query(
      collection(db, 'auraSquads'),
      orderBy('totalPoints', 'desc'),
      limit(10)
    );
    
    const topSquadsSnapshot = await getDocs(topSquadsQuery);
    const topSquads = topSquadsSnapshot.docs.map((doc, index) => ({
      id: doc.id,
      rank: index + 1,
      ...doc.data(),
    })) as Array<AuraSquad & { rank: number }>;
    
    // Get most active squads (by recent activity)
    const mostActiveQuery = query(
      collection(db, 'auraSquads'),
      orderBy('lastActivity', 'desc'),
      limit(5)
    );
    
    const mostActiveSnapshot = await getDocs(mostActiveQuery);
    const mostActive = mostActiveSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as AuraSquad[];
    
    return {
      topSquads,
      categories: {
        mostPoints: topSquads.slice(0, 5),
        mostActive,
        longestStreak: [], // Would need to implement streak tracking
      },
    };
  } catch (error) {
    console.error('Error getting squad leaderboards:', error);
    return {
      topSquads: [],
      categories: {
        mostPoints: [],
        mostActive: [],
        longestStreak: [],
      },
    };
  }
}

// Get user's squads
export async function getUserSquads(userUid: string): Promise<AuraSquad[]> {
  try {
    const squadsQuery = query(
      collection(db, 'auraSquads'),
      where('members', 'array-contains', userUid),
      orderBy('lastActivity', 'desc')
    );
    
    const snapshot = await getDocs(squadsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as AuraSquad[];
  } catch (error) {
    console.error('Error getting user squads:', error);
    return [];
  }
}

// Search for public squads to join
export async function searchPublicSquads(searchTerm: string = ''): Promise<AuraSquad[]> {
  try {
    let squadsQuery;
    
    if (searchTerm) {
      squadsQuery = query(
        collection(db, 'auraSquads'),
        where('isPrivate', '==', false),
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff'),
        orderBy('name'),
        limit(20)
      );
    } else {
      squadsQuery = query(
        collection(db, 'auraSquads'),
        where('isPrivate', '==', false),
        orderBy('totalPoints', 'desc'),
        limit(20)
      );
    }
    
    const snapshot = await getDocs(squadsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as AuraSquad[];
  } catch (error) {
    console.error('Error searching public squads:', error);
    return [];
  }
}

// Get squad details with member info
export async function getSquadDetails(squadId: string): Promise<{
  squad: AuraSquad | null;
  memberStats: Array<{
    uid: string;
    name?: string;
    avatar?: string;
    points: number;
    contribution: number;
  }>;
}> {
  try {
    const squadDoc = await getDoc(doc(db, 'auraSquads', squadId));
    
    if (!squadDoc.exists()) {
      return { squad: null, memberStats: [] };
    }
    
    const squad = { id: squadDoc.id, ...squadDoc.data() } as AuraSquad;
    
    // Get member stats
    const memberStats = [];
    for (const memberUid of squad.members) {
      const memberStatsDoc = await getDoc(getAuraStatsRef(memberUid));
      const userDoc = await getDoc(doc(db, 'users', memberUid));
      
      const stats = memberStatsDoc.exists() ? memberStatsDoc.data() : null;
      const user = userDoc.exists() ? userDoc.data() : null;
      
      memberStats.push({
        uid: memberUid,
        name: user?.name || user?.email || 'Anonymous',
        avatar: user?.avatar,
        points: stats?.totalPoints || 0,
        contribution: Math.round((stats?.totalPoints || 0) / Math.max(squad.totalPoints, 1) * 100),
      });
    }
    
    // Sort by contribution
    memberStats.sort((a, b) => b.points - a.points);
    
    return { squad, memberStats };
  } catch (error) {
    console.error('Error getting squad details:', error);
    return { squad: null, memberStats: [] };
  }
}

// Listen to squad updates
export function listenToSquad(squadId: string, callback: (squad: AuraSquad | null) => void) {
  return onSnapshot(doc(db, 'auraSquads', squadId), (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as AuraSquad);
    } else {
      callback(null);
    }
  });
}

// Auto-complete expired challenges
export async function processExpiredChallenges(): Promise<void> {
  try {
    const now = Timestamp.now();
    const squadsQuery = query(
      collection(db, 'auraSquads'),
      where('currentChallenge', '!=', null)
    );
    
    const snapshot = await getDocs(squadsQuery);
    const batch = writeBatch(db);
    
    for (const doc of snapshot.docs) {
      const squad = doc.data() as AuraSquad;
      const challenge = squad.currentChallenge;
      
      if (challenge && challenge.deadline < now) {
        // Challenge expired - clear it
        batch.update(doc.ref, {
          currentChallenge: null,
        });
      }
    }
    
    await batch.commit();
  } catch (error) {
    console.error('Error processing expired challenges:', error);
  }
}