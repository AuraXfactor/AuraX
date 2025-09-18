import { User } from 'firebase/auth';
import { arrayUnion, collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export type CircleStatus = 'active' | 'completed' | 'paused';

export type SupportCircle = {
  circleId: string;
  members: string[]; // array of uids
  challengeName: string;
  progress: Record<string, number>; // uid -> days completed or points
  status: CircleStatus;
};

export async function createSupportCircle(currentUser: User, circleId: string, members: string[], challengeName: string) {
  const userRef = doc(db, 'users', currentUser.uid);
  const circleDoc = doc(collection(userRef, 'supportCircles'), circleId);
  const initial: SupportCircle = {
    circleId,
    members: Array.from(new Set([currentUser.uid, ...members])),
    challengeName,
    progress: { [currentUser.uid]: 0 },
    status: 'active',
  };
  await setDoc(circleDoc, initial, { merge: true });
}

export async function updateCircleProgress(currentUser: User, circleId: string, delta: number = 1) {
  const circleRef = doc(db, 'users', currentUser.uid, 'supportCircles', circleId);
  const snap = await getDoc(circleRef);
  const existing = (snap.exists() ? (snap.data() as any) : {}) as SupportCircle;
  const prev = (existing.progress?.[currentUser.uid] ?? 0) as number;
  const next = prev + delta;
  await setDoc(circleRef, { progress: { ...(existing.progress ?? {}), [currentUser.uid]: next }, updatedAt: serverTimestamp() }, { merge: true });
}

