"use client";
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function GratitudePage() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [items, setItems] = useState<string[]>(['', '', '']);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('gratitude-today') : null;
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gratitude-today', JSON.stringify(items));
    }
  }, [items]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur motion-fade-in">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-green-500 to-emerald-500 text-white animate-pop">🙏</div>
          <h1 className="text-2xl font-bold">Gratitude requires login</h1>
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
      <h1 className="text-3xl font-extrabold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-500">Quick Gratitude</h1>
      <div className="max-w-xl mx-auto mt-8 space-y-3">
        {items.map((v, i) => (
          <input key={i} value={v} onChange={(e) => setItems((arr) => arr.map((x, idx) => idx===i ? e.target.value : x))} placeholder={`Thing ${i+1}`} className="w-full px-3 py-2 rounded-md bg-white/80 dark:bg-white/10 border border-white/20" />
        ))}
      </div>
      <div className="max-w-xl mx-auto mt-6 text-center">
        <Link href="/toolkit" className="px-4 py-2 rounded-full border border-white/30 hover:bg-white/10 transition pressable">← Back to Toolkit</Link>
      </div>
    </motion.div>
  );
}

