'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { addDoc, collection, serverTimestamp, query, orderBy, onSnapshot, Timestamp, DocumentData } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const moods = [
  { label: '😊', value: 'happy' },
  { label: '😐', value: 'neutral' },
  { label: '😔', value: 'sad' },
  { label: '😡', value: 'angry' },
  { label: '😰', value: 'anxious' },
];

type JournalEntry = {
  id: string;
  entryText: string;
  moodTag: string;
  createdAt?: Timestamp | null;
  voiceMemoUrl?: string | null;
};

export default function JournalPage() {
  const { user } = useAuth();
  const [entryText, setEntryText] = useState('');
  const [moodTag, setMoodTag] = useState<string>('neutral');
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const prompts = useMemo(() => {
    const today = new Date();
    const idx = today.getDate() % 7;
    const list = [
      'What energized you today?',
      'Name one small win you had.',
      'What’s one thing you can let go of?',
      'Who supported you this week?',
      'What would make tomorrow 1% better?',
      'What emotion is most present right now?',
      'Write a note of kindness to yourself.',
    ];
    return { today: list[idx], list };
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'journals', user.uid, 'entries'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => {
        const data = d.data() as DocumentData;
        return {
          id: d.id,
          entryText: data.entryText as string,
          moodTag: data.moodTag as string,
          createdAt: (data.createdAt as Timestamp | null) ?? null,
          voiceMemoUrl: (data.voiceMemoUrl as string | null) ?? null,
        } satisfies JournalEntry;
      });
      setEntries(items);
    });
    return () => unsub();
  }, [user]);

  const startRecording = async () => {
    if (!navigator.mediaDevices) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    audioChunksRef.current = [];
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
    };
    mr.start();
    setMediaRecorder(mr);
    setRecording(true);
    if ('vibrate' in navigator) {
      navigator.vibrate?.(50);
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setRecording(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      let voiceMemoUrl: string | null = null;
      if (audioChunksRef.current.length) {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const storageRef = ref(storage, `voiceMemos/${user.uid}/${Date.now()}.webm`);
        await uploadBytes(storageRef, blob);
        voiceMemoUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'journals', user.uid, 'entries'), {
        entryText,
        moodTag,
        createdAt: serverTimestamp(),
        voiceMemoUrl: voiceMemoUrl ?? null,
      });

      setEntryText('');
      audioChunksRef.current = [];
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-rose-400 to-orange-400 text-white animate-pop">📔</div>
          <h1 className="text-2xl font-bold">Journal requires login</h1>
          <p className="text-gray-600 dark:text-gray-300">Sign in to write entries, tag moods, and add voice memos.</p>
          <div className="flex items-center justify-center gap-3">
            <a href="/login" className="px-5 py-2.5 rounded-full border border-white/30 hover:bg-white/10 transition">Login</a>
            <a href="/signup" className="px-5 py-2.5 rounded-full text-white bg-gradient-to-r from-indigo-500 to-blue-500 hover:scale-105 transition">Create account</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Journal</h1>
      <div className="glass rounded-xl p-4">
        <div className="text-sm uppercase tracking-wider text-[rgba(230,230,255,0.75)]">Today9;s prompt</div>
        <div className="mt-1 text-sm">{prompts.today}</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          className="w-full border rounded-md p-3 min-h-[120px]"
          placeholder="Write your thoughts..."
          value={entryText}
          onChange={(e) => setEntryText(e.target.value)}
          required
        />
        <div className="flex items-center gap-3">
          {moods.map((m) => (
            <button
              key={m.value}
              type="button"
              className={`text-2xl ${moodTag === m.value ? 'opacity-100' : 'opacity-50'}`}
              onClick={() => setMoodTag(m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          {!recording ? (
            <button type="button" onClick={startRecording} className="px-4 py-2 border rounded">
              Start Voice
            </button>
          ) : (
            <button type="button" onClick={stopRecording} className="px-4 py-2 border rounded">
              Stop Voice
            </button>
          )}
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-500 text-white rounded">
            {submitting ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {entries.map((e) => (
          <div key={e.id} className="border rounded p-3">
            <div className="text-sm text-gray-500">{e.createdAt?.toDate?.().toLocaleString?.() ?? 'Pending sync'}</div>
            <div className="text-2xl mb-2">{moods.find((m) => m.value === e.moodTag)?.label ?? '😐'}</div>
            <p className="whitespace-pre-wrap">{e.entryText}</p>
            {e.voiceMemoUrl && (
              <audio src={e.voiceMemoUrl} controls className="mt-2 w-full" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

