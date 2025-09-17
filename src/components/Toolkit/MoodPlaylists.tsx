"use client";
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logToolkitUsage } from '@/lib/toolkit';

type Mood = 'focus' | 'calm' | 'uplift';

const TRACKS: Record<Mood, { title: string; src: string }[]> = {
	focus: [
		{ title: 'Deep Focus', src: '/focus1.mp3' },
	],
	calm: [
		{ title: 'Ocean Calm', src: '/calm1.mp3' },
	],
	uplift: [
		{ title: 'Sunny Vibes', src: '/uplift1.mp3' },
	],
};

export default function MoodPlaylists() {
	const { user } = useAuth();
	const [mood, setMood] = useState<Mood>('calm');
	const [current, setCurrent] = useState(0);

	const play = () => {
		const audio = new Audio(TRACKS[mood][current].src);
		audio.play();
		if (user) logToolkitUsage(user, { toolId: 'mood', action: 'play', meta: { mood, current } });
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3">
				<label className="text-sm opacity-80">Mood</label>
				<select className="px-3 py-2 rounded-xl bg-white/10 border border-white/20" value={mood} onChange={(e) => { setMood(e.target.value as Mood); setCurrent(0); }}>
					<option value="focus">Focus</option>
					<option value="calm">Calm</option>
					<option value="uplift">Uplift</option>
				</select>
			</div>
			<div className="p-4 rounded-xl bg-white/10 border border-white/20">
				<div className="text-sm opacity-80">{TRACKS[mood][current].title}</div>
			</div>
			<div className="flex items-center gap-2">
				<button className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white" onClick={play}>Play</button>
				<button className="px-3 py-2 rounded-xl bg-white/10" onClick={() => setCurrent((current + 1) % TRACKS[mood].length)}>Next</button>
			</div>
			<div className="text-xs opacity-70">Add real audio sources or streaming integration later.</div>
		</div>
	);
}