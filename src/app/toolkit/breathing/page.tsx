"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Phase = 'inhale' | 'hold' | 'exhale';
type SessionState = 'idle' | 'active' | 'completed';

interface BreathingSession {
  id?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  pattern: string;
  effectiveness?: number;
  helpfulness?: number;
  followUpResponses?: {
    trigger?: string;
    helpfulAspects?: string[];
    improvements?: string;
  };
}

export default function EnhancedBreathingToolPage() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  const [pattern, setPattern] = useState<'478' | 'box' | 'custom'>('478');
  const [custom, setCustom] = useState({ inhale: 4, hold: 7, exhale: 8 });
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [currentSession, setCurrentSession] = useState<BreathingSession | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpData, setFollowUpData] = useState({
    trigger: '',
    helpfulAspects: [] as string[],
    improvements: ''
  });

  const durations = useMemo(() => {
    if (pattern === '478') return { inhale: 4, hold: 7, exhale: 8 };
    if (pattern === 'box') return { inhale: 4, hold: 4, exhale: 4 };
    return custom;
  }, [pattern, custom]);

  const [phase, setPhase] = useState<Phase>('inhale');
  const [count, setCount] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);
  const targetScale = phase === 'inhale' ? 1.2 : phase === 'exhale' ? 0.9 : 1;

  // Start session
  const startSession = async () => {
    if (!user) return;
    
    const session: BreathingSession = {
      startTime: new Date(),
      pattern: pattern === 'custom' ? `custom-${custom.inhale}-${custom.hold}-${custom.exhale}` : pattern
    };

    try {
      const docRef = await addDoc(collection(db, 'breathingSessions'), {
        ...session,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      setCurrentSession({ ...session, id: docRef.id });
    } catch (error) {
      console.error('Error starting session:', error);
    }

    setSessionState('active');
    setShowIntro(false);
  };

  // Stop session
  const stopSession = async () => {
    if (!currentSession || !user) return;

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - currentSession.startTime.getTime()) / 1000);

    try {
      if (currentSession.id) {
        await updateDoc(doc(db, 'breathingSessions', currentSession.id), {
          endTime: serverTimestamp(),
          duration: duration,
          status: 'completed'
        });
      }
    } catch (error) {
      console.error('Error ending session:', error);
    }

    setSessionState('completed');
    setShowFollowUp(true);
  };

  // Session timer
  useEffect(() => {
    if (sessionState !== 'active') return;

    const interval = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionState]);

  // Breathing animation
  useEffect(() => {
    if (sessionState !== 'active') return;

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
  }, [phase, durations, sessionState]);

  // Save follow-up data
  const saveFollowUpData = async () => {
    if (!currentSession?.id || !user) return;

    try {
      await updateDoc(doc(db, 'breathingSessions', currentSession.id), {
        followUpResponses: followUpData,
        effectiveness: followUpData.helpfulAspects.length > 0 ? 1 : 0,
        helpfulness: followUpData.helpfulAspects.length
      });
    } catch (error) {
      console.error('Error saving follow-up data:', error);
    }

    setShowFollowUp(false);
    setSessionState('idle');
    setCurrentSession(null);
    setSessionDuration(0);
    setCount(0);
    setPhase('inhale');
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
        Enhanced Breathwork 🌬️
      </motion.h1>

      {/* Introduction Modal */}
      <AnimatePresence>
        {showIntro && (
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-xl font-bold text-center">Welcome to Enhanced Breathwork</h2>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <p><strong>What it helps with:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Reduces anxiety and stress</li>
                  <li>Improves focus and concentration</li>
                  <li>Regulates nervous system</li>
                  <li>Promotes relaxation and calm</li>
                </ul>
                <p><strong>How it works:</strong></p>
                <p>Follow the breathing patterns with our guided animations. We'll track your progress and help you understand what works best for you.</p>
              </div>
              <button 
                onClick={() => setShowIntro(false)}
                className="w-full px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-lg transition hover:opacity-90"
              >
                Get Started
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Follow-up Modal */}
      <AnimatePresence>
        {showFollowUp && (
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-xl font-bold text-center">How was your session?</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">What triggered you to use this tool?</label>
                  <input 
                    type="text" 
                    value={followUpData.trigger}
                    onChange={(e) => setFollowUpData({...followUpData, trigger: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="e.g., work stress, anxiety, panic attack..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">What was most helpful? (select all that apply)</label>
                  <div className="space-y-2">
                    {['The breathing pattern', 'The visual guidance', 'The timing', 'The calm environment', 'The vibration feedback'].map((option) => (
                      <label key={option} className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={followUpData.helpfulAspects.includes(option)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFollowUpData({
                                ...followUpData, 
                                helpfulAspects: [...followUpData.helpfulAspects, option]
                              });
                            } else {
                              setFollowUpData({
                                ...followUpData, 
                                helpfulAspects: followUpData.helpfulAspects.filter(item => item !== option)
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">How could we improve this experience?</label>
                  <textarea 
                    value={followUpData.improvements}
                    onChange={(e) => setFollowUpData({...followUpData, improvements: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 h-20"
                    placeholder="Your suggestions..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={saveFollowUpData}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-lg transition hover:opacity-90"
                >
                  Save & Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pattern Selection */}
      {sessionState === 'idle' && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => setPattern('478')} className={`px-3 py-1.5 rounded-full border border-white/30 transition pressable ${pattern==='478' ? 'bg-white/10' : ''}`}>4-7-8</button>
          <button onClick={() => setPattern('box')} className={`px-3 py-1.5 rounded-full border border-white/30 transition pressable ${pattern==='box' ? 'bg-white/10' : ''}`}>Box 4-4-4-4</button>
          <button onClick={() => setPattern('custom')} className={`px-3 py-1.5 rounded-full border border-white/30 transition pressable ${pattern==='custom' ? 'bg-white/10' : ''}`}>Custom</button>
        </div>
      )}

      {pattern === 'custom' && sessionState === 'idle' && (
        <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
          <label className="flex items-center gap-1">Inhale <input type="number" min={1} value={custom.inhale} onChange={(e) => setCustom({ ...custom, inhale: Number(e.target.value) })} className="w-16 px-2 py-1 rounded-md bg-white/70 dark:bg-white/10 border border-white/20" /></label>
          <label className="flex items-center gap-1">Hold <input type="number" min={1} value={custom.hold} onChange={(e) => setCustom({ ...custom, hold: Number(e.target.value) })} className="w-16 px-2 py-1 rounded-md bg-white/70 dark:bg-white/10 border border-white/20" /></label>
          <label className="flex items-center gap-1">Exhale <input type="number" min={1} value={custom.exhale} onChange={(e) => setCustom({ ...custom, exhale: Number(e.target.value) })} className="w-16 px-2 py-1 rounded-md bg-white/70 dark:bg-white/10 border border-white/20" /></label>
        </div>
      )}

      {/* Session Controls */}
      {sessionState === 'idle' && (
        <button 
          onClick={startSession}
          className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-full font-semibold transition hover:opacity-90"
        >
          Start Session
        </button>
      )}

      {/* Active Session Display */}
      {sessionState === 'active' && (
        <>
          <motion.div className="relative" initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
            <div className="absolute inset-0 blur-2xl opacity-60 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500"></div>
            <motion.div
              className="relative w-56 h-56 rounded-full bg-white/20 border border-white/20 backdrop-blur flex items-center justify-center text-3xl shadow-xl pressable"
              animate={prefersReducedMotion ? undefined : { scale: targetScale }}
              transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 20 }}
              whileTap={prefersReducedMotion ? undefined : { scale: targetScale * 0.98 }}
            >
              <div className="text-center">
                <div className="text-2xl font-bold capitalize">{phase}</div>
                <div className="text-lg">{count} / {phase === 'inhale' ? durations.inhale : phase === 'hold' ? durations.hold : durations.exhale}</div>
              </div>
            </motion.div>
          </motion.div>

          <div className="text-center space-y-2">
            <p className="text-gray-600 dark:text-gray-300">Session Duration: {Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}</p>
            <button 
              onClick={stopSession}
              className="px-4 py-2 bg-red-500 text-white rounded-full transition hover:opacity-90"
            >
              Stop Session
            </button>
          </div>
        </>
      )}

      {/* Session Completed */}
      {sessionState === 'completed' && !showFollowUp && (
        <div className="text-center space-y-4">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold text-green-500">Session Complete!</h2>
          <p className="text-gray-600 dark:text-gray-300">Duration: {Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}</p>
          <button 
            onClick={() => {
              setSessionState('idle');
              setSessionDuration(0);
              setCount(0);
              setPhase('inhale');
            }}
            className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-full transition hover:opacity-90"
          >
            Start New Session
          </button>
        </div>
      )}

      <Link href="/toolkit" className="px-4 py-2 rounded-full border border-white/30 hover:bg-white/10 transition pressable">← Back to Toolkit</Link>
    </motion.div>
  );
}