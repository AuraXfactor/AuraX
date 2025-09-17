'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  DocumentData,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addJournalEntry, incrementAuraPoints, updateJournalStreak } from '@/lib/dataOps';

const defaultActivities: { key: string; label: string }[] = [
  { key: 'talk_friend', label: 'Talking to a friend/loved one' },
  { key: 'exercise', label: 'Exercise / workout' },
  { key: 'meditation', label: 'Meditation / prayer' },
  { key: 'journaling', label: 'Journaling / writing' },
  { key: 'reading', label: 'Reading' },
  { key: 'listening', label: 'Listening to music / podcast' },
  { key: 'outdoors', label: 'Going for a walk / time outdoors' },
  { key: 'gratitude', label: 'Practicing gratitude' },
  { key: 'healthy_eating', label: 'Eating healthy meal(s)' },
  { key: 'rest', label: 'Resting / sleeping well' },
];

const moods = [
  { label: '🤩', value: 'excited', color: 'from-pink-500 to-rose-500' },
  { label: '😊', value: 'happy', color: 'from-yellow-400 to-amber-500' },
  { label: '😌', value: 'calm', color: 'from-teal-400 to-emerald-500' },
  { label: '😐', value: 'neutral', color: 'from-slate-300 to-slate-400' },
  { label: '😔', value: 'sad', color: 'from-blue-300 to-indigo-400' },
  { label: '😩', value: 'stressed', color: 'from-orange-400 to-red-400' },
  { label: '😰', value: 'anxious', color: 'from-cyan-400 to-blue-500' },
  { label: '😡', value: 'angry', color: 'from-red-500 to-rose-600' },
];

type JournalEntry = {
  id: string;
  notes: string; // notes
  moodTag: string;
  createdAt?: Timestamp | null;
  voiceMemoUrl?: string | null;
  activities?: string[];
  affirmation?: string | null;
  auraPoints?: number | null;
  dateKey?: string | null; // YYYY-MM-DD
};

