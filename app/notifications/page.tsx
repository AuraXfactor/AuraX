'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';

type NotificationItem = { id: string; title: string; body?: string; createdAt?: any };

export default function NotificationsPage() {
  const [me, setMe] = useState<string | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setMe(u?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!me) return;
    const q = query(collection(db, 'users', me, 'notifications'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, [me]);

  async function addReminder() {
    if (!me) return;
    await addDoc(collection(db, 'users', me, 'notifications'), {
      title: 'Daily check-in reminder',
      body: 'Take 30 seconds for a vibe check ✨',
      createdAt: serverTimestamp(),
    });
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <button onClick={addReminder} className="rounded-md px-4 py-2 bg-white/10">Add sample reminder</button>
      </div>
      <div className="space-y-2">
        {items.map((n) => (
          <div key={n.id} className="rounded-lg border border-white/10 p-3">
            <div className="text-sm font-semibold">{n.title}</div>
            {n.body && <div className="text-xs text-gray-300">{n.body}</div>}
          </div>
        ))}
        {items.length === 0 && <div className="text-xs text-gray-400">No notifications yet.</div>}
      </div>
    </div>
  );
}

