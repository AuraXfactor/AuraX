'use client';
import React from 'react';
import { useTourGuide } from '@/components/TourGuide';
import { useLeftSwipeMenu } from '@/components/LeftSwipeMenu';
import TourGuide from '@/components/TourGuide';
import LeftSwipeMenu from '@/components/LeftSwipeMenu';

interface ClientAppWrapperProps {
  children: React.ReactNode;
}

export default function ClientAppWrapper({ children }: ClientAppWrapperProps) {
  const { isActive: tourActive, startTour, completeTour, skipTour, shouldShowTour } = useTourGuide();
  const { isOpen: menuOpen, openMenu, closeMenu } = useLeftSwipeMenu();

  // Auto-start tour for new users
  React.useEffect(() => {
    if (typeof window !== 'undefined' && shouldShowTour()) {
      const timer = setTimeout(() => startTour(), 2000); // Start tour after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [shouldShowTour, startTour]);

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