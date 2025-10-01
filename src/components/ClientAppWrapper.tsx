'use client';
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTourGuide } from '@/components/TourGuide';
import { useLeftSwipeMenu } from '@/components/LeftSwipeMenu';
import TourGuide from '@/components/TourGuide';
import LeftSwipeMenu from '@/components/LeftSwipeMenu';

interface ClientAppWrapperProps {
  children: React.ReactNode;
}

export default function ClientAppWrapper({ children }: ClientAppWrapperProps) {
  const { user } = useAuth();
  const { isActive: tourActive, startTour, completeTour, skipTour, shouldShowTour } = useTourGuide();
  const { isOpen: menuOpen, openMenu, closeMenu } = useLeftSwipeMenu();

  // Auto-start tour for new users only after onboarding completion
  React.useEffect(() => {
    if (typeof window !== 'undefined' && user && shouldShowTour()) {
      // Check if user has completed onboarding by checking if they have a profile
      const checkOnboardingComplete = async () => {
        try {
          const response = await fetch('/api/user/profile');
          if (response.ok) {
            const profile = await response.json();
            // If user has completed onboarding (has profile data), show tour
            if (profile && profile.name) {
              const timer = setTimeout(() => startTour(), 2000);
              return () => clearTimeout(timer);
            }
          }
        } catch (error) {
          console.log('Profile check failed, skipping tour');
        }
      };
      
      checkOnboardingComplete();
    }
  }, [user, shouldShowTour, startTour]);

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