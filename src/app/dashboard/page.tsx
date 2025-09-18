"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendCheer } from '@/lib/cheers';

interface FriendDoc { id: string; friendUid: string; status: 'pending' | 'accepted'; since?: unknown }
interface UserAggregate { currentStreak?: number; auraTotal?: number; streakShields?: number; lastStreakKey?: string }
interface CircleRow { id: string; challengeName?: string; progress?: Record<string, number> }
interface CheerRow { id: string; fromUid: string; emoji: string; message?: string }

export default function DashboardPage() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserAggregate | null>(null);
  const [friends, setFriends] = useState<FriendDoc[]>([]);
  const [friendProfiles, setFriendProfiles] = useState<Record<string, UserAggregate>>({});
  const [cheers, setCheers] = useState<CheerRow[]>([]);
  const [circles, setCircles] = useState<CircleRow[]>([]);

  const todayKey = useMemo(() => {
    const d = new Date();
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    const unsubUser = onSnapshot(ref, (snap) => setUserData((snap.data() as UserAggregate) ?? null));
    const unsubFriends = onSnapshot(collection(ref, 'friends'), (snap) => setFriends(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FriendDoc, 'id'>) }))));
    const unsubCheers = onSnapshot(collection(ref, 'cheers'), (snap) => setCheers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CheerRow, 'id'>) }))));
    const unsubCircles = onSnapshot(collection(ref, 'supportCircles'), (snap) => setCircles(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CircleRow, 'id'>) }))));
    return () => { unsubUser(); unsubFriends(); unsubCheers(); unsubCircles(); };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const accepted = friends.filter((f) => f.status === 'accepted');
    const unsubs: Array<() => void> = [];
    accepted.forEach((f) => {
      const friendRef = doc(db, 'users', f.friendUid);
      const unsub = onSnapshot(friendRef, (snap) => {
        setFriendProfiles((prev) => ({ ...prev, [f.friendUid]: (snap.data() as UserAggregate) ?? {} }));
      });
      unsubs.push(unsub);
    });
    return () => { unsubs.forEach((u) => u()); };
  }, [user, friends]);

  if (!user) return <div className="min-h-screen flex items-center justify-center">Login required</div>;

  const acceptedFriends = friends.filter((f) => f.status === 'accepted');

  return (
    <main className="min-h-screen p-6 md:p-10 space-y-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-extrabold">Dashboard</h1>

      <section className="grid md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl border">
          <div className="text-sm opacity-70">Your streak</div>
          <div className="text-4xl font-bold">{userData?.currentStreak ?? 0} 🔥</div>
          <div className="mt-2 text-sm">Aura points: <span className="font-semibold">{userData?.auraTotal ?? 0}</span></div>
          <div className="mt-2 text-sm">Shields: <span className="font-semibold">{userData?.streakShields ?? 0}</span></div>
        </div>

        <div className="p-5 rounded-2xl border md:col-span-2">
          <div className="font-semibold mb-2">Friends&apos; streaks</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {acceptedFriends.length === 0 && <div className="text-sm opacity-70">No friends yet</div>}
            {acceptedFriends.map((f) => (
              <div key={f.friendUid} className="p-3 rounded-xl border flex items-center justify-between">
                <div>
                  <div className="font-medium">{f.friendUid}</div>
                  <div className="text-xs opacity-70">Streak: {friendProfiles[f.friendUid]?.currentStreak ?? 0} 🔥</div>
                  <div className="text-xs opacity-70">Shared: {Math.min(Number(userData?.currentStreak ?? 0), Number(friendProfiles[f.friendUid]?.currentStreak ?? 0))}</div>
                </div>
                <button className="px-3 py-1.5 rounded-md bg-amber-500 text-white" onClick={async()=>{ await sendCheer(user, f.friendUid, '👏', 'You got this!'); }}>Cheer</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl border">
          <div className="font-semibold mb-2">Support circles</div>
          <div className="space-y-3">
            {circles.length === 0 && <div className="text-sm opacity-70">No circles yet</div>}
            {circles.map((c) => {
              const myProgress = Number(c.progress?.[user.uid] ?? 0);
              const pct = Math.min(100, (myProgress / 7) * 100);
              return (
                <div key={c.id} className="p-3 rounded-xl border">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{c.challengeName}</div>
                    <div className="text-sm opacity-70">{myProgress} / 7</div>
                  </div>
                  <div className="h-2 rounded bg-white/10 mt-2">
                    <div className="h-2 rounded bg-blue-600" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-5 rounded-2xl border">
          <div className="font-semibold mb-2">Notifications</div>
          <div className="space-y-2 text-sm">
            {acceptedFriends.map((f) => {
              const prof = friendProfiles[f.friendUid] ?? {};
              if (prof.lastStreakKey === todayKey) {
                return (
                  <div key={`streak-${f.friendUid}`} className="p-2 rounded border">
                    🔥 {f.friendUid} just saved their streak!
                  </div>
                );
              }
              return null;
            })}
            {cheers.slice().reverse().map((c) => (
              <div key={c.id} className="p-2 rounded border">
                <span className="mr-2">{c.emoji}</span> From {c.fromUid}: {c.message || '✨ Cheer received!'}
              </div>
            ))}
            {cheers.length === 0 && <div className="opacity-70">No cheers yet</div>}
          </div>
        </div>
      </section>
    </main>
  );
}

