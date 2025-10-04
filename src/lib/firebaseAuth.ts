import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  sendPasswordResetEmail,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
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
  try {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    await ensureUserProfile(credential.user);
    return credential;
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error('Domain not authorized for Google sign-in. Please contact support.');
    } else if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed. Please try again.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked. Please allow popups and try again.');
    }
    
    throw error;
  }
};

export const signInWithApple = async () => {
  try {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    const credential = await signInWithPopup(auth, provider);
    await ensureUserProfile(credential.user);
    return credential;
  } catch (error: any) {
    console.error('Apple sign-in error:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error('Domain not authorized for Apple sign-in. Please contact support.');
    } else if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed. Please try again.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked. Please allow popups and try again.');
    }
    
    throw error;
  }
};

export const sendPhoneVerification = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
  try {
    return await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  } catch (error: any) {
    console.error('Phone verification error:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/captcha-check-failed') {
      throw new Error('reCAPTCHA verification failed. Please try again.');
    } else if (error.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number format.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many requests. Please try again later.');
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error('Domain not authorized. Please contact support.');
    }
    
    throw error;
  }
};

export const verifyPhoneCode = async (confirmationResult: ConfirmationResult, code: string) => {
  const credential = await confirmationResult.confirm(code);
  await ensureUserProfile(credential.user);
  return credential;
};

export const logOut = () => {
  return signOut(auth);
};

export const resetPassword = (email: string) => {
  return sendPasswordResetEmail(auth, email);
};