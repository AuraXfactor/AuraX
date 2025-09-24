"use client";
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion, useReducedMotion } from 'framer-motion';
import { awardAuraPoints } from '@/lib/auraPoints';
import { updateQuestProgress } from '@/lib/weeklyQuests';
import { updateSquadChallengeProgress } from '@/lib/auraSquads';
import { useState } from 'react';

export default function WorkoutsPage() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [completedWorkouts, setCompletedWorkouts] = useState<Set<string>>(new Set());

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
    { id: 'neck-shoulder', title: 'Neck & Shoulder Release (5m)', embed: 'https://www.youtube.com/embed/2bG3m9z1Zt8', duration: 300 },
    { id: 'desk-stretch', title: 'Desk Stretch (7m)', embed: 'https://www.youtube.com/embed/Kh6C7Sx5D60', duration: 420 },
  ];

  const handleWorkoutComplete = async (workoutId: string) => {
    if (!user || completedWorkouts.has(workoutId)) return;
    
    try {
      await awardAuraPoints({
        user,
        activity: 'workout_complete',
        proof: {
          type: 'video_completion',
          value: 100, // Assume full completion for embedded videos
          metadata: { 
            workoutId,
            duration: routines.find(r => r.id === workoutId)?.duration || 0
          }
        },
        description: `💪 Completed workout: ${routines.find(r => r.id === workoutId)?.title}`,
      });
      
      // Update quest progress
      await updateQuestProgress(user.uid, 'workout_complete');
      
      // Update squad challenge progress
      await updateSquadChallengeProgress(user.uid, 'workout_complete', 1);
      
      // Mark as completed
      setCompletedWorkouts(prev => new Set([...prev, workoutId]));
      
      // Show celebration
      alert(`🎉 Workout completed! +15 Aura Points earned for taking care of your body!`);
    } catch (error) {
      console.error('Error awarding workout points:', error);
    }
  };

  return (
    <motion.div className="min-h-screen p-6 md:p-10" initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-extrabold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-rose-500">Mini Workouts & Stretch</h1>
      <div className="max-w-3xl mx-auto mt-8 grid grid-cols-1 gap-4">
        {routines.map((r) => (
          <div key={r.title} className="p-4 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{r.title}</div>
              {completedWorkouts.has(r.id) && (
                <span className="text-green-500 font-bold text-sm">✅ +15 pts</span>
              )}
            </div>
            <div className="aspect-video w-full rounded-lg overflow-hidden mb-3">
              <iframe className="w-full h-full" src={r.embed} title={r.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Complete the workout to earn 15 Aura Points! 💪
              </p>
              <button
                onClick={() => handleWorkoutComplete(r.id)}
                disabled={completedWorkouts.has(r.id)}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {completedWorkouts.has(r.id) ? 'Completed ✅' : 'Mark Complete'}
              </button>
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

