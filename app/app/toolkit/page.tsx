"use client";
import React, { useEffect, useState } from 'react';

export default function ToolkitPage() {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [count, setCount] = useState(0);

  useEffect(() => {
    const vibrate = () => navigator.vibrate?.(20);

    const run = () => {
      if (phase === 'inhale') {
        setCount((c) => {
          const next = c + 1;
          if (next >= 4) {
            setPhase('hold');
            vibrate();
            return 0;
          }
          return next;
        });
      } else if (phase === 'hold') {
        setCount((c) => {
          const next = c + 1;
          if (next >= 7) {
            setPhase('exhale');
            vibrate();
            return 0;
          }
          return next;
        });
      } else {
        setCount((c) => {
          const next = c + 1;
          if (next >= 8) {
            setPhase('inhale');
            vibrate();
            return 0;
          }
          return next;
        });
      }
    };

    const id = setInterval(run, 1000);
    return () => clearInterval(id);
  }, [phase]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">4-7-8 Breathing 🌬️</h1>
      <div className="relative">
        <div className="absolute inset-0 blur-2xl opacity-60 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500"></div>
        <div
          className="relative w-56 h-56 rounded-full bg-white/20 border border-white/20 backdrop-blur flex items-center justify-center text-3xl transition-all shadow-xl"
          style={{ transform: `scale(${phase === 'inhale' ? 1.2 : phase === 'exhale' ? 0.9 : 1})` }}
        >
          {phase}
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-300">Count: {count}</p>
      <div className="text-xs text-gray-500">Phone users feel subtle haptics between phases.</div>
    </div>
  );
}

