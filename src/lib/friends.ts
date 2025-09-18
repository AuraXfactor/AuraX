import { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

export type FriendStatus = 'pending' | 'accepted';

export type PublicUser = {
  uid: string;
  username: string | null;
  email: string | null;
  phone?: string | null;
  name?: string | null;
  avatar?: string | null;
};

export async function searchUsers(term: string): Promise<PublicUser[]> {
  const trimmed = term.trim();
  if (!trimmed) return [];

  // Firestore does not support OR easily; run separate queries and merge results
  const usersCol = collection(db, 'users');
  const queries = [
    query(usersCol, where('username', '==', trimmed.toLowerCase())),
    query(usersCol, where('email', '==', trimmed.toLowerCase())),
    query(usersCol, where('phone', '==', trimmed)),
  ];

  const results = await Promise.all(queries.map((q) => getDocs(q)));
  const map = new Map<string, PublicUser>();
  for (const snap of results) {
    snap.forEach((d) => {
      const data = d.data() as any;
      map.set(d.id, {
        uid: d.id,
        username: (data.username as string | null) ?? null,
        email: (data.email as string | null) ?? null,
        phone: (data.phone as string | null) ?? null,
        name: (data.name as string | null) ?? null,
        avatar: (data.avatar as string | null) ?? null,
      });
    });
  }
  return Array.from(map.values());
}

export async function sendFriendRequest(currentUser: User, targetUid: string) {
  if (currentUser.uid === targetUid) return;
  const meRef = doc(db, 'users', currentUser.uid);
  const youRef = doc(db, 'users', targetUid);
  const meFriendRef = doc(collection(meRef, 'friends'), targetUid);
  const youFriendRef = doc(collection(youRef, 'friends'), currentUser.uid);

  await setDoc(meFriendRef, { friendUid: targetUid, status: 'pending', since: serverTimestamp() }, { merge: true });
  await setDoc(youFriendRef, { friendUid: currentUser.uid, status: 'pending', since: serverTimestamp() }, { merge: true });
}

export async function acceptFriendRequest(currentUser: User, requesterUid: string) {
  const meRef = doc(db, 'users', currentUser.uid);
  const themRef = doc(db, 'users', requesterUid);
  await setDoc(doc(collection(meRef, 'friends'), requesterUid), { friendUid: requesterUid, status: 'accepted', since: serverTimestamp() }, { merge: true });
  await setDoc(doc(collection(themRef, 'friends'), currentUser.uid), { friendUid: currentUser.uid, status: 'accepted', since: serverTimestamp() }, { merge: true });
}

export async function getFriendStatus(currentUser: User, friendUid: string): Promise<FriendStatus | null> {
  const ref = doc(db, 'users', currentUser.uid, 'friends', friendUid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  return (data.status as FriendStatus) ?? null;
}

