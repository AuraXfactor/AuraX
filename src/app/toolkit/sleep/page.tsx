"use client";
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import GuidanceBox from '@/components/GuidanceBox';
import { useState } from 'react';

export default function SleepToolsPage() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [showGuidance, setShowGuidance] = useState(true);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur motion-fade-in">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-slate-500 to-gray-700 text-white animate-pop">😴</div>
          <h1 className="text-2xl font-bold">Sleep tools require login</h1>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login" className="px-5 py-2.5 rounded-full border border-white/30 transition pressable">Login</Link>
            <Link href="/signup" className="px-5 py-2.5 rounded-full text-white bg-gradient-to-r from-indigo-500 to-blue-500 transition pressable">Create account</Link>
          </div>
        </div>
      </div>
    );
  }

  const sounds = [
    { title: 'White Noise', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { title: 'Rain', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  ];

  return (
    <motion.div className="min-h-screen p-6 md:p-10" initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-extrabold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-slate-500 to-gray-700">Sleep Tools</h1>
      
      <AnimatePresence mode="wait">
        {showGuidance && (
          <motion.div
            key="guidance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl w-full mx-auto mt-8"
          >
            <GuidanceBox
              title="Sleep Tools"
              emoji="😴"
              when="When you need to wind down, have trouble falling asleep, or want to create a calming bedtime routine. Use 30-60 minutes before sleep."
              why="Sleep sounds mask disruptive noises, create a consistent sleep environment, and signal to your brain that it's time to rest. They promote deeper, more restorative sleep."
              how="Choose a sound that feels calming to you (white noise, rain, etc.). Play at a comfortable volume and let it run throughout the night or until you fall asleep."
              importance="Quality sleep is essential for mental health, physical recovery, and daily functioning. These tools help establish healthy sleep patterns and improve sleep quality."
              preparation="Ensure your device is charged or plugged in. Use headphones or speakers at a low volume. Create a dark, cool sleep environment for best results."
              onProceed={() => setShowGuidance(false)}
              onSkip={() => setShowGuidance(false)}
              colors="from-slate-500 to-gray-700"
            />
          </motion.div>
        )}

        {!showGuidance && (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
      <div className="max-w-3xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {sounds.map((s) => (
          <div key={s.title} className="p-4 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5">
            <div className="font-semibold">{s.title}</div>
            <audio controls className="w-full mt-2">
              <source src={s.src} type="audio/mpeg" />
            </audio>
          </div>
        ))}
      </div>
            <div className="max-w-3xl mx-auto mt-6 text-center">
              <Link href="/toolkit" className="px-4 py-2 rounded-full border border-white/30 hover:bg-white/10 transition pressable">← Back to Toolkit</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

