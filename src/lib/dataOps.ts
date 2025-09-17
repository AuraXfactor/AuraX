import { collection, doc, addDoc, setDoc, serverTimestamp, increment, getDoc, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import { AuraStats, JournalEntryData, ToolkitUsageLog, formatDateKeyFromDate } from './dataModels';

function getUserDocRef(uid: string) {
  return doc(db, 'users', uid);
}

function getUserEntriesCollection(uid: string) {
  return collection(db, 'users', uid, 'entries');
}

function getUserToolkitUsageCollection(uid: string) {
  return collection(db, 'users', uid, 'toolkitUsage');
}

export async function addJournalEntry(params: {
  uid: string;
  mood: string;
  activities: string[];
  notes: string;
  affirmation?: string | null;
  voiceMemoUrl?: string | null;
  date?: Date;
  auraPoints: number;
}) {
  const { uid, mood, activities, notes, affirmation, voiceMemoUrl, date, auraPoints } = params;
  const createdAt = serverTimestamp();
  const dateKey = formatDateKeyFromDate(date ?? new Date());
  const data: JournalEntryData = {
    mood,
    activities,
    notes,
    affirmation: affirmation ?? null,
    voiceMemoUrl: voiceMemoUrl ?? null,
    auraPoints,
    dateKey,
    createdAt,
  };
  const col = getUserEntriesCollection(uid);
  const ref = await addDoc(col, data as any);
  return { ref, dateKey };
}

export async function incrementAuraPoints(uid: string, points: number) {
  const auraStatsRef = doc(db, 'users', uid, 'auraStats', 'current');
  await setDoc(
    auraStatsRef,
    { totalAuraPoints: increment(points), updatedAt: serverTimestamp() } as Partial<AuraStats>,
    { merge: true }
  );
}

function isYesterday(prevDateKey: string, newDateKey: string) {
  const [y, m, d] = prevDateKey.split('-').map((v) => parseInt(v, 10));
  const prev = new Date(y, m - 1, d);
  const [ny, nm, nd] = newDateKey.split('-').map((v) => parseInt(v, 10));
  const curr = new Date(ny, nm - 1, nd);
  const diff = Math.round((curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));
  return diff === 1;
}

export async function updateJournalStreak(uid: string, dateKey: string) {
  const auraStatsRef = doc(db, 'users', uid, 'auraStats', 'current');
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(auraStatsRef);
    const data = (snap.exists() ? (snap.data() as AuraStats) : undefined) ?? undefined;
    const last = data?.lastJournalDateKey ?? null;
    let nextStreak = data?.journalStreakDays ?? 0;
    if (last === dateKey) {
      // already counted today; no change
      nextStreak = data?.journalStreakDays ?? 1;
    } else if (last && isYesterday(last, dateKey)) {
      nextStreak = (data?.journalStreakDays ?? 0) + 1;
    } else {
      nextStreak = 1;
    }
    tx.set(
      auraStatsRef,
      { lastJournalDateKey: dateKey, journalStreakDays: nextStreak, updatedAt: serverTimestamp() } as Partial<AuraStats>,
      { merge: true }
    );
  });
}

export async function logToolkitUsage(params: {
  uid: string;
  toolName: string;
  durationSec: number;
  reliefLevel?: number | null;
  auraPoints: number;
}) {
  const { uid, toolName, durationSec, reliefLevel, auraPoints } = params;
  const log: ToolkitUsageLog = {
    toolName,
    durationSec,
    reliefLevel: reliefLevel ?? null,
    auraPoints,
    createdAt: serverTimestamp(),
  };
  const col = getUserToolkitUsageCollection(uid);
  const id = `${toolName}_${Date.now()}`;
  await setDoc(doc(col, id), log as any, { merge: true });
}
