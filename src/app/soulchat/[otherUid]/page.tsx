// @ts-nocheck
'use client';
import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { AiPersonality, ChatMessage, getDeterministicChatId, listenToMessages, markMessagesRead, saveChatExcerptToJournal, sendMoodSticker, sendTextMessage, setTyping, typingDocRef } from '@/lib/chat';
import { onSnapshot } from 'firebase/firestore';
import VoiceInput from '@/components/VoiceInput';
import MoodPicker from '@/app/soulchat/components/MoodPicker';

function SOSMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button className="px-3 py-1.5 rounded-full bg-red-500/20 text-red-200 hover:bg-red-500/30" onClick={() => setOpen((v) => !v)}>SOS</button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg border border-white/10 bg-black/80 backdrop-blur shadow-xl">
          <button className="w-full text-left px-4 py-2 hover:bg-white/5" onClick={() => alert('Contacting RYD Support…')}>Contact RYD Support</button>
          <button className="w-full text-left px-4 py-2 hover:bg-white/5" onClick={() => window.open('tel:988', '_self')}>Dial Local Hotline (988)</button>
          <button className="w-full text-left px-4 py-2 hover:bg-white/5" onClick={() => alert('Opening therapy booking…')}>Book Therapy</button>
        </div>
      )}
    </div>
  );
}

export default function ConversationPage() {
  const { user } = useAuth();
  const params = useParams<{ otherUid: string }>();
  const otherUid = decodeURIComponent(params.otherUid);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [showJournal, setShowJournal] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [otherTyping, setOtherTyping] = useState(false);

  const chatId = useMemo(() => user ? getDeterministicChatId(user.uid, otherUid) : '', [user, otherUid]);

  useEffect(() => {
    if (!user || !chatId) return;
    const off = listenToMessages({ uid: user.uid, chatId, onChange: (rows) => setMessages(rows) });
    // Listen to the other user's typing doc (they write in their own tree)
    const offTyping = onSnapshot(typingDocRef({ uid: otherUid, chatId, otherUid: user.uid }), (snap) => {
      setOtherTyping(Boolean(snap.data()?.typing));
    });
    return () => { off(); offTyping(); };
  }, [user, chatId, otherUid]);

  useEffect(() => {
    if (!user || !chatId) return;
    markMessagesRead({ uid: user.uid, chatId }).catch(() => {});
  }, [user, chatId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  async function onSend(e?: FormEvent) {
    e?.preventDefault();
    if (!user || !input.trim()) return;
    const text = input.trim();
    setInput('');
    await sendTextMessage({ fromUser: user, toUid: otherUid, text }).catch(console.error);
    await setTyping({ uid: user.uid, otherUid, chatId, typing: false }).catch(() => {});
  }

  async function requestAiAssist() {
    if (!user || aiBusy) return;
    setAiBusy(true);
    try {
      const res = await fetch('/api/aura/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUid: otherUid,
          lastUserInput: input,
          authUid: user.uid,
        }),
      });
      const data = await res.json();
      if (data?.suggestion) setSuggestion(data.suggestion as string);
    } catch (e) {
      console.error('[AI Assist] error', e);
    } finally {
      setAiBusy(false);
    }
  }

  function sendSuggestion() {
    if (!suggestion) return;
    setInput(suggestion);
    setSuggestion(null);
  }

  async function handleSaveJournal() {
    if (!user) return;
    const excerpt = journalText || messages.slice(-6).map((m) => `${m.fromUid === user.uid ? 'Me' : 'Them'}: ${m.text ?? m.emoji ?? ''}`).join('\n');
    await saveChatExcerptToJournal({ user, notes: excerpt }).catch(console.error);
    setShowJournal(false);
    setJournalText('');
  }

  const bubble = (m: ChatMessage) => {
    const mine = m.fromUid === user?.uid;
    const base = mine ? 'bg-emerald-500/20 text-emerald-100' : 'bg-white/10 text-white';
    const mood = m.type === 'moodSticker';
    return (
      <div key={m.messageId} className={`max-w-[75%] rounded-2xl px-3 py-2 my-1 ${base} ${mine ? 'ml-auto' : ''}`}>
        {mood ? (
          <div className="flex items-center gap-2">
            <span className="text-xl">{m.emoji ?? '💟'}</span>
            <div className="font-medium">{m.mood}</div>
          </div>
        ) : null}
        {m.text ? <div className="whitespace-pre-wrap">{m.text}</div> : null}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto h-[100dvh] flex flex-col">
      <header className="sticky top-0 z-10 backdrop-blur bg-black/30 border-b border-white/10">
        <div className="px-3 py-2 flex items-center gap-2">
          <Link href="/soulchat" className="px-2 py-1 rounded hover:bg-white/10">← Back</Link>
          <div className="font-semibold">{otherUid}</div>
          <div className="ml-auto flex items-center gap-2">
            {otherTyping && <span className="text-sm text-white/60">typing…</span>}
            <SOSMenu />
          </div>
        </div>
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto p-3">
        {messages.map(bubble)}
      </div>

      <footer className="border-t border-white/10 p-2">
        {suggestion && (
          <div className="mb-2 p-2 rounded-lg bg-white/5 flex items-center gap-2">
            <div className="text-white/80 text-sm flex-1">AI suggests: {suggestion}</div>
            <button className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30" onClick={sendSuggestion}>Use</button>
            <button className="px-2 py-1 rounded hover:bg-white/10" onClick={() => setSuggestion(null)}>Dismiss</button>
          </div>
        )}

        <form onSubmit={onSend} className="flex items-end gap-2">
          <MoodPicker onPick={async (m) => { if (!user) return; await sendMoodSticker({ fromUser: user, toUid: otherUid, mood: m.mood, emoji: m.emoji }).catch(console.error); }} />
          <div className="flex-1">
            <textarea
              value={input}
              onChange={async (e) => {
                setInput(e.target.value);
                if (user && chatId) {
                  await setTyping({ uid: user.uid, otherUid, chatId, typing: e.target.value.length > 0 }).catch(() => {});
                }
              }}
              placeholder="Type a message…"
              className="w-full resize-none min-h-[44px] max-h-[140px] bg-white/5 rounded-xl p-3 outline-none"
            />
          </div>
          <VoiceInput onResult={(t) => setInput((v) => (v ? v + ' ' + t : t))} />
          <button type="button" onClick={requestAiAssist} className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30" disabled={aiBusy} aria-label="AI Assist">
            {aiBusy ? 'Aura…' : 'Aura'}
          </button>
          <button type="submit" className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20">Send</button>
        </form>

        <div className="flex items-center justify-between mt-2">
          <button className="text-sm text-white/70 hover:text-white" onClick={() => setShowJournal(true)}>Save excerpt to Journal</button>
        </div>
      </footer>

      {showJournal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-black/80 p-4">
            <div className="text-lg font-semibold mb-2">Save to Journal?</div>
            <textarea className="w-full h-40 bg-white/5 rounded p-2" value={journalText} onChange={(e) => setJournalText(e.target.value)} placeholder="Optional note or excerpt…" />
            <div className="mt-3 flex justify-end gap-2">
              <button className="px-3 py-1.5 rounded hover:bg-white/10" onClick={() => setShowJournal(false)}>Cancel</button>
              <button className="px-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30" onClick={handleSaveJournal}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

