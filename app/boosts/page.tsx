"use client";
import { useEffect, useMemo, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { addDoc, collection, doc, increment, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

type Boost = {
  id: string;
  title: string;
  type: 'breathe' | 'checkin' | 'gratitude' | 'move' | 'motivate';
  points: number;
};

const defaultBoosts: Boost[] = [
  { id: 'breathe-1', title: '1-Min Breather', type: 'breathe', points: 5 },
  { id: 'checkin-1', title: 'Vibe Check', type: 'checkin', points: 5 },
  { id: 'gratitude-1', title: 'List 3 Gratitudes', type: 'gratitude', points: 8 },
  { id: 'move-1', title: '2-Min Move', type: 'move', points: 8 },
  { id: 'motivate-1', title: 'Daily Spark', type: 'motivate', points: 4 },
];

export const dynamic = 'force-dynamic';

export default function BoostsPage() {
  const [completing, setCompleting] = useState<string | null>(null);

  async function complete(boost: Boost) {
    if (!auth.currentUser) return;
    setCompleting(boost.id);
    try {
      const uid = auth.currentUser.uid;
      // Log completion
      const compCol = collection(db, 'users', uid, 'userBoosts');
      await addDoc(compCol, {
        boostId: boost.id,
        title: boost.title,
        type: boost.type,
        points: boost.points,
        timestamp: serverTimestamp(),
      });

      // Increment user points and write a transaction
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { points: increment(boost.points) }, { merge: true });
      const txCol = collection(db, 'users', uid, 'transactions');
      await addDoc(txCol, {
        type: 'earn',
        source: `boost:${boost.id}`,
        amount: boost.points,
        timestamp: serverTimestamp(),
      });

      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } finally {
      setCompleting(null);
    }
  }

  return (
    <main>
      <h1 className="mb-4 text-xl font-semibold">Aura Boosts</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {defaultBoosts.map((b) => (
          <motion.div
            key={b.id}
            className="glass rounded-2xl p-4 hover:shadow-glow"
            whileHover={{ y: -2 }}
          >
            <div className="mb-2 text-sm uppercase tracking-wider text-[rgba(230,230,255,0.75)]">{b.type}</div>
            <div className="mb-4 text-lg font-medium">{b.title}</div>
            <button
              onClick={() => complete(b)}
              disabled={completing === b.id}
              className="w-full rounded-xl bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan px-4 py-2 font-semibold text-black disabled:opacity-60"
            >
              {completing === b.id ? 'Completing...' : `Complete (+${b.points})`}
            </button>
          </motion.div>
        ))}
      </div>
    </main>
  );
}

