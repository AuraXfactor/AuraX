"use client";
import Link from 'next/link';
import VoiceInput from '@/components/VoiceInput';
import { useAuth } from '@/contexts/AuthContext';
import { motion, useReducedMotion } from 'framer-motion';
import { awardAuraPoints } from '@/lib/auraPoints';
import { updateQuestProgress } from '@/lib/weeklyQuests';
import { updateSquadChallengeProgress } from '@/lib/auraSquads';
import { useState } from 'react';

export default function MeditationsPage() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [completedSessions, setCompletedSessions] = useState<Set<string>>(new Set());

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
    { id: 'sleep', title: 'Sleep Drift (10m)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', duration: 600 },
    { id: 'anxiety', title: 'Anxiety Ease (8m)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', duration: 480 },
    { id: 'focus', title: 'Deep Focus (15m)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', duration: 900 },
  ];

  const handleMeditationComplete = async (sessionId: string, duration: number, completionPercentage: number) => {
    if (!user || completedSessions.has(sessionId)) return;
    
    try {
      // Award points for meditation completion (minimum 80% completion)
      if (completionPercentage >= 80) {
        await awardAuraPoints({
          user,
          activity: 'meditation_complete',
          proof: {
            type: 'video_completion',
            value: completionPercentage,
            metadata: { 
              sessionId,
              duration,
              completedDuration: Math.round(duration * completionPercentage / 100)
            }
          },
          description: `🧘 Completed meditation: ${sessions.find(s => s.id === sessionId)?.title}`,
        });
        
        // Update quest progress
        await updateQuestProgress(user.uid, 'meditation_complete');
        
        // Update squad challenge progress (pass minutes meditated)
        const minutesCompleted = Math.round(duration * completionPercentage / 100 / 60);
        await updateSquadChallengeProgress(user.uid, 'meditation_complete', minutesCompleted);
        
        // Mark as completed to prevent double awarding
        setCompletedSessions(prev => new Set([...prev, sessionId]));
        
        // Show celebration
        alert(`🎉 Meditation completed! +15 Aura Points earned for your mindfulness practice!`);
      }
    } catch (error) {
      console.error('Error awarding meditation points:', error);
    }
  };
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
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{s.title}</div>
              {completedSessions.has(s.id) && (
                <span className="text-green-500 font-bold text-sm">✅ +15 pts</span>
              )}
            </div>
            <audio 
              controls 
              className="w-full mt-2"
              onEnded={() => handleMeditationComplete(s.id, s.duration, 100)}
              onTimeUpdate={(e) => {
                const audio = e.target as HTMLAudioElement;
                const completion = (audio.currentTime / audio.duration) * 100;
                if (completion >= 80 && !completedSessions.has(s.id)) {
                  // Award partial completion
                  handleMeditationComplete(s.id, s.duration, completion);
                }
              }}
            >
              <source src={s.url} type="audio/mpeg" />
            </audio>
            <p className="text-xs text-gray-500 mt-2">
              Complete 80% to earn 15 Aura Points! 🌟
            </p>
          </div>
        ))}
      </div>
      <div className="max-w-3xl mx-auto mt-6 text-center">
        <Link href="/toolkit" className="px-4 py-2 rounded-full border border-white/30 hover:bg-white/10 transition pressable">← Back to Toolkit</Link>
      </div>
    </motion.div>
  );
}

