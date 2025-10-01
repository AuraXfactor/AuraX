'use client';
import React, { useState, useEffect } from 'react';
import { useLeftSwipeMenu } from './LeftSwipeMenu';

interface SwipeDetectorProps {
  children: React.ReactNode;
}

export default function SwipeDetector({ children }: SwipeDetectorProps) {
  const { openMenu } = useLeftSwipeMenu();
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  // Minimum distance for swipe
  const minSwipeDistance = 50;
  const maxVerticalDistance = 100; // Prevent accidental swipes when scrolling

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = Math.abs(touchEnd.y - touchStart.y);
    
    // Check if it's a right swipe (left to right) and not too vertical
    const isRightSwipe = deltaX > minSwipeDistance && deltaY < maxVerticalDistance;
    
    // Only trigger from the left edge of the screen
    const isFromLeftEdge = touchStart.x < 50;
    
    if (isRightSwipe && isFromLeftEdge) {
      openMenu();
    }
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="h-full w-full"
    >
      {children}
    </div>
  );
}