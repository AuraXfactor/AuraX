'use client';
import React, { useEffect, useState } from 'react';

export default function ToolkitPage() {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer: ReturnType<typeof setInterval> | undefined = undefined;
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
      <h1 className="text-2xl font-bold">4-7-8 Breathing</h1>
      <div className="w-48 h-48 rounded-full bg-blue-200 flex items-center justify-center text-3xl transition-all"
        style={{ transform: `scale(${phase === 'inhale' ? 1.2 : phase === 'exhale' ? 0.9 : 1})` }}>
        {phase}
      </div>
      <p className="text-gray-600">Count: {count}</p>
    </div>
  );
}

