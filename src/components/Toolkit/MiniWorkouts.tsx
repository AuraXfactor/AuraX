"use client";
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logToolkitUsage } from '@/lib/toolkit';

type Routine = {
	id: string;
	name: string;
	steps: { label: string; seconds: number }[];
};

const ROUTINES: Routine[] = [
	{
		id: 'stretch5',
		name: '5-min Stretch',
		steps: [
			{ label: 'Neck roll', seconds: 30 },
			{ label: 'Shoulder stretch', seconds: 30 },
			{ label: 'Side bend', seconds: 30 },
			{ label: 'Hamstring reach', seconds: 30 },
			{ label: 'Ankle circles', seconds: 30 },
			{ label: 'Repeat x2', seconds: 120 },
		],
	},
];

export default function MiniWorkouts() {
	const { user } = useAuth();
	const [routineId, setRoutineId] = useState('stretch5');
	const current = ROUTINES.find(r => r.id === routineId) ?? ROUTINES[0];

	const start = () => {
		if (user) logToolkitUsage(user, { toolId: 'workout', action: 'start', meta: { routineId } });
		alert('Follow the steps; timer coming soon.');
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-3">
				<label className="text-sm opacity-80">Routine</label>
				<select className="px-3 py-2 rounded-xl bg-white/10 border border-white/20" value={routineId} onChange={(e) => setRoutineId(e.target.value)}>
					{ROUTINES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
				</select>
			</div>
			<div className="p-4 rounded-xl bg-white/10 border border-white/20 space-y-2">
				{current.steps.map((s, i) => (
					<div key={i} className="flex items-center justify-between">
						<div className="text-sm">{s.label}</div>
						<div className="text-xs opacity-70">{s.seconds}s</div>
					</div>
				))}
			</div>
			<button className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white" onClick={start}>Start</button>
		</div>
	);
}