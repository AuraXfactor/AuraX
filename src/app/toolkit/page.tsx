"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Breathing from '@/components/Toolkit/Breathing';
import Grounding from '@/components/Toolkit/Grounding';
import PanicButton from '@/components/Toolkit/PanicButton';
import Affirmations from '@/components/Toolkit/Affirmations';
import Gratitude from '@/components/Toolkit/Gratitude';
import SleepTools from '@/components/Toolkit/SleepTools';
import AudioLibrary from '@/components/Toolkit/AudioLibrary';
import MoodPlaylists from '@/components/Toolkit/MoodPlaylists';
import MiniWorkouts from '@/components/Toolkit/MiniWorkouts';
import Visualization from '@/components/Toolkit/Visualization';
import ReliefPopup from '@/components/Toolkit/ReliefPopup';

type Tab = 'panic' | 'breath' | 'ground' | 'meditate' | 'affirm' | 'gratitude' | 'mood' | 'workout' | 'visualize' | 'sleep';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'panic', label: 'Panic', emoji: '🆘' },
  { id: 'breath', label: 'Breath', emoji: '🌬️' },
  { id: 'ground', label: 'Ground', emoji: '🧭' },
  { id: 'meditate', label: 'Meditate', emoji: '🧘' },
  { id: 'affirm', label: 'Affirm', emoji: '💬' },
  { id: 'gratitude', label: 'Gratitude', emoji: '✨' },
  { id: 'mood', label: 'Playlists', emoji: '🎧' },
  { id: 'workout', label: 'Stretch', emoji: '🤸' },
  { id: 'visualize', label: 'Visualize', emoji: '🖼️' },
  { id: 'sleep', label: 'Sleep', emoji: '🌙' },
];

export default function ToolkitPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('panic');
  const [reliefOpen, setReliefOpen] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white animate-pop">🧰</div>
          <h1 className="text-2xl font-bold">Toolkit requires login</h1>
          <p className="text-gray-600 dark:text-gray-300">Sign in to access your interactive self-help toolkit.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login" className="px-5 py-2.5 rounded-full border border-white/30 hover:bg-white/10 transition">Login</Link>
            <Link href="/signup" className="px-5 py-2.5 rounded-full text-white bg-gradient-to-r from-indigo-500 to-blue-500 hover:scale-105 transition">Create account</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <aside className="p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/20 backdrop-blur">
          <div className="text-sm font-semibold mb-3">Aura X Toolkit</div>
          <nav className="flex flex-col gap-2">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`text-left px-3 py-2 rounded-xl border transition ${tab === t.id ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-white/30' : 'bg-white/10 border-white/10 hover:bg-white/20'}`}>
                <span className="mr-2">{t.emoji}</span>{t.label}
              </button>
            ))}
          </nav>
        </aside>
        <main className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/20 backdrop-blur space-y-6">
          {tab === 'panic' && <PanicButton />}
          {tab === 'breath' && <Breathing />}
          {tab === 'ground' && <Grounding />}
          {tab === 'meditate' && <AudioLibrary />}
          {tab === 'affirm' && <Affirmations />}
          {tab === 'gratitude' && <Gratitude />}
          {tab === 'mood' && <MoodPlaylists />}
          {tab === 'workout' && <MiniWorkouts />}
          {tab === 'visualize' && <Visualization />}
          {tab === 'sleep' && <SleepTools />}
          <div className="pt-2 text-xs opacity-70">Use icons, animations, and interactivity to explore tools. More modules coming soon.</div>
        </main>
      </div>
      <ReliefPopup open={reliefOpen} onClose={() => setReliefOpen(false)} />
    </div>
  );
}

