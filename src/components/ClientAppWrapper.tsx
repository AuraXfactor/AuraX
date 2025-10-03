'use client';
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTourGuide } from '@/components/TourGuide';
import { useLeftSwipeMenu } from '@/components/LeftSwipeMenu';
import { useOfflineSync } from '@/utils/offlineStorage';
import TourGuide from '@/components/TourGuide';
import LeftSwipeMenu from '@/components/LeftSwipeMenu';

interface ClientAppWrapperProps {
  children: React.ReactNode;
}

export default function ClientAppWrapper({ children }: ClientAppWrapperProps) {
  const { user } = useAuth();
  const { isActive: tourActive, startTour, completeTour, skipTour, shouldShowTour } = useTourGuide();
  const { isOpen: menuOpen, openMenu, closeMenu } = useLeftSwipeMenu();
  const { isOnline, syncStatus, triggerSync } = useOfflineSync();

  // Initialize offline sync
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const initOfflineSync = async () => {
        try {
          const { syncManager } = await import('@/utils/offlineStorage');
          await syncManager.init();
        } catch (error) {
          console.error('Failed to initialize offline sync:', error);
        }
      };
      
      initOfflineSync();
    }
  }, []);

  // Auto-start tour for new users only after onboarding completion
  React.useEffect(() => {
    if (typeof window !== 'undefined' && user && shouldShowTour()) {
      // Check if user has completed onboarding by checking localStorage
      const onboardingCompleted = localStorage.getItem(`onboarding_completed_${user.uid}`);
      if (onboardingCompleted === 'true') {
        // Clear the onboarding completion flag to prevent showing tour again
        localStorage.removeItem(`onboarding_completed_${user.uid}`);
        // Start tour after a short delay
        const timer = setTimeout(() => startTour(), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, shouldShowTour, startTour]);

  // Listen for tour start events from menu
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStartTour = () => {
        startTour();
      };

      window.addEventListener('startTour', handleStartTour);
      return () => window.removeEventListener('startTour', handleStartTour);
    }
  }, [startTour]);

  // Auto-sync when coming back online (with debouncing to prevent flickering)
  React.useEffect(() => {
    if (isOnline && syncStatus === 'idle') {
      // Add a small delay to prevent immediate flickering
      const timer = setTimeout(() => {
        triggerSync();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, syncStatus, triggerSync]);

  // Show/hide offline indicators
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const offlineIndicator = document.getElementById('offline-indicator');
      const syncIndicator = document.getElementById('sync-indicator');
      
      if (offlineIndicator) {
        if (!isOnline) {
          offlineIndicator.classList.remove('hidden');
        } else {
          offlineIndicator.classList.add('hidden');
        }
      }
      
      if (syncIndicator) {
        if (syncStatus === 'syncing') {
          syncIndicator.classList.remove('hidden');
        } else {
          syncIndicator.classList.add('hidden');
        }
      }
    }
  }, [isOnline, syncStatus]);

  return (
    <>
      {children}
      
      <TourGuide 
        isActive={tourActive} 
        onComplete={completeTour} 
        onSkip={skipTour} 
      />
      
      <LeftSwipeMenu 
        isOpen={menuOpen} 
        onClose={closeMenu} 
      />
    </>
  );
}