'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { updateUserSettings, getUserProfile } from '@/lib/userProfile';

type Theme = 'light' | 'dark' | 'auto' | 'purple' | 'ocean' | 'sunset';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'auto',
  setTheme: () => {},
  loading: true
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>('auto');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load theme from user profile or localStorage
    const loadTheme = async () => {
      if (user) {
        try {
          const profile = await getUserProfile(user);
          const userTheme = profile?.settings?.theme as Theme;
          if (userTheme) {
            setThemeState(userTheme);
            applyTheme(userTheme);
          }
        } catch (error) {
          console.error('Error loading user theme:', error);
          // Fallback to localStorage
          const savedTheme = localStorage.getItem('aura-theme') as Theme;
          if (savedTheme) {
            setThemeState(savedTheme);
            applyTheme(savedTheme);
          }
        }
      } else {
        // Load from localStorage for non-authenticated users
        const savedTheme = localStorage.getItem('aura-theme') as Theme;
        if (savedTheme) {
          setThemeState(savedTheme);
          applyTheme(savedTheme);
        }
      }
      setLoading(false);
    };

    loadTheme();
  }, [user]);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('dark');
    root.removeAttribute('data-theme');
    
    // Apply new theme
    switch (newTheme) {
      case 'dark':
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
        break;
      case 'light':
        root.setAttribute('data-theme', 'light');
        break;
      case 'auto':
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
          root.setAttribute('data-theme', 'dark');
        } else {
          root.setAttribute('data-theme', 'light');
        }
        break;
      case 'purple':
      case 'ocean':
      case 'sunset':
        root.setAttribute('data-theme', newTheme);
        break;
      default:
        root.setAttribute('data-theme', 'light');
        break;
    }
  };

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    
    // Save to localStorage
    localStorage.setItem('aura-theme', newTheme);
    
    // Save to user profile if authenticated
    if (user) {
      try {
        await updateUserSettings(user, { theme: newTheme });
      } catch (error) {
        console.error('Error saving theme to profile:', error);
      }
    }
  };

  // Handle system theme changes for auto mode
  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('auto');
      
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};