function formatDateKey(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function JournalPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [moodTag, setMoodTag] = useState<string>('neutral');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [affirmation, setAffirmation] = useState('');
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [customActivities, setCustomActivities] = useState<string[]>([]);
  const [newActivity, setNewActivity] = useState('');

  useEffect(() => {
    if (!user) return;

    (async () => {
      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as DocumentData;
        if (typeof data.journalReminderEnabled === 'boolean') {
          setReminderEnabled(Boolean(data.journalReminderEnabled));
        }
        if (typeof data.journalReminderTime === 'string') {
          setReminderTime(data.journalReminderTime);
        }
        if (Array.isArray(data.customActivities)) {
          setCustomActivities(data.customActivities as string[]);
        }
      }
    })();

    const q = query(
      collection(db, 'journals', user.uid, 'entries'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => {
        const data = d.data() as DocumentData;
        return {
          id: d.id,
          notes: (data.notes as string) ?? (data.entryText as string) ?? '',
          moodTag: (data.moodTag as string) ?? 'neutral',
          createdAt: (data.createdAt as Timestamp | null) ?? null,
          voiceMemoUrl: (data.voiceMemoUrl as string | null) ?? null,
          activities: (data.activities as string[] | undefined) ?? [],
          affirmation: (data.affirmation as string | null) ?? null,
          auraPoints: (data.auraPoints as number | null) ?? (data.auraScore as number | null) ?? null,
          dateKey: (data.dateKey as string | null) ?? null,
        } satisfies JournalEntry;
      });
      setEntries(items);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let interval: number | undefined;
    if (reminderEnabled && typeof window !== 'undefined') {
      interval = window.setInterval(async () => {
        try {
          const permission = await (async () => {
            if (!('Notification' in window)) return 'denied';
            return Notification.permission;
          })();
          if (permission === 'denied') return;
          const now = new Date();
          const [h, m] = reminderTime.split(':').map((v) => parseInt(v, 10));
          if (now.getHours() !== h || now.getMinutes() !== m) return;

          const todayKey = formatDateKey(now);
          const hasToday = entries.some((e) => {
            const key = e.dateKey ?? (e.createdAt ? formatDateKey(e.createdAt.toDate()) : null);
            return key === todayKey;
          });
          if (hasToday) return;

          const reg = await navigator.serviceWorker?.ready;
          const title = 'Aura X — Journal Reminder';
          const body = 'Take a minute to log your mood and activities today ✨';
          if (reg && 'showNotification' in reg) {
            reg.showNotification(title, {
              body,
              icon: '/favicon.ico',
              tag: 'journal-reminder',
            });
          } else if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body });
          }
        } catch {}
      }, 60 * 1000);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [user, reminderEnabled, reminderTime, entries]);

  const toggleActivity = (key: string) => {
    setSelectedActivities((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

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

  const computeAuraPoints = useCallback(
    (hasVoice: boolean) => {
      const base = 10;
      const perActivity = 5 * selectedActivities.length;
      const moodBonus = moodTag === 'excited' || moodTag === 'happy' ? 3 : 0;
      const affirmBonus = affirmation.trim() ? 5 : 0;
      const notesBonus = notes.trim().length >= 50 ? 5 : 2;
      const voiceBonus = hasVoice ? 2 : 0;
      return base + perActivity + moodBonus + affirmBonus + notesBonus + voiceBonus;
    },
    [selectedActivities.length, moodTag, affirmation, notes]
  );

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

      const hasVoice = Boolean(voiceMemoUrl);
      const auraPoints = computeAuraPoints(hasVoice);
      const dateKey = formatDateKey(new Date());

      await addJournalEntry({
        uid: user.uid,
        mood: moodTag,
        activities: selectedActivities,
        notes,
        affirmation: affirmation.trim() || null,
        voiceMemoUrl: voiceMemoUrl ?? null,
        auraPoints,
      });

      await incrementAuraPoints(user.uid, auraPoints);
      await updateJournalStreak(user.uid, dateKey);

      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(
        userDocRef,
        {
          journalReminderEnabled: reminderEnabled,
          journalReminderTime: reminderTime,
        },
        { merge: true }
      );

      setNotes('');
      setAffirmation('');
      setSelectedActivities([]);
      audioChunksRef.current = [];
    } finally {
      setSubmitting(false);
    }
  };

  const allActivities = useMemo(() => {
    const merged = [...defaultActivities.map((a) => a.label), ...customActivities];
    const seen = new Set<string>();
    const labels = merged.filter((l) => {
      if (seen.has(l)) return false;
      seen.add(l);
      return true;
    });
    const map = labels.map((label) => {
      const existing = defaultActivities.find((a) => a.label === label);
      if (existing) return existing;
      const key = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      return { key: `custom_${key}`, label };
    });
    return map;
  }, [customActivities]);

  const uniqueDateKeys = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) {
      const key = e.dateKey ?? (e.createdAt ? formatDateKey(e.createdAt.toDate()) : undefined);
      if (key) set.add(key);
    }
    return Array.from(set).sort().reverse();
  }, [entries]);

  const currentStreak = useMemo(() => {
    if (uniqueDateKeys.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    for (;;) {
      const check = new Date();
      check.setDate(today.getDate() - streak);
      const key = formatDateKey(check);
      if (uniqueDateKeys.includes(key)) {
        streak += 1;
      } else {
        break;
      }
    }
    return streak;
  }, [uniqueDateKeys]);

  const weeklySummary = useMemo(() => {
    const now = new Date();
    const sevenDaysAgoStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    const inWindow = entries.filter((e) => {
      const d = e.createdAt?.toDate?.();
      return d ? d >= sevenDaysAgoStart : false;
    });
    const moodCounts: Record<string, number> = {};
    const activityCounts: Record<string, number> = {};
    let auraSum = 0;
    for (const e of inWindow) {
      moodCounts[e.moodTag] = (moodCounts[e.moodTag] ?? 0) + 1;
      for (const a of e.activities ?? []) {
        activityCounts[a] = (activityCounts[a] ?? 0) + 1;
      }
      auraSum += e.auraPoints ?? 0;
    }
    return { moodCounts, activityCounts, auraSum, days: inWindow.length };
  }, [entries]);

  const saveReminderSettings = async (enabled: boolean, time: string) => {
    if (!user) return;
    await setDoc(
      doc(db, 'users', user.uid),
      { journalReminderEnabled: enabled, journalReminderTime: time, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  };

  const handleToggleReminder = async () => {
    const next = !reminderEnabled;
    if (next) {
      const ok = await requestNotificationPermission();
      if (!ok) {
        setReminderEnabled(false);
        return;
      }
    }
    setReminderEnabled(next);
    await saveReminderSettings(next, reminderTime);
  };

  const handleChangeReminderTime = async (val: string) => {
    setReminderTime(val);
    await saveReminderSettings(reminderEnabled, val);
  };

  const handleAddCustomActivity = async () => {
    if (!user) return;
    const label = newActivity.trim();
    if (!label) return;
    const updated = Array.from(new Set([...customActivities, label]));
    setCustomActivities(updated);
    setNewActivity('');
    await setDoc(doc(db, 'users', user.uid), { customActivities: updated, updatedAt: serverTimestamp() }, { merge: true });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-rose-400 to-orange-400 text-white animate-pop">📔</div>
          <h1 className="text-2xl font-bold">Journal requires login</h1>
          <p className="text-gray-600 dark:text-gray-300">Sign in to log moods, self-care, affirmations, and notes.</p>
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Journal</h1>
        <div className="px-3 py-1 rounded-full border border-white/20 text-sm">
          Streak: <span className="font-semibold">{currentStreak}</span>🔥
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <div className="text-sm font-medium">Mood</div>
          <div className="flex items-center gap-2 flex-wrap">
            {moods.map((m) => (
              <button
                key={m.value}
                type="button"
                className={`text-2xl p-2 rounded-xl border border-white/20 hover:scale-105 transition bg-gradient-to-br ${m.color} ${moodTag === m.value ? 'ring-2 ring-white/60' : 'opacity-90'}`}
                onClick={() => setMoodTag(m.value)}
                aria-pressed={moodTag === m.value}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium">Self-care activities</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {allActivities.map((a) => (
              <label key={a.key} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer ${selectedActivities.includes(a.key) ? 'bg-white/10' : ''}`}>
                <input
                  type="checkbox"
                  className="accent-blue-500"
                  checked={selectedActivities.includes(a.key)}
                  onChange={() => toggleActivity(a.key)}
                />
                <span>{a.label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              placeholder="Add custom activity"
              className="flex-1 border rounded-md p-2"
            />
            <button type="button" onClick={handleAddCustomActivity} className="px-3 py-2 rounded-md border">Add</button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Word of affirmation</div>
          <input
            type="text"
            maxLength={140}
            value={affirmation}
            onChange={(e) => setAffirmation(e.target.value)}
            placeholder="Write a short positive message to yourself"
            className="w-full border rounded-md p-3"
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Notes</div>
          <textarea
            className="w-full border rounded-md p-3 min-h-[140px]"
            placeholder="Reflect on your day..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            required
          />
        </div>

        <div className="flex gap-3 items-center">
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

      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Weekly summary</div>
            <div className="text-sm opacity-80">Aura: {weeklySummary.auraSum}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm">Mood trends</div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(weeklySummary.moodCounts).length === 0 && (
                <div className="text-sm opacity-70">No entries yet.</div>
              )}
              {Object.entries(weeklySummary.moodCounts).map(([k, v]) => {
                const mood = moods.find((m) => m.value === k);
                return (
                  <div key={k} className={`px-3 py-1 rounded-full text-sm border bg-gradient-to-br ${mood?.color ?? 'from-slate-200 to-slate-300'} text-black/80`}>
                    <span className="mr-1">{mood?.label ?? '🙂'}</span>
                    {v}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm">Activities frequency</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(weeklySummary.activityCounts).map(([k, v]) => {
                const label = defaultActivities.find((a) => a.key === k)?.label || k.replace(/^custom_/, '').replace(/_/g, ' ');
                return (
                  <div key={k} className="px-3 py-1 rounded-full text-sm border">
                    {label}: <span className="font-medium">{v}</span>
                  </div>
                );
              })}
              {Object.keys(weeklySummary.activityCounts).length === 0 && (
                <div className="text-sm opacity-70">No activities logged.</div>
              )}
            </div>
          </div>
          <div className="text-sm">Streak status: <span className="font-semibold">{currentStreak}</span> days</div>
        </div>

        <div className="rounded-2xl border border-white/10 p-4 space-y-3">
          <div className="font-semibold">Reminder</div>
          <div className="flex items-center gap-3">
            <button onClick={handleToggleReminder} className={`px-3 py-2 rounded-md border ${reminderEnabled ? 'bg-blue-500 text-white' : ''}`}>
              {reminderEnabled ? 'On' : 'Off'}
            </button>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => handleChangeReminderTime(e.target.value)}
              className="border rounded-md p-2"
            />
            <div className="text-sm opacity-70">Daily reminder to keep your streak alive</div>
          </div>
        </div>

        <div className="space-y-4">
          {entries.map((e) => (
            <div key={e.id} className="border rounded p-3">
              <div className="text-sm text-gray-500">{e.createdAt?.toDate?.().toLocaleString?.() ?? 'Pending sync'}</div>
              <div className="text-2xl mb-2">{moods.find((m) => m.value === e.moodTag)?.label ?? '😐'}</div>
              {e.affirmation ? (
                <div className="mb-2 text-sm italic opacity-80">“{e.affirmation}”</div>
              ) : null}
              {e.activities && e.activities.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {e.activities.map((a) => {
                    const label = defaultActivities.find((d) => d.key === a)?.label || a.replace(/^custom_/, '').replace(/_/g, ' ');
                    return (
                      <span key={a} className="px-2 py-0.5 rounded-full text-xs border">
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}
              <p className="whitespace-pre-wrap">{e.notes}</p>
              {typeof e.auraPoints === 'number' && (
                <div className="mt-2 text-sm opacity-80">Aura: +{e.auraPoints}</div>
              )}
              {e.voiceMemoUrl && (
                <audio src={e.voiceMemoUrl} controls className="mt-2 w-full" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

