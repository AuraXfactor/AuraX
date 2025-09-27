import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type BoostCategory =
  | 'guided_meditation'
  | 'body_scan'
  | 'mini_workout'
  | 'panic_resource';

export interface Boost {
  id: string;
  title: string;
  description: string;
  videoUrl?: string; // YouTube URL
  audioUrl?: string; // Optional audio-only alt
  durationSec: number; // seconds
  points: number;
  category: BoostCategory;
  tags?: string[];
  thumbnail?: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  isActive: boolean;
  panicClip?: {
    startSec: number;
    endSec: number;
  };
}

export function getBoostsRef() {
  return collection(db, 'boosts');
}

export async function listBoosts(params?: { category?: BoostCategory; activeOnly?: boolean }): Promise<Boost[]> {
  let base = getBoostsRef();
  const filters = [] as any[];
  if (params?.category) filters.push(where('category', '==', params.category));
  if (params?.activeOnly) filters.push(where('isActive', '==', true));
  const q = filters.length > 0 ? query(base, ...filters, orderBy('title')) : query(base, orderBy('title'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Boost, 'id'>) }));
}

export async function getBoost(id: string): Promise<Boost | null> {
  const ref = doc(getBoostsRef(), id);
  const d = await getDoc(ref);
  return d.exists() ? ({ id: d.id, ...(d.data() as Omit<Boost, 'id'>) } as Boost) : null;
}

export async function upsertBoost(data: Omit<Boost, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<string> {
  if (data.id) {
    const ref = doc(getBoostsRef(), data.id);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
    return data.id;
  }
  const payload = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const created = await addDoc(getBoostsRef(), payload);
  return created.id;
}

export async function removeBoost(id: string): Promise<void> {
  await deleteDoc(doc(getBoostsRef(), id));
}

export function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '') || null;
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
  } catch (_) {
    return null;
  }
  return null;
}

export function buildYouTubeEmbed(url?: string, opts?: { start?: number; end?: number }): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  const params = new URLSearchParams({ modestbranding: '1', rel: '0', playsinline: '1' });
  if (opts?.start) params.set('start', String(opts.start));
  if (opts?.end) params.set('end', String(opts.end));
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

export type BoostSeed = Omit<Boost, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };

export async function seedBoosts(items: BoostSeed[]): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;
  for (const item of items) {
    if (item.id) {
      await upsertBoost(item);
      updated += 1;
    } else {
      await upsertBoost(item);
      created += 1;
    }
  }
  return { created, updated };
}

