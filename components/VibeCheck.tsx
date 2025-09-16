"use client";
import { useEffect, useMemo, useState } from 'react';
import { submitVibe } from '@/lib/vibe';
import { motion } from 'framer-motion';

const moods = [
  { value: 1, label: 'Low' },
  { value: 2, label: 'OK' },
  { value: 3, label: 'Good' },
  { value: 4, label: 'Great' },
  { value: 5, label: 'Glowing' },
];

export function VibeCheck() {
  const [mood, setMood] = useState<number | null>(null);
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit() {
    if (!mood) return;
    setSubmitting(true);
    try {
      await submitVibe(mood, note || undefined);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2000);
      setNote('');
      setMood(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4">
      <div className="mb-3 text-sm uppercase tracking-wider text-[rgba(230,230,255,0.75)]">Vibe Check-in</div>
      <div className="mb-3 grid grid-cols-5 gap-2">
        {moods.map((m) => (
          <button
            key={m.value}
            onClick={() => setMood(m.value)}
            className={`rounded-xl px-3 py-2 text-sm ${
              mood === m.value
                ? 'bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan text-black'
                : 'glass'
            }`}
          >
            {m.value}
          </button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a quick note (optional)"
        className="mb-3 w-full rounded-xl bg-transparent p-3 text-sm outline-none ring-1 ring-[rgba(255,255,255,0.08)] focus:ring-neon-cyan/60"
        rows={2}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={onSubmit}
          disabled={!mood || submitting}
          className="rounded-xl bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Save Vibe'}
        </button>
        {submitted && (
          <motion.span
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-sm text-neon-cyan"
          >
            Saved and Aura updated ✨
          </motion.span>
        )}
      </div>
    </div>
  );
}

