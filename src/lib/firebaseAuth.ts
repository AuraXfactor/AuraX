import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User,
} from 'firebase/auth';
import { auth } from './firebase';
import { ensureUserProfile } from './userProfile';

export const signUpWithEmail = async (email: string, password: string) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(credential.user);
  return credential;
};

export const signInWithEmail = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  await ensureUserProfile(credential.user);
  return credential;
};

export const logOut = () => {
  return signOut(auth);
};

export const resetPassword = (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

export const userHasPasswordProvider = (user: User | null) => {
  if (!user) return false;
  return user.providerData.some((p) => p.providerId === 'password');
};

export async function changePassword(currentPassword: string, newPassword: string) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('Not authenticated');
  const cred = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPassword);
}