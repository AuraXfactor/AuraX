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
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ============================================================================
// CENTRALIZED AURA POINTS SYSTEM
// ============================================================================

// Core point earning activities with standardized values
export type AuraActivity = 
  | 'journal_entry'           // +10 base points
  | 'specialized_journal'     // +15 base points (CBT, Gratitude, etc.)
  | 'meditation_complete'     // +15 base points
  | 'workout_complete'        // +15 base points
  | 'aura_post'              // +5 base points
  | 'friend_support'         // +3 base points
  | 'streak_bonus'           // +5-50 points based on streak length
  | 'level_up'               // +25 points
  | 'badge_earned'           // +10 points
  | 'quest_completed'        // +25-200 points based on quest
  | 'squad_challenge'        // +20 points
  | 'daily_checkin'          // +5 points
  | 'mood_tracking'          // +3 points
  | 'goal_setting'           // +5 points
  | 'first_time_bonus';      // +20 points

// Point values - centralized and consistent
export const AURA_POINT_VALUES: Record<AuraActivity, number> = {
  journal_entry: 10,
  specialized_journal: 15,
  meditation_complete: 15,
  workout_complete: 15,
  aura_post: 5,
  friend_support: 3,
  streak_bonus: 5, // Base, can be multiplied
  level_up: 25,
  badge_earned: 10,
  quest_completed: 25, // Base, varies by quest
  squad_challenge: 20,
  daily_checkin: 5,
  mood_tracking: 3,
  goal_setting: 5,
  first_time_bonus: 20,
};

// Daily caps to prevent grinding
export const DAILY_ACTIVITY_CAPS: Record<AuraActivity, number> = {
  journal_entry: 1,
  specialized_journal: 3,
  meditation_complete: 3,
  workout_complete: 2,
  aura_post: 2,
  friend_support: 10,
  streak_bonus: 1,
  level_up: 1,
  badge_earned: 5,
  quest_completed: 5,
  squad_challenge: 1,
  daily_checkin: 1,
  mood_tracking: 1,
  goal_setting: 3,
  first_time_bonus: 1,
};

export const DAILY_POINT_CAP = 100; // Maximum points per day

// Enhanced user stats interface
export interface CentralizedAuraStats {
  userUid: string;
  
  // Core Points
  totalPoints: number;           // All-time earned
  availablePoints: number;       // Available to spend
  lifetimeEarned: number;        // Total earned (same as totalPoints)
  lifetimeSpent: number;         // Total spent on rewards
  
  // Streak Management
  currentStreak: number;         // Current active streak
  longestStreak: number;         // Best streak ever
  streakType: 'journal' | 'daily' | 'mixed'; // Type of current streak
  lastActivityDate: string;      // YYYY-MM-DD format
  streakRestoreCount: number;    // Times user restored streak this month
  streakRestoreResetDate: string; // When restore count resets
  
  // Daily/Weekly Tracking
  dailyPointsEarned: number;     // Points earned today
  weeklyPointsEarned: number;    // Points earned this week
  lastDailyReset: string;        // Last daily reset date
  lastWeeklyReset: string;       // Last weekly reset date
  
  // Progression
  level: number;                 // Current level
  experiencePoints: number;      // XP for leveling
  nextLevelXP: number;          // XP needed for next level
  
  // Achievements
  badges: string[];             // Earned badge IDs
  achievements: string[];       // Earned achievement IDs
  totalActivities: number;      // Total activities completed
  
  // Activity Counts (for badges/achievements)
  activityCounts: Record<AuraActivity, number>;
  
  // Timestamps
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

// Point transaction record
export interface AuraTransaction {
  id: string;
  userUid: string;
  activity: AuraActivity;
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  description: string;
  metadata: {
    source: string;              // 'journal', 'meditation', 'workout', etc.
    quality?: number;            // Quality score 0-100
    completion?: number;         // Completion percentage
    streakLength?: number;       // Streak at time of earning
    level?: number;              // Level at time of earning
    uniqueId?: string;           // Prevents duplicates
  };
  createdAt: Timestamp | null;
}

// Badge definitions with point requirements
export interface AuraBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'streak' | 'points' | 'activity' | 'social' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: {
    type: 'points' | 'streak' | 'activities' | 'level' | 'special';
    value: number;
    activity?: AuraActivity;
  };
  pointsReward: number;
}

