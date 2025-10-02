"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useOffline } from '@/hooks/useOffline';

type Phase = 'inhale' | 'hold' | 'exhale';

interface SessionData {
  id: string;
  startTime: Date;
  endTime?: Date;
  pattern: string;
  duration: number;
  moodBefore: number;
  moodAfter?: number;
  stressBefore: number;
  stressAfter?: number;
  notes?: string;
}

export default function BreathingToolPage() {
  const { user } = useAuth();
  const { isOfflineMode, saveOffline, getOfflineData } = useOffline();
  const prefersReducedMotion = useReducedMotion();

  const [pattern, setPattern] = useState<'478' | 'box' | 'custom'>('478');
  const [custom, setCustom] = useState({ inhale: 4, hold: 7, exhale: 8 });
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionData[]>([]);
  const [showIntro, setShowIntro] = useState(true);
  const [moodBefore, setMoodBefore] = useState(5);
  const [stressBefore, setStressBefore] = useState(5);
  const [moodAfter, setMoodAfter] = useState(5);
  const [stressAfter, setStressAfter] = useState(5);
  const [sessionNotes, setSessionNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const durations = useMemo(() => {
    if (pattern === '478') return { inhale: 4, hold: 7, exhale: 8 };
    if (pattern === 'box') return { inhale: 4, hold: 4, exhale: 4 };
    return custom;
  }, [pattern, custom]);

  const [phase, setPhase] = useState<Phase>('inhale');
  const [count, setCount] = useState(0);
  const targetScale = phase === 'inhale' ? 1.2 : phase === 'exhale' ? 0.9 : 1;

  useEffect(() => {
    if (!isSessionActive) return;
    
    const vibrate = () => navigator.vibrate?.(20);
    const limit = phase === 'inhale' ? durations.inhale : phase === 'hold' ? durations.hold : durations.exhale;
    const id = setInterval(() => {
      setCount((c) => {
        const next = c + 1;
        if (next >= limit) {
          setPhase((p) => {
            if (p === 'inhale') return 'hold';
            if (p === 'hold') return 'exhale';
            return 'inhale';
          });
          vibrate();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, durations, isSessionActive]);

  const startSession = () => {
    const session: SessionData = {
      id: Date.now().toString(),
      startTime: new Date(),
      pattern: pattern,
      duration: 0,
      moodBefore,
      stressBefore
    };
    setCurrentSession(session);
    setIsSessionActive(true);
    setShowIntro(false);
  };

  const endSession = async () => {
    if (!currentSession || !user) return;
    
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - currentSession.startTime.getTime()) / 1000);
    
    const completedSession: SessionData = {
      ...currentSession,
      endTime,
      duration,
      moodAfter,
      stressAfter,
      notes: sessionNotes
    };
    
    setSaving(true);
    try {
      // Save offline
      await saveOffline('breathing', completedSession, user.uid);
      
      setSessionHistory(prev => [...prev, completedSession]);
      setCurrentSession(null);
      setIsSessionActive(false);
      setPhase('inhale');
      setCount(0);
      
      if (isOfflineMode) {
        alert('Session saved offline! It will sync when you\'re back online. 🌬️');
      }
    } catch (error) {
      console.error('Error saving session:', error);
      alert('Failed to save session. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetSession = () => {
    setCurrentSession(null);
    setIsSessionActive(false);
    setPhase('inhale');
    setCount(0);
    setMoodAfter(5);
    setStressAfter(5);
    setSessionNotes('');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur motion-fade-in">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white animate-pop">🧘</div>
          <h1 className="text-2xl font-bold">Breathwork requires login</h1>
          <p className="text-gray-600 dark:text-gray-300">Sign in to access breathwork and more wellness tools.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login" className="px-5 py-2.5 rounded-full border border-white/30 hover:bg:white/10 transition pressable">Login</Link>
            <Link href="/signup" className="px-5 py-2.5 rounded-full text-white bg-gradient-to-r from-indigo-500 to-blue-500 transition pressable">Create account</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="min-h-screen flex flex-col items-center justify-center gap-8 p-6" initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
      <motion.h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500" initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.45 }}>
        Guided Breathwork 🌬️
      </motion.h1>
      
      {isOfflineMode && (
        <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            📱 Working offline - your sessions will sync when you're back online
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {showIntro && !isSessionActive && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6"
          >
            <h2 className="text-2xl font-bold mb-4 text-center">Welcome to Guided Breathwork</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
              Take a moment to prepare for your breathing session. This guided experience will help you relax and center yourself.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">How are you feeling right now? (1-10)</label>
                <div className="flex items-center gap-4">
                  <span className="text-sm">Stressed</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={stressBefore}
                    onChange={(e) => setStressBefore(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-bold">{stressBefore}</span>
                  <span className="text-sm">Calm</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">What's your current mood? (1-10)</label>
                <div className="flex items-center gap-4">
                  <span className="text-sm">Low</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={moodBefore}
                    onChange={(e) => setMoodBefore(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-bold">{moodBefore}</span>
                  <span className="text-sm">High</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={startSession}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full hover:from-cyan-600 hover:to-blue-600 transition"
              >
                Start Guided Session
              </button>
              <button
                onClick={() => setShowIntro(false)}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Skip to Free Mode
              </button>
            </div>
          </motion.div>
        )}

        {!showIntro && !isSessionActive && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl w-full space-y-6"
          >
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button onClick={() => setPattern('478')} className={`px-3 py-1.5 rounded-full border border-white/30 transition pressable ${pattern==='478' ? 'bg-white/10' : ''}`}>4-7-8</button>
              <button onClick={() => setPattern('box')} className={`px-3 py-1.5 rounded-full border border-white/30 transition pressable ${pattern==='box' ? 'bg-white/10' : ''}`}>Box 4-4-4-4</button>
              <button onClick={() => setPattern('custom')} className={`px-3 py-1.5 rounded-full border border-white/30 transition pressable ${pattern==='custom' ? 'bg-white/10' : ''}`}>Custom</button>
            </div>

            {pattern === 'custom' && (
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                <label className="flex items-center gap-1">Inhale <input type="number" min={1} value={custom.inhale} onChange={(e) => setCustom({ ...custom, inhale: Number(e.target.value) })} className="w-16 px-2 py-1 rounded-md bg-white/70 dark:bg-white/10 border border-white/20" /></label>
                <label className="flex items-center gap-1">Hold <input type="number" min={1} value={custom.hold} onChange={(e) => setCustom({ ...custom, hold: Number(e.target.value) })} className="w-16 px-2 py-1 rounded-md bg-white/70 dark:bg:white/10 border border-white/20" /></label>
                <label className="flex items-center gap-1">Exhale <input type="number" min={1} value={custom.exhale} onChange={(e) => setCustom({ ...custom, exhale: Number(e.target.value) })} className="w-16 px-2 py-1 rounded-md bg-white/70 dark:bg:white/10 border border-white/20" /></label>
              </div>
            )}

            <motion.div className="relative" initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
              <div className="absolute inset-0 blur-2xl opacity-60 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500"></div>
              <motion.div
                className="relative w-56 h-56 rounded-full bg-white/20 border border:white/20 backdrop-blur flex items-center justify-center text-3xl shadow-xl pressable"
                animate={prefersReducedMotion ? undefined : { scale: targetScale }}
                transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 20 }}
                whileTap={prefersReducedMotion ? undefined : { scale: targetScale * 0.98 }}
              >
                {phase}
              </motion.div>
            </motion.div>

            <p className="text-gray-600 dark:text-gray-300 motion-fade-in text-center" style={prefersReducedMotion ? undefined : { animationDelay: '120ms' }}>Count: {count} / {phase === 'inhale' ? durations.inhale : phase === 'hold' ? durations.hold : durations.exhale}</p>

            <div className="text-center">
              <button
                onClick={startSession}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full hover:from-cyan-600 hover:to-blue-600 transition shadow-lg"
              >
                Start Guided Session
              </button>
            </div>
          </motion.div>
        )}

        {isSessionActive && (
          <motion.div
            key="session"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl w-full text-center space-y-6"
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-4">Guided Breathing Session</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Follow the breathing pattern: {pattern === '478' ? '4-7-8' : pattern === 'box' ? '4-4-4-4' : `${custom.inhale}-${custom.hold}-${custom.exhale}`}
              </p>
              
              <motion.div className="relative mx-auto w-64 h-64 mb-6">
                <div className="absolute inset-0 blur-2xl opacity-60 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500"></div>
                <motion.div
                  className="relative w-full h-full rounded-full bg-white/20 border border-white/20 backdrop-blur flex items-center justify-center text-4xl shadow-xl"
                  animate={prefersReducedMotion ? undefined : { scale: targetScale }}
                  transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 20 }}
                >
                  <div className="text-center">
                    <div className="text-6xl mb-2">{phase === 'inhale' ? '🌬️' : phase === 'hold' ? '⏸️' : '💨'}</div>
                    <div className="text-2xl font-bold capitalize">{phase}</div>
                    <div className="text-lg">{count} / {phase === 'inhale' ? durations.inhale : phase === 'hold' ? durations.hold : durations.exhale}</div>
                  </div>
                </motion.div>
              </motion.div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={endSession}
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full hover:from-green-600 hover:to-emerald-600 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'End Session'}
                </button>
                <button
                  onClick={resetSession}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {!showIntro && !isSessionActive && (
          <motion.div
            key="outcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6"
          >
            <h3 className="text-xl font-bold mb-4 text-center">Session Complete! 🎉</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
              How are you feeling after your breathing session?
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">How stressed do you feel now? (1-10)</label>
                <div className="flex items-center gap-4">
                  <span className="text-sm">Very Stressed</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={stressAfter}
                    onChange={(e) => setStressAfter(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-bold">{stressAfter}</span>
                  <span className="text-sm">Very Calm</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">What's your mood now? (1-10)</label>
                <div className="flex items-center gap-4">
                  <span className="text-sm">Low</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={moodAfter}
                    onChange={(e) => setMoodAfter(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-bold">{moodAfter}</span>
                  <span className="text-sm">High</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Session Notes (optional)</label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="How did this session feel? Any insights or observations?"
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={endSession}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full hover:from-cyan-600 hover:to-blue-600 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Session'}
              </button>
              <button
                onClick={resetSession}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Start New Session
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-2xl">
        <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Guided: 3-Minute Breathing Space</div>
        <div className="aspect-video w-full rounded-lg overflow-hidden">
          <iframe className="w-full h-full" src="https://www.youtube.com/embed/SEfs5TJZ6Nk" title="3-Minute Breathing Space" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
        </div>
      </div>

      <Link href="/toolkit" className="px-4 py-2 rounded-full border border-white/30 hover:bg-white/10 transition pressable">← Back to Toolkit</Link>
    </motion.div>
  );
}

