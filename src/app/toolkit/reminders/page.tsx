"use client";
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function RemindersPage() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [minutes, setMinutes] = useState(60);
  const [id, setId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const request = async () => {
    if (!('Notification' in window)) return;
    const res = await Notification.requestPermission();
    setPermission(res);
  };

  const schedule = () => {
    if (!('Notification' in window)) return;
    if (permission !== 'granted') return;
    if (id) window.clearTimeout(id);
    const timeout = window.setTimeout(() => {
      new Notification('Gentle reminder', { body: 'Take a mindful minute 🌿' });
    }, minutes * 60 * 1000);
    setId(timeout);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur motion-fade-in">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-amber-500 to-yellow-500 text-white animate-pop">⏰</div>
          <h1 className="text-2xl font-bold">Reminders require login</h1>
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
      <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-yellow-500">Reminders</h1>
      <p className="text-gray-700 dark:text-gray-200 mt-2">Opt-in gentle notifications. Never naggy.</p>
      <div className="mt-6 max-w-md mx-auto p-6 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 text-left">
        <div className="flex items-center gap-3">
          <button onClick={request} className="px-3 py-1.5 rounded-full border border-white/30 pressable">{permission === 'granted' ? 'Granted ✅' : 'Request Permission'}</button>
          <label className="text-sm">Every <input type="number" min={5} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="w-20 mx-1 px-2 py-1 rounded-md bg-white/80 dark:bg-white/10 border border-white/20" /> minutes</label>
          <button onClick={schedule} className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white pressable">Schedule</button>
        </div>
      </div>
      <div className="mt-6">
        <Link href="/toolkit" className="px-4 py-2 rounded-full border border-white/30 hover:bg-white/10 transition pressable">← Back to Toolkit</Link>
      </div>
    </motion.div>
  );
}