// Badge definitions
export const AURA_BADGES: AuraBadge[] = [
  // Streak Badges
  {
    id: 'streak_3',
    name: 'Getting Started',
    description: '3-day streak',
    icon: '🔥',
    category: 'streak',
    rarity: 'common',
    requirement: { type: 'streak', value: 3 },
    pointsReward: 10,
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: '7-day streak',
    icon: '⚡',
    category: 'streak',
    rarity: 'rare',
    requirement: { type: 'streak', value: 7 },
    pointsReward: 25,
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: '30-day streak',
    icon: '👑',
    category: 'streak',
    rarity: 'epic',
    requirement: { type: 'streak', value: 30 },
    pointsReward: 100,
  },
  {
    id: 'streak_100',
    name: 'Century Sage',
    description: '100-day streak',
    icon: '🌟',
    category: 'streak',
    rarity: 'legendary',
    requirement: { type: 'streak', value: 100 },
    pointsReward: 500,
  },
  
  // Points Badges
  {
    id: 'points_100',
    name: 'Point Collector',
    description: 'Earned 100 points',
    icon: '💎',
    category: 'points',
    rarity: 'common',
    requirement: { type: 'points', value: 100 },
    pointsReward: 10,
  },
  {
    id: 'points_500',
    name: 'Point Pro',
    description: 'Earned 500 points',
    icon: '💍',
    category: 'points',
    rarity: 'rare',
    requirement: { type: 'points', value: 500 },
    pointsReward: 25,
  },
  {
    id: 'points_1000',
    name: 'Point Legend',
    description: 'Earned 1000 points',
    icon: '👑',
    category: 'points',
    rarity: 'epic',
    requirement: { type: 'points', value: 1000 },
    pointsReward: 50,
  },
  {
    id: 'points_5000',
    name: 'Point Master',
    description: 'Earned 5000 points',
    icon: '🏆',
    category: 'points',
    rarity: 'legendary',
    requirement: { type: 'points', value: 5000 },
    pointsReward: 200,
  },
  
  // Activity Badges
  {
    id: 'journal_master',
    name: 'Journal Master',
    description: '100 journal entries',
    icon: '📔',
    category: 'activity',
    rarity: 'epic',
    requirement: { type: 'activities', value: 100, activity: 'journal_entry' },
    pointsReward: 50,
  },
  {
    id: 'meditation_master',
    name: 'Zen Master',
    description: '50 meditation sessions',
    icon: '🧘',
    category: 'activity',
    rarity: 'rare',
    requirement: { type: 'activities', value: 50, activity: 'meditation_complete' },
    pointsReward: 25,
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: '100 friend interactions',
    icon: '🦋',
    category: 'social',
    rarity: 'rare',
    requirement: { type: 'activities', value: 100, activity: 'friend_support' },
    pointsReward: 30,
  },
];

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

// Get user's centralized aura stats
export async function getCentralizedAuraStats(userUid: string): Promise<CentralizedAuraStats | null> {
  try {
    const statsRef = doc(db, 'users', userUid, 'auraStats', 'centralized');
    const statsDoc = await getDoc(statsRef);
    
    if (statsDoc.exists()) {
      return statsDoc.data() as CentralizedAuraStats;
    }
    
    // Initialize if doesn't exist
    await initializeCentralizedAuraStats(userUid);
    const newStatsDoc = await getDoc(statsRef);
    return newStatsDoc.exists() ? (newStatsDoc.data() as CentralizedAuraStats) : null;
  } catch (error) {
    console.error('Error getting centralized aura stats:', error);
    return null;
  }
}

