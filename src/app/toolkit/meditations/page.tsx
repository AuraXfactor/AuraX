"use client";
import Link from 'next/link';
import VoiceInput from '@/components/VoiceInput';
import { useAuth } from '@/contexts/AuthContext';
import { motion, useReducedMotion } from 'framer-motion';

export default function MeditationsPage() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur motion-fade-in">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white animate-pop">🧘</div>
          <h1 className="text-2xl font-bold">Meditations require login</h1>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login" className="px-5 py-2.5 rounded-full border border-white/30 transition pressable">Login</Link>
            <Link href="/signup" className="px-5 py-2.5 rounded-full text-white bg-gradient-to-r from-indigo-500 to-blue-500 transition pressable">Create account</Link>
          </div>
        </div>
      </div>
    );
  }

  const sessions = [
    { title: 'Sleep Drift (10m)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { title: 'Anxiety Ease (8m)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { title: 'Deep Focus (15m)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  ];
  const handleVoice = (text: string) => {
    const idx = sessions.findIndex((s) => text.toLowerCase().includes(s.title.toLowerCase().split(' ')[0]));
    if (idx >= 0) {
      const el = document.querySelectorAll('audio')[idx] as HTMLAudioElement | undefined;
      el?.play();
    }
  };

  return (
    <motion.div className="min-h-screen p-6 md:p-10" initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-extrabold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">Guided Meditations</h1>
      <div className="max-w-3xl mx-auto mt-8 space-y-4">
        <div className="flex items-center justify-end">
          <VoiceInput onResult={handleVoice} />
        </div>
        {sessions.map((s) => (
          <div key={s.title} className="p-4 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur">
            <div className="font-semibold">{s.title}</div>
            <audio controls className="w-full mt-2">
              <source src={s.url} type="audio/mpeg" />
            </audio>
          </div>
        ))}
      </div>
      <div className="max-w-3xl mx-auto mt-6 text-center">
        <Link href="/toolkit" className="px-4 py-2 rounded-full border border-white/30 hover:bg-white/10 transition pressable">← Back to Toolkit</Link>
      </div>
    </motion.div>
  );
}

