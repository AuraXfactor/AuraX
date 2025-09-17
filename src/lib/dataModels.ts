import { FieldValue, Timestamp } from 'firebase/firestore';

export interface JournalEntryData {
  mood: string;
  activities: string[];
  notes: string;
  affirmation?: string | null;
  voiceMemoUrl?: string | null;
  createdAt?: Timestamp | FieldValue;
  dateKey: string; // YYYY-MM-DD
  auraPoints: number;
}

export interface ToolkitUsageLog {
  toolName: string; // e.g., "breath_478"
  durationSec: number;
  reliefLevel?: number | null; // 1-5 optional
  createdAt?: Timestamp | FieldValue;
  auraPoints: number;
}

export interface AuraStats {
  totalAuraPoints: number;
  journalStreakDays?: number;
  lastJournalDateKey?: string | null; // YYYY-MM-DD
  milestones?: string[];
  updatedAt?: Timestamp | FieldValue;
}

export function formatDateKeyFromDate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
