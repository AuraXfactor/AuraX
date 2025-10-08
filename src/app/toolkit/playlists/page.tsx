"use client";
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import GuidanceBox from '@/components/GuidanceBox';
import { useState } from 'react';

export default function PlaylistsPage() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [showGuidance, setShowGuidance] = useState(true);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur motion-fade-in">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white animate-pop">🎧</div>
          <h1 className="text-2xl font-bold">Mood playlists require login</h1>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login" className="px-5 py-2.5 rounded-full border border-white/30 transition pressable">Login</Link>
            <Link href="/signup" className="px-5 py-2.5 rounded-full text-white bg-gradient-to-r from-indigo-500 to-blue-500 transition pressable">Create account</Link>
          </div>
        </div>
      </div>
    );
  }

  const moods = [
    { title: 'Calm Focus', link: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ' },
    { title: 'Deep Sleep', link: 'https://open.spotify.com/playlist/37i9dQZF1DWZqd5JICZI0u' },
    { title: 'Anxiety Relief', link: 'https://open.spotify.com/playlist/37i9dQZF1DX3rxVfibe1L0' },
  ];

  return (
    <motion.div className="min-h-screen p-6 md:p-10" initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-extrabold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-blue-500">Mood Playlists</h1>
      
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
              title="Mood Playlists"
              emoji="🎧"
              when="When you need to shift your emotional state, enhance focus, or create a specific atmosphere. Use during work, relaxation, or sleep preparation."
              why="Music has powerful effects on mood, focus, and emotional regulation. Curated playlists can help you transition between emotional states and maintain desired moods."
              how="Choose a playlist that matches your current needs or desired mood. Open in Spotify and let the music guide your emotional experience."
              importance="Music therapy is a recognized form of emotional support. The right music can reduce anxiety, improve focus, enhance sleep quality, and provide emotional comfort."
              preparation="Ensure you have Spotify installed or access to the music platform. Use headphones for the best experience and find a comfortable listening environment."
              onProceed={() => setShowGuidance(false)}
              onSkip={() => setShowGuidance(false)}
              colors="from-indigo-500 to-blue-500"
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
        {moods.map((m) => (
          <a key={m.title} href={m.link} target="_blank" rel="noreferrer" className="p-4 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5 pressable block">
            <div className="font-semibold">{m.title}</div>
            <div className="text-sm text-blue-600">Open in Spotify →</div>
          </a>
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

