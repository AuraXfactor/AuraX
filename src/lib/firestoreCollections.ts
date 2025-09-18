import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit
} from 'firebase/firestore';
import { db } from './firebase';

// TypeScript interfaces for all collections
export interface JournalEntry {
  entryId: string;
  date: Date;
  mood: string; // emoji + text combined
  selfCareActivities: string[];
  affirmation: string;
  notes: string;
  auraPoints: number;
  timestamp: Date;
}

export interface ToolkitLog {
  logId: string;
  toolName: string;
  duration?: number; // minutes if applicable
  reliefLevel?: number; // 1-5 scale
  timestamp: Date;
}

export interface RecoveryLog {
  logId: string;
  trigger?: string;
  cravingLevel: number; // 1-10
  copingToolUsed: string;
  relapse: boolean;
  notes: string;
  timestamp: Date;
}

export interface TherapyRequest {
  requestId: string;
  preferredLanguage: string;
  preferredGender: string;
  preferredTime: string; // morning/evening/weekend
  mode: string; // phone, whatsapp, zoom
  status: 'pending' | 'confirmed' | 'completed';
  timestamp: Date;
}

// Journal Entries Functions
export async function saveJournalEntry(userId: string, entry: Omit<JournalEntry, 'entryId' | 'timestamp'>) {
  const journalRef = collection(db, 'users', userId, 'journalEntries');
  const docRef = await addDoc(journalRef, {
    ...entry,
    timestamp: serverTimestamp(),
  });
  return docRef.id;
}

export async function getJournalEntries(userId: string, limitCount: number = 50): Promise<JournalEntry[]> {
  const journalRef = collection(db, 'users', userId, 'journalEntries');
  const q = query(journalRef, orderBy('timestamp', 'desc'), limit(limitCount));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    entryId: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate() || new Date(),
    timestamp: doc.data().timestamp?.toDate() || new Date(),
  })) as JournalEntry[];
}

// Toolkit Usage Functions
export async function saveToolkitLog(userId: string, log: Omit<ToolkitLog, 'logId' | 'timestamp'>) {
  const toolkitRef = collection(db, 'users', userId, 'toolkitLogs');
  const docRef = await addDoc(toolkitRef, {
    ...log,
    timestamp: serverTimestamp(),
  });
  return docRef.id;
}

export async function getToolkitLogs(userId: string, limitCount: number = 100): Promise<ToolkitLog[]> {
  const toolkitRef = collection(db, 'users', userId, 'toolkitLogs');
  const q = query(toolkitRef, orderBy('timestamp', 'desc'), limit(limitCount));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    logId: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate() || new Date(),
  })) as ToolkitLog[];
}

// Recovery Hub Functions
export async function saveRecoveryLog(userId: string, log: Omit<RecoveryLog, 'logId' | 'timestamp'>) {
  const recoveryRef = collection(db, 'users', userId, 'recoveryLogs');
  const docRef = await addDoc(recoveryRef, {
    ...log,
    timestamp: serverTimestamp(),
  });
  return docRef.id;
}

export async function getRecoveryLogs(userId: string, limitCount: number = 100): Promise<RecoveryLog[]> {
  const recoveryRef = collection(db, 'users', userId, 'recoveryLogs');
  const q = query(recoveryRef, orderBy('timestamp', 'desc'), limit(limitCount));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    logId: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate() || new Date(),
  })) as RecoveryLog[];
}

// Therapy Request Functions
export async function saveTherapyRequest(userId: string, request: Omit<TherapyRequest, 'requestId' | 'timestamp'>) {
  const therapyRef = collection(db, 'users', userId, 'therapyRequests');
  const docRef = await addDoc(therapyRef, {
    ...request,
    timestamp: serverTimestamp(),
  });
  return docRef.id;
}

export async function getTherapyRequests(userId: string): Promise<TherapyRequest[]> {
  const therapyRef = collection(db, 'users', userId, 'therapyRequests');
  const q = query(therapyRef, orderBy('timestamp', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    requestId: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate() || new Date(),
  })) as TherapyRequest[];
}

export async function updateTherapyRequestStatus(userId: string, requestId: string, status: 'pending' | 'confirmed' | 'completed') {
  const requestRef = doc(db, 'users', userId, 'therapyRequests', requestId);
  await updateDoc(requestRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}

// Aura Points Calculation
export async function calculateTotalAuraPoints(userId: string): Promise<number> {
  try {
    // Get points from journal entries
    const journalRef = collection(db, 'users', userId, 'journalEntries');
    const journalQuery = query(journalRef);
    const journalSnapshot = await getDocs(journalQuery);
    
    let journalPoints = 0;
    journalSnapshot.docs.forEach(doc => {
      const data = doc.data();
      journalPoints += data.auraPoints || 0;
    });

    // Toolkit usage gives 5 points each
    const toolkitRef = collection(db, 'users', userId, 'toolkitLogs');
    const toolkitQuery = query(toolkitRef);
    const toolkitSnapshot = await getDocs(toolkitQuery);
    const toolkitPoints = toolkitSnapshot.size * 5;

    // Recovery logs give 10 points each (for logging progress)
    const recoveryRef = collection(db, 'users', userId, 'recoveryLogs');
    const recoveryQuery = query(recoveryRef);
    const recoverySnapshot = await getDocs(recoveryQuery);
    const recoveryPoints = recoverySnapshot.size * 10;

    return journalPoints + toolkitPoints + recoveryPoints;
  } catch (error) {
    console.error('Error calculating Aura Points:', error);
    return 0;
  }
}

// Update user's total Aura Points
export async function updateUserAuraPoints(userId: string) {
  const totalPoints = await calculateTotalAuraPoints(userId);
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    auraPoints: totalPoints,
    updatedAt: serverTimestamp(),
  });
  return totalPoints;
}