"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createSupportCircle, updateCircleProgress } from '@/lib/circles';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logStreakActivity } from '@/lib/streaks';

type CircleDoc = {
  id: string;
  circleId?: string;
  members?: string[];
  challengeName?: string;
  progress?: Record<string, number>;
  status?: 'active' | 'completed' | 'paused';
};

export default function CirclesPage() {
  const { user } = useAuth();
  const [circleId, setCircleId] = useState('');
  const [challengeName, setChallengeName] = useState('7-day Gratitude');
  const [members, setMembers] = useState('');
  const [circles, setCircles] = useState<CircleDoc[]>([]);

  useEffect(() => {
    if (!user) return;
    const col = collection(db, 'users', user.uid, 'supportCircles');
    const unsub = onSnapshot(col, (snap) => {
      setCircles(snap.docs.map((d) => ({ id: d.id, ...(d.data() as unknown as Omit<CircleDoc, 'id'>) })));
    });
    return () => unsub();
  }, [user]);

  if (!user) return <div className="min-h-screen flex items-center justify-center">Login required</div>;

  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Support Circles</h1>

      <div className="p-4 rounded-xl border space-y-3">
        <div className="font-medium">Create a circle</div>
        <div className="grid sm:grid-cols-3 gap-2">
          <input value={circleId} onChange={(e)=>setCircleId(e.target.value)} placeholder="Circle ID" className="border rounded-md p-2" />
          <input value={challengeName} onChange={(e)=>setChallengeName(e.target.value)} placeholder="Challenge name" className="border rounded-md p-2" />
          <input value={members} onChange={(e)=>setMembers(e.target.value)} placeholder="Member UIDs (comma-separated)" className="border rounded-md p-2" />
        </div>
        <button onClick={async()=>{
          const list = members.split(',').map(s=>s.trim()).filter(Boolean);
          await createSupportCircle(user, circleId.trim(), list, challengeName.trim());
        }} className="px-4 py-2 rounded-md bg-blue-600 text-white">Create</button>
      </div>

      <div className="space-y-4">
        {circles.map((c) => (
          <div key={c.circleId || c.id} className="p-4 rounded-xl border">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{c.challengeName}</div>
                <div className="text-xs opacity-70">Members: {Array.isArray(c.members) ? c.members.join(', ') : ''}</div>
              </div>
              <button onClick={async()=>{ await updateCircleProgress(user, c.circleId || c.id, 1); try { await logStreakActivity(user, 'journal'); } catch {} }} className="px-3 py-1.5 rounded-md bg-emerald-600 text-white">Mark Today</button>
            </div>
            <div className="mt-3">
              <div className="text-sm">Your progress: {c.progress?.[user.uid] ?? 0}</div>
              <div className="h-2 rounded bg-white/10 mt-2">
                <div className="h-2 rounded bg-emerald-500" style={{ width: `${Math.min(100, (Number(c.progress?.[user.uid] ?? 0) / 7) * 100)}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

