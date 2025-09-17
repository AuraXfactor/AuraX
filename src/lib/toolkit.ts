import { User } from 'firebase/auth';
import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export type ToolkitUsageEvent = {
	toolId: string;
	action: 'start' | 'complete' | 'preset_apply' | 'add' | 'play' | 'pause';
	meta?: Record<string, unknown>;
	createdAt?: unknown;
};

export type BreathingPreset = {
	id: string;
	name: string;
	pattern: {
		inhaleSeconds: number;
		holdSeconds: number;
		exhaleSeconds: number;
	};
};

export const DEFAULT_BREATHING_PRESETS: BreathingPreset[] = [
	{ id: '478', name: '4-7-8', pattern: { inhaleSeconds: 4, holdSeconds: 7, exhaleSeconds: 8 } },
	{ id: 'box', name: 'Box 4-4-4-4', pattern: { inhaleSeconds: 4, holdSeconds: 4, exhaleSeconds: 4 } },
	{ id: 'calm', name: 'Calm 5-2-5', pattern: { inhaleSeconds: 5, holdSeconds: 2, exhaleSeconds: 5 } },
];

export async function logToolkitUsage(user: User, event: ToolkitUsageEvent) {
	const col = collection(db, 'users', user.uid, 'toolkitUsage');
	await addDoc(col, { ...event, createdAt: serverTimestamp() });
}

export type Affirmation = {
	id?: string;
	text: string;
	createdAt?: unknown;
};

export async function addAffirmation(user: User, text: string) {
	const col = collection(db, 'users', user.uid, 'affirmations');
	await addDoc(col, { text, createdAt: serverTimestamp() });
}

export async function getAffirmations(user: User): Promise<Affirmation[]> {
	const col = collection(db, 'users', user.uid, 'affirmations');
	const q = query(col, orderBy('createdAt', 'desc'));
	const snap = await getDocs(q);
	return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Affirmation, 'id'>) }));
}

export type JournalEntry = {
	id?: string;
	items: string[];
	createdAt?: unknown;
};

export async function addGratitudeEntry(user: User, items: string[]) {
	const col = collection(db, 'users', user.uid, 'gratitude');
	await addDoc(col, { items, createdAt: serverTimestamp() });
}

export async function getGratitudeEntries(user: User): Promise<JournalEntry[]> {
	const col = collection(db, 'users', user.uid, 'gratitude');
	const q = query(col, orderBy('createdAt', 'desc'));
	const snap = await getDocs(q);
	return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<JournalEntry, 'id'>) }));
}

export type PanicPreset = {
	id: string;
	name: string;
	includes: {
		breathingPresetId?: string;
		playChime?: boolean;
		showAffirmation?: boolean;
	};
};

export const DEFAULT_PANIC_PRESETS: PanicPreset[] = [
	{ id: 'calm-now', name: 'Calm Now', includes: { breathingPresetId: '478', playChime: true, showAffirmation: true } },
	{ id: 'soft-reset', name: 'Soft Reset', includes: { breathingPresetId: 'calm', playChime: true, showAffirmation: false } },
];

export type ToolkitPreference = {
	defaultBreathingPresetId?: string;
	defaultPanicPresetId?: string;
};

export async function saveToolkitPreferences(user: User, prefs: ToolkitPreference) {
	const ref = doc(db, 'users', user.uid, 'settings', 'toolkit');
	await setDoc(ref, { ...prefs, updatedAt: serverTimestamp() }, { merge: true });
}

