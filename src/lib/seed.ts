import { User } from 'firebase/auth';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  awardAuraPoints,
  getAuraStatsRef,
} from '@/lib/auraPoints';
import { createAuraSquad, startSquadChallenge } from '@/lib/auraSquads';
import { createGroupChat, sendGroupMessage, createAuraPost } from '@/lib/friends';
import { initializeRewardsStore } from '@/lib/rewardsStore';
import { ensureUserProfile, setUserAddiction, logCraving, addShadowBox, addWhisper } from '@/lib/userProfile';

type SeedResult = {
  ensuredUserProfile: boolean;
  auraStatsInitialized: boolean;
  rewardsInitialized: boolean;
  weeklyQuestsCreated: number;
  sampleSquadId?: string;
  sampleGroupId?: string;
  sampleAuraPostId?: string;
  journalSeeded: boolean;
  specializedJournalsSeeded: string[];
  goalDocCreated: boolean;
  recoveryUpdated: boolean;
  pointsAwarded: boolean;
};

async function ensureAuraStats(user: User): Promise<boolean> {
  const statsRef = getAuraStatsRef(user.uid);
  const snap = await getDoc(statsRef);
  if (!snap.exists()) {
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
      badges: [] as string[],
      achievements: [] as string[],
      joinedSquads: [] as string[],
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
    await setDoc(statsRef, initialStats);
    return true;
  }
  return false;
}

async function maybeInitializeRewards(): Promise<boolean> {
  const rewardsSnap = await getDocs(query(collection(db, 'rewards'), limit(1)));
  if (!rewardsSnap.empty) return false;
  await initializeRewardsStore();
  return true;
}

async function maybeCreateWeeklyQuests(): Promise<number> {
  const existing = await getDocs(query(collection(db, 'weeklyQuests'), limit(1)));
  if (!existing.empty) return 0;

  const now = new Date();
  const startDate = Timestamp.fromDate(now);
  const end = new Date(now);
  end.setDate(end.getDate() + 7);
  const endDate = Timestamp.fromDate(end);

  const quests = [
    {
      title: 'Mindful Week',
      description: 'Complete 5 meditation sessions this week',
      requirement: { type: 'count', target: 5, activities: ['meditation_complete'] },
      reward: { points: 75, badge: 'zen_master' },
      duration: { startDate, endDate },
      participants: [],
      completions: [],
      difficulty: 'medium',
      isActive: true,
      category: 'mindfulness',
    },
    {
      title: 'Social Butterfly',
      description: 'Support 10 friend Auras this week',
      requirement: { type: 'count', target: 10, activities: ['friend_support'] },
      reward: { points: 50, badge: 'supportive_friend' },
      duration: { startDate, endDate },
      participants: [],
      completions: [],
      difficulty: 'medium',
      isActive: true,
      category: 'social',
    },
    {
      title: 'Wellness Explorer',
      description: 'Try meditation, workout, and journaling in one week',
      requirement: { type: 'variety', target: 3, activities: ['meditation_complete', 'workout_complete', 'journal_entry'] },
      reward: { points: 75, badge: 'well_rounded' },
      duration: { startDate, endDate },
      participants: [],
      completions: [],
      difficulty: 'easy',
      isActive: true,
      category: 'exploration',
    },
  ];

  for (const quest of quests) {
    await addDoc(collection(db, 'weeklyQuests'), quest);
  }
  return quests.length;
}

async function maybeCreateSampleSquad(user: User): Promise<string | undefined> {
  const stats = await getDoc(getAuraStatsRef(user.uid));
  const joined = (stats.exists() ? (stats.data().joinedSquads as string[] | undefined) : undefined) || [];
  if (joined.length > 0) return undefined;
  const id = await createAuraSquad({
    creator: user,
    name: 'Sample Squad',
    description: 'A demo squad to explore challenges',
    isPrivate: true,
    initialMembers: [],
  });
  // Optionally start a simple challenge
  try {
    await startSquadChallenge(user, id, 'journal_entries');
  } catch {}
  return id;
}

async function maybeCreateSampleGroup(user: User): Promise<string | undefined> {
  const existing = await getDocs(
    query(
      collection(db, 'groupChats'),
      limit(1)
    )
  );
  if (!existing.empty) return undefined;
  const groupId = await createGroupChat({ user, name: 'Wellness Circle', description: 'Welcome and say hi!', memberUids: [], isPrivate: true });
  await sendGroupMessage({ user, groupId, content: '👋 Welcome to the Wellness Circle!', type: 'text' });
  return groupId;
}

async function maybeCreateAuraPost(user: User): Promise<string | undefined> {
  const posts = await getDocs(query(collection(db, 'auraPosts'), orderBy('createdAt', 'desc'), limit(1)));
  if (!posts.empty) return undefined;
  const postId = await createAuraPost({
    user,
    content: 'Grateful for small wins today ✨',
    type: 'text',
    moodTag: 'grateful',
    emoji: '🌟',
    visibility: 'friends',
  });
  return postId;
}

async function maybeAddDemoFriend(user: User): Promise<void> {
  const friendRef = doc(collection(db, 'users', user.uid, 'friends'), 'demo-friend');
  const snap = await getDoc(friendRef);
  if (snap.exists()) return;
  await setDoc(friendRef, {
    userUid: user.uid,
    friendUid: 'demo-friend',
    friendName: 'Demo Friend',
    friendUsername: 'demo',
    friendAvatar: null,
    createdAt: serverTimestamp(),
    lastInteraction: serverTimestamp(),
  });
}

