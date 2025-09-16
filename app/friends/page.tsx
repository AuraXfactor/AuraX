'use client';
import { useEffect, useMemo, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';

type Friend = { id: string; displayName?: string | null; email?: string | null };

export default function FriendsPage() {
  const [me, setMe] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Friend[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setMe(u?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!me) return;
    const q = query(collection(db, 'users', me, 'friends'));
    const unsub = onSnapshot(q, (snap) => {
      const list: Friend[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setFriends(list);
    });
    return () => unsub();
  }, [me]);

  const friendIds = useMemo(() => new Set(friends.map((f) => f.id)), [friends]);

  async function onSearch() {
    if (!search.trim()) return setResults([]);
    const q = query(collection(db, 'directory'), where('keywords', 'array-contains', search.toLowerCase()));
    const snap = await (await import('firebase/firestore')).getDocs(q);
    const found: Friend[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    setResults(found.filter((u) => u.id !== me));
  }

  async function addFriend(userId: string, meta?: Partial<Friend>) {
    if (!me) return;
    await addDoc(collection(db, 'users', me, 'friends'), {
      id: userId,
      displayName: meta?.displayName ?? null,
      email: meta?.email ?? null,
      createdAt: serverTimestamp(),
    });
  }

  async function removeFriend(friendId: string) {
    if (!me) return;
    const snap = await (await import('firebase/firestore')).getDocs(query(collection(db, 'users', me, 'friends'), where('id', '==', friendId)));
    await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, 'users', me, 'friends', d.id))));
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Friends</h1>

      <div className="glass rounded-xl p-4 space-y-3">
        <div className="text-sm uppercase tracking-wider text-[rgba(230,230,255,0.75)]">Find Friends</div>
        <div className="flex gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email" className="flex-1 rounded-md bg-transparent border border-white/20 px-3 py-2" />
          <button onClick={onSearch} className="rounded-md px-4 py-2 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan text-black font-semibold">Search</button>
        </div>
        <div className="space-y-2">
          {results.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border border-white/10 p-2">
              <div className="text-sm">{u.displayName ?? u.email ?? u.id}</div>
              {friendIds.has(u.id) ? (
                <button onClick={() => removeFriend(u.id)} className="text-xs underline">Remove</button>
              ) : (
                <button onClick={() => addFriend(u.id, u)} className="text-xs underline">Add</button>
              )}
            </div>
          ))}
          {results.length === 0 && <div className="text-xs text-gray-400">No results yet.</div>}
        </div>
      </div>

      <div className="glass rounded-xl p-4 space-y-3">
        <div className="text-sm uppercase tracking-wider text-[rgba(230,230,255,0.75)]">Your Friends</div>
        <div className="space-y-2">
          {friends.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-lg border border-white/10 p-2">
              <div className="text-sm">{f.displayName ?? f.email ?? f.id}</div>
              <button onClick={() => removeFriend(f.id)} className="text-xs underline text-red-300">Remove</button>
            </div>
          ))}
          {friends.length === 0 && <div className="text-xs text-gray-400">You have no friends yet. Try searching above.</div>}
        </div>
      </div>
    </div>
  );
}

