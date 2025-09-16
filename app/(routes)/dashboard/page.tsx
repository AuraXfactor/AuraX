'use client';
import Link from 'next/link';
import { AuraRing } from '@/components/AuraRing';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

export default function DashboardPage() {
  const [score, setScore] = useState<number>(0);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) return;
      const scoresCol = collection(db, 'users', user.uid, 'userScores');
      const q = query(scoresCol, orderBy('timestamp', 'desc'));
      return onSnapshot(q, (snap) => {
        const latest = snap.docs[0]?.data() as { score?: number } | undefined;
        setScore(Math.max(0, Math.min(100, latest?.score ?? 0)));
      });
    });
    return () => unsubAuth();
  }, []);

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-col items-center gap-6">
          <AuraRing score={score} />
          <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3">
            <Link href="/journal" className="glass rounded-xl p-4 text-center text-sm hover:opacity-90">Journal</Link>
            <Link href="/toolkit" className="glass rounded-xl p-4 text-center text-sm hover:opacity-90">Toolkit</Link>
            <Link href="/friends" className="glass rounded-xl p-4 text-center text-sm hover:opacity-90">Friends</Link>
            <Link href="/chat" className="glass rounded-xl p-4 text-center text-sm hover:opacity-90">Chat</Link>
            <Link href="/community" className="glass rounded-xl p-4 text-center text-sm hover:opacity-90">Community</Link>
            <Link href="/notifications" className="glass rounded-xl p-4 text-center text-sm hover:opacity-90">Notifications</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

