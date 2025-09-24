import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  getDoc,
  getDocs,
  limit,
  where,
  Timestamp,
  writeBatch,
  arrayUnion,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Core Philosophy: Balance intrinsic and extrinsic motivation
// Points celebrate self-care, not replace genuine well-being

// Types for Aura Points System
export type AuraPointActivity = 
  | 'journal_entry'           // +10 pts - Core habit
  | 'streak_7_days'          // +50 pts - Consistency bonus
  | 'meditation_complete'    // +15 pts - Mindfulness
  | 'workout_complete'       // +15 pts - Physical health
  | 'aura_post'             // +5 pts - Social connection
  | 'friend_support'        // +3 pts - Community engagement
  | 'group_challenge'       // Variable - Group activities
  | 'weekly_quest'          // Variable - Special challenges
  | 'daily_streak'          // +5 pts - Daily consistency
  | 'first_time_bonus';     // +20 pts - Trying new features

export interface AuraPointTransaction {
  id: string;
  userUid: string;
  activity: AuraPointActivity;
  points: number;
  description: string;
  proof?: {
    type: 'journal_length' | 'video_completion' | 'streak_count' | 'social_interaction';
    value: number | string;
    metadata?: Record<string, unknown>;
  };
  multiplier?: number; // For squad bonuses, special events
  questId?: string; // If part of a weekly quest
  squadId?: string; // If part of squad challenge
  createdAt: Timestamp | null;
  expiresAt?: Timestamp | null; // For time-limited bonuses
}

