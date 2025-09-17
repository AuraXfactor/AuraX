"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logToolkitUsage } from '@/lib/toolkit';

type Sound = 'white' | 'pink' | 'brown';

export default function SleepTools() {
	const { user } = useAuth();
	const [playing, setPlaying] = useState(false);
	const [sound, setSound] = useState<Sound>('white');
	const audioCtxRef = useRef<AudioContext | null>(null);
	const sourceRef = useRef<AudioBufferSourceNode | null>(null);

	useEffect(() => {
		if (!user) return;
		logToolkitUsage(user, { toolId: 'sleep', action: 'start', meta: { sound } });
	}, [user, sound]);

	const createNoiseBuffer = (ctx: AudioContext, kind: Sound) => {
		const length = ctx.sampleRate * 2;
		const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
		for (let channel = 0; channel < 2; channel++) {
			const data = buffer.getChannelData(channel);
			let lastOut = 0;
			for (let i = 0; i < length; i++) {
				const white = Math.random() * 2 - 1;
				if (kind === 'white') {
					data[i] = white * 0.5;
				} else if (kind === 'pink') {
					lastOut = 0.98 * lastOut + 0.02 * white;
					data[i] = lastOut * 0.7;
				} else {
					lastOut = (lastOut + (0.02 * white)) / 1.02;
					data[i] = lastOut * 1.5;
				}
			}
		}
		return buffer;
	};

	const stop = () => {
		sourceRef.current?.stop();
		sourceRef.current = null;
		setPlaying(false);
	};

	const play = async () => {
		if (!audioCtxRef.current) {
			const Ctx: typeof AudioContext = (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!;
			audioCtxRef.current = new Ctx();
		}
		const ctx = audioCtxRef.current;
		const buffer = createNoiseBuffer(ctx, sound);
		const src = ctx.createBufferSource();
		src.buffer = buffer;
		src.loop = true;
		src.connect(ctx.destination);
		src.start();
		sourceRef.current = src;
		setPlaying(true);
		if (user) logToolkitUsage(user, { toolId: 'sleep', action: 'play', meta: { sound } });
	};

	useEffect(() => {
		return () => stop();
	}, []);

	return (
		<div className="space-y-4">
			<div className="text-xl font-semibold">Sleep Tools</div>
			<div className="flex items-center gap-3">
				<label className="text-sm opacity-80">Sound</label>
				<select className="px-3 py-2 rounded-xl bg-white/10 border border-white/20" value={sound} onChange={(e) => setSound(e.target.value as Sound)}>
					<option value="white">White Noise</option>
					<option value="pink">Pink Noise</option>
					<option value="brown">Brown Noise</option>
				</select>
			</div>
			<div className="flex items-center gap-2">
				{!playing ? (
					<button className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white" onClick={play}>Play</button>
				) : (
					<button className="px-4 py-2 rounded-xl bg-white/10 border border-white/20" onClick={stop}>Stop</button>
				)}
				<div className="text-xs opacity-70">Loops endlessly. Stop when ready to sleep.</div>
			</div>
		</div>
	);
}