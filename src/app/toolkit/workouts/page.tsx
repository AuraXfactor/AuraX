"use client";
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion, useReducedMotion } from 'framer-motion';

export default function WorkoutsPage() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur motion-fade-in">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white animate-pop">🤸</div>
          <h1 className="text-2xl font-bold">Mini Workouts require login</h1>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login" className="px-5 py-2.5 rounded-full border border-white/30 transition pressable">Login</Link>
            <Link href="/signup" className="px-5 py-2.5 rounded-full text-white bg-gradient-to-r from-indigo-500 to-blue-500 transition pressable">Create account</Link>
          </div>
        </div>
      </div>
    );
  }

  const routines = [
    { title: 'Neck & Shoulder Release (5m)', embed: 'https://www.youtube.com/embed/2bG3m9z1Zt8' },
    { title: 'Desk Stretch (7m)', embed: 'https://www.youtube.com/embed/Kh6C7Sx5D60' },
  ];

  return (
    <motion.div className="min-h-screen p-6 md:p-10" initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-extrabold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-rose-500">Mini Workouts & Stretch</h1>
      <div className="max-w-3xl mx-auto mt-8 grid grid-cols-1 gap-4">
        {routines.map((r) => (
          <div key={r.title} className="p-4 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5">
            <div className="font-semibold mb-2">{r.title}</div>
            <div className="aspect-video w-full rounded-lg overflow-hidden">
              <iframe className="w-full h-full" src={r.embed} title={r.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
            </div>
          </div>
        ))}
      </div>
      <div className="max-w-3xl mx-auto mt-6 text-center">
        <Link href="/toolkit" className="px-4 py-2 rounded-full border border-white/30 hover:bg-white/10 transition pressable">← Back to Toolkit</Link>
      </div>
    </motion.div>
  );
}

