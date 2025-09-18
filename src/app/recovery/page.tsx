'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp, doc, setDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { QuerySnapshot, DocumentData, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { saveRecoveryLog, updateUserAuraPoints } from '@/lib/firestoreCollections';
import Link from 'next/link';

// Local helpers
const AFFIRMATIONS = [
  'I am stronger than my cravings.',
  'Healing is possible, step by step.',
  'My past does not define my future.',
];

const QUOTES = [
  'You are not your thoughts. You are the sky; cravings are the weather.',
  'Every urge survived rewires your strength.',
  'Small steps, big courage. Keep going.',
];

type CompassState = 'Calm' | 'Tempted' | 'Struggling' | 'Urgent';

export default function RecoveryHubPage() {
  const { user } = useAuth();
  const [affirmationIdx, setAffirmationIdx] = useState(0);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [compass, setCompass] = useState<CompassState>('Calm');
  const [showAction, setShowAction] = useState<CompassState | null>(null);
  const [shadowInput, setShadowInput] = useState('');
  const [reframe, setReframe] = useState('');
  const [whisper, setWhisper] = useState('');
  
  // Recovery log form state
  const [showRecoveryLog, setShowRecoveryLog] = useState(false);
  const [trigger, setTrigger] = useState('');
  const [cravingLevel, setCravingLevel] = useState(1);
  const [copingTool, setCopingTool] = useState('');
  const [relapse, setRelapse] = useState(false);
  const [notes, setNotes] = useState('');
  type WhisperDoc = { text: string; createdAt?: Timestamp };
  type CravingDoc = { state: CompassState; createdAt?: Timestamp };
  type BadgeDoc = { unlockedAt?: Timestamp; label?: string };
  const [whispers, setWhispers] = useState<Array<{ id: string } & WhisperDoc>>([]);
  const [cravingLogs, setCravingLogs] = useState<Array<{ id: string } & CravingDoc>>([]);
  const [badges, setBadges] = useState<Array<{ id: string } & BadgeDoc>>([]);
  const [resurfacedWhisper, setResurfacedWhisper] = useState<string | null>(null);

  // Rotating affirmations & quotes
  useEffect(() => {
    const a = setInterval(() => setAffirmationIdx((i: number) => (i + 1) % AFFIRMATIONS.length), 4000);
    const q = setInterval(() => setQuoteIdx((i: number) => (i + 1) % QUOTES.length), 8000);
    return () => { clearInterval(a); clearInterval(q); };
  }, []);

  // Firestore live data
  useEffect(() => {
    if (!user) return;
    const whispersCol = collection(db, 'users', user.uid, 'recovery_whispers');
    const whispersQ = query(whispersCol, orderBy('createdAt', 'desc'));
    const unsubWhispers = onSnapshot(whispersQ, (snap: QuerySnapshot<DocumentData>) => {
      setWhispers(snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...(d.data() as WhisperDoc) })));
    });

    const cravingsCol = collection(db, 'users', user.uid, 'recovery_cravings');
    const cravingsQ = query(cravingsCol, orderBy('createdAt', 'desc'));
    const unsubCravings = onSnapshot(cravingsQ, (snap: QuerySnapshot<DocumentData>) => {
      setCravingLogs(snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...(d.data() as CravingDoc) })));
    });

    const badgesCol = collection(db, 'users', user.uid, 'recovery_badges');
    const unsubBadges = onSnapshot(badgesCol, (snap: QuerySnapshot<DocumentData>) => {
      setBadges(snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...(d.data() as BadgeDoc) })));
    });

    return () => { unsubWhispers(); unsubCravings(); unsubBadges(); };
  }, [user]);

  // Animated background interactions
  const bgRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bgRef.current;
    if (!el) return;
    let px = 0, py = 0;
    const onMove = (e: TouchEvent | MouseEvent) => {
      const x = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const y = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      px = (x / window.innerWidth - 0.5) * 10;
      py = (y / window.innerHeight - 0.5) * 10;
      el.style.setProperty('--parallaxX', `${px}`);
      el.style.setProperty('--parallaxY', `${py}`);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
    };
  }, []);

  // Compass quick actions
  const handleCompassSelect = async (state: CompassState) => {
    setCompass(state);
    setShowAction(state);
    // surface a supportive whisper on tough states
    if ((state === 'Struggling' || state === 'Urgent') && whispers.length > 0) {
      const w = whispers[Math.floor(Math.random() * whispers.length)];
      setResurfacedWhisper(w?.text ?? null);
    } else {
      setResurfacedWhisper(null);
    }
    if (user) {
      await addDoc(collection(db, 'users', user.uid, 'recovery_cravings'), {
        state,
        createdAt: serverTimestamp(),
      });
    }
  };

  // Shadow Box reframe
  const generateReframe = (input: string) => {
    if (!input) return '';
    const templates = [
      'I notice the thought: "{t}". I choose calm actions that honor my recovery.',
      'The urge says "{t}", but I remember: urges peak and pass. I can surf it.',
      '"{t}" is a thought, not a command. I am in control of my choices.',
    ];
    const pick = templates[Math.floor(Math.random() * templates.length)];
    return pick.replace('{t}', input);
  };

  const handleShadowSubmit = async () => {
    if (!user || !shadowInput.trim()) return;
    const reframed = generateReframe(shadowInput.trim());
    setReframe(reframed);
    await addDoc(collection(db, 'users', user.uid, 'recovery_shadow_box'), {
      input: shadowInput.trim(),
      reframe: reframed,
      createdAt: serverTimestamp(),
    });
    setShadowInput('');
  };

  const handleSaveWhisper = async () => {
    if (!user || !whisper.trim()) return;
    await addDoc(collection(db, 'users', user.uid, 'recovery_whispers'), {
      text: whisper.trim(),
      createdAt: serverTimestamp(),
    });
    setWhisper('');
  };

  const handleSaveRecoveryLog = async () => {
    if (!user) return;
    
    try {
      await saveRecoveryLog(user.uid, {
        trigger: trigger.trim() || undefined,
        cravingLevel,
        copingToolUsed: copingTool.trim(),
        relapse,
        notes: notes.trim(),
      });
      
      await updateUserAuraPoints(user.uid);
      
      // Reset form
      setTrigger('');
      setCravingLevel(1);
      setCopingTool('');
      setRelapse(false);
      setNotes('');
      setShowRecoveryLog(false);
    } catch (error) {
      console.error('Error saving recovery log:', error);
    }
  };

  // Simple milestone calc
  const milestones = useMemo(() => {
    const logsWithDate = cravingLogs.filter((c): c is { id: string } & CravingDoc & { createdAt: Timestamp } => !!c.createdAt && typeof c.createdAt.toDate === 'function');
    const daysLogged = new Set(logsWithDate.map((c) => c.createdAt.toDate().toDateString())).size;
    return {
      daysLogged,
      has7: daysLogged >= 7,
      has30: daysLogged >= 30,
    };
  }, [cravingLogs]);

  // Persist badges when unlocked
  useEffect(() => {
    if (!user) return;
    const already = new Set(badges.map((b) => b.id));
    const ops: Promise<void>[] = [];
    if (milestones.has7 && !already.has('badge_7_days')) {
      ops.push(setDoc(doc(db, 'users', user.uid, 'recovery_badges', 'badge_7_days'), { unlockedAt: serverTimestamp(), label: '🌱 7 Days' }));
    }
    if (milestones.has30 && !already.has('badge_30_days')) {
      ops.push(setDoc(doc(db, 'users', user.uid, 'recovery_badges', 'badge_30_days'), { unlockedAt: serverTimestamp(), label: '🌟 30 Days Strong' }));
    }
    if (ops.length) { Promise.allSettled(ops); }
  }, [milestones.has7, milestones.has30, user, badges]);

  return (
    <div className="relative mx-auto max-w-5xl px-4 pb-20">
      {/* Animated BG */}
      <div ref={bgRef} aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 via-purple-500/10 to-transparent" />
        <motion.div
          className="absolute -inset-40 rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(600px 600px at calc(50% + var(--parallaxX,0px)) calc(30% + var(--parallaxY,0px)), rgba(59,130,246,0.25), transparent 60%), radial-gradient(500px 500px at calc(30% - var(--parallaxX,0px)) calc(60% - var(--parallaxY,0px)), rgba(236,72,153,0.25), transparent 60%)',
          }}
          animate={{ opacity: [0.6, 1, 0.8] }}
          transition={{ duration: 6, repeat: Infinity, repeatType: 'mirror' }}
        />
        {/* Simple particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute block h-1 w-1 rounded-full bg-white/40"
              style={{ top: `${(i * 127) % 100}%`, left: `${(i * 251) % 100}%` }}
              animate={{ y: [0, -10, 0], opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 3 + (i % 5), delay: i * 0.1, repeat: Infinity }}
            />
          ))}
        </div>
      </div>

      {/* Welcome Block */}
      <section className="pt-10 text-center">
        <div className="text-sm opacity-80 mb-2">
          <AnimatePresence mode="popLayout">
            <motion.div key={affirmationIdx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.35 }}>
              {AFFIRMATIONS[affirmationIdx]}
            </motion.div>
          </AnimatePresence>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
          Your Recovery Journey, Your Aura.
        </h1>
      </section>

      {/* 1. Craving Compass */}
      <section className="mt-10 grid md:grid-cols-2 gap-6 items-center">
        <div className="relative aspect-square mx-auto w-full max-w-sm">
          <div className="absolute inset-0 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm" />
          <div className="absolute inset-6 rounded-full bg-gradient-to-b from-white/5 to-white/0" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="uppercase text-xs opacity-70">Craving Compass</div>
              <div className="text-2xl font-bold mt-1">{compass}</div>
            </div>
          </div>
          <div className="absolute inset-2">
            <div className="grid grid-cols-2 grid-rows-2 h-full w-full">
              {([
                ['Calm', '🟢'],
                ['Tempted', '🟡'],
                ['Struggling', '🟠'],
                ['Urgent', '🔴'],
              ] as [CompassState, string][]).map(([label, emoji]) => (
                <button
                  key={label}
                  onClick={() => handleCompassSelect(label)}
                  className="relative m-2 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 transition p-4 flex items-center justify-center text-center"
                >
                  <div className="text-3xl" aria-hidden>{emoji}</div>
                  <div className="absolute bottom-2 text-xs opacity-80">{label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-2">Quick actions</h3>
          <ul className="space-y-2 text-sm opacity-90">
            <li><b>Calm</b>: reflection prompt</li>
            <li><b>Tempted</b>: 1-minute grounding</li>
            <li><b>Struggling</b>: guided breathing animation</li>
            <li><b>Urgent</b>: SOS sequence</li>
          </ul>
          <p className="text-xs mt-3 opacity-70">Your selections are saved to your profile to grow your aura points.</p>
        </div>
      </section>

      <AnimatePresence>
        {showAction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white/10 border border-white/20 backdrop-blur p-5">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{showAction} action</div>
                <button className="text-sm opacity-80 hover:opacity-100" onClick={() => setShowAction(null)}>Close</button>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                {showAction === 'Calm' && (
                  <div>
                    <div className="mb-2">Reflection: What helped you stay steady today?</div>
                    <BreathingBar seconds={20} />
                  </div>
                )}
                {showAction === 'Tempted' && <GroundingOneMinute />}
                {showAction === 'Struggling' && (
                  <div className="space-y-3">
                    <BreathingCircle />
                    {resurfacedWhisper && (
                      <div className="text-xs p-2 rounded bg-white/10 border border-white/15">
                        <div className="uppercase opacity-70 mb-1">From your past self</div>
                        <div>{resurfacedWhisper}</div>
                      </div>
                    )}
                  </div>
                )}
                {showAction === 'Urgent' && (
                  <div className="space-y-3">
                    <SOSBlock />
                    {resurfacedWhisper && (
                      <div className="text-xs p-2 rounded bg-white/10 border border-white/15">
                        <div className="uppercase opacity-70 mb-1">From your past self</div>
                        <div>{resurfacedWhisper}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Shadow Box */}
      <section className="mt-10">
        <h3 className="font-semibold text-lg mb-2">Shadow Box (Face the Urge)</h3>
        <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
          <label className="text-sm opacity-80">What is your craving telling you?</label>
          <textarea value={shadowInput} onChange={(e) => setShadowInput(e.target.value)} placeholder="Type the voice of the craving..." className="mt-2 w-full rounded-lg bg-black/20 p-3 outline-none border border-white/10" rows={3} />
          <div className="mt-3 flex gap-2">
            <button onClick={handleShadowSubmit} className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white">Reframe</button>
            <button onClick={() => { setShadowInput(''); setReframe(''); }} className="px-4 py-2 rounded-full border border-white/20">Clear</button>
          </div>
          {reframe && (
            <div className="mt-4 text-sm p-3 rounded-lg bg-white/10 border border-white/15">
              <div className="uppercase text-xs opacity-70 mb-1">Reframed</div>
              <div>{reframe}</div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Milestone Path */}
      <section className="mt-10">
        <h3 className="font-semibold text-lg mb-2">Milestone Path</h3>
        <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
          <MilestonePath daysLogged={milestones.daysLogged} />
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <Badge active={milestones.has7} share="I unlocked 🌱 7 Days on AuraX!">🌱 7 Days</Badge>
            <Badge active={milestones.daysLogged >= 1} share="I rode the cravings today with AuraX!">🌊 Rode the Cravings</Badge>
            <Badge active={milestones.has30} share="30 Days Strong on AuraX 🌟">🌟 30 Days Strong</Badge>
          </div>
          <div className="mt-3 text-xs opacity-70">Share badges from your dashboard or socials.</div>
        </div>
      </section>

      {/* 4. Distraction Vault */}
      <section className="mt-10 grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
          <h3 className="font-semibold mb-2">Distraction Vault</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <MiniPuzzle />
            <ColoringAnim />
            <BreathingVisual />
            <CallAFriend />
          </div>
        </div>
        {/* 5. Snippets + Whisper Log */}
        <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
          <h3 className="font-semibold mb-2">Motivation & Whisper Log</h3>
          <ThirtySecondSnippet />
          <div className="mt-4">
            <label className="text-sm opacity-80">Write a note to future you</label>
            <textarea value={whisper} onChange={(e) => setWhisper(e.target.value)} placeholder="Short encouragement for a tough moment later..." className="mt-2 w-full rounded-lg bg-black/20 p-3 outline-none border border-white/10" rows={3} />
            <div className="mt-3">
              <button onClick={handleSaveWhisper} className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white">Save Whisper</button>
            </div>
            {whispers.length > 0 && (
              <div className="mt-4 text-sm">
                <div className="uppercase text-xs opacity-70 mb-1">Your whispers</div>
                <ul className="space-y-2">
                  {whispers.slice(0, 4).map((w) => (
                    <li key={w.id} className="p-2 rounded-lg bg-white/10 border border-white/15">{w.text}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. Recovery Log */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Recovery Log</h3>
          <button
            onClick={() => setShowRecoveryLog(true)}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm hover:scale-105 transition"
          >
            + Log Entry
          </button>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
          <p className="text-sm opacity-80">
            Track your recovery journey with detailed logs. Each entry helps build your aura and provides insights into your progress.
          </p>
        </div>
      </section>

      {/* Recovery Log Modal */}
      {showRecoveryLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Recovery Log Entry</h3>
              <button
                onClick={() => setShowRecoveryLog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Trigger (optional)</label>
                <input
                  type="text"
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  placeholder="What triggered the craving?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Craving Level (1-10)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                    <button
                      key={level}
                      onClick={() => setCravingLevel(level)}
                      className={`w-8 h-8 rounded-full text-sm transition ${
                        cravingLevel === level
                          ? 'bg-purple-500 text-white'
                          : 'border border-gray-300 hover:border-purple-300'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Coping Tool Used</label>
                <input
                  type="text"
                  value={copingTool}
                  onChange={(e) => setCopingTool(e.target.value)}
                  placeholder="e.g., Breathing exercise, Called friend, Went for walk"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={relapse}
                    onChange={(e) => setRelapse(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">This was a relapse</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional thoughts, feelings, or observations..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveRecoveryLog}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-2 px-4 rounded-lg font-medium hover:scale-105 transition"
                >
                  Save Entry (+10 Aura Points)
                </button>
                <button
                  onClick={() => setShowRecoveryLog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Recovery Map */}
      <section className="mt-10">
        <h3 className="font-semibold text-lg mb-2">Recovery Map</h3>
        <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
          <HeatmapCalendar logs={cravingLogs} />
          <div className="text-xs opacity-70 mt-2">Glow is brighter on hard days survived.</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 text-center">
        <div className="text-sm opacity-80 mb-2">
          <AnimatePresence mode="popLayout">
            <motion.div key={quoteIdx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.35 }}>
              {QUOTES[quoteIdx]}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="text-xs opacity-70">
          Recovery is powered by <a className="font-semibold underline decoration-dotted hover:opacity-100" href="https://rydmentalhealth.com" target="_blank" rel="noopener noreferrer">RYD Mental Health</a>. You are never alone.
        </div>
      </footer>
    </div>
  );
}

// UI Components
function Badge({ active, share, children }: { active?: boolean; share?: string; children: React.ReactNode }) {
  const navAny = typeof navigator !== 'undefined' ? (navigator as unknown as { share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>; clipboard?: { writeText: (text: string) => Promise<void> } }) : undefined;
  const canShare = !!navAny?.share;
  const onShare = async () => {
    if (!active) return;
    try {
      if (canShare && navAny?.share) {
        await navAny.share({ title: 'AuraX Recovery', text: share ?? 'Proud of my recovery progress on AuraX.', url: typeof window !== 'undefined' ? window.location.origin : undefined });
      } else if (navAny?.clipboard?.writeText) {
        await navAny.clipboard.writeText(share ?? 'Proud of my recovery progress on AuraX.');
        alert('Copied to clipboard!');
      }
    } catch {
      // swallow share errors
    }
  };
  return (
    <button onClick={onShare} className={`px-3 py-1 rounded-full border text-xs ${active ? 'bg-emerald-500/20 border-emerald-400/40 hover:bg-emerald-500/30' : 'bg-white/5 border-white/15 opacity-70 cursor-default'}`}>
      {children}
    </button>
  );
}

function MilestonePath({ daysLogged }: { daysLogged: number }) {
  const stones = Array.from({ length: 14 }).map((_, i) => i + 1);
  return (
    <div className="relative">
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-cyan-400/40 to-purple-400/40" />
      <div className="relative grid grid-cols-7 gap-3">
        {stones.map((d) => (
          <motion.div key={d} initial={{ scale: 0.9, opacity: 0.6 }} animate={{ scale: d <= daysLogged ? 1.05 : 1, opacity: 1 }} transition={{ duration: 0.3 }} className={`h-8 rounded-full ${d <= daysLogged ? 'bg-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.5)]' : 'bg-white/10'}`} />
        ))}
      </div>
    </div>
  );
}

function MiniPuzzle() {
  const [order, setOrder] = useState([0,1,2,3]);
  const shuffle = () => setOrder((o: number[]) => o.slice().sort(() => Math.random() - 0.5));
  const isWin = order.join(',') === '0,1,2,3';
  return (
    <div className="rounded-lg border border-white/10 p-3">
      <div className="text-xs opacity-70 mb-2">Mini Puzzle</div>
      <div className="grid grid-cols-2 gap-1">
        {order.map((n: number, i: number) => (
          <button key={i} onClick={shuffle} className={`h-10 rounded bg-white/10 ${n===i?'ring-2 ring-emerald-400/60':''}`}>{n+1}</button>
        ))}
      </div>
      {isWin && <div className="text-xs mt-2 text-emerald-300">Nice! Ordered!</div>}
    </div>
  );
}

function ColoringAnim() {
  const [hue, setHue] = useState(200);
  return (
    <div className="rounded-lg border border-white/10 p-3">
      <div className="text-xs opacity-70 mb-2">Color Flow</div>
      <motion.div className="h-16 rounded" style={{ background: `hsl(${hue},70%,50%)` }} animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 2, repeat: Infinity }} />
      <input type="range" min={0} max={360} value={hue} onChange={(e) => setHue(parseInt(e.target.value))} className="mt-2 w-full" />
    </div>
  );
}

function BreathingVisual() {
  return (
    <div className="rounded-lg border border-white/10 p-3">
      <div className="text-xs opacity-70 mb-2">Breathing Visual</div>
      <motion.div className="h-16 rounded bg-white/10" animate={{ scaleY: [1, 1.4, 1] }} transition={{ duration: 6, repeat: Infinity }} />
      <div className="text-[11px] opacity-70 mt-1">Inhale 4 • Hold 4 • Exhale 6</div>
    </div>
  );
}

function CallAFriend() {
  const contacts = ['Alex', 'Sam', 'Jordan', 'Taylor'];
  const [pick, setPick] = useState<string | null>(null);
  const spin = () => {
    const idx = Math.floor(Math.random() * contacts.length);
    setPick(contacts[idx]);
  };
  return (
    <div className="rounded-lg border border-white/10 p-3">
      <div className="text-xs opacity-70 mb-2">Call a Friend</div>
      <button onClick={spin} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15">Spin</button>
      {pick && <div className="text-xs mt-2">Suggested: <span className="font-medium">{pick}</span></div>}
    </div>
  );
}

function ThirtySecondSnippet() {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => { const a = audioRef.current; return () => { if (a) a.pause(); }; }, []);
  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); } else { audioRef.current.currentTime = 0; audioRef.current.play(); }
    setPlaying((p) => !p);
  };
  return (
    <div className="rounded-lg border border-white/10 p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm">30s Motivation</div>
        <button onClick={toggle} className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">{playing ? 'Pause' : 'Play'}</button>
      </div>
      <audio ref={audioRef} src="/sw.mp3" preload="auto" />
      <div className="text-[11px] opacity-70 mt-1">Short audio to anchor you. Video mode coming soon.</div>
    </div>
  );
}

function BreathingBar({ seconds = 20 }: { seconds?: number }) {
  return (
    <div className="mt-2 h-2 rounded bg-white/10 overflow-hidden">
      <motion.div className="h-full bg-cyan-400/70" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: seconds, ease: 'linear' }} />
    </div>
  );
}

function GroundingOneMinute() {
  return (
    <div className="text-sm space-y-2">
      <div>Find 5 things you can see • 4 you can touch • 3 you can hear • 2 you can smell • 1 you can taste.</div>
      <BreathingBar seconds={60} />
    </div>
  );
}

function BreathingCircle() {
  return (
    <div className="text-center">
      <motion.div className="mx-auto h-24 w-24 rounded-full border-2 border-white/30" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 6, repeat: Infinity }} />
      <div className="text-xs opacity-70 mt-2">Breathe with the circle</div>
    </div>
  );
}

function SOSBlock() {
  return (
    <div className="space-y-2 text-sm">
      <div>1) Step away • 2) Breathe • 3) Call support</div>
      <Link href="/toolkit/panic" className="inline-block px-3 py-1.5 rounded-full bg-rose-500 text-white">Open SOS</Link>
    </div>
  );
}

function HeatmapCalendar({ logs }: { logs: { state: CompassState; createdAt?: Timestamp }[] }) {
  const today = new Date();
  const days = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (29 - i));
    return d;
  });
  const intensityForDay = (d: Date) => {
    const key = d.toDateString();
    const items = logs.filter((l) => l.createdAt && typeof l.createdAt.toDate === 'function' && l.createdAt.toDate().toDateString() === key);
    const score = items.reduce((acc, it) => {
      const val = it.state === 'Calm' ? 0 : it.state === 'Tempted' ? 1 : it.state === 'Struggling' ? 2 : 3;
      return Math.max(acc, val);
    }, 0);
    return score; // 0-3
  };
  return (
    <div className="grid grid-cols-10 gap-1">
      {days.map((d, i) => {
        const s = intensityForDay(d);
        const shades = ['bg-white/10', 'bg-yellow-400/40', 'bg-orange-400/50', 'bg-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.5)]'];
        return <div key={i} title={d.toDateString()} className={`h-5 rounded ${shades[s]}`} />;
      })}
    </div>
  );
}

