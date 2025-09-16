import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, Timestamp, where } from 'firebase/firestore';

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getTodayScore(): Promise<number> {
  const user = auth.currentUser;
  if (!user) return 0;
  const scoresCol = collection(db, 'users', user.uid, 'userScores');
  const sod = startOfDay(new Date());
  const eod = new Date(sod);
  eod.setDate(eod.getDate() + 1);
  const q = query(
    scoresCol,
    where('timestamp', '>=', Timestamp.fromDate(sod)),
    where('timestamp', '<', Timestamp.fromDate(eod))
  );
  const snap = await getDocs(q);
  if (snap.empty) return 0;
  const data = snap.docs[0].data() as { score: number };
  return Math.max(0, Math.min(100, data.score ?? 0));
}

export async function writeTodayScore(score: number) {
  const user = auth.currentUser;
  if (!user) return;
  const scoresCol = collection(db, 'users', user.uid, 'userScores');
  const id = startOfDay(new Date()).toISOString().slice(0, 10); // YYYY-MM-DD
  await setDoc(doc(scoresCol, id), { score, timestamp: serverTimestamp() }, { merge: true });
}

