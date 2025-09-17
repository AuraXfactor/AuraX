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

  // Feature toggles / simple UIs for the additional tools
  const [activeTool, setActiveTool] = useState<
    | 'breath_478'
    | 'guided_meditation'
    | 'body_scan'
    | 'ground_54321'
    | 'panic_button'
    | 'mood_playlists'
    | 'affirmation_cards'
    | 'quick_gratitude'
    | 'mini_workouts'
    | 'visualization'
    | 'sleep_tools'
  >('breath_478');
  const [selectedMeditation, setSelectedMeditation] = useState('sleep_10');
  const [affirmation, setAffirmation] = useState('I am safe, capable, and loved.');
  const [gratitudes, setGratitudes] = useState(['', '', '']);

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
      <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">Toolkit</h1>
      <div className="flex flex-wrap gap-2 justify-center">
        {[
          { id: 'breath_478', label: '4-7-8 Breath' },
          { id: 'guided_meditation', label: 'Meditations' },
          { id: 'body_scan', label: 'Body Scan' },
          { id: 'ground_54321', label: '5-4-3-2-1' },
          { id: 'panic_button', label: 'Panic Button' },
          { id: 'mood_playlists', label: 'Playlists' },
          { id: 'affirmation_cards', label: 'Affirmations' },
          { id: 'quick_gratitude', label: 'Gratitude' },
          { id: 'mini_workouts', label: 'Stretch' },
          { id: 'visualization', label: 'Visualization' },
          { id: 'sleep_tools', label: 'Sleep' },
        ].map((t) => (
          <button
            key={t.id}
            className={`px-3 py-1.5 rounded-full border ${activeTool === t.id ? 'bg-blue-500 text-white' : ''}`}
            onClick={() => setActiveTool(t.id as typeof activeTool)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {activeTool === 'breath_478' && (
        <>
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
        </>
      )}

      {activeTool === 'guided_meditation' && (
        <div className="w-full max-w-md p-4 border rounded-xl">
          <div className="mb-2 font-semibold">Guided Meditations</div>
          <select value={selectedMeditation} onChange={(e) => setSelectedMeditation(e.target.value)} className="w-full border rounded p-2 mb-3">
            <option value="sleep_10">Sleep – 10 min</option>
            <option value="sleep_20">Sleep – 20 min</option>
            <option value="anxiety_10">Anxiety – 10 min</option>
            <option value="focus_5">Focus – 5 min</option>
          </select>
          <audio controls className="w-full">
            <source src={`/audio/${selectedMeditation}.mp3`} type="audio/mpeg" />
          </audio>
        </div>
      )}

      {activeTool === 'body_scan' && (
        <div className="w-full max-w-md p-4 border rounded-xl">
          <div className="mb-2 font-semibold">Body Scan</div>
          <audio controls className="w-full">
            <source src="/audio/body_scan_10.mp3" type="audio/mpeg" />
          </audio>
        </div>
      )}

      {activeTool === 'ground_54321' && (
        <div className="w-full max-w-md p-4 border rounded-xl space-y-2">
          <div className="mb-2 font-semibold">5-4-3-2-1 Grounding</div>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>5 things you can see</li>
            <li>4 things you can touch</li>
            <li>3 things you can hear</li>
            <li>2 things you can smell</li>
            <li>1 thing you can taste</li>
          </ol>
        </div>
      )}

      {activeTool === 'panic_button' && (
        <div className="w-full max-w-md p-4 border rounded-xl space-y-3">
          <div className="mb-2 font-semibold">Panic Button</div>
          <div>Preset: 4-7-8 breathing + affirmation + soft sound</div>
          <button onClick={() => setActiveTool('breath_478')} className="px-3 py-2 rounded-md border">Start calming sequence</button>
          <div className="text-sm opacity-70">Affirmation: {affirmation}</div>
        </div>
      )}

      {activeTool === 'mood_playlists' && (
        <div className="w-full max-w-md p-4 border rounded-xl space-y-3">
          <div className="font-semibold">Mood Playlists</div>
          <audio controls className="w-full">
            <source src="/audio/soundscape_lofi.mp3" type="audio/mpeg" />
          </audio>
        </div>
      )}

      {activeTool === 'affirmation_cards' && (
        <div className="w-full max-w-md p-4 border rounded-xl space-y-3">
          <div className="font-semibold">Affirmations</div>
          <input value={affirmation} onChange={(e) => setAffirmation(e.target.value)} className="w-full border rounded p-2" />
          <div className="text-sm italic">“{affirmation}”</div>
        </div>
      )}

      {activeTool === 'quick_gratitude' && (
        <div className="w-full max-w-md p-4 border rounded-xl space-y-2">
          <div className="font-semibold">Quick Gratitude</div>
          {gratitudes.map((g, i) => (
            <input key={i} value={g} onChange={(e) => setGratitudes((arr) => arr.map((v, idx) => (idx === i ? e.target.value : v)))} placeholder={`Thing ${i + 1}`} className="w-full border rounded p-2" />
          ))}
        </div>
      )}

      {activeTool === 'mini_workouts' && (
        <div className="w-full max-w-md p-4 border rounded-xl space-y-2">
          <div className="font-semibold">Mini Workout / Stretch</div>
          <video controls className="w-full" poster="/video/stretch_thumb.jpg">
            <source src="/video/stretch_5min.mp4" />
          </video>
        </div>
      )}

      {activeTool === 'visualization' && (
        <div className="w-full max-w-md p-4 border rounded-xl space-y-2">
          <div className="font-semibold">Visualization</div>
          <audio controls className="w-full">
            <source src="/audio/visualize_safe_place.mp3" type="audio/mpeg" />
          </audio>
        </div>
      )}

      {activeTool === 'sleep_tools' && (
        <div className="w-full max-w-md p-4 border rounded-xl space-y-2">
          <div className="font-semibold">Sleep Tools</div>
          <audio controls className="w-full">
            <source src="/audio/white_noise.mp3" type="audio/mpeg" />
          </audio>
        </div>
      )}

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
                    toolName: activeTool,
                    durationSec,
                    reliefLevel,
                    auraPoints,
                    details:
                      activeTool === 'guided_meditation'
                        ? { program: selectedMeditation }
                        : activeTool === 'affirmation_cards'
                        ? { affirmation }
                        : activeTool === 'quick_gratitude'
                        ? { g1: gratitudes[0] || null, g2: gratitudes[1] || null, g3: gratitudes[2] || null }
                        : undefined,
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

