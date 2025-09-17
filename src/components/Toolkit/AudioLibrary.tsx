"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logToolkitUsage } from '@/lib/toolkit';

type Kind = 'meditation' | 'bodyscan';

const SCRIPTS: Record<Kind, string[]> = {
	meditation: [
		'Find a comfortable position. Close your eyes. Begin by noticing your breath...'
	],
	bodyscan: [
		'Gently bring awareness to your toes. Notice sensations. Slowly move up to your ankles...'
	],
};

export default function AudioLibrary() {
	const { user } = useAuth();
	const [kind, setKind] = useState<Kind>('meditation');
	const [idx, setIdx] = useState(0);
	const [playing, setPlaying] = useState(false);

	useEffect(() => {
		return () => {
			window.speechSynthesis.cancel();
		};
	}, []);

	const play = () => {
		window.speechSynthesis.cancel();
		const text = SCRIPTS[kind][idx];
		const utter = new SpeechSynthesisUtterance(text);
		utter.rate = 0.9;
		utter.pitch = 1;
		utter.onend = () => setPlaying(false);
		window.speechSynthesis.speak(utter);
		setPlaying(true);
		if (user) logToolkitUsage(user, { toolId: kind, action: 'play', meta: { idx } });
	};

	const stop = () => {
		window.speechSynthesis.cancel();
		setPlaying(false);
		if (user) logToolkitUsage(user, { toolId: kind, action: 'pause', meta: { idx } });
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3">
				<label className="text-sm opacity-80">Type</label>
				<select className="px-3 py-2 rounded-xl bg-white/10 border border-white/20" value={kind} onChange={(e) => { setKind(e.target.value as Kind); setIdx(0); }}>
					<option value="meditation">Guided Meditation</option>
					<option value="bodyscan">Body Scan</option>
				</select>
			</div>
			<div className="p-4 rounded-xl bg-white/10 border border-white/20">
				<div className="text-sm opacity-80">Session {idx + 1}</div>
				<div className="text-base mt-1">{SCRIPTS[kind][idx]}</div>
			</div>
			<div className="flex items-center gap-2">
				{!playing ? (
					<button className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white" onClick={play}>Play</button>
				) : (
					<button className="px-4 py-2 rounded-xl bg-white/10 border border-white/20" onClick={stop}>Stop</button>
				)}
				<button className="px-3 py-2 rounded-xl bg-white/10" onClick={() => setIdx((idx + 1) % SCRIPTS[kind].length)}>Next</button>
			</div>
		</div>
	);
}