import { User } from 'firebase/auth';
import { collection, doc, getDoc, increment, serverTimestamp, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export type StreakActivity = 'journal' | 'toolkit' | 'recover';

export type StreakEntry = {
  date: Timestamp;
  activitiesCompleted: StreakActivity[];
  streakCount: number;
  shieldUsed: boolean;
};

function formatDateKeyUTC(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function getTodayStreakDocRef(user: User) {
  const todayKey = formatDateKeyUTC(new Date());
  const docRef = doc(db, 'users', user.uid);
  const dayDocRef = doc(collection(docRef, 'streaks'), todayKey);
  return dayDocRef;
}

type UserStreakAggregate = {
  lastStreakKey?: string | null;
  currentStreak?: number;
  streakShields?: number;
};

export async function getLatestStreak(user: User): Promise<{ lastKey: string | null; count: number; shieldBank: number; }> {
  const userDocRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userDocRef);
  const data = (snap.exists() ? (snap.data() as UserStreakAggregate) : {});
  const lastKey = data.lastStreakKey ?? null;
  const count = data.currentStreak ?? 0;
  const shieldBank = data.streakShields ?? 0;
  return { lastKey, count, shieldBank };
}

export async function awardShieldIfEligible(user: User, newCount: number, isJournalDay: boolean) {
  // Award one shield when crossing 7 days of journal streak
  if (isJournalDay && newCount === 7) {
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, { streakShields: increment(1) });
  }
}

export async function logStreakActivity(user: User, activity: StreakActivity, extraAura: number = 0) {
  const today = new Date();
  const todayKey = formatDateKeyUTC(today);

  const userDocRef = doc(db, 'users', user.uid);
  const todayDocRef = doc(collection(userDocRef, 'streaks'), todayKey);
  const todaySnap = await getDoc(todayDocRef);
  const { lastKey, count, shieldBank } = await getLatestStreak(user);

  let newActivities: StreakActivity[] = [activity];
  let newCount = count;
  let shieldUsed = false;

  let auraDelta = 0;
  if (todaySnap.exists()) {
    const data = todaySnap.data() as Partial<StreakEntry>;
    const existing: StreakActivity[] = Array.isArray(data.activitiesCompleted) ? data.activitiesCompleted : [];
    if (!existing.includes(activity)) {
      newActivities = Array.from(new Set([...existing, activity]));
      auraDelta = 1; // extra aura for new unique activity today
    } else {
      newActivities = existing;
      auraDelta = 0;
    }
    newCount = typeof data.streakCount === 'number' ? data.streakCount : count;
    shieldUsed = Boolean(data.shieldUsed);
  } else {
    // Determine if this continues streak
    const prevDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1));
    const prevKey = formatDateKeyUTC(prevDate);
    const hadYesterday = lastKey === prevKey;
    if (hadYesterday) {
      newCount = count + 1;
    } else {
      // Gap detected: try to use a shield
      if (shieldBank > 0) {
        shieldUsed = true;
        newCount = Math.max(1, count + 1); // resume as if protected
        await updateDoc(userDocRef, { streakShields: increment(-1) });
      } else {
        newCount = 1;
      }
    }
    auraDelta = 1; // first activity of the day grants +1 aura
  }

  await setDoc(
    todayDocRef,
    {
      date: serverTimestamp(),
      activitiesCompleted: newActivities,
      streakCount: newCount,
      shieldUsed,
    },
    { merge: true }
  );

  // Update user-level aggregates
  await setDoc(
    userDocRef,
    {
      lastStreakKey: todayKey,
      currentStreak: newCount,
      auraTotal: increment(auraDelta + extraAura),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // Award shield at milestones
  const isJournalDay = newActivities.includes('journal') || activity === 'journal';
  await awardShieldIfEligible(user, newCount, isJournalDay);

  return { newCount, activities: newActivities, shieldUsed, auraDelta };
}

