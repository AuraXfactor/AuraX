"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { buildYouTubeEmbed, listBoosts, Boost, BoostCategory } from '@/lib/boosts';
import { awardAuraPoints } from '@/lib/auraPoints';
import { updateQuestProgress } from '@/lib/weeklyQuests';
import { updateSquadChallengeProgress } from '@/lib/auraSquads';

type Tab = 'all' | BoostCategory;

const tabs: Array<{ id: Tab; label: string; emoji: string }> = [
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'guided_meditation', label: 'Meditations', emoji: '🧘' },
  { id: 'body_scan', label: 'Body Scan', emoji: '🪷' },
  { id: 'mini_workout', label: 'Mini Workouts', emoji: '🤸' },
  { id: 'panic_resource', label: 'Panic', emoji: '🆘' },
];

export default function BoostsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [boosts, setBoosts] = useState<Boost[]>([]);
  const [loading, setLoading] = useState(true);
  const [completions, setCompletions] = useState<Record<string, number>>({}); // percent by boost.id
  const [affirmationIdx, setAffirmationIdx] = useState<Record<string, number>>({});
  const [affirmationTimers, setAffirmationTimers] = useState<Record<string, number>>({});
  const defaultAffirmations = useMemo(
    () => [
      'You are safe in this moment.',
      'This feeling will pass.',
      'Breathe in calm, breathe out tension.',
      'You are stronger than this wave.',
      'Your breath anchors you now.',
      'One step at a time.',
    ],
    []
  );

  useEffect(() => {
    (async () => {
      try {
        const items = await listBoosts({ activeOnly: true });
        setBoosts(items);
      } catch (e) {
        console.error('Failed to load boosts', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return boosts;
    return boosts.filter((b) => b.category === activeTab);
  }, [boosts, activeTab]);

  const handleComplete = async (b: Boost, completionPercentage: number) => {
    if (!user) return;
    // Only award once at >= 80%
    const already = completions[b.id] && completions[b.id] >= 80;
    if (already || completionPercentage < 80) {
      setCompletions((prev) => ({ ...prev, [b.id]: Math.max(prev[b.id] || 0, Math.floor(completionPercentage)) }));
      return;
    }

    try {
      if (b.category === 'guided_meditation' || b.category === 'body_scan') {
        await awardAuraPoints({
          user,
          activity: 'meditation_complete',
          proof: {
            type: 'video_completion',
            value: completionPercentage,
            metadata: { boostId: b.id, duration: b.durationSec },
          },
          description: `🧘 Completed: ${b.title}`,
        });
        await updateQuestProgress(user.uid, 'meditation_complete');
        await updateSquadChallengeProgress(user.uid, 'meditation_complete', Math.round((b.durationSec * completionPercentage) / 100 / 60));
      } else if (b.category === 'mini_workout') {
        await awardAuraPoints({
          user,
          activity: 'workout_complete',
          proof: {
            type: 'video_completion',
            value: completionPercentage,
            metadata: { boostId: b.id, duration: b.durationSec },
          },
          description: `💪 Completed: ${b.title}`,
        });
        await updateQuestProgress(user.uid, 'workout_complete');
        await updateSquadChallengeProgress(user.uid, 'workout_complete', Math.round((b.durationSec * completionPercentage) / 100 / 60));
      }
      setCompletions((prev) => ({ ...prev, [b.id]: Math.floor(completionPercentage) }));
      alert(`🎉 ${b.title} completed! +${b.points} Aura Points earned.`);
    } catch (err) {
      console.error('Error awarding points for boost', err);
    }
  };

  const renderYouTube = (b: Boost) => {
    const src = buildYouTubeEmbed(b.videoUrl, b.panicClip ? { start: b.panicClip.startSec, end: b.panicClip.endSec } : undefined);
    if (!src) return null;
    // Track time using HTML5 API when available via postMessage is complex; fallback: time gate via button timer below
    return (
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          className="absolute inset-0 w-full h-full rounded-xl"
          src={src}
          title={b.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  };

  const timersRef = useRef<Record<string, number>>({});
  const [running, setRunning] = useState<Record<string, boolean>>({});

  const startTimer = (b: Boost) => {
    if (running[b.id]) return;
    setRunning((prev) => ({ ...prev, [b.id]: true }));
    const start = Date.now();
    timersRef.current[b.id] = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const pct = Math.min(100, Math.floor((elapsed / b.durationSec) * 100));
      setCompletions((prev) => ({ ...prev, [b.id]: pct }));
      if (pct >= 80) {
        window.clearInterval(timersRef.current[b.id]);
        setRunning((prev) => ({ ...prev, [b.id]: false }));
        handleComplete(b, pct);
      }
    }, 1000);
  };

  useEffect(() => () => {
    Object.values(timersRef.current).forEach((tid) => window.clearInterval(tid));
    Object.values(affirmationTimers).forEach((tid) => window.clearInterval(tid));
  }, [affirmationTimers]);

  // Offline WebAudio chime fallback
  const playOfflineChime = async (seconds: number) => {
    try {
      let AudioCtor: typeof AudioContext = window.AudioContext;
      if ('webkitAudioContext' in window) {
        AudioCtor = (window as Window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      }
      const ctx = new AudioCtor();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 528; // soothing frequency
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + seconds);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + seconds + 0.05);
    } catch (e) {
      console.error('Chime fallback failed', e);
    }
  };

  const startAffirmations = (b: Boost) => {
    if (affirmationTimers[b.id]) return;
    const tid = window.setInterval(() => {
      setAffirmationIdx((prev) => ({ ...prev, [b.id]: ((prev[b.id] ?? 0) + 1) % defaultAffirmations.length }));
    }, 4000);
    setAffirmationTimers((prev) => ({ ...prev, [b.id]: tid }));
  };

  const stopAffirmations = (b: Boost) => {
    const tid = affirmationTimers[b.id];
    if (tid) {
      window.clearInterval(tid);
      setAffirmationTimers((prev) => {
        const next = { ...prev };
        delete next[b.id];
        return next;
      });
    }
  };

  const renderPanicTools = (b: Boost) => {
    const isAffirmations = (!b.videoUrl && (b.title.toLowerCase().includes('affirmation') || b.tags?.includes('affirmations')));
    return (
      <div className="space-y-3">
        {!isAffirmations && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => playOfflineChime(b.durationSec || 30)}
              className="px-3 py-1.5 text-sm rounded-lg bg-emerald-500 text-white"
            >
              Play 30s Chime (offline)
            </button>
          </div>
        )}
        {isAffirmations && (
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200/50 dark:border-purple-800/50">
            <div className="text-sm text-gray-700 dark:text-gray-200 min-h-[2.5rem] flex items-center justify-center font-medium">
              {defaultAffirmations[affirmationIdx[b.id] ?? 0]}
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <button onClick={() => startAffirmations(b)} className="px-3 py-1.5 text-xs rounded-lg bg-purple-500 text-white">Start</button>
              <button onClick={() => stopAffirmations(b)} className="px-3 py-1.5 text-xs rounded-lg border border-white/30">Stop</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">✨</div>
          <h1 className="text-2xl font-bold">Aura Boosts require login</h1>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login" className="px-5 py-2.5 rounded-full border border-white/30 transition">Login</Link>
            <Link href="/signup" className="px-5 py-2.5 rounded-full text-white bg-gradient-to-r from-indigo-500 to-blue-500 transition">Create account</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold tracking-tight">Aura Boosts</h1>
          <p className="text-gray-600 dark:text-gray-300">Quick meditations, scans, workouts, and panic support.</p>
        </div>

        <div className="flex space-x-2 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition ${
                activeTab === t.id ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <span>{t.emoji}</span>
              <span className="font-medium text-sm md:text-base">{t.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="min-h-[30vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((b) => (
              <div key={b.id} className="p-4 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold leading-tight">
                    <div>{b.title}</div>
                    <div className="text-xs text-gray-500">{Math.round(b.durationSec / 60)}m • +{b.points} pts</div>
                  </div>
                  {completions[b.id] && completions[b.id] >= 80 && (
                    <span className="text-green-600 font-bold text-xs">✅ +{b.points}</span>
                  )}
                </div>
                {b.videoUrl && renderYouTube(b)}
                {b.category === 'panic_resource' && renderPanicTools(b)}
                {b.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{b.description}</p>}

                {/* Simple timer fallback for completion tracking */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-gray-500">Progress: {completions[b.id] ?? 0}%</div>
                  <button
                    onClick={() => startTimer(b)}
                    disabled={running[b.id] || (completions[b.id] ?? 0) >= 80}
                    className="px-3 py-1.5 text-sm rounded-lg bg-purple-500 text-white disabled:opacity-50"
                  >
                    {running[b.id] ? 'Running…' : 'Track Completion'}
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">No boosts available.</div>
            )}
          </div>
        )}

        <div className="max-w-5xl mx-auto mt-6 text-center">
          <Link href="/toolkit" className="px-4 py-2 rounded-full border border-white/30 hover:bg-white/10 transition">← Back to Toolkit</Link>
        </div>
      </div>
    </div>
  );
}

