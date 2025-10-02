'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { addShadowBox, addWhisper, logCraving, setUserAddiction } from '@/lib/userProfile';
import { awardAuraPoints } from '@/lib/auraPoints';
import Link from 'next/link';

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
  
  // Sobriety tracking state
  const [sobrietyStartDate, setSobrietyStartDate] = useState<string>('');
  const [sobrietyStreak, setSobrietyStreak] = useState(0);
  const [milestones, setMilestones] = useState<Array<{id: string, title: string, achieved: boolean, date?: string}>>([]);
  const [dailyCheckIns, setDailyCheckIns] = useState<Array<{date: string, mood: number, triggers: string[], notes: string}>>([]);
  const [todayCheckIn, setTodayCheckIn] = useState({mood: 5, triggers: [] as string[], notes: ''});

  useEffect(() => {
    if (affTimer.current) window.clearInterval(affTimer.current);
    affTimer.current = window.setInterval(() => setCurrentAff((i) => (i + 1) % affirmations.length), 4000);
    return () => { if (affTimer.current) window.clearInterval(affTimer.current); };
  }, []);

  // Initialize sobriety tracking
  useEffect(() => {
    if (user) {
      const savedData = localStorage.getItem(`sobriety_${user.uid}`);
      if (savedData) {
        const data = JSON.parse(savedData);
        setSobrietyStartDate(data.startDate || '');
        setSobrietyStreak(data.streak || 0);
        setMilestones(data.milestones || []);
        setDailyCheckIns(data.checkIns || []);
      }
    }
  }, [user]);

  // Calculate sobriety streak
  const calculateStreak = () => {
    if (!sobrietyStartDate) return 0;
    const start = new Date(sobrietyStartDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Initialize milestones
  useEffect(() => {
    if (sobrietyStartDate && milestones.length === 0) {
      const initialMilestones = [
        { id: '1', title: '24 Hours Clean', achieved: false },
        { id: '2', title: '1 Week Strong', achieved: false },
        { id: '3', title: '30 Days Victory', achieved: false },
        { id: '4', title: '90 Days Champion', achieved: false },
        { id: '5', title: '6 Months Hero', achieved: false },
        { id: '6', title: '1 Year Legend', achieved: false },
      ];
      setMilestones(initialMilestones);
    }
  }, [sobrietyStartDate, milestones.length]);

  // Check milestone achievements
  useEffect(() => {
    const currentStreak = calculateStreak();
    setSobrietyStreak(currentStreak);
    
    const updatedMilestones = milestones.map(milestone => {
      let shouldAchieve = false;
      switch (milestone.id) {
        case '1': shouldAchieve = currentStreak >= 1; break;
        case '2': shouldAchieve = currentStreak >= 7; break;
        case '3': shouldAchieve = currentStreak >= 30; break;
        case '4': shouldAchieve = currentStreak >= 90; break;
        case '5': shouldAchieve = currentStreak >= 180; break;
        case '6': shouldAchieve = currentStreak >= 365; break;
      }
      
      if (shouldAchieve && !milestone.achieved) {
        // Award points for milestone
        if (user) {
          awardAuraPoints({
            user,
            activity: 'first_time_bonus',
            description: `🏆 ${milestone.title} milestone achieved!`,
            uniqueId: `milestone-${milestone.id}-${user.uid}`
          });
        }
        return { ...milestone, achieved: true, date: new Date().toISOString() };
      }
      return milestone;
    });
    
    if (JSON.stringify(updatedMilestones) !== JSON.stringify(milestones)) {
      setMilestones(updatedMilestones);
    }
  }, [sobrietyStartDate, user]);

  // Save data to localStorage
  useEffect(() => {
    if (user && sobrietyStartDate) {
      const data = {
        startDate: sobrietyStartDate,
        streak: sobrietyStreak,
        milestones,
        checkIns: dailyCheckIns
      };
      localStorage.setItem(`sobriety_${user.uid}`, JSON.stringify(data));
    }
  }, [user, sobrietyStartDate, sobrietyStreak, milestones, dailyCheckIns]);

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

  const handleStartSobriety = () => {
    const today = new Date().toISOString().split('T')[0];
    setSobrietyStartDate(today);
    alert('🎉 Your sobriety journey begins today! You\'ve got this!');
  };

  const handleDailyCheckIn = () => {
    const today = new Date().toISOString().split('T')[0];
    const newCheckIn = {
      date: today,
      mood: todayCheckIn.mood,
      triggers: todayCheckIn.triggers,
      notes: todayCheckIn.notes
    };
    
    setDailyCheckIns(prev => {
      const filtered = prev.filter(checkIn => checkIn.date !== today);
      return [...filtered, newCheckIn];
    });
    
    setTodayCheckIn({mood: 5, triggers: [], notes: ''});
    alert('✅ Daily check-in saved! Keep up the great work!');
  };

  const getStreakDisplay = () => {
    if (!sobrietyStartDate) return 'Not started';
    const days = calculateStreak();
    if (days === 0) return 'Starting today';
    if (days === 1) return '1 day strong';
    if (days < 7) return `${days} days strong`;
    if (days < 30) return `${days} days (${Math.floor(days/7)} weeks)`;
    if (days < 365) return `${days} days (${Math.floor(days/30)} months)`;
    return `${days} days (${Math.floor(days/365)} years)`;
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
        <div className="text-3xl md:text-4xl font-extrabold">Your Addiction Recovery Journey</div>
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

        {/* Sobriety Tracker */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">🎯 Sobriety Tracker</h2>
            {!sobrietyStartDate && (
              <button 
                onClick={handleStartSobriety}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
              >
                Start Journey
              </button>
            )}
          </div>
          
          {sobrietyStartDate ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{getStreakDisplay()}</div>
                <div className="text-emerald-100">Sobriety Streak</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{milestones.filter(m => m.achieved).length}</div>
                <div className="text-emerald-100">Milestones Achieved</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{dailyCheckIns.length}</div>
                <div className="text-emerald-100">Check-ins Completed</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-emerald-100">Ready to start your recovery journey? Every day counts!</p>
            </div>
          )}
        </div>
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
            <Link href="/toolkit/breathing" className="px-3 py-2 rounded-lg border hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-center">🫁 Breathing</Link>
            <Link href="/toolkit/meditations" className="px-3 py-2 rounded-lg border hover:bg-purple-50 dark:hover:bg-purple-900/20 transition text-center">🧘 Meditation</Link>
            <Link href="/toolkit/workouts" className="px-3 py-2 rounded-lg border hover:bg-green-50 dark:hover:bg-green-900/20 transition text-center">💪 Workout</Link>
            <Link href="/chat" className="px-3 py-2 rounded-lg border hover:bg-pink-50 dark:hover:bg-pink-900/20 transition text-center">🤖 AI Chat</Link>
            <Link href="/journal" className="px-3 py-2 rounded-lg border hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition text-center">📔 Journal</Link>
            <button className="px-3 py-2 rounded-lg border hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition">📞 Call Support</button>
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
          <div className="font-semibold mb-2">Recovery Milestones</div>
          <div className="space-y-2">
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className={`flex items-center justify-between p-2 rounded-lg ${
                milestone.achieved ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${milestone.achieved ? '🏆' : '⏳'}`}></span>
                  <span className={milestone.achieved ? 'font-semibold' : ''}>{milestone.title}</span>
                </div>
                {milestone.achieved && milestone.date && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    {new Date(milestone.date).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm opacity-70">Each milestone unlocks Aura Points!</div>
        </div>

        <div className="p-5 rounded-2xl border bg-white/70 dark:bg-white/5">
          <div className="font-semibold mb-2">Daily Check-in</div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">How are you feeling today? (1-10)</label>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={todayCheckIn.mood}
                onChange={(e) => setTodayCheckIn(prev => ({...prev, mood: Number(e.target.value)}))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Struggling</span>
                <span className="font-bold">{todayCheckIn.mood}</span>
                <span>Great</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm mb-1">Triggers today (optional)</label>
              <div className="flex flex-wrap gap-1">
                {['Stress', 'Social', 'Boredom', 'Celebration', 'Loneliness'].map(trigger => (
                  <button
                    key={trigger}
                    onClick={() => setTodayCheckIn(prev => ({
                      ...prev,
                      triggers: prev.triggers.includes(trigger) 
                        ? prev.triggers.filter(t => t !== trigger)
                        : [...prev.triggers, trigger]
                    }))}
                    className={`px-2 py-1 text-xs rounded ${
                      todayCheckIn.triggers.includes(trigger)
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    {trigger}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm mb-1">Notes (optional)</label>
              <textarea
                value={todayCheckIn.notes}
                onChange={(e) => setTodayCheckIn(prev => ({...prev, notes: e.target.value}))}
                placeholder="How was your day? Any challenges or victories?"
                className="w-full p-2 text-sm rounded border"
                rows={2}
              />
            </div>
            
            <button
              onClick={handleDailyCheckIn}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              Save Check-in
            </button>
          </div>
        </div>


        <div className="p-5 rounded-2xl border bg-white/70 dark:bg-white/5">
          <div className="font-semibold mb-2">Recovery Tools</div>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/toolkit/breathing" className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition text-center">
              <div className="text-2xl mb-1">🫁</div>
              <div className="text-sm font-medium">Breathing</div>
            </Link>
            <Link href="/toolkit/meditations" className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition text-center">
              <div className="text-2xl mb-1">🧘</div>
              <div className="text-sm font-medium">Meditation</div>
            </Link>
            <Link href="/toolkit/grounding" className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition text-center">
              <div className="text-2xl mb-1">🌱</div>
              <div className="text-sm font-medium">Grounding</div>
            </Link>
            <Link href="/journal" className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition text-center">
              <div className="text-2xl mb-1">📔</div>
              <div className="text-sm font-medium">Journal</div>
            </Link>
          </div>
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

