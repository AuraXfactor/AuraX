// @ts-nocheck
'use client';
import React, { useState } from 'react';

type Props = { onPick: (m: { mood: string; emoji: string }) => void };

const MOODS = [
  { mood: 'calm', emoji: '😊' },
  { mood: 'anxious', emoji: '😟' },
  { mood: 'sad', emoji: '😔' },
  { mood: 'stressed', emoji: '😣' },
  { mood: 'proud', emoji: '😌' },
  { mood: 'angry', emoji: '😠' },
];

export default function MoodPicker({ onPick }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" className="px-2 py-1 rounded bg-white/10 hover:bg-white/20" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Mood stickers">😊</button>
      {open && (
        <div className="absolute bottom-full mb-2 left-0 z-10 rounded-xl border border-white/10 bg-black/80 backdrop-blur p-2 grid grid-cols-3 gap-2">
          {MOODS.map((m) => (
            <button key={m.mood} type="button" className="px-2 py-1 rounded hover:bg-white/10" onClick={() => { onPick(m); setOpen(false); }}>
              <span className="text-lg mr-1">{m.emoji}</span>
              <span className="text-sm capitalize">{m.mood}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

