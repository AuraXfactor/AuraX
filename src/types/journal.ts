export type JournalType =
  | 'deepDive'
  | 'gratitude'
  | 'brainDump'
  | 'cognitiveTriangle'
  | 'goalTracker'
  | 'bullet'
  | 'idea'
  | 'stream'
  | 'dialogue'
  | 'oneLine'
  | 'dream';

export interface Journal {
  id: string;
  ownerId: string;
  journalType: JournalType;
  title: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalEntryBase {
  id: string;
  ownerId: string;
  journalId: string;
  journalType: JournalType;
  tags?: string[];
  emotions?: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type EntryContent =
  | { text: string } // deepDive, stream, idea
  | { items: Array<{ text: string; why?: string }> } // gratitude
  | { timerSec: number; text: string; released?: boolean } // brainDump
  | { situation: string; thoughts: string; feelings: string } // CBT
  | { goals?: GoalDefinition[]; tasks?: TaskItem[]; progress?: number; reflection?: string } // goalTracker
  | { bullets: Array<{ kind: 'task' | 'event' | 'note'; text: string; done?: boolean }> } // bullet
  | { prompt?: string; text: string } // dialogue (multi-speaker handled in UI layer)
  | { line: string; year: number } // oneLine
  | { transcript?: string; themes?: string[]; mood?: string }; // dream

export interface JournalEntry extends JournalEntryBase {
  content: EntryContent;
}

export interface GoalDefinition {
  id: string;
  title: string;
  description?: string;
  targetDate?: string; // ISO date
  completed?: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  note?: string;
  dueDate?: string; // ISO date
  done?: boolean;
}

