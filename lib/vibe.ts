import { auth, db } from '@/lib/firebase';
import { addDoc, collection, getDocs, query, serverTimestamp, Timestamp, where } from 'firebase/firestore';
import { writeTodayScore } from '@/lib/score';

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function submitVibe(mood: number, note?: string) {
  if (typeof window === 'undefined') return;
  const user = auth?.currentUser;
  if (!user) return;

  // Write vibe entry
  await addDoc(collection(db, 'users', user.uid, 'vibes'), {
    mood,
    note: note ?? null,
    timestamp: serverTimestamp(),
  });

  // Recompute today's score with simple weights
  const sod = startOfDay(new Date());
  const eod = new Date(sod);
  eod.setDate(eod.getDate() + 1);

  // Boosts completed today
  const boostsQ = query(
    collection(db, 'users', user.uid, 'userBoosts'),
    where('timestamp', '>=', Timestamp.fromDate(sod)),
    where('timestamp', '<', Timestamp.fromDate(eod))
  );
  const boostsSnap = await getDocs(boostsQ);
  const boostsCount = boostsSnap.size;

  // Simple weighted algorithm
  const moodNorm = Math.max(0, Math.min(100, Math.round(((mood - 1) / 4) * 100)));
  const boostsNorm = Math.max(0, Math.min(100, Math.round((Math.min(boostsCount, 5) / 5) * 100)));
  const glowsNorm = 0; // Placeholder until Glow interactions are implemented

  const moodWeight = 0.5;
  const boostsWeight = 0.3;
  const glowsWeight = 0.2;

  const score = Math.round(moodNorm * moodWeight + boostsNorm * boostsWeight + glowsNorm * glowsWeight);
  await writeTodayScore(score);
}