export interface UserAuraStats {
  userUid: string;
  totalPoints: number;
  availablePoints: number; // Points not yet spent
  lifetimeEarned: number;
  lifetimeSpent: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string; // YYYY-MM-DD format
  dailyPointsEarned: number; // Resets daily
  weeklyPointsEarned: number; // Resets weekly
  level: number; // Based on lifetime earned
  badges: string[]; // Badge IDs earned
  achievements: string[]; // Achievement IDs unlocked
  joinedSquads: string[]; // Squad IDs user is member of
  preferences: {
    celebrationStyle: 'subtle' | 'enthusiastic' | 'minimal';
    privacyLevel: 'public' | 'friends' | 'private';
    notifications: {
      dailyReminder: boolean;
      streakAlert: boolean;
      questAvailable: boolean;
      squadActivity: boolean;
    };
  };
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface WeeklyQuest {
  id: string;
  title: string;
  description: string;
  requirement: {
    type: 'count' | 'streak' | 'variety' | 'social';
    target: number;
    activities?: AuraPointActivity[];
  };
  reward: {
    points: number;
    badge?: string;
    special?: string; // Special unlock or feature
  };
  duration: {
    startDate: Timestamp;
    endDate: Timestamp;
  };
  participants: string[]; // User UIDs participating
  completions: string[]; // User UIDs who completed
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  isActive: boolean;
  category: 'mindfulness' | 'social' | 'consistency' | 'exploration';
}

export interface AuraSquad {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  members: string[]; // User UIDs (max 8)
  admins: string[]; // User UIDs who can manage squad
  totalPoints: number; // Combined squad points
  currentChallenge?: {
    id: string;
    title: string;
    description: string;
    target: number;
    currentProgress: number;
    reward: number; // Points to split among members
    deadline: Timestamp;
    type: 'meditation_minutes' | 'journal_entries' | 'aura_posts' | 'friend_support';
  };
  achievements: string[]; // Squad-level achievements
  level: number; // Squad level based on total activity
  isPrivate: boolean;
  createdAt: Timestamp | null;
  lastActivity: Timestamp | null;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number; // Points required
  category: 'badge' | 'theme' | 'sticker' | 'frame' | 'partner' | 'merchandise';
  type: 'digital' | 'physical' | 'service';
  phase: 1 | 2; // Launch phase vs growth phase
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  preview?: string; // URL to preview image
  metadata?: Record<string, unknown>;
  isActive: boolean;
  isLimited?: boolean; // Limited time or quantity
  limitQuantity?: number;
  claimed: number; // How many times claimed
  requirements?: {
    level?: number;
    badges?: string[];
    achievements?: string[];
  };
  createdAt: Timestamp | null;
}

// Point values following the "Proof of Care" algorithm
export const POINT_VALUES: Record<AuraPointActivity, number> = {
  journal_entry: 10,        // Core habit - requires >50 words
  streak_7_days: 50,        // Consistency bonus
  meditation_complete: 15,  // Mindfulness - video completion tracked
  workout_complete: 15,     // Physical health - video completion tracked
  aura_post: 5,            // Social connection - 24hr post
  friend_support: 3,       // Community - meaningful reaction/reply
  group_challenge: 25,     // Variable based on challenge
  weekly_quest: 75,        // Variable based on quest difficulty
  daily_streak: 5,         // Daily consistency
  first_time_bonus: 20,    // Trying new features
};

// Daily caps to prevent grinding
export const DAILY_CAPS: Record<AuraPointActivity, number> = {
  journal_entry: 1,        // Once per day
  streak_7_days: 1,        // Once per week
  meditation_complete: 3,  // Max 3 meditations per day
  workout_complete: 2,     // Max 2 workouts per day
  aura_post: 2,           // Max 2 posts per day
  friend_support: 10,     // Max 10 friend interactions per day
  group_challenge: 1,     // Once per challenge
  weekly_quest: 1,        // Once per quest
  daily_streak: 1,        // Once per day
  first_time_bonus: 1,    // Once per feature ever
};

export const DAILY_POINT_CAP = 50; // Maximum points per day from standard activities

// Helper functions
export function getAuraStatsRef(userUid: string) {
  return doc(db, 'users', userUid, 'auraStats', 'main');
}

export function getPointTransactionsRef(userUid: string) {
  return collection(db, 'users', userUid, 'pointTransactions');
}

export function getWeeklyQuestsRef() {
  return collection(db, 'weeklyQuests');
}

export function getAuraSquadsRef() {
  return collection(db, 'auraSquads');
}

export function getRewardsRef() {
  return collection(db, 'rewards');
}

// Core point earning function with "Proof of Care" validation
export async function awardAuraPoints(params: {
  user: User;
  activity: AuraPointActivity;
  proof?: AuraPointTransaction['proof'];
  description?: string;
  multiplier?: number;
  questId?: string;
  squadId?: string;
}): Promise<{ success: boolean; points: number; message: string }> {
  const { user, activity, proof, description, multiplier = 1, questId, squadId } = params;
  
  try {
    // Get current user stats
    const statsRef = getAuraStatsRef(user.uid);
    const statsDoc = await getDoc(statsRef);
    
    if (!statsDoc.exists()) {
      await initializeUserAuraStats(user);
    }
    
    const stats = statsDoc.data() as UserAuraStats;
    const today = new Date().toISOString().split('T')[0];
    
    // Check daily caps
    if (stats.lastActivityDate === today) {
      const todayTransactions = await getDocs(
        query(
          getPointTransactionsRef(user.uid),
          where('activity', '==', activity),
          where('createdAt', '>=', Timestamp.fromDate(new Date(today))),
          limit(DAILY_CAPS[activity] || 1)
        )
      );
      
      if (todayTransactions.size >= (DAILY_CAPS[activity] || 1)) {
        return {
          success: false,
          points: 0,
          message: `Daily limit reached for ${activity}. Try again tomorrow! 🌅`
        };
      }
    }
    
    // Check overall daily cap
    if (stats.lastActivityDate === today && stats.dailyPointsEarned >= DAILY_POINT_CAP) {
      return {
        success: false,
        points: 0,
        message: `Daily point cap of ${DAILY_POINT_CAP} reached! Rest and come back tomorrow! 😴`
      };
    }
    
    // Validate proof based on activity type
    const validationResult = validateProofOfCare(activity, proof);
    if (!validationResult.valid) {
      return {
        success: false,
        points: 0,
        message: validationResult.message || 'Activity validation failed'
      };
    }
    
    // Calculate points with multiplier
    const basePoints = POINT_VALUES[activity];
    const earnedPoints = Math.round(basePoints * multiplier);
    
    // Create transaction record
    const transaction = {
      userUid: user.uid,
      activity,
      points: earnedPoints,
      description: description || getDefaultDescription(activity, earnedPoints),
      proof,
      multiplier: multiplier !== 1 ? multiplier : undefined,
      questId,
      squadId,
      createdAt: serverTimestamp(),
    };
    
    // Use batch to update both transaction and stats
    const batch = writeBatch(db);
    
    // Add transaction
    const transactionRef = doc(getPointTransactionsRef(user.uid));
    batch.set(transactionRef, transaction);
    
    // Update user stats
    const newDailyPoints = stats.lastActivityDate === today 
      ? stats.dailyPointsEarned + earnedPoints 
      : earnedPoints;
    
    const updateData: Record<string, unknown> = {
      totalPoints: stats.totalPoints + earnedPoints,
      availablePoints: stats.availablePoints + earnedPoints,
      lifetimeEarned: stats.lifetimeEarned + earnedPoints,
      lastActivityDate: today,
      dailyPointsEarned: newDailyPoints,
      updatedAt: serverTimestamp(),
    };
    
    // Update streak if it's a journal entry
    if (activity === 'journal_entry') {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      if (stats.lastActivityDate === yesterday) {
        const newStreak = stats.currentStreak + 1;
        updateData.currentStreak = newStreak;
        updateData.longestStreak = Math.max(stats.longestStreak, newStreak);
      } else if (stats.lastActivityDate !== today) {
        updateData.currentStreak = 1; // Reset streak if gap > 1 day
      }
      
      // Award streak bonus
      const currentStreak = updateData.currentStreak as number;
      if (currentStreak && currentStreak % 7 === 0) {
        // Recursive call for streak bonus
        setTimeout(() => {
          awardAuraPoints({
            user,
            activity: 'streak_7_days',
            description: `🔥 ${currentStreak}-day streak bonus!`,
          });
        }, 1000);
      }
    }
    
    batch.update(statsRef, updateData);
    await batch.commit();
    
    return {
      success: true,
      points: earnedPoints,
      message: getCelebrationMessage(activity, earnedPoints, multiplier > 1)
    };
    
  } catch (error) {
    console.error('Error awarding Aura Points:', error);
    return {
      success: false,
      points: 0,
      message: 'Failed to award points. Please try again.'
    };
  }
}

// Proof of Care validation
function validateProofOfCare(
  activity: AuraPointActivity, 
  proof?: AuraPointTransaction['proof']
): { valid: boolean; message?: string } {
  switch (activity) {
    case 'journal_entry':
      if (!proof || proof.type !== 'journal_length' || (proof.value as number) < 50) {
        return { valid: false, message: 'Journal entry must be at least 50 words' };
      }
      break;
    
    case 'meditation_complete':
    case 'workout_complete':
      if (!proof || proof.type !== 'video_completion' || (proof.value as number) < 80) {
        return { valid: false, message: 'Must complete at least 80% of the video' };
      }
      break;
    
    case 'friend_support':
      if (!proof || proof.type !== 'social_interaction') {
        return { valid: false, message: 'Must include meaningful interaction proof' };
      }
      break;
    
    case 'streak_7_days':
      if (!proof || proof.type !== 'streak_count' || (proof.value as number) < 7) {
        return { valid: false, message: 'Must have at least 7-day streak' };
      }
      break;
  }
  
  return { valid: true };
}

// Initialize user Aura stats
export async function initializeUserAuraStats(user: User): Promise<void> {
  const statsRef = getAuraStatsRef(user.uid);
  const initialStats = {
    userUid: user.uid,
    totalPoints: 0,
    availablePoints: 0,
    lifetimeEarned: 0,
    lifetimeSpent: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: '',
    dailyPointsEarned: 0,
    weeklyPointsEarned: 0,
    level: 1,
    badges: [],
    achievements: [],
    joinedSquads: [],
    preferences: {
      celebrationStyle: 'enthusiastic',
      privacyLevel: 'friends',
      notifications: {
        dailyReminder: true,
        streakAlert: true,
        questAvailable: true,
        squadActivity: true,
      },
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  await updateDoc(statsRef, initialStats);
}

// Get user's current Aura stats
export async function getUserAuraStats(userUid: string): Promise<UserAuraStats | null> {
  try {
    const statsDoc = await getDoc(getAuraStatsRef(userUid));
    if (statsDoc.exists()) {
      return statsDoc.data() as UserAuraStats;
    }
    return null;
  } catch (error) {
    console.error('Error getting Aura stats:', error);
    return null;
  }
}

// Get user's recent point transactions
export async function getRecentTransactions(userUid: string, limitCount = 20): Promise<AuraPointTransaction[]> {
  try {
    const q = query(
      getPointTransactionsRef(userUid),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as AuraPointTransaction[];
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
}

// Helper functions for user experience
function getDefaultDescription(activity: AuraPointActivity, points: number): string {
  const descriptions: Record<AuraPointActivity, string> = {
    journal_entry: `✍️ Daily journal entry completed! +${points} pts`,
    streak_7_days: `🔥 Amazing ${points === 50 ? '7' : Math.floor(points/50)*7}-day streak! +${points} pts`,
    meditation_complete: `🧘 Mindfulness session completed! +${points} pts`,
    workout_complete: `💪 Workout session finished! +${points} pts`,
    aura_post: `✨ Aura shared with friends! +${points} pts`,
    friend_support: `🤗 Supported a friend's journey! +${points} pts`,
    group_challenge: `🏆 Group challenge completed! +${points} pts`,
    weekly_quest: `⭐ Weekly quest conquered! +${points} pts`,
    daily_streak: `📅 Daily consistency bonus! +${points} pts`,
    first_time_bonus: `🎉 First time exploring! +${points} pts`,
  };
  
  return descriptions[activity];
}

function getCelebrationMessage(activity: AuraPointActivity, points: number, hasMultiplier: boolean): string {
  const base = getDefaultDescription(activity, points);
  
  if (hasMultiplier) {
    return `${base} 🌟 BONUS POINTS!`;
  }
  
  // Add encouraging messages based on activity
  const encouragements: Record<AuraPointActivity, string[]> = {
    journal_entry: ['Keep reflecting! 📔', 'Your thoughts matter! 💭', 'Self-awareness grows! 🌱'],
    meditation_complete: ['Inner peace activated! ☮️', 'Mindfulness mastered! 🎯', 'Calm energy rising! 🌊'],
    workout_complete: ['Body and mind in sync! ⚡', 'Strength building! 💎', 'Energy flowing! 🌟'],
    aura_post: ['Connection sparks joy! ⚡', 'Sharing is caring! 💝', 'Community grows! 🌍'],
    friend_support: ['Kindness radiates! 🌈', 'Support multiplies! 🔄', 'Hearts connect! 💕'],
    streak_7_days: ['Consistency is key! 🔑', 'Habits forming! ⚙️', 'You\'re unstoppable! 🚀'],
    group_challenge: ['Teamwork makes dreams work! 🤝', 'Together we rise! 🌅', 'Squad goals! 🎯'],
    weekly_quest: ['Quest master! ⚔️', 'Challenge accepted! ✅', 'Adventure complete! 🗺️'],
    daily_streak: ['Every day counts! 📈', 'Progress over perfection! 🎨', 'Steady wins! 🐢'],
    first_time_bonus: ['Curiosity rewards! 🔍', 'Exploration pays! 🧭', 'New horizons! 🌄'],
  };
  
  const randomEncouragement = encouragements[activity][
    Math.floor(Math.random() * encouragements[activity].length)
  ];
  
  return `${base} ${randomEncouragement}`;
}

// Listen to user stats updates
export function listenToUserAuraStats(userUid: string, callback: (stats: UserAuraStats | null) => void) {
  return onSnapshot(getAuraStatsRef(userUid), (doc) => {
    if (doc.exists()) {
      callback(doc.data() as UserAuraStats);
    } else {
      callback(null);
    }
  });
}