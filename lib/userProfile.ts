import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const ensureUserProfile = async (user: User) => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
};