// Initialize user's centralized aura stats
export async function initializeCentralizedAuraStats(userUid: string): Promise<void> {
  const statsRef = doc(db, 'users', userUid, 'auraStats', 'centralized');
  const today = new Date().toISOString().split('T')[0];
  
  const initialStats: CentralizedAuraStats = {
    userUid,
    totalPoints: 0,
    availablePoints: 0,
    lifetimeEarned: 0,
    lifetimeSpent: 0,
    currentStreak: 0,
    longestStreak: 0,
    streakType: 'daily',
    lastActivityDate: '',
    streakRestoreCount: 0,
    streakRestoreResetDate: today,
    dailyPointsEarned: 0,
    weeklyPointsEarned: 0,
    lastDailyReset: today,
    lastWeeklyReset: today,
    level: 1,
    experiencePoints: 0,
    nextLevelXP: 1000,
    badges: [],
    achievements: [],
    totalActivities: 0,
    activityCounts: {
      journal_entry: 0,
      specialized_journal: 0,
      meditation_complete: 0,
      workout_complete: 0,
      aura_post: 0,
      friend_support: 0,
      streak_bonus: 0,
      level_up: 0,
      badge_earned: 0,
      quest_completed: 0,
      squad_challenge: 0,
      daily_checkin: 0,
      mood_tracking: 0,
      goal_setting: 0,
      first_time_bonus: 0,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  await setDoc(statsRef, initialStats, { merge: true });
}

// Award points with centralized logic
export async function awardCentralizedPoints(params: {
  user: User;
  activity: AuraActivity;
  source: string;
  quality?: number;
  completion?: number;
  uniqueId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; points: number; message: string; badgesEarned: string[] }> {
  const { user, activity, source, quality = 100, completion = 100, uniqueId, description, metadata = {} } = params;
  
  try {
    // Get current stats
    const stats = await getCentralizedAuraStats(user.uid);
    if (!stats) {
      await initializeCentralizedAuraStats(user.uid);
      const newStats = await getCentralizedAuraStats(user.uid);
      if (!newStats) throw new Error('Failed to initialize stats');
    }
    
    const currentStats = stats || await getCentralizedAuraStats(user.uid)!;
    const today = new Date().toISOString().split('T')[0];
    
    // Check for duplicates using uniqueId
    if (uniqueId) {
      const duplicateCheck = await getDocs(
        query(
          collection(db, 'users', user.uid, 'auraTransactions'),
          where('metadata.uniqueId', '==', uniqueId),
          limit(1)
        )
      );
      
      if (duplicateCheck.size > 0) {
        return {
          success: false,
          points: 0,
          message: 'Points already awarded for this activity! ✅',
          badgesEarned: [],
        };
      }
    }
    
    // Check daily caps
    const dailyActivityCount = await getDailyActivityCount(user.uid, activity, today);
    if (dailyActivityCount >= DAILY_ACTIVITY_CAPS[activity]) {
      return {
        success: false,
        points: 0,
        message: `Daily limit reached for ${activity}. Try again tomorrow! 🌅`,
        badgesEarned: [],
      };
    }
    
    // Check daily point cap
    if (currentStats.dailyPointsEarned >= DAILY_POINT_CAP) {
      return {
        success: false,
        points: 0,
        message: `Daily point cap of ${DAILY_POINT_CAP} reached! Rest and come back tomorrow! 😴`,
        badgesEarned: [],
      };
    }
    
    // Calculate points
    const basePoints = AURA_POINT_VALUES[activity];
    const qualityMultiplier = Math.min(quality / 100, 1.5); // Max 1.5x for quality
    const completionMultiplier = Math.min(completion / 100, 1.2); // Max 1.2x for completion
    const streakMultiplier = calculateStreakMultiplier(currentStats.currentStreak);
    
    const bonusPoints = Math.round(
      basePoints * (qualityMultiplier - 1) + 
      basePoints * (completionMultiplier - 1) + 
      basePoints * (streakMultiplier - 1)
    );
    
    const totalPoints = Math.round(basePoints * qualityMultiplier * completionMultiplier * streakMultiplier);
    
    // Ensure we don't exceed daily cap
    if (currentStats.dailyPointsEarned + totalPoints > DAILY_POINT_CAP) {
      const remainingPoints = DAILY_POINT_CAP - currentStats.dailyPointsEarned;
      return {
        success: false,
        points: 0,
        message: `Only ${remainingPoints} points remaining today. Complete this tomorrow! 🌙`,
        badgesEarned: [],
      };
    }
    
    // Create transaction
    const transaction: Omit<AuraTransaction, 'id'> = {
      userUid: user.uid,
      activity,
      basePoints,
      bonusPoints,
      totalPoints,
      description: description || getDefaultDescription(activity, totalPoints),
      metadata: {
        source,
        quality,
        completion,
        streakLength: currentStats.currentStreak,
        level: currentStats.level,
        uniqueId,
        ...metadata,
      },
      createdAt: serverTimestamp(),
    };
    
    // Use batch operations for atomicity
    const batch = writeBatch(db);
    
    // Add transaction
    const transactionRef = doc(collection(db, 'users', user.uid, 'auraTransactions'));
    batch.set(transactionRef, transaction);
    
    // Update stats
    const statsRef = doc(db, 'users', user.uid, 'auraStats', 'centralized');
    const updateData: Record<string, unknown> = {
      totalPoints: currentStats.totalPoints + totalPoints,
      availablePoints: currentStats.availablePoints + totalPoints,
      lifetimeEarned: currentStats.lifetimeEarned + totalPoints,
      dailyPointsEarned: currentStats.dailyPointsEarned + totalPoints,
      weeklyPointsEarned: currentStats.weeklyPointsEarned + totalPoints,
      totalActivities: currentStats.totalActivities + 1,
      [`activityCounts.${activity}`]: currentStats.activityCounts[activity] + 1,
      lastActivityDate: today,
      updatedAt: serverTimestamp(),
    };
    
    // Update streak
    const streakUpdate = updateStreak(currentStats, today);
    Object.assign(updateData, streakUpdate);
    
    // Update level
    const levelUpdate = updateLevel(currentStats, totalPoints);
    Object.assign(updateData, levelUpdate);
    
    batch.update(statsRef, updateData);
    
    // Check for new badges
    const newBadges = await checkForNewBadges(user.uid, {
      ...currentStats,
      totalPoints: currentStats.totalPoints + totalPoints,
      activityCounts: {
        ...currentStats.activityCounts,
        [activity]: currentStats.activityCounts[activity] + 1,
      },
    });
    
    // Award badge points
    if (newBadges.length > 0) {
      const badgePoints = newBadges.reduce((sum, badgeId) => {
        const badge = AURA_BADGES.find(b => b.id === badgeId);
        return sum + (badge?.pointsReward || 0);
      }, 0);
      
      if (badgePoints > 0) {
        batch.update(statsRef, {
          totalPoints: currentStats.totalPoints + totalPoints + badgePoints,
          availablePoints: currentStats.availablePoints + totalPoints + badgePoints,
          lifetimeEarned: currentStats.lifetimeEarned + totalPoints + badgePoints,
          badges: [...currentStats.badges, ...newBadges],
        });
      }
    }
    
    await batch.commit();
    
    return {
      success: true,
      points: totalPoints,
      message: getCelebrationMessage(activity, totalPoints, bonusPoints > 0, newBadges.length > 0),
      badgesEarned: newBadges,
    };
    
  } catch (error) {
    console.error('Error awarding centralized points:', error);
    return {
      success: false,
      points: 0,
      message: 'Failed to award points. Please try again.',
      badgesEarned: [],
    };
  }
}

// Helper function to get daily activity count
async function getDailyActivityCount(userUid: string, activity: AuraActivity, date: string): Promise<number> {
  try {
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');
    
    const q = query(
      collection(db, 'users', userUid, 'auraTransactions'),
      where('activity', '==', activity),
      where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
      where('createdAt', '<=', Timestamp.fromDate(endOfDay))
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting daily activity count:', error);
    return 0;
  }
}

// Calculate streak multiplier
function calculateStreakMultiplier(streak: number): number {
  if (streak >= 100) return 2.0;
  if (streak >= 30) return 1.5;
  if (streak >= 7) return 1.2;
  if (streak >= 3) return 1.1;
  return 1.0;
}

// Update streak logic
function updateStreak(stats: CentralizedAuraStats, today: string): Record<string, unknown> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  if (stats.lastActivityDate === yesterday) {
    // Continue streak
    const newStreak = stats.currentStreak + 1;
    return {
      currentStreak: newStreak,
      longestStreak: Math.max(stats.longestStreak, newStreak),
    };
  } else if (stats.lastActivityDate === today) {
    // Same day, no change
    return {};
  } else {
    // Streak broken
    return {
      currentStreak: 1,
    };
  }
}

// Update level logic
function updateLevel(stats: CentralizedAuraStats, pointsEarned: number): Record<string, unknown> {
  const newXP = stats.experiencePoints + pointsEarned;
  const newLevel = calculateLevel(newXP);
  
  if (newLevel > stats.level) {
    return {
      level: newLevel,
      experiencePoints: newXP,
      nextLevelXP: calculateNextLevelXP(newLevel),
    };
  }
  
  return {
    experiencePoints: newXP,
  };
}

// Calculate level from XP
function calculateLevel(xp: number): number {
  if (xp < 1000) return 1;
  if (xp < 3000) return 2;
  if (xp < 6000) return 3;
  if (xp < 10000) return 4;
  if (xp < 15000) return 5;
  if (xp < 25000) return 6;
  if (xp < 40000) return 7;
  if (xp < 60000) return 8;
  if (xp < 100000) return 9;
  return 10;
}

// Calculate XP needed for next level
function calculateNextLevelXP(level: number): number {
  const levelThresholds = [0, 1000, 3000, 6000, 10000, 15000, 25000, 40000, 60000, 100000];
  return levelThresholds[Math.min(level, levelThresholds.length - 1)] || 100000;
}

// Check for new badges
async function checkForNewBadges(userUid: string, stats: CentralizedAuraStats): Promise<string[]> {
  const newBadges: string[] = [];
  
  for (const badge of AURA_BADGES) {
    if (stats.badges.includes(badge.id)) continue;
    
    let earned = false;
    
    switch (badge.requirement.type) {
      case 'points':
        earned = stats.totalPoints >= badge.requirement.value;
        break;
      case 'streak':
        earned = stats.currentStreak >= badge.requirement.value;
        break;
      case 'activities':
        if (badge.requirement.activity) {
          earned = stats.activityCounts[badge.requirement.activity] >= badge.requirement.value;
        }
        break;
      case 'level':
        earned = stats.level >= badge.requirement.value;
        break;
    }
    
    if (earned) {
      newBadges.push(badge.id);
    }
  }
  
  return newBadges;
}

// Get default description for activity
function getDefaultDescription(activity: AuraActivity, points: number): string {
  const descriptions: Record<AuraActivity, string> = {
    journal_entry: `📔 Journal entry completed! +${points} pts`,
    specialized_journal: `📚 Specialized journal completed! +${points} pts`,
    meditation_complete: `🧘 Meditation session completed! +${points} pts`,
    workout_complete: `💪 Workout completed! +${points} pts`,
    aura_post: `✨ Aura shared! +${points} pts`,
    friend_support: `🤗 Friend supported! +${points} pts`,
    streak_bonus: `🔥 Streak bonus! +${points} pts`,
    level_up: `🎉 Level up! +${points} pts`,
    badge_earned: `🏆 Badge earned! +${points} pts`,
    quest_completed: `⭐ Quest completed! +${points} pts`,
    squad_challenge: `👥 Squad challenge! +${points} pts`,
    daily_checkin: `📅 Daily check-in! +${points} pts`,
    mood_tracking: `😊 Mood tracked! +${points} pts`,
    goal_setting: `🎯 Goal set! +${points} pts`,
    first_time_bonus: `🎉 First time bonus! +${points} pts`,
  };
  
  return descriptions[activity];
}

// Get celebration message
function getCelebrationMessage(activity: AuraActivity, points: number, hasBonus: boolean, hasBadge: boolean): string {
  const base = getDefaultDescription(activity, points);
  
  const bonuses = [];
  if (hasBonus) bonuses.push('🌟 QUALITY BONUS');
  if (hasBadge) bonuses.push('🏆 NEW BADGE');
  
  const bonusText = bonuses.length > 0 ? ` ${bonuses.join(' ')}!` : '';
  
  return `${base}${bonusText}`;
}

// Restore streak (5 times per month)
export async function restoreStreak(user: User): Promise<{ success: boolean; message: string }> {
  try {
    const stats = await getCentralizedAuraStats(user.uid);
    if (!stats) {
      return { success: false, message: 'User stats not found' };
    }
    
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7); // YYYY-MM
    const statsMonth = stats.streakRestoreResetDate.substring(0, 7);
    
    // Reset restore count if new month
    if (currentMonth !== statsMonth) {
      await updateDoc(doc(db, 'users', user.uid, 'auraStats', 'centralized'), {
        streakRestoreCount: 0,
        streakRestoreResetDate: today,
      });
    }
    
    // Check if user can restore
    if (stats.streakRestoreCount >= 5) {
      return { success: false, message: 'Monthly streak restore limit reached (5/5). Wait for next month! 📅' };
    }
    
    if (stats.currentStreak > 0) {
      return { success: false, message: 'Your streak is still active! No need to restore. 🔥' };
    }
    
    // Restore streak
    await updateDoc(doc(db, 'users', user.uid, 'auraStats', 'centralized'), {
      currentStreak: 1,
      lastActivityDate: today,
      streakRestoreCount: stats.streakRestoreCount + 1,
      updatedAt: serverTimestamp(),
    });
    
    return { success: true, message: 'Streak restored! You have 1 day to continue your streak. 🔥' };
  } catch (error) {
    console.error('Error restoring streak:', error);
    return { success: false, message: 'Failed to restore streak. Please try again.' };
  }
}

// Get recent transactions
export async function getRecentTransactions(userUid: string, limitCount = 20): Promise<AuraTransaction[]> {
  try {
    const q = query(
      collection(db, 'users', userUid, 'auraTransactions'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as AuraTransaction[];
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
}

// Listen to stats updates
export function listenToCentralizedAuraStats(userUid: string, callback: (stats: CentralizedAuraStats | null) => void) {
  return onSnapshot(doc(db, 'users', userUid, 'auraStats', 'centralized'), (doc) => {
    if (doc.exists()) {
      callback(doc.data() as CentralizedAuraStats);
    } else {
      callback(null);
    }
  });
}

// Sync with legacy systems
export async function syncLegacyAuraPoints(userUid: string): Promise<void> {
  try {
    // Get legacy aura points from user profile
    const userDoc = await getDoc(doc(db, 'users', userUid));
    const legacyPoints = userDoc.data()?.auraTotal || 0;
    
    if (legacyPoints > 0) {
      // Get centralized stats
      const centralizedStats = await getCentralizedAuraStats(userUid);
      if (centralizedStats && centralizedStats.totalPoints === 0) {
        // Migrate legacy points
        await updateDoc(doc(db, 'users', userUid, 'auraStats', 'centralized'), {
          totalPoints: legacyPoints,
          availablePoints: legacyPoints,
          lifetimeEarned: legacyPoints,
          updatedAt: serverTimestamp(),
        });
        
        console.log(`Migrated ${legacyPoints} legacy aura points for user ${userUid}`);
      }
    }
  } catch (error) {
    console.error('Error syncing legacy aura points:', error);
  }
}