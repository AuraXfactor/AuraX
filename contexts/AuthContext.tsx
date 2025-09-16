"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';

type AuthContextValue = {
  user: User | null | undefined;
  isReady: boolean;
};

const AuthContext = createContext<AuthContextValue>({ user: undefined, isReady: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsReady(true);
    });
    return () => unsub();
  }, []);

  return <AuthContext.Provider value={{ user, isReady }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

