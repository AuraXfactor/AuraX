"use client";
import { AuraRing } from '@/components/AuraRing';
import { VibeCheck } from '@/components/VibeCheck';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

export default function AppHomePage() {
  const [score, setScore] = useState<number>(0);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsub) {
        unsub();
        unsub = null;
      }
      if (!user) return;
      const scoresCol = collection(db, 'users', user.uid, 'userScores');
      const q = query(scoresCol, orderBy('timestamp', 'desc'));
      unsub = onSnapshot(q, (snap) => {
        const latest = snap.docs[0]?.data() as { score?: number } | undefined;
        setScore(Math.max(0, Math.min(100, latest?.score ?? 0)));
      });
    });
    return () => {
      unsubAuth();
      if (unsub) unsub();
    };
  }, []);

  return (
    <main className="grid place-items-center">
      <div className="glass w-full rounded-2xl p-6 shadow-glow">
        <div className="flex flex-col items-center gap-6">
          <AuraRing score={score} />
          <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
            <VibeCheck />
            <a href="/app/boosts" className="glass rounded-2xl p-4 text-center text-sm hover:opacity-90">Open Aura Boosts →</a>
          </div>
        </div>
      </div>
    </main>
  );
}


