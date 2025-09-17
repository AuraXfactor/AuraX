"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_BREATHING_PRESETS, logToolkitUsage } from '@/lib/toolkit';
import { useAuth } from '@/contexts/AuthContext';

type Phase = 'inhale' | 'hold' | 'exhale';

export default function Breathing() {
	const { user } = useAuth();
	const [presetId, setPresetId] = useState('478');
	const preset = useMemo(() => DEFAULT_BREATHING_PRESETS.find(p => p.id === presetId) ?? DEFAULT_BREATHING_PRESETS[0], [presetId]);
	const [phase, setPhase] = useState<Phase>('inhale');
	const [counter, setCounter] = useState(0);
	const intervalRef = useRef<number | null>(null);

	useEffect(() => {
		if (!user) return;
		logToolkitUsage(user, { toolId: 'breathing', action: 'start', meta: { presetId } });
	}, [user, presetId]);

	useEffect(() => {
		const vibrate = () => navigator.vibrate?.(20);
		const step = () => {
			setCounter(prev => {
				const next = prev + 1;
				const target = phase === 'inhale' ? preset.pattern.inhaleSeconds : phase === 'hold' ? preset.pattern.holdSeconds : preset.pattern.exhaleSeconds;
				if (next >= target) {
					setPhase(prevPhase => {
						if (prevPhase === 'inhale') return 'hold';
						if (prevPhase === 'hold') return 'exhale';
						return 'inhale';
					});
					vibrate();
					return 0;
				}
				return next;
			});
		};
		if (intervalRef.current) window.clearInterval(intervalRef.current);
		intervalRef.current = window.setInterval(step, 1000);
		return () => {
			if (intervalRef.current) window.clearInterval(intervalRef.current);
		};
	}, [phase, preset]);

	const phaseLabel = phase === 'inhale' ? 'Inhale' : phase === 'hold' ? 'Hold' : 'Exhale';

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<label className="text-sm opacity-80">Rhythm</label>
				<select className="px-3 py-2 rounded-xl bg-white/10 border border-white/20" value={presetId} onChange={(e) => setPresetId(e.target.value)}>
					{DEFAULT_BREATHING_PRESETS.map(p => (
						<option key={p.id} value={p.id}>{p.name}</option>
					))}
				</select>
			</div>
			<div className="relative w-64 h-64 mx-auto">
				<div className="absolute inset-0 blur-2xl opacity-60 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500"></div>
				<div className="relative w-64 h-64 rounded-full bg-white/20 border border-white/20 backdrop-blur flex flex-col items-center justify-center text-3xl transition-all shadow-xl"
						 style={{ transform: `scale(${phase === 'inhale' ? 1.15 : phase === 'exhale' ? 0.9 : 1})` }}>
					<div className="text-2xl font-semibold">{phaseLabel}</div>
					<div className="text-sm mt-2 opacity-80">{counter}s</div>
				</div>
			</div>
			<div className="text-center text-xs opacity-70">Subtle haptics on phase change if supported.</div>
		</div>
	);
}