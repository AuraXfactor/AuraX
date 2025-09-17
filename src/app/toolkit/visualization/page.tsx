"use client";
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion, useReducedMotion } from 'framer-motion';

export default function VisualizationPage() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur motion-fade-in">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white animate-pop">🌄</div>
          <h1 className="text-2xl font-bold">Visualization requires login</h1>
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
      <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-cyan-500">Visualization Exercises</h1>
      <div className="max-w-2xl mx-auto mt-8 p-6 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 text-left space-y-3">
        <div className="font-semibold">Safe Place</div>
        <p>Close your eyes. Imagine a place where you feel completely safe and calm. Engage all senses: what do you see, hear, smell, touch?</p>
        <div className="font-semibold pt-2">Success Visualization</div>
        <p>Picture yourself completing a task with confidence. Note your posture, breath, and emotion as you succeed.</p>
      </div>
      <div className="mt-6">
        <Link href="/toolkit" className="px-4 py-2 rounded-full border border-white/30 hover:bg-white/10 transition pressable">← Back to Toolkit</Link>
      </div>
    </motion.div>
  );
}

