'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { addShadowBox, addWhisper, logCraving, setUserAddiction } from '@/lib/userProfile';
import { logStreakActivity } from '@/lib/streaks';

const affirmations = [
  'I am stronger than my cravings.',
  'Healing is possible, step by step.',
  'My past does not define my future.',
];

type LevelKey = 'Calm' | 'Tempted' | 'Struggling' | 'Urgent';

const levelMeta: Record<LevelKey, { color: string; emoji: string; action: string }> = {
  Calm: { color: '#10b981', emoji: '🟢', action: 'Take a mindful reflection' },
  Tempted: { color: '#f59e0b', emoji: '🟡', action: 'Try a 60s breathing' },
  Struggling: { color: '#fb923c', emoji: '🟠', action: 'Start guided breath + grounding' },
  Urgent: { color: '#ef4444', emoji: '🔴', action: 'SOS sequence: call support' },
};

export default function RecoveryHub() {
  const { user } = useAuth();
  const [addiction, setAddiction] = useState('');
  const [savedAddiction, setSavedAddiction] = useState<string | null>(null);
  const [currentAff, setCurrentAff] = useState(0);
  const affTimer = useRef<number | null>(null);

  const [shadowInput, setShadowInput] = useState('');
  const [shadowReframe, setShadowReframe] = useState<string | null>(null);
  const [whisper, setWhisper] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (affTimer.current) window.clearInterval(affTimer.current);
    affTimer.current = window.setInterval(() => setCurrentAff((i) => (i + 1) % affirmations.length), 4000);
    return () => { if (affTimer.current) window.clearInterval(affTimer.current); };
  }, []);

  const handleSaveAddiction = async () => {
    if (!user || !addiction.trim()) return;
    setSaving(true);
    try {
      await setUserAddiction(user, addiction.trim());
      setSavedAddiction(addiction.trim());
    } finally { setSaving(false); }
  };

  const onPickLevel = async (level: LevelKey) => {
    if (!user) return;
    await logCraving(user, level);
    try { await logStreakActivity(user, 'recover'); } catch {}
    // Quick feedback via alert for now; could use modal/animation
    alert(levelMeta[level].action);
  };

  const reframeThought = (t: string) => {
    if (!t) return '';
    const lower = t.toLowerCase();
    if (lower.includes('can\'t') || lower.includes('cannot')) return 'I can take one small step right now.';
    if (lower.includes('need') || lower.includes('crave')) return 'This urge will pass. I choose my recovery.';
    if (lower.includes('fail') || lower.includes('weak')) return 'I am resilient. Every choice builds strength.';
    return 'I acknowledge the urge and let it flow by without acting.';
  };

  const handleShadowBox = async () => {
    if (!user || !shadowInput.trim()) return;
    const reframed = reframeThought(shadowInput.trim());
    setShadowReframe(reframed);
    await addShadowBox(user, shadowInput.trim(), reframed);
    setShadowInput('');
  };

  const handleWhisper = async () => {
    if (!user || !whisper.trim()) return;
    await addWhisper(user, whisper.trim());
    setWhisper('');
    alert('Saved. We\'ll surface this when you need it most.');
  };

  const particles = useMemo(() => Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    opacity: 0.15 + Math.random() * 0.35,
  })), []);

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        {particles.map(p => (
          <motion.div key={p.id} className="rounded-full bg-cyan-400/40 blur-xl"
            style={{width:p.size*10, height:p.size*10, position:'absolute', left:p.x+'%', top:p.y+'%'}}
            animate={{x: [0, 10, -10, 0], y: [0, -8, 8, 0]}}
            transition={{duration: 8 + (p.id % 5), repeat: Infinity, ease: 'easeInOut'}}
          />
        ))}
      </div>

      <section className="px-6 py-10 max-w-5xl mx-auto">
        <div className="text-3xl md:text-4xl font-extrabold">Your Recovery Journey, Your Aura.</div>
        <div className="mt-2 text-lg text-gray-600 dark:text-gray-300">
          <AnimatePresence mode="wait">
            <motion.div key={currentAff} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.25}}>
              {affirmations[currentAff]}
            </motion.div>
          </AnimatePresence>
        </div>

        {!savedAddiction && (
          <div className="mt-6 p-4 rounded-xl bg-white/60 dark:bg-white/5 border">
            <div className="text-sm mb-2">What are you recovering from? (saved once)</div>
            <div className="flex gap-2">
              <input value={addiction} onChange={(e)=>setAddiction(e.target.value)} placeholder="e.g., nicotine, alcohol, gambling" className="flex-1 px-3 py-2 rounded-md border"/>
              <button onClick={handleSaveAddiction} disabled={saving || !addiction.trim()} className="px-4 py-2 rounded-md bg-emerald-600 text-white disabled:opacity-40">Save</button>
            </div>
          </div>
        )}
      </section>

      <section className="px-6 max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl border bg-white/70 dark:bg-white/5">
          <div className="font-semibold mb-2">Craving Compass</div>
          <div className="relative w-64 h-64 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-white/40" />
            <div className="absolute inset-3 rounded-full border border-white/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-sm opacity-70">Tap a state</div>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-2">
              <button onClick={()=>onPickLevel('Calm')} className="px-3 py-1 rounded-full bg-emerald-500/80 text-white shadow">{levelMeta.Calm.emoji} Calm</button>
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <button onClick={()=>onPickLevel('Tempted')} className="px-3 py-1 rounded-full bg-amber-500/80 text-white shadow">{levelMeta.Tempted.emoji} Tempted</button>
            </div>
            <div className="absolute left-2 top-1/2 -translate-y-1/2">
              <button onClick={()=>onPickLevel('Struggling')} className="px-3 py-1 rounded-full bg-orange-500/80 text-white shadow">{levelMeta.Struggling.emoji} Struggling</button>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-2">
              <button onClick={()=>onPickLevel('Urgent')} className="px-3 py-1 rounded-full bg-rose-600/80 text-white shadow">{levelMeta.Urgent.emoji} Urgent</button>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-white/70 dark:bg-white/5">
          <div className="font-semibold mb-2">Shadow Box (Face the Urge)</div>
          <div className="space-y-2">
            <textarea value={shadowInput} onChange={(e)=>setShadowInput(e.target.value)} placeholder="What is the craving telling you?" className="w-full px-3 py-2 rounded-md border min-h-[96px]" />
            <button onClick={handleShadowBox} className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-40">Reframe</button>
            {shadowReframe && (
              <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/30">{shadowReframe}</div>
            )}
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-white/70 dark:bg-white/5">
          <div className="font-semibold mb-2">Milestone Path</div>
          <div className="flex items-center gap-3">
            {Array.from({length: 10}).map((_,i)=> (
              <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 opacity-60" />
            ))}
          </div>
          <div className="mt-3 text-sm opacity-70">Unlock badges at 7 days, Rode the Cravings, 30 days strong.</div>
        </div>

        <div className="p-5 rounded-2xl border bg-white/70 dark:bg-white/5">
          <div className="font-semibold mb-2">Distraction Vault</div>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <button className="px-3 py-2 rounded-lg border">Puzzle</button>
            <button className="px-3 py-2 rounded-lg border">Coloring</button>
            <button className="px-3 py-2 rounded-lg border">Breathing Visual</button>
            <button className="px-3 py-2 rounded-lg border">Matching</button>
            <button className="px-3 py-2 rounded-lg border">Cards</button>
            <button className="px-3 py-2 rounded-lg border">Call a Friend</button>
          </div>
          <div className="mt-3 text-sm opacity-70">Try a 30-second motivational clip.</div>
        </div>

        <div className="p-5 rounded-2xl border bg-white/70 dark:bg-white/5">
          <div className="font-semibold mb-2">Whisper Log</div>
          <div className="flex gap-2">
            <input value={whisper} onChange={(e)=>setWhisper(e.target.value)} placeholder="Write to your future self" className="flex-1 px-3 py-2 rounded-md border" />
            <button onClick={handleWhisper} className="px-4 py-2 rounded-md bg-emerald-600 text-white">Save</button>
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-white/70 dark:bg-white/5">
          <div className="font-semibold mb-2">Recovery Map</div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({length: 28}).map((_,i)=> (
              <div key={i} className="h-8 rounded-md bg-cyan-400/20" />
            ))}
          </div>
          <div className="mt-2 text-sm opacity-70">Glow brighter on hard days survived.</div>
        </div>
      </section>

      <footer className="px-6 py-10 max-w-5xl mx-auto text-center text-sm opacity-80">
        <div className="italic">{`"`}Recovery is powered by RYD Mental Health. You are never alone.{`"`}</div>
        <a href="https://rydmentalhealth.org" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-2 text-blue-600">
          <img src="/ryd-logo.svg" alt="RYD" className="w-5 h-5" /> rydmentalhealth.org
        </a>
      </footer>
    </main>
  );
}

