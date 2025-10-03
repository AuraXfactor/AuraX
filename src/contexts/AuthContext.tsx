'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { ensureUserProfile } from '@/lib/userProfile';
import { autoMigrateUserFriends } from '@/lib/migrateToFamSystem';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true 
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try { 
          await ensureUserProfile(user);
          await autoMigrateUserFriends(user);
        } catch {}
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Note: Firebase auth is configured with browserLocalPersistence
  // Users will stay logged in until they explicitly log out
  // Session duration is managed by Firebase (typically 30 days, extendable to 3 months)

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};