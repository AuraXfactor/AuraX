"use client";
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logToolkitUsage } from '@/lib/toolkit';

const PROMPTS = {
	safe: 'Close your eyes. Imagine a place where you feel completely safe and at ease. Notice the colors, the temperature, the sounds.',
	success: 'Visualize completing your next challenge with confidence. See each step going smoothly. Feel the pride and relief.',
};

export default function Visualization() {
	const { user } = useAuth();
	const [type, setType] = useState<'safe' | 'success'>('safe');

	const begin = () => {
		if (user) logToolkitUsage(user, { toolId: 'visualization', action: 'start', meta: { type } });
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3">
				<label className="text-sm opacity-80">Type</label>
				<select className="px-3 py-2 rounded-xl bg-white/10 border border-white/20" value={type} onChange={(e) => setType(e.target.value as 'safe' | 'success')}>
					<option value="safe">Safe place</option>
					<option value="success">Success visualization</option>
				</select>
			</div>
			<div className="p-4 rounded-xl bg-white/10 border border-white/20">
				<div className="text-base">{PROMPTS[type]}</div>
			</div>
			<button className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white" onClick={begin}>Begin</button>
		</div>
	);
}