async function maybeSeedJournal(user: User): Promise<boolean> {
  const col = collection(db, 'journals', user.uid, 'entries');
  const snap = await getDocs(query(col, limit(1)));
  if (!snap.empty) return false;
  await addDoc(col, {
    entryText: 'First entry: excited to build healthy habits! 🚀',
    moodTag: 'happy',
    activities: ['journaling', 'reading'],
    affirmation: 'I am making steady progress.',
    auraScore: 22,
    dateKey: new Date().toISOString().split('T')[0],
    createdAt: serverTimestamp(),
  });
  return true;
}

async function maybeSeedSpecializedJournals(user: User): Promise<string[]> {
  const seeded: string[] = [];
  const root = collection(db, 'specialized-journals');

  const kinds = [
    { key: 'daily-checkin', sample: { journalType: 'daily-checkin', mood: { value: 'happy', customLabel: null }, heartSpeak: 'Feeling optimistic.', gratitude: ['Life', 'Health', 'Family'], selfCareActivities: ['Meditation'], completionScore: 70 } },
    { key: 'gratitude', sample: { journalType: 'gratitude', dailyHighlight: 'A kind message from a friend', gratitudeItems: [{ item: 'Coffee', why: 'Gave me energy' }], completionScore: 60 } },
    { key: 'relationship', sample: { journalType: 'relationship', relationship: { type: 'friend', personName: 'Alex', interactionQuality: 4 }, completionScore: 55 } },
    { key: 'cbt-therapy', sample: { journalType: 'cbt-therapy', situation: 'Presentation tomorrow', emotion: { type: 'anxious', initialIntensity: 6, finalIntensity: 4, improvement: 2 }, balancedThought: 'I have prepared well.', completionScore: 75 } },
    { key: 'goal-achievement', sample: { journalType: 'goal-achievement', goalTitle: 'Read 10 pages', dailyProgress: [{ task: 'Read 10 pages', completed: true }], completionScore: 80 } },
  ];

  for (const k of kinds) {
    const col = collection(db, 'specialized-journals', user.uid, k.key);
    const snap = await getDocs(query(col, limit(1)));
    if (snap.empty) {
      await addDoc(col, { ...k.sample, userId: user.uid, dateKey: new Date().toISOString().split('T')[0], timestamp: serverTimestamp() });
      seeded.push(k.key);
    }
  }
  return seeded;
}

async function maybeCreateGoal(user: User): Promise<boolean> {
  const ref = doc(db, 'user-goals', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return false;
  await updateDoc(ref, {
    title: 'Build a daily journaling habit',
    description: 'Write at least 50 words each day',
    targetDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    progress: 10,
    createdAt: serverTimestamp(),
  });
  return true;
}

async function maybeSeedRecovery(user: User): Promise<boolean> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  const hadRecovery = snap.exists() && Boolean((snap.data() as Record<string, unknown>).recovery);
  await setUserAddiction(user, 'screen time');
  await logCraving(user, 'Calm');
  await addShadowBox(user, 'I need to check my phone again', 'I can wait 10 minutes and breathe.');
  await addWhisper(user, 'I am in control of my attention.');
  return !hadRecovery;
}

async function maybeAwardWelcomePoints(user: User): Promise<boolean> {
  const txCol = collection(db, 'users', user.uid, 'pointTransactions');
  const snap = await getDocs(query(txCol, limit(1)));
  if (!snap.empty) return false;
  const res = await awardAuraPoints({
    user,
    activity: 'first_time_bonus',
    proof: { type: 'streak_count', value: 1 },
    description: '🎉 Welcome bonus for setting up your account',
  });
  return res.success;
}

export async function seedAll(user: User): Promise<SeedResult> {
  // Ensure base user data
  await ensureUserProfile(user);
  const auraStatsInitialized = await ensureAuraStats(user);

  // Global collections
  const [rewardsInitialized, weeklyQuestCount] = await Promise.all([
    maybeInitializeRewards(),
    maybeCreateWeeklyQuests(),
  ]);

  // User-scoped sample content
  const [sampleSquadId, sampleGroupId, sampleAuraPostId] = await Promise.all([
    maybeCreateSampleSquad(user),
    maybeCreateSampleGroup(user),
    maybeCreateAuraPost(user),
  ]);

  const [journalSeeded, specializedJournalsSeeded, goalDocCreated, recoveryUpdated, pointsAwarded] = await Promise.all([
    maybeSeedJournal(user),
    maybeSeedSpecializedJournals(user),
    maybeCreateGoal(user),
    maybeSeedRecovery(user),
    maybeAwardWelcomePoints(user),
  ]);

  // Add a demo friend for UI flows that expect friends
  await maybeAddDemoFriend(user);

  return {
    ensuredUserProfile: true,
    auraStatsInitialized,
    rewardsInitialized,
    weeklyQuestsCreated: weeklyQuestCount,
    sampleSquadId,
    sampleGroupId,
    sampleAuraPostId,
    journalSeeded,
    specializedJournalsSeeded,
    goalDocCreated,
    recoveryUpdated,
    pointsAwarded,
  };
}

