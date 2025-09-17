"use client";
import React, { useState } from 'react';
import { addGratitudeEntry, logToolkitUsage } from '@/lib/toolkit';
import { useAuth } from '@/contexts/AuthContext';

export default function Gratitude() {
	const { user } = useAuth();
	const [items, setItems] = useState(['', '', '']);
	const [saved, setSaved] = useState(false);

	const save = async () => {
		if (!user) return;
		const clean = items.map(i => i.trim()).filter(Boolean);
		if (clean.length < 3) return;
		try {
			await addGratitudeEntry(user, clean.slice(0, 3));
			setSaved(true);
			await logToolkitUsage(user, { toolId: 'gratitude', action: 'complete' });
		} catch {}
	};

	return (
		<div className="space-y-4">
			<div className="text-xl font-semibold">Quick Gratitude</div>
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
				{items.map((val, i) => (
					<input key={i} className="px-3 py-2 rounded-xl bg-white/10 border border-white/20" placeholder={`Thing ${i+1}`} value={val} onChange={(e) => {
						const next = [...items];
						next[i] = e.target.value;
						setItems(next);
						setSaved(false);
					}} />
				))}
			</div>
			<div className="flex items-center gap-3">
				<button className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white" onClick={save}>Save</button>
				{saved && <div className="text-sm opacity-80">Saved. Nice boost to your mood ✨</div>}
			</div>
		</div>
	);
}