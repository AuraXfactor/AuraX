"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion, useReducedMotion } from 'framer-motion';
import { saveToolkitLog, updateUserAuraPoints } from '@/lib/firestoreCollections';

type Phase = 'inhale' | 'hold' | 'exhale';

export default function BreathingToolPage() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  const [pattern, setPattern] = useState<'478' | 'box' | 'custom'>('478');
  const [custom, setCustom] = useState({ inhale: 4, hold: 7, exhale: 8 });
  const durations = useMemo(() => {
    if (pattern === '478') return { inhale: 4, hold: 7, exhale: 8 };
    if (pattern === 'box') return { inhale: 4, hold: 4, exhale: 4 };
    return custom;
  }, [pattern, custom]);

  const [phase, setPhase] = useState<Phase>('inhale');
  const [count, setCount] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [cycleCount, setCycleCount] = useState(0);
  const [reliefLevel, setReliefLevel] = useState<number | null>(null);
  const [showReliefPrompt, setShowReliefPrompt] = useState(false);
  const targetScale = phase === 'inhale' ? 1.2 : phase === 'exhale' ? 0.9 : 1;

  useEffect(() => {
    if (!sessionActive) return;
    
    const vibrate = () => navigator.vibrate?.(20);
    const limit = phase === 'inhale' ? durations.inhale : phase === 'hold' ? durations.hold : durations.exhale;
    const id = setInterval(() => {
      setCount((c) => {
        const next = c + 1;
        if (next >= limit) {
          setPhase((p) => {
            if (p === 'inhale') return 'hold';
            if (p === 'hold') return 'exhale';
            if (p === 'exhale') {
              setCycleCount(prev => prev + 1);
              return 'inhale';
            }
            return 'inhale';
          });
          vibrate();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, durations, sessionActive]);

  const startSession = () => {
    setSessionActive(true);
    setSessionStartTime(new Date());
    setCycleCount(0);
    setPhase('inhale');
    setCount(0);
  };

  const endSession = async () => {
    if (!user || !sessionStartTime) return;
    
    setSessionActive(false);
    const duration = Math.round((Date.now() - sessionStartTime.getTime()) / 60000); // minutes
    
    if (duration >= 1) { // Only log sessions of 1+ minutes
      setShowReliefPrompt(true);
    } else {
      resetSession();
    }
  };

  const saveSession = async (relief?: number) => {
    if (!user || !sessionStartTime) return;
    
    const duration = Math.round((Date.now() - sessionStartTime.getTime()) / 60000);
    
    try {
      await saveToolkitLog(user.uid, {
        toolName: `Breathing Exercise - ${pattern.toUpperCase()}`,
        duration,
        reliefLevel: relief,
      });
      
      await updateUserAuraPoints(user.uid);
      setShowReliefPrompt(false);
      resetSession();
    } catch (error) {
      console.error('Error saving breathing session:', error);
    }
  };

  const resetSession = () => {
    setSessionStartTime(null);
    setCycleCount(0);
    setReliefLevel(null);
    setPhase('inhale');
    setCount(0);
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
        Breathwork 🌬️
      </motion.h1>

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

      <div className="text-center space-y-2">
        <p className="text-gray-600 dark:text-gray-300 motion-fade-in" style={prefersReducedMotion ? undefined : { animationDelay: '120ms' }}>
          Count: {count} / {phase === 'inhale' ? durations.inhale : phase === 'hold' ? durations.hold : durations.exhale}
        </p>
        {sessionActive && (
          <p className="text-sm text-blue-400">
            Cycles completed: {cycleCount} • Session time: {sessionStartTime ? Math.round((Date.now() - sessionStartTime.getTime()) / 1000) : 0}s
          </p>
        )}
      </div>

      <div className="flex gap-3">
        {!sessionActive ? (
          <button 
            onClick={startSession}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:scale-105 transition pressable"
          >
            Start Session
          </button>
        ) : (
          <button 
            onClick={endSession}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white font-medium hover:scale-105 transition pressable"
          >
            End Session
          </button>
        )}
      </div>

      <div className="text-xs text-gray-500 motion-fade-in" style={prefersReducedMotion ? undefined : { animationDelay: '180ms' }}>
        Tip: switch patterns to match your needs. Phone users feel subtle haptics between phases.
      </div>

      {/* Relief Level Prompt */}
      {showReliefPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-xl font-bold text-center">How do you feel?</h3>
            <p className="text-gray-600 dark:text-gray-300 text-center">
              Rate your relief level after this breathing session
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => saveSession(level)}
                  className={`w-12 h-12 rounded-full border-2 transition ${
                    reliefLevel === level 
                      ? 'border-blue-500 bg-blue-100 dark:bg-blue-900' 
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={() => saveSession()}
                className="px-4 py-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      <Link href="/toolkit" className="px-4 py-2 rounded-full border border-white/30 hover:bg-white/10 transition pressable">← Back to Toolkit</Link>
    </motion.div>
  );
}

