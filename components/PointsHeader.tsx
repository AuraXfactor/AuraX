"use client";
import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { SparklesIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

export function PointsHeader() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [points, setPoints] = useState<number>(0);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, setFirebaseUser);
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    const ref = doc(db, 'users', firebaseUser.uid);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data();
      setPoints((data?.points as number) ?? 0);
    });
    return () => unsub();
  }, [firebaseUser]);

  return (
    <div className="mb-6 flex items-center justify-between">
      <Link href="/app" className="text-lg font-semibold">✨ Aura</Link>
      <div className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm">
        <SparklesIcon className="h-5 w-5 text-neon-yellow" />
        <span className="font-medium">{points}</span>
        <Link href="/app/boosts" className="ml-3 text-[rgba(230,230,255,0.8)] underline-offset-4 hover:underline">Boosts</Link>
      </div>
    </div>
  );
}

