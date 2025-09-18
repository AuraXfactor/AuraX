"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { acceptFriendRequest, getFriendStatus, searchUsers, sendFriendRequest } from '@/lib/friends';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function FriendsPage() {
  const { user } = useAuth();
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [accepted, setAccepted] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const friendsCol = collection(db, 'users', user.uid, 'friends');
    const unsub = onSnapshot(friendsCol, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPending(all.filter((f) => f.status === 'pending'));
      setAccepted(all.filter((f) => f.status === 'accepted'));
    });
    return () => unsub();
  }, [user]);

  const onSearch = async () => {
    const r = await searchUsers(term);
    setResults(r);
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Login required</div>;
  }

  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Friends</h1>

      <div className="p-4 rounded-xl border space-y-3">
        <div className="font-medium">Find friends</div>
        <div className="flex gap-2">
          <input value={term} onChange={(e)=>setTerm(e.target.value)} placeholder="Username, email or phone" className="flex-1 border rounded-md p-2" />
          <button onClick={onSearch} className="px-4 py-2 rounded-md border">Search</button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {results.map((u) => (
            <div key={u.uid} className="p-3 rounded border flex items-center justify-between">
              <div>
                <div className="font-medium">{u.username || u.name || u.email || u.uid}</div>
                <div className="text-xs opacity-70">{u.email}</div>
              </div>
              <button onClick={async()=>{ await sendFriendRequest(user, u.uid); }} className="px-3 py-1.5 rounded-md bg-blue-600 text-white">Add</button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-4 rounded-xl border">
          <div className="font-medium mb-2">Pending</div>
          <div className="space-y-2">
            {pending.length === 0 && <div className="text-sm opacity-70">No pending requests</div>}
            {pending.map((f) => (
              <div key={f.friendUid} className="flex items-center justify-between p-2 rounded border">
                <div className="text-sm">{f.friendUid}</div>
                <button onClick={async()=>{ await acceptFriendRequest(user, f.friendUid); }} className="px-3 py-1.5 rounded-md bg-emerald-600 text-white">Accept</button>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-xl border">
          <div className="font-medium mb-2">Friends</div>
          <div className="space-y-2">
            {accepted.length === 0 && <div className="text-sm opacity-70">No friends yet</div>}
            {accepted.map((f) => (
              <div key={f.friendUid} className="flex items-center justify-between p-2 rounded border">
                <div className="text-sm">{f.friendUid}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

