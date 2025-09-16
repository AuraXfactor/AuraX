import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export async function ensureUserProfile(user: User) {
  if (!user) return;
  const userDocRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

