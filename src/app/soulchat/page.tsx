'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Timestamp, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type ChatMeta = {
  chatId: string;
  otherUid: string;
  lastMessage: string | null;
  lastAt: Timestamp | null;
  unreadCount: number;
};

export default function SoulChatListPage() {
  const { user, loading } = useAuth();
  const [chats, setChats] = useState<ChatMeta[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'chatMeta'), orderBy('lastAt', 'desc'));
    const off = onSnapshot(q, (snap) => {
      const rows: ChatMeta[] = snap.docs.map((d) => {
        const data = d.data() as Omit<ChatMeta, 'chatId'>;
        return { chatId: d.id, ...data };
      });
      setChats(rows);
    });
    return () => off();
  }, [user]);

  const content = useMemo(() => {
    if (loading) return <div className="p-4">Loading…</div>;
    if (!user) return <div className="p-4">Please sign in to view chats.</div>;
    if (!chats.length) return (
      <div className="p-6 text-center text-white/70">
        <h1 className="text-2xl font-semibold mb-2">SoulChat</h1>
        <p>No conversations yet. Start a new chat by opening a user profile.</p>
      </div>
    );
    return (
      <ul className="divide-y divide-white/10">
        {chats.map((c) => (
          <li key={c.chatId}>
            <Link href={`/soulchat/${encodeURIComponent(c.otherUid)}`} className="flex items-center justify-between p-4 hover:bg-white/5 transition">
              <div className="min-w-0">
                <div className="text-white font-medium truncate">{c.otherUid}</div>
                <div className="text-white/60 text-sm truncate">{c.lastMessage ?? '—'}</div>
              </div>
              {c.unreadCount > 0 && (
                <span className="ml-3 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 text-xs px-2">
                  {c.unreadCount}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    );
  }, [loading, user, chats]);

  return (
    <div className="max-w-2xl mx-auto w-full">
      <header className="sticky top-0 z-10 backdrop-blur bg-black/30 border-b border-white/10">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">SoulChat</h1>
          <Link href="/toolkit" className="text-sm text-white/70 hover:text-white">Toolkit</Link>
        </div>
      </header>
      {content}
    </div>
  );
}

