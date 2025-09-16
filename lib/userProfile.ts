import { User } from 'firebase/auth';
import { collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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

    // Write to public directory to enable friend search
    const dirRef = doc(collection(db, 'directory'), user.uid);
    const name = (user.displayName ?? '').toLowerCase();
    const email = (user.email ?? '').toLowerCase();
    const keywords = Array.from(
      new Set(
        [name, email]
          .flatMap((s) => (s ? [s, ...s.split(/\s+|\.|@|_/g)] : []))
          .filter(Boolean)
      )
    );
    await setDoc(dirRef, {
      displayName: user.displayName ?? null,
      email: user.email ?? null,
      keywords,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
};