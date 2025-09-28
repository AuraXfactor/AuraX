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
  setDoc,
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

// Universal Aura Points Algorithm - Prevents overlaps and ensures consistency
export async function awardAuraPoints(params: {
  user: User;
  activity: AuraPointActivity;
  proof?: AuraPointTransaction['proof'];
  description?: string;
  multiplier?: number;
  questId?: string;
  squadId?: string;
  uniqueId?: string; // Prevents duplicate awarding for same activity instance
}): Promise<{ success: boolean; points: number; message: string }> {
  const { user, activity, proof, description, multiplier = 1, questId, squadId, uniqueId } = params;
  
  try {
    // Get or initialize user stats
    const statsRef = getAuraStatsRef(user.uid);
    let statsDoc = await getDoc(statsRef);
    if (!statsDoc.exists()) {
      await initializeUserAuraStats(user);
      statsDoc = await getDoc(statsRef);
    }
    const stats = (statsDoc.data() as UserAuraStats) || ({} as UserAuraStats);
    const today = new Date().toISOString().split('T')[0];
    
    // Prevent duplicate awarding using uniqueId (e.g., sessionId, postId, etc.)
    if (uniqueId) {
      const duplicateCheck = await getDocs(
        query(
          getPointTransactionsRef(user.uid),
          where('proof.metadata.uniqueId', '==', uniqueId),
          limit(1)
        )
      );
      
      if (duplicateCheck.size > 0) {
        return {
          success: false,
          points: 0,
          message: 'Points already awarded for this activity! ✅'
        };
      }
    }
    
    // Enhanced daily cap checking with better time zone handling
    const todayStart = new Date(today + 'T00:00:00.000Z');
    const todayEnd = new Date(today + 'T23:59:59.999Z');
    
    // Check activity-specific daily caps
    const todayActivityTransactions = await getDocs(
      query(
        getPointTransactionsRef(user.uid),
        where('activity', '==', activity),
        where('createdAt', '>=', Timestamp.fromDate(todayStart)),
        where('createdAt', '<=', Timestamp.fromDate(todayEnd))
      )
    );
    
    if (todayActivityTransactions.size >= (DAILY_CAPS[activity] || 1)) {
      return {
        success: false,
        points: 0,
        message: `Daily limit reached for ${getActivityDisplayName(activity)}. Try again tomorrow! 🌅`
      };
    }
    
    // Check overall daily point cap
    const todayAllTransactions = await getDocs(
      query(
        getPointTransactionsRef(user.uid),
        where('createdAt', '>=', Timestamp.fromDate(todayStart)),
        where('createdAt', '<=', Timestamp.fromDate(todayEnd))
      )
    );
    
    const todayPointsEarned = todayAllTransactions.docs.reduce((total, doc) => {
      const data = doc.data() as AuraPointTransaction;
      return total + (data.points || 0);
    }, 0);
    
    if (todayPointsEarned >= DAILY_POINT_CAP) {
      return {
        success: false,
        points: 0,
        message: `Daily point cap of ${DAILY_POINT_CAP} reached! Rest and come back tomorrow! 😴`
      };
    }
    
    // Validate proof based on activity type using enhanced validation
    const validationResult = validateProofOfCare(activity, proof, uniqueId);
    if (!validationResult.valid) {
      return {
        success: false,
        points: 0,
        message: validationResult.message || 'Activity validation failed'
      };
    }
    
    // Calculate points with multiplier and apply smart bonuses
    const basePoints = POINT_VALUES[activity];
    const smartBonus = calculateSmartBonus(activity, proof, stats);
    const earnedPoints = Math.round((basePoints + smartBonus) * multiplier);
    
    // Ensure we don't exceed daily cap with this transaction
    if (todayPointsEarned + earnedPoints > DAILY_POINT_CAP) {
      const remainingPoints = DAILY_POINT_CAP - todayPointsEarned;
      return {
        success: false,
        points: 0,
        message: `Only ${remainingPoints} points remaining today. Complete this tomorrow! 🌙`
      };
    }
    
    // Create enhanced transaction record with metadata for tracking
    const enhancedProof = proof ? {
      ...proof,
      metadata: {
        ...proof.metadata,
        uniqueId,
        timestamp: Date.now(),
        userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        smartBonus
      }
    } : undefined;
    
    const transaction = {
      userUid: user.uid,
      activity,
      points: earnedPoints,
      description: description || getDefaultDescription(activity, earnedPoints),
      proof: enhancedProof,
      multiplier: multiplier !== 1 ? multiplier : undefined,
      questId,
      squadId,
      createdAt: serverTimestamp(),
    };
    
    // Use atomic batch operations
    const batch = writeBatch(db);
    
    // Add transaction
    const transactionRef = doc(getPointTransactionsRef(user.uid));
    batch.set(transactionRef, transaction);
    
    // Update user stats with proper calculations
    const newDailyPoints = todayPointsEarned + earnedPoints;
    
    const updateData: Record<string, unknown> = {
      totalPoints: stats.totalPoints + earnedPoints,
      availablePoints: stats.availablePoints + earnedPoints,
      lifetimeEarned: stats.lifetimeEarned + earnedPoints,
      lastActivityDate: today,
      dailyPointsEarned: newDailyPoints,
      updatedAt: serverTimestamp(),
    };
    
    // Enhanced streak management for journal entries
    if (activity === 'journal_entry') {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      if (stats.lastActivityDate === yesterday) {
        const newStreak = stats.currentStreak + 1;
        updateData.currentStreak = newStreak;
        updateData.longestStreak = Math.max(stats.longestStreak, newStreak);
        
        // Award streak bonus at intervals (7, 14, 21, 30, etc.)
        if (newStreak % 7 === 0) {
          // Schedule streak bonus - prevent immediate recursion
          setTimeout(() => {
            awardAuraPoints({
              user,
              activity: 'streak_7_days',
              proof: {
                type: 'streak_count',
                value: newStreak,
                metadata: { streakType: '7-day-multiple', baseStreak: newStreak }
              },
              description: `🔥 ${newStreak}-day streak milestone!`,
              uniqueId: `streak-${user.uid}-${today}-${newStreak}`
            });
          }, 2000);
        }
      } else if (stats.lastActivityDate !== today) {
        updateData.currentStreak = 1; // Reset streak if gap > 1 day
      }
    }
    
    // Calculate level progression
    const newLevel = calculateLevel(stats.lifetimeEarned + earnedPoints);
    if (newLevel > stats.level) {
      updateData.level = newLevel;
      // Award level up bonus
      setTimeout(() => {
        awardAuraPoints({
          user,
          activity: 'first_time_bonus',
          description: `🎉 Level ${newLevel} achieved!`,
          uniqueId: `level-up-${user.uid}-${newLevel}`
        });
      }, 3000);
    }
    
    batch.update(statsRef, updateData);
    await batch.commit();
    
    return {
      success: true,
      points: earnedPoints,
      message: getCelebrationMessage(activity, earnedPoints, multiplier > 1, smartBonus > 0)
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

// Helper function to get user-friendly activity names
function getActivityDisplayName(activity: AuraPointActivity): string {
  const displayNames: Record<AuraPointActivity, string> = {
    journal_entry: 'Journal Writing',
    streak_7_days: 'Streak Bonus',
    meditation_complete: 'Meditation',
    workout_complete: 'Workout',
    aura_post: 'Aura Sharing',
    friend_support: 'Friend Support',
    group_challenge: 'Group Challenge',
    weekly_quest: 'Weekly Quest',
    daily_streak: 'Daily Streak',
    first_time_bonus: 'First Time Bonus',
  };
  return displayNames[activity] || activity;
}

// Calculate smart bonuses based on user behavior and activity quality
function calculateSmartBonus(
  activity: AuraPointActivity,
  proof?: AuraPointTransaction['proof'],
  stats?: UserAuraStats
): number {
  let bonus = 0;
  
  if (!proof || !stats) return bonus;
  
  switch (activity) {
    case 'journal_entry':
      // Bonus for longer, more thoughtful entries
      if (proof.type === 'journal_length' && typeof proof.value === 'number') {
        if (proof.value >= 200) bonus += 3; // 200+ words
        else if (proof.value >= 100) bonus += 2; // 100+ words
        else if (proof.value >= 75) bonus += 1; // 75+ words
        
        // Bonus for including activities, voice memo, or affirmation
        if (proof.metadata?.hasVoice) bonus += 1;
        if (proof.metadata?.affirmation) bonus += 1;
        if (proof.metadata?.activities && Array.isArray(proof.metadata.activities) && proof.metadata.activities.length >= 3) bonus += 1;
      }
      break;
      
    case 'meditation_complete':
    case 'workout_complete':
      // Bonus for higher completion rates
      if (proof.type === 'video_completion' && typeof proof.value === 'number') {
        if (proof.value >= 95) bonus += 2; // Near perfect completion
        else if (proof.value >= 90) bonus += 1; // Excellent completion
      }
      
      // Bonus for longer sessions
      if (proof.metadata?.duration) {
        const minutes = (proof.metadata.duration as number) / 60;
        if (minutes >= 15) bonus += 2;
        else if (minutes >= 10) bonus += 1;
      }
      break;
      
    case 'aura_post':
      // Bonus for meaningful posts (length and engagement)
      if (proof.metadata?.length && (proof.metadata.length as number) >= 100) bonus += 1;
      if (proof.metadata?.hasMedia) bonus += 1;
      break;
      
    case 'friend_support':
      // Bonus for consecutive days of supporting friends
      if (stats.currentStreak >= 7) bonus += 1;
      break;
  }
  
  // Global consistency bonus
  if (stats.currentStreak >= 14) bonus += 1; // 2+ week streak
  if (stats.currentStreak >= 30) bonus += 2; // 1+ month streak
  
  return Math.min(bonus, 5); // Cap smart bonus at 5 points
}

// Calculate user level based on lifetime points
function calculateLevel(lifetimePoints: number): number {
  // Level progression: 0-999=1, 1000-2999=2, 3000-5999=3, etc.
  if (lifetimePoints < 1000) return 1;
  if (lifetimePoints < 3000) return 2;
  if (lifetimePoints < 6000) return 3;
  if (lifetimePoints < 10000) return 4;
  if (lifetimePoints < 15000) return 5;
  if (lifetimePoints < 25000) return 6;
  if (lifetimePoints < 40000) return 7;
  if (lifetimePoints < 60000) return 8;
  if (lifetimePoints < 100000) return 9;
  return 10; // Max level
}

// Enhanced Proof of Care validation
function validateProofOfCare(
  activity: AuraPointActivity, 
  proof?: AuraPointTransaction['proof'],
  uniqueId?: string
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
  // Create or overwrite the main stats doc
  await setDoc(statsRef, initialStats, { merge: true });
}

// Get user's current Aura stats
export async function getUserAuraStats(userUid: string): Promise<UserAuraStats | null> {
  try {
    const ref = getAuraStatsRef(userUid);
    const statsDoc = await getDoc(ref);
    if (statsDoc.exists()) return statsDoc.data() as UserAuraStats;
    // Initialize if missing
    await setDoc(ref, {
      userUid,
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
    }, { merge: true });
    const fresh = await getDoc(ref);
    return fresh.exists() ? (fresh.data() as UserAuraStats) : null;
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

function getCelebrationMessage(activity: AuraPointActivity, points: number, hasMultiplier: boolean, hasSmartBonus: boolean): string {
  const base = getDefaultDescription(activity, points);
  
  const bonusIndicators = [];
  if (hasMultiplier) bonusIndicators.push('🌟 MULTIPLIER');
  if (hasSmartBonus) bonusIndicators.push('🎯 QUALITY BONUS');
  
  const bonusText = bonusIndicators.length > 0 ? ` ${bonusIndicators.join(' ')}!` : '';
  
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
  
  return `${base}${bonusText} ${randomEncouragement}`;
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