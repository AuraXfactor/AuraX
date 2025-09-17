"use client";
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion, useReducedMotion } from 'framer-motion';
import { useCallback } from 'react';

export default function BodyScanPage() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  const speak = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech not supported.');
      return;
    }
    const script = `Close your eyes. Start at the crown of your head. Notice any tension. Breathe in. On the exhale, soften and release. Move slowly to your face, neck, shoulders, arms, chest, belly, hips, legs, and feet. Invite ease to each area.`;
    const utter = new SpeechSynthesisUtterance(script);
    utter.rate = 0.95;
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur motion-fade-in">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-fuchsia-400 to-pink-500 text-white animate-pop">🪷</div>
          <h1 className="text-2xl font-bold">Body Scan requires login</h1>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login" className="px-5 py-2.5 rounded-full border border-white/30 transition pressable">Login</Link>
            <Link href="/signup" className="px-5 py-2.5 rounded-full text-white bg-gradient-to-r from-indigo-500 to-blue-500 transition pressable">Create account</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="min-h-screen p-6 md:p-10" initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-extrabold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-pink-500">Body Scan</h1>
      <div className="max-w-2xl mx-auto mt-6 space-y-4 text-gray-700 dark:text-gray-200">
        <p>Use this simple scan to release tension. Press Play Guidance to hear the instructions.</p>
        <div className="flex items-center justify-center">
          <button onClick={speak} className="px-4 py-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white pressable">▶ Play Guidance</button>
        </div>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Start at the crown. Notice sensation. Breathe slowly.</li>
          <li>Relax your forehead, eyes, and jaw.</li>
          <li>Drop shoulders, soften chest and belly.</li>
          <li>Scan hips, thighs, knees, calves.</li>
          <li>Finish at feet. Feel grounded and supported.</li>
        </ol>
      </div>
      <div className="max-w-2xl mx-auto mt-6 text-center">
        <Link href="/toolkit" className="px-4 py-2 rounded-full border border-white/30 hover:bg-white/10 transition pressable">← Back to Toolkit</Link>
      </div>
    </motion.div>
  );
}

