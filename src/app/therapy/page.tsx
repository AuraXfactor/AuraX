'use client';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export default function TherapyPage() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur motion-fade-in">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white animate-pop">🧑‍⚕️</div>
          <h1 className="text-2xl font-bold">Therapy requires login</h1>
          <p className="text-gray-600 dark:text-gray-300">Sign in to view therapists and schedule sessions.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login" className="px-5 py-2.5 rounded-full border border-white/30 hover:bg-white/10 transition pressable">Login</Link>
            <Link href="/signup" className="px-5 py-2.5 rounded-full text-white bg-gradient-to-r from-emerald-500 to-teal-500 transition pressable">Create account</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="min-h-screen p-6 md:p-10" initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
      <section className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">Therapy</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Explore licensed therapists, schedule sessions, and access supportive resources.</p>
      </section>

      <section className="max-w-5xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
          <div className="text-2xl">🧭</div>
          <h3 className="font-semibold mt-2">Find a Therapist</h3>
          <p className="text-sm opacity-80 mt-1">Browse specialties and approaches that fit your needs.</p>
          <button className="mt-4 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white">Start matching</button>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
          <div className="text-2xl">📅</div>
          <h3 className="font-semibold mt-2">Book a Session</h3>
          <p className="text-sm opacity-80 mt-1">Pick a time that works for you. Video and chat options.</p>
          <Link href="/therapy/book" className="mt-4 inline-block px-4 py-2 rounded-full border border-white/25 hover:bg-white/10 transition">Open scheduler</Link>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
          <div className="text-2xl">📚</div>
          <h3 className="font-semibold mt-2">Therapy Resources</h3>
          <p className="text-sm opacity-80 mt-1">CBT worksheets, mindfulness guides, and crisis info.</p>
          <Link href="/toolkit" className="mt-4 inline-block px-4 py-2 rounded-full border border-white/25 hover:bg-white/10 transition">Open toolkit</Link>
        </div>
      </section>
    </motion.div>
  );
}

