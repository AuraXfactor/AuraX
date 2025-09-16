"use client";
import { motion } from 'framer-motion';
import React from 'react';

type AuraRingProps = {
  score: number; // 0-100
  size?: number;
};

export function AuraRing({ score, size = 240 }: AuraRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - 24) / 2; // 12px stroke padding
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * (clamped / 100);

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="drop-shadow-[0_0_25px_rgba(155,92,255,0.35)]">
        <defs>
          <linearGradient id="aura-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9b5cff" />
            <stop offset="50%" stopColor="#ff4d9d" />
            <stop offset="100%" stopColor="#00e5ff" />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={12}
          fill="none"
        />

        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#aura-gradient)"
          strokeWidth={12}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference - progress}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: 'drop-shadow(0 0 12px rgba(155, 92, 255, 0.8))' }}
        />
      </svg>

      <div className="absolute text-center">
        <div className="text-6xl font-bold tracking-tight">{clamped}</div>
        <div className="mt-1 text-sm uppercase tracking-widest text-[rgba(230,230,255,0.75)]">Aura</div>
      </div>
    </div>
  );
}

