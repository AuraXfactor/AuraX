"use client";
import React, { useEffect } from 'react';

export default function ReliefPopup({ open, onClose, message }: { open: boolean; onClose: () => void; message?: string }) {
	useEffect(() => {
		if (!open) return;
		const id = setTimeout(onClose, 3000);
		return () => clearTimeout(id);
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 flex items-end sm:items-center justify-center p-4 z-50 pointer-events-none">
			<div className="pointer-events-auto px-4 py-3 rounded-2xl bg-white/80 dark:bg-white/10 border border-white/20 shadow-xl">
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-500 text-white">✓</div>
					<div className="text-sm">{message ?? 'Feeling better? Saved to your history.'}</div>
				</div>
			</div>
		</div>
	);
}