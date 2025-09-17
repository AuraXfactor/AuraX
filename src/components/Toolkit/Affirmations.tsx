"use client";
import React, { useEffect, useState } from 'react';
import { addAffirmation, getAffirmations, logToolkitUsage } from '@/lib/toolkit';
import { useAuth } from '@/contexts/AuthContext';

const DEFAULTS = [
	'I am safe. I can handle this moment.',
	'My breath anchors me to the present.',
	'I choose calm. I choose kindness for myself.',
	'This wave will pass. I am grounded.',
];

export default function Affirmations() {
	const { user } = useAuth();
	const [list, setList] = useState<string[]>(DEFAULTS);
	const [idx, setIdx] = useState(0);
	const [input, setInput] = useState('');

	useEffect(() => {
		if (!user) return;
		(async () => {
			try {
				const items = await getAffirmations(user);
				if (items.length) setList([...items.map(i => i.text), ...DEFAULTS]);
			} catch {}
		})();
	}, [user]);

	const next = () => setIdx((idx + 1) % list.length);
	const prev = () => setIdx((idx - 1 + list.length) % list.length);

	const add = async () => {
		if (!user || !input.trim()) return;
		try {
			await addAffirmation(user, input.trim());
			setList([input.trim(), ...list]);
			setInput('');
			await logToolkitUsage(user, { toolId: 'affirmations', action: 'add' });
		} catch {}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="text-xl font-semibold">Daily Affirmations</div>
				<div className="flex items-center gap-2">
					<button className="px-2 py-1 rounded-lg bg-white/10" onClick={prev}>◀</button>
					<button className="px-2 py-1 rounded-lg bg-white/10" onClick={next}>▶</button>
				</div>
			</div>
			<div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/20 shadow-lg">
				<div className="text-center text-lg font-medium">{list[idx]}</div>
			</div>
			<div className="flex items-center gap-2">
				<input className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/20" placeholder="Add your own" value={input} onChange={(e) => setInput(e.target.value)} />
				<button className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white" onClick={add}>Add</button>
			</div>
		</div>
	);
}