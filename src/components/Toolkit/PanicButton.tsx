"use client";
import React, { useMemo, useRef, useState } from 'react';
import { DEFAULT_BREATHING_PRESETS, DEFAULT_PANIC_PRESETS, logToolkitUsage } from '@/lib/toolkit';
import { useAuth } from '@/contexts/AuthContext';

export default function PanicButton() {
	const { user } = useAuth();
	const [presetId, setPresetId] = useState('calm-now');
	const preset = useMemo(() => DEFAULT_PANIC_PRESETS.find(p => p.id === presetId) ?? DEFAULT_PANIC_PRESETS[0], [presetId]);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const run = async () => {
		if (user) logToolkitUsage(user, { toolId: 'panic', action: 'start', meta: { presetId } });
		if (preset.includes.playChime) {
			try {
				audioRef.current?.play();
			} catch {}
		}
		if (preset.includes.showAffirmation) {
			alert('You are safe. This feeling will pass. Breathe.');
		}
		if (user) logToolkitUsage(user, { toolId: 'panic', action: 'complete', meta: { presetId } });
	};

	const breathing = preset.includes.breathingPresetId && DEFAULT_BREATHING_PRESETS.find(b => b.id === preset.includes.breathingPresetId);

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3">
				<label className="text-sm opacity-80">Preset</label>
				<select className="px-3 py-2 rounded-xl bg-white/10 border border-white/20" value={presetId} onChange={(e) => setPresetId(e.target.value)}>
					{DEFAULT_PANIC_PRESETS.map(p => (
						<option key={p.id} value={p.id}>{p.name}</option>
					))}
				</select>
			</div>
			<button className="w-full py-6 rounded-2xl text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-xl active:scale-[0.99]" onClick={run}>Panic Button</button>
			{breathing && (
				<div className="text-xs opacity-80">Breathing: {breathing.name}</div>
			)}
			<audio ref={audioRef} src="/chime.mp3" preload="auto" />
		</div>
	);
}