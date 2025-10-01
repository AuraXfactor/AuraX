"use client";
import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion, useReducedMotion } from 'framer-motion';
import ToolCard from '@/components/ToolCard';

export default function ToolkitPage() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur motion-fade-in">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white animate-pop">🧰</div>
          <h1 className="text-2xl font-bold">Toolkit requires login</h1>
          <p className="text-gray-600 dark:text-gray-300">Sign in to access wellness tools.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login" className="px-5 py-2.5 rounded-full border border-white/30 hover:bg-white/10 transition pressable">Login</Link>
            <Link href="/signup" className="px-5 py-2.5 rounded-full text-white bg-gradient-to-r from-indigo-500 to-blue-500 transition pressable">Create account</Link>
          </div>
        </div>
      </div>
    );
  }

  const cards = [
    { href: '/toolkit/breathing', title: 'Breathing Exercises', desc: '4-7-8, Box, and custom patterns', emoji: '🌬️', colors: 'from-cyan-400 to-blue-500' },
    { href: '/toolkit/meditations', title: 'Guided Meditations', desc: '5-20 min sessions for sleep, focus', emoji: '🧘', colors: 'from-emerald-400 to-teal-500' },
    { href: '/toolkit/body-scan', title: 'Body Scan', desc: 'Release tension with audio guidance', emoji: '🪷', colors: 'from-fuchsia-400 to-pink-500' },
    { href: '/boosts', title: 'Aura Boosts', desc: 'YouTube meditations, workouts, and panic tools', emoji: '⚡', colors: 'from-purple-500 to-violet-500' },
    { href: '/toolkit/grounding', title: '5-4-3-2-1 Grounding', desc: 'Senses-based interactive grounding', emoji: '🪨', colors: 'from-amber-400 to-orange-500' },
    { href: '/toolkit/panic', title: 'Panic Button', desc: 'One-tap calming sequence', emoji: '🆘', colors: 'from-rose-500 to-orange-500' },
    { href: '/toolkit/playlists', title: 'Mood Playlists', desc: 'Curated Spotify/Apple playlists', emoji: '🎧', colors: 'from-indigo-500 to-blue-500' },
    { href: '/toolkit/affirmations', title: 'Affirmations', desc: 'Swipe cards, add your own', emoji: '✨', colors: 'from-purple-500 to-violet-500' },
    { href: '/toolkit/gratitude', title: 'Quick Gratitude', desc: '3 things for today', emoji: '🙏', colors: 'from-green-500 to-emerald-500' },
    { href: '/toolkit/workouts', title: 'Mini Workouts', desc: '5-10 min stretch routines', emoji: '🤸', colors: 'from-pink-500 to-rose-500' },
    { href: '/toolkit/visualization', title: 'Visualization', desc: 'Guided imagery and focus', emoji: '🌄', colors: 'from-sky-500 to-cyan-500' },
    { href: '/toolkit/sleep', title: 'Sleep Tools', desc: 'White noise and wind-down', emoji: '😴', colors: 'from-slate-500 to-gray-700' },
    { href: '/toolkit/self-assessment', title: 'Self-Assessment', desc: 'Mental health screening tools (GAD-7, PHQ-9)', emoji: '📋', colors: 'from-purple-400 to-pink-500' },
  ];

  return (
    <motion.div className="min-h-screen p-6 md:p-10" initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
      <section className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">Toolkit</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Your hub for breathwork, grounding, affirmations, sleep, and more.</p>
      </section>

      <section className="max-w-5xl mx-auto mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((c, i) => (
          <ToolCard key={c.title} href={c.href} title={c.title} desc={c.desc} emoji={c.emoji} colors={c.colors} delay={i * 0.03} />
        ))}
      </section>
    </motion.div>
  );
}

