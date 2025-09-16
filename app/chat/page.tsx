'use client';
import { useEffect, useRef, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp, where } from 'firebase/firestore';

type Message = { id: string; from: string; to: string; text: string; createdAt?: any };

export default function ChatPage() {
  const [me, setMe] = useState<string | null>(null);
  const [peerId, setPeerId] = useState('');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setMe(u?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!me || !peerId) return;
    const msgs = collection(db, 'messages');
    const q = query(
      msgs,
      where('participants', 'array-contains', me),
      orderBy('createdAt', 'asc'),
      limit(200)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list: Message[] = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((m) => (m.from === me && m.to === peerId) || (m.from === peerId && m.to === me));
      setMessages(list);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
    });
    return () => unsub();
  }, [me, peerId]);

  async function send() {
    if (!me || !peerId || !text.trim()) return;
    await addDoc(collection(db, 'messages'), {
      from: me,
      to: peerId,
      participants: [me, peerId],
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
    setText('');
  }

  return (
    <div className="max-w-2xl mx-auto h-[70vh] p-6 glass rounded-2xl flex flex-col">
      <div className="mb-3 flex items-center gap-2">
        <input value={peerId} onChange={(e) => setPeerId(e.target.value)} placeholder="Friend user ID" className="flex-1 rounded-md bg-transparent border border-white/20 px-3 py-2" />
        <button onClick={() => peerId && setPeerId(peerId)} className="rounded-md px-4 py-2 bg-white/10">Open</button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 p-2 rounded-xl border border-white/10">
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${m.from === me ? 'ml-auto bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan text-black' : 'bg-white/10'}`}>
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="mt-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" className="flex-1 rounded-md bg-transparent border border-white/20 px-3 py-2" />
        <button onClick={send} className="rounded-md px-4 py-2 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan text-black">Send</button>
      </div>
    </div>
  );
}

