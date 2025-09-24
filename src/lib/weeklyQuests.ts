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
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { WeeklyQuest, UserAuraStats, getAuraStatsRef, awardAuraPoints } from './auraPoints';

// Re-export WeeklyQuest for external use
export type { WeeklyQuest };

// Weekly Quest Templates - These create variety and excitement
const QUEST_TEMPLATES = [
  // Mindfulness Category
  {
    id: 'mindful_week',
    title: 'Mindful Week',
    description: 'Complete 5 meditation sessions this week',
    requirement: { type: 'count' as const, target: 5, activities: ['meditation_complete'] },
    reward: { points: 75, badge: 'zen_master' },
    difficulty: 'medium' as const,
    category: 'mindfulness' as const,
  },
  {
    id: 'meditation_streak',
    title: 'Daily Zen',
    description: 'Meditate for 3 consecutive days',
    requirement: { type: 'streak' as const, target: 3, activities: ['meditation_complete'] },
    reward: { points: 50, badge: 'meditation_streak' },
    difficulty: 'easy' as const,
    category: 'mindfulness' as const,
  },
  
  // Social Category
  {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Support 10 friend Auras this week',
    requirement: { type: 'count' as const, target: 10, activities: ['friend_support'] },
    reward: { points: 50, badge: 'supportive_friend' },
    difficulty: 'medium' as const,
    category: 'social' as const,
  },
  {
    id: 'connection_master',
    title: 'Connection Master',
    description: 'Share 5 Auras and support 5 friends this week',
    requirement: { type: 'variety' as const, target: 10, activities: ['aura_post', 'friend_support'] },
    reward: { points: 100, badge: 'connector' },
    difficulty: 'hard' as const,
    category: 'social' as const,
  },
  
  // Consistency Category
  {
    id: 'journal_warrior',
    title: 'Journal Warrior',
    description: 'Write in your journal for 7 consecutive days',
    requirement: { type: 'streak' as const, target: 7, activities: ['journal_entry'] },
    reward: { points: 125, badge: 'consistency_champion' },
    difficulty: 'hard' as const,
    category: 'consistency' as const,
  },
  {
    id: 'daily_dedication',
    title: 'Daily Dedication',
    description: 'Complete any 3 activities daily for 5 days',
    requirement: { type: 'variety' as const, target: 15 },
    reward: { points: 100, special: 'unlock_golden_theme' },
    difficulty: 'medium' as const,
    category: 'consistency' as const,
  },
  
  // Exploration Category
  {
    id: 'wellness_explorer',
    title: 'Wellness Explorer',
    description: 'Try meditation, workout, and journaling in one week',
    requirement: { type: 'variety' as const, target: 3, activities: ['meditation_complete', 'workout_complete', 'journal_entry'] },
    reward: { points: 75, badge: 'well_rounded' },
    difficulty: 'easy' as const,
    category: 'exploration' as const,
  },
  {
    id: 'legendary_adventurer',
    title: 'Legendary Adventurer',
    description: 'Complete 20 total activities across all categories this week',
    requirement: { type: 'count' as const, target: 20 },
    reward: { points: 200, badge: 'legendary_explorer', special: 'unlock_rainbow_theme' },
    difficulty: 'legendary' as const,
    category: 'exploration' as const,
  },
];

// Badge definitions
export const BADGES = {
  zen_master: { name: 'Zen Master', icon: '🧘‍♀️', description: 'Completed 5 meditations in a week' },
  meditation_streak: { name: 'Daily Meditator', icon: '🔥', description: '3-day meditation streak' },
  supportive_friend: { name: 'Supportive Friend', icon: '🤗', description: 'Supported 10 friends in a week' },
  connector: { name: 'Master Connector', icon: '🌈', description: 'Social engagement champion' },
  consistency_champion: { name: 'Consistency Champion', icon: '👑', description: '7-day journaling streak' },
  well_rounded: { name: 'Well-Rounded', icon: '⚖️', description: 'Explored all wellness areas' },
  legendary_explorer: { name: 'Legendary Explorer', icon: '🏆', description: 'Ultimate activity completion' },
  // Additional badges
  early_bird: { name: 'Early Bird', icon: '🌅', description: 'Completed activities before 9 AM' },
  night_owl: { name: 'Night Owl', icon: '🦉', description: 'Completed activities after 9 PM' },
  weekend_warrior: { name: 'Weekend Warrior', icon: '⚡', description: 'Active on weekends' },
  mindful_master: { name: 'Mindful Master', icon: '✨', description: 'Advanced mindfulness practitioner' },
};

