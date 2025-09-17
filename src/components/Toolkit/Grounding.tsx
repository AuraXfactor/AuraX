"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logToolkitUsage } from '@/lib/toolkit';

type Step = 5 | 4 | 3 | 2 | 1;

export default function Grounding() {
	const { user } = useAuth();
	const [current, setCurrent] = useState<Step>(5);
	const [entries, setEntries] = useState<string[]>([]);
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const [cameraOn, setCameraOn] = useState(false);
	const [stream, setStream] = useState<MediaStream | null>(null);

	useEffect(() => {
		if (!user) return;
		logToolkitUsage(user, { toolId: 'grounding', action: 'start' });
	}, [user]);

	useEffect(() => {
		return () => {
			stream?.getTracks().forEach(t => t.stop());
		};
	}, [stream]);

	const toggleCamera = async () => {
		if (cameraOn) {
			setCameraOn(false);
			stream?.getTracks().forEach(t => t.stop());
			setStream(null);
			return;
		}
		try {
			const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
			setStream(s);
			setCameraOn(true);
			if (videoRef.current) videoRef.current.srcObject = s;
		} catch {
			setCameraOn(false);
		}
	};

	const prompts: Record<Step, string> = {
		5: 'Name five things you can see',
		4: 'Name four things you can feel',
		3: 'Name three things you can hear',
		2: 'Name two things you can smell',
		1: 'Name one thing you can taste',
	};

	const advance = () => {
		if (current > 1) {
			setEntries([]);
			setCurrent(((current - 1) as Step));
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="text-xl font-semibold">5-4-3-2-1 Grounding</div>
				<button className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20" onClick={toggleCamera}>
					{cameraOn ? 'Disable Camera' : 'Enable Camera'}
				</button>
			</div>
			{cameraOn && (
				<div className="rounded-xl overflow-hidden border border-white/20">
					<video ref={videoRef} autoPlay playsInline muted className="w-full h-48 object-cover" />
				</div>
			)}
			<div className="p-4 rounded-xl bg-white/10 border border-white/20">
				<div className="text-sm opacity-80 mb-2">Step {current} • {prompts[current]}</div>
				<div className="flex flex-wrap gap-2">
					{Array.from({ length: current }).map((_, i) => (
						<input key={i} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 w-32" placeholder={`Item ${i+1}`} value={entries[i] ?? ''} onChange={(e)=>{
							const next = [...entries];
							next[i] = e.target.value;
							setEntries(next);
						}} />
					))}
				</div>
				<div className="mt-3 flex items-center gap-2">
					<button disabled={entries.filter(Boolean).length < current} className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white disabled:opacity-40" onClick={advance}>Next</button>
					<div className="text-xs opacity-70">Fill {current} items to continue</div>
				</div>
			</div>
		</div>
	);
}