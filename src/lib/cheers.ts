import { User } from 'firebase/auth';
import { addDoc, collection, doc, increment, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export type Cheer = {
  fromUid: string;
  emoji: string;
  message?: string;
  timestamp: Timestamp;
};

export async function sendCheer(currentUser: User, targetUid: string, emoji: string, message?: string) {
  const targetRef = doc(db, 'users', targetUid);
  await addDoc(collection(targetRef, 'cheers'), {
    fromUid: currentUser.uid,
    emoji,
    message: message?.trim() || null,
    timestamp: serverTimestamp(),
  });

  // Aura boost for both users
  await Promise.all([
    setDoc(doc(db, 'users', currentUser.uid), { auraTotal: increment(1) }, { merge: true }),
    setDoc(doc(db, 'users', targetUid), { auraTotal: increment(1) }, { merge: true }),
  ]);
}

