"use client";
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion, useReducedMotion } from 'framer-motion';
import { useCallback, useState } from 'react';
import { saveToolkitLog, updateUserAuraPoints } from '@/lib/firestoreCollections';

export default function PanicButtonPage() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [affirmation, setAffirmation] = useState('You are safe. This will pass.');

  const chime = useCallback(() => {
    try {
      const AudioCtx: typeof AudioContext | undefined = (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 528;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // ignore
    }
  }, []);

  const runSequence = useCallback(async () => {
    navigator.vibrate?.([50, 30, 50]);
    chime();
    
    // Log panic button usage
    if (user) {
      try {
        await saveToolkitLog(user.uid, {
          toolName: 'Panic Button',
          duration: 1, // 1 minute session
        });
        await updateUserAuraPoints(user.uid);
      } catch (error) {
        console.error('Error logging panic button usage:', error);
      }
    }
  }, [chime, user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur motion-fade-in">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-white animate-pop">🆘</div>
          <h1 className="text-2xl font-bold">Panic Button requires login</h1>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login" className="px-5 py-2.5 rounded-full border border-white/30 transition pressable">Login</Link>
            <Link href="/signup" className="px-5 py-2.5 rounded-full text-white bg-gradient-to-r from-indigo-500 to-blue-500 transition pressable">Create account</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="min-h-screen p-6 md:p-10 text-center" initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-orange-500">Panic Button</h1>
      <p className="text-gray-700 dark:text-gray-200 mt-2">One tap to play a calming chime, vibrate, and show an affirmation.</p>
      <div className="mt-6">
        <button onClick={runSequence} className="px-6 py-3 rounded-full text-white bg-gradient-to-r from-rose-500 to-orange-500 shadow pressable">Calm Me Now</button>
      </div>
      <div className="mt-6 max-w-md mx-auto p-4 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5">
        <div className="text-sm mb-2">Affirmation</div>
        <input value={affirmation} onChange={(e) => setAffirmation(e.target.value)} className="w-full px-3 py-2 rounded-md bg-white/80 dark:bg-white/10 border border-white/20" />
        <div className="mt-2 text-lg">{affirmation}</div>
      </div>
      <div className="mt-6">
        <Link href="/toolkit" className="px-4 py-2 rounded-full border border-white/30 hover:bg-white/10 transition pressable">← Back to Toolkit</Link>
      </div>
    </motion.div>
  );
}

