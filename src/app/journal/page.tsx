'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  DocumentData,
  doc,
  setDoc,
  getDoc,
  increment,
} from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { awardAuraPoints } from '@/lib/auraPoints';
import { updateQuestProgress } from '@/lib/weeklyQuests';
import { updateSquadChallengeProgress } from '@/lib/auraSquads';

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
  { label: '😌', value: 'fine', color: 'from-teal-400 to-emerald-500' },
  { label: '😐', value: 'neutral', color: 'from-slate-300 to-slate-400' },
  { label: '😔', value: 'sad', color: 'from-blue-300 to-indigo-400' },
  { label: '😩', value: 'stressed', color: 'from-orange-400 to-red-400' },
  { label: '😰', value: 'anxious', color: 'from-cyan-400 to-blue-500' },
  { label: '😡', value: 'angry', color: 'from-red-500 to-rose-600' },
];

type JournalEntry = {
  id: string;
  entryText: string; // notes
  moodTag: string;
  createdAt?: Timestamp | null;
  voiceMemoUrl?: string | null;
  activities?: string[];
  affirmation?: string | null;
  auraScore?: number | null;
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
          entryText: (data.entryText as string) ?? '',
          moodTag: (data.moodTag as string) ?? 'neutral',
          createdAt: (data.createdAt as Timestamp | null) ?? null,
          voiceMemoUrl: (data.voiceMemoUrl as string | null) ?? null,
          activities: (data.activities as string[] | undefined) ?? [],
          affirmation: (data.affirmation as string | null) ?? null,
          auraScore: (data.auraScore as number | null) ?? null,
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

  const computeAuraScore = useCallback(
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
      const auraScore = computeAuraScore(hasVoice);
      const dateKey = formatDateKey(new Date());

      await addDoc(collection(db, 'journals', user.uid, 'entries'), {
        entryText: notes,
        moodTag,
        activities: selectedActivities,
        affirmation: affirmation.trim() || null,
        auraScore,
        dateKey,
        createdAt: serverTimestamp(),
        voiceMemoUrl: voiceMemoUrl ?? null,
      });

      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(
        userDocRef,
        {
          auraTotal: increment(auraScore),
          journalReminderEnabled: reminderEnabled,
          journalReminderTime: reminderTime,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Award Aura Points for journal entry
      try {
        const wordCount = notes.trim().split(/\s+/).length;
        await awardAuraPoints({
          user,
          activity: 'journal_entry',
          proof: {
            type: 'journal_length',
            value: wordCount,
            metadata: { 
              moodTag, 
              activities: selectedActivities,
              hasVoice: Boolean(voiceMemoUrl),
              affirmation: Boolean(affirmation)
            }
          },
          description: `📔 Journal entry completed (${wordCount} words)`,
        });
        
        // Update quest progress
        await updateQuestProgress(user.uid, 'journal_entry');
        
        // Update squad challenge progress
        await updateSquadChallengeProgress(user.uid, 'journal_entry', 1);
      } catch (pointsError) {
        console.error('Error awarding points:', pointsError);
        // Don't fail the journal entry if points fail
      }

      // Show success message
      alert('Journal entry saved successfully! 🎉');

      setNotes('');
      setAffirmation('');
      setSelectedActivities([]);
      audioChunksRef.current = [];
    } catch (error) {
      console.error('Error saving journal entry:', error);
      alert('Failed to save journal entry. Please try again.');
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
      auraSum += e.auraScore ?? 0;
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.href = '/journal/history'}
            className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-700 dark:text-purple-300 rounded-lg transition text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {entries.length > 0 ? `View All ${entries.length} Entries` : 'View History'}
          </button>
          <div className="px-3 py-1 rounded-full border border-white/20 text-sm">
            Streak: <span className="font-semibold">{currentStreak}</span>🔥
          </div>
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

        {/* Recent Entries Preview */}
        {entries.length > 0 && (
          <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                📖 Recent Entries
              </h2>
              <button
                onClick={() => window.location.href = '/journal/history'}
                className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 transition"
              >
                View All →
              </button>
            </div>
            
            <div className="space-y-3">
              {entries.slice(0, 3).map((entry) => (
                <div key={entry.id} className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {moods.find((m) => m.value === entry.moodTag)?.label ?? '😐'}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {entry.createdAt?.toDate?.().toLocaleDateString() ?? 'Recent'}
                      </span>
                    </div>
                    {typeof entry.auraScore === 'number' && (
                      <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                        +{entry.auraScore} Aura
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {entry.entryText.length > 100 ? `${entry.entryText.slice(0, 100)}...` : entry.entryText}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

