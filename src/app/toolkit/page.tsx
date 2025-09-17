"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { incrementAuraPoints, logToolkitUsage } from '@/lib/dataOps';

export default function ToolkitPage() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [count, setCount] = useState(0);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [reliefLevel, setReliefLevel] = useState<number>(3);
  const [saving, setSaving] = useState(false);

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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white animate-pop">🧰</div>
          <h1 className="text-2xl font-bold">Toolkit requires login</h1>
          <p className="text-gray-600 dark:text-gray-300">Sign in to access breathwork and more wellness tools.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login" className="px-5 py-2.5 rounded-full border border-white/30 hover:bg-white/10 transition">Login</Link>
            <Link href="/signup" className="px-5 py-2.5 rounded-full text-white bg-gradient-to-r from-indigo-500 to-blue-500 hover:scale-105 transition">Create account</Link>
          </div>
        </div>
      </div>
    );
  }

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

      <div className="w-full max-w-sm mt-2 p-4 rounded-xl border border-white/20">
        <div className="mb-3 text-sm font-medium">Session logging</div>
        <div className="flex items-center gap-3">
          {sessionStart == null ? (
            <button
              onClick={() => setSessionStart(Date.now())}
              className="px-4 py-2 rounded-md text-white bg-gradient-to-r from-cyan-400 to-blue-500"
            >
              Start session
            </button>
          ) : (
            <button
              disabled={saving}
              onClick={async () => {
                if (!user || sessionStart == null) return;
                setSaving(true);
                try {
                  const durationSec = Math.max(1, Math.round((Date.now() - sessionStart) / 1000));
                  const auraPoints = Math.max(5, Math.round(durationSec / 60));
                  await logToolkitUsage({
                    uid: user.uid,
                    toolName: 'breath_478',
                    durationSec,
                    reliefLevel,
                    auraPoints,
                  });
                  await incrementAuraPoints(user.uid, auraPoints);
                } finally {
                  setSaving(false);
                  setSessionStart(null);
                }
              }}
              className="px-4 py-2 rounded-md text-white bg-gradient-to-r from-emerald-500 to-teal-500 disabled:opacity-60"
            >
              {saving ? 'Logging…' : 'Finish & log'}
            </button>
          )}
          <div className="flex-1" />
          <label className="text-sm opacity-80">Relief</label>
          <input
            type="range"
            min={1}
            max={5}
            value={reliefLevel}
            onChange={(e) => setReliefLevel(parseInt(e.target.value, 10))}
          />
          <div className="text-sm w-6 text-center">{reliefLevel}</div>
        </div>
      </div>
    </div>
  );
}

