# Aura

Next.js 14 + Tailwind + Firebase starter.

## Setup

1. Copy `.env.example` to `.env.local` and fill Firebase values (already added for you).
2. Install deps: `npm install`
3. Dev server: `npm run dev`

## Firebase Collections

- `users/{uid}`: { points: number }
- `users/{uid}/transactions`: earnings/spending logs
- `users/{uid}/userBoosts`: boost completions
- `users/{uid}/userScores`: daily aura score

## Pages

- `/` Aura Score ring dashboard
- `/boosts` Boosts grid with completion + points + confetti