// Get user's current quest progress
export async function getUserQuestProgress(
  userUid: string, 
  questId: string
): Promise<{
  enrolled: boolean;
  progress: number;
  completed: boolean;
  activities: Record<string, number>;
}> {
  try {
    const progressRef = doc(db, 'users', userUid, 'questProgress', questId);
    const progressDoc = await getDoc(progressRef);
    
    if (progressDoc.exists()) {
      return progressDoc.data() as {
      enrolled: boolean;
      progress: number;
      completed: boolean;
      activities: Record<string, number>;
    };
    }
    
    return {
      enrolled: false,
      progress: 0,
      completed: false,
      activities: {},
    };
  } catch (error) {
    console.error('Error getting quest progress:', error);
    return { enrolled: false, progress: 0, completed: false, activities: {} };
  }
}

// Enroll user in a weekly quest
export async function enrollInQuest(user: User, questId: string): Promise<boolean> {
  try {
    const questRef = doc(db, 'weeklyQuests', questId);
    const progressRef = doc(db, 'users', user.uid, 'questProgress', questId);
    
    const batch = writeBatch(db);
    
    // Add user to quest participants
    batch.update(questRef, {
      participants: arrayUnion(user.uid),
    });
    
    // Initialize user progress
    batch.set(progressRef, {
      questId,
      userUid: user.uid,
      enrolled: true,
      progress: 0,
      completed: false,
      activities: {},
      enrolledAt: serverTimestamp(),
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error enrolling in quest:', error);
    return false;
  }
}

// Update quest progress when user completes activities
export async function updateQuestProgress(
  userUid: string,
  activityType: string,
  questId?: string
): Promise<void> {
  try {
    // Get all active quests user is enrolled in
    const activeQuests = await getActiveQuests();
    
    for (const quest of activeQuests) {
      if (!quest.participants.includes(userUid)) continue;
      
      const progressRef = doc(db, 'users', userUid, 'questProgress', quest.id);
      const progressDoc = await getDoc(progressRef);
      
      if (!progressDoc.exists()) continue;
      
      const progress = progressDoc.data() as {
        enrolled: boolean;
        progress: number;
        completed: boolean;
        activities: Record<string, number>;
        completedAt?: { toDate?: () => Date } | null;
      };
      if (progress.completed) continue;
      
      // Check if this activity counts for this quest
      const requirement = quest.requirement;
      if (requirement.activities && !requirement.activities.includes(activityType as never)) {
        continue;
      }
      
      // Update activity count
      const newActivities = { ...progress.activities };
      newActivities[activityType] = (newActivities[activityType] || 0) + 1;
      
      // Calculate new progress
      let newProgress = 0;
      if (requirement.type === 'count') {
        newProgress = Object.values(newActivities).reduce((sum: number, count: number) => sum + count, 0);
      } else if (requirement.type === 'variety') {
        newProgress = Object.keys(newActivities).length;
      } else if (requirement.type === 'streak') {
        // Streak calculation would need more complex logic
        newProgress = newActivities[activityType] || 0;
      }
      
      const completed = newProgress >= requirement.target;
      
      // Update progress
      await updateDoc(progressRef, {
        progress: newProgress,
        activities: newActivities,
        completed,
        completedAt: completed ? serverTimestamp() : null,
      });
      
      // If quest completed, award rewards
      if (completed && !progress.completed) {
        await completeQuest(userUid, quest);
      }
    }
  } catch (error) {
    console.error('Error updating quest progress:', error);
  }
}

// Complete a quest and award rewards
async function completeQuest(userUid: string, quest: WeeklyQuest): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // Award quest completion points
    const user = { uid: userUid } as User; // Simplified for this context
    await awardAuraPoints({
      user,
      activity: 'weekly_quest',
      description: `🏆 Completed "${quest.title}" quest!`,
      questId: quest.id,
    });
    
    // Award badge if specified
    if (quest.reward.badge) {
      const statsRef = getAuraStatsRef(userUid);
      batch.update(statsRef, {
        badges: arrayUnion(quest.reward.badge),
      });
    }
    
    // Add to quest completions
    const questRef = doc(db, 'weeklyQuests', quest.id);
    batch.update(questRef, {
      completions: arrayUnion(userUid),
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error completing quest:', error);
  }
}

// Get all active weekly quests
export async function getActiveQuests(): Promise<WeeklyQuest[]> {
  try {
    const now = Timestamp.now();
    const q = query(
      collection(db, 'weeklyQuests'),
      where('isActive', '==', true),
      where('duration.endDate', '>', now),
      orderBy('duration.endDate'),
      limit(10)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as WeeklyQuest[];
  } catch (error) {
    console.error('Error getting active quests:', error);
    return [];
  }
}

// Create weekly quests (admin function)
export async function createWeeklyQuest(questTemplate: typeof QUEST_TEMPLATES[0]): Promise<string> {
  try {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0); // Start of today
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7); // 7 days later
    
    const quest = {
      title: questTemplate.title,
      description: questTemplate.description,
      requirement: {
        type: questTemplate.requirement.type,
        target: questTemplate.requirement.target,
        activities: questTemplate.requirement.activities as never[],
      },
      reward: questTemplate.reward,
      duration: {
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
      },
      participants: [],
      completions: [],
      difficulty: questTemplate.difficulty,
      isActive: true,
      category: questTemplate.category,
    };
    
    const docRef = await addDoc(collection(db, 'weeklyQuests'), quest);
    return docRef.id;
  } catch (error) {
    console.error('Error creating weekly quest:', error);
    throw error;
  }
}

// Auto-generate weekly quests (would run on a schedule)
export async function generateWeeklyQuests(): Promise<void> {
  try {
    // Deactivate old quests
    const oldQuests = await getDocs(
      query(
        collection(db, 'weeklyQuests'),
        where('isActive', '==', true),
        where('duration.endDate', '<', Timestamp.now())
      )
    );
    
    const batch = writeBatch(db);
    oldQuests.docs.forEach(doc => {
      batch.update(doc.ref, { isActive: false });
    });
    
    // Create new quests - pick 3-4 different categories
    const categories = ['mindfulness', 'social', 'consistency', 'exploration'];
    const selectedTemplates = categories.map(category => {
      const categoryTemplates = QUEST_TEMPLATES.filter(t => t.category === category);
      return categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
    });
    
    // Create the new quests
    for (const template of selectedTemplates.slice(0, 3)) {
      await createWeeklyQuest(template);
    }
    
    await batch.commit();
  } catch (error) {
    console.error('Error generating weekly quests:', error);
  }
}

// Get user's quest history and achievements
export async function getUserQuestHistory(userUid: string): Promise<{
  completed: number;
  totalPoints: number;
  badges: string[];
  currentQuests: Array<Record<string, unknown>>;
}> {
  try {
    const progressQuery = query(
      collection(db, 'users', userUid, 'questProgress'),
      orderBy('enrolledAt', 'desc'),
      limit(20)
    );
    
    const snapshot = await getDocs(progressQuery);
    const questProgress = snapshot.docs.map(doc => doc.data()) as Array<{
      completed: boolean;
      rewardPoints?: number;
    }>;
    
    const completed = questProgress.filter(q => q.completed).length;
    const totalPoints = questProgress
      .filter(q => q.completed)
      .reduce((sum, q) => sum + (q.rewardPoints || 0), 0);
    
    // Get current active quests
    const currentQuests = questProgress.filter(q => !q.completed) as Array<Record<string, unknown>>;
    
    // Get user stats for badges
    const stats = await getDoc(getAuraStatsRef(userUid));
    const badges = stats.exists() ? stats.data().badges : [];
    
    return {
      completed,
      totalPoints,
      badges,
      currentQuests,
    };
  } catch (error) {
    console.error('Error getting quest history:', error);
    return { completed: 0, totalPoints: 0, badges: [], currentQuests: [] };
  }
}