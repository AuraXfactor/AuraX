'use client';
import React, { useState, useEffect } from 'react';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Only show splash screen for PWA (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if (!isStandalone) {
      setIsVisible(false);
      return;
    }

    // Hide splash screen after 2 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-white/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Logo and branding */}
      <div className="text-center z-10">
        <div className="w-24 h-24 mx-auto mb-6 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm animate-pop">
          <span className="text-4xl">✨</span>
        </div>
        
        <h1 className="text-4xl font-extrabold text-white mb-2 animate-pop" style={{ animationDelay: '0.2s' }}>
          Aura X
        </h1>
        
        <p className="text-white/80 text-lg animate-pop" style={{ animationDelay: '0.4s' }}>
          Your Vibe, Your Tribe
        </p>

        {/* Loading indicator */}
        <div className="mt-8 animate-pop" style={{ animationDelay: '0.6s' }}>
          <div className="w-16 h-1 bg-white/30 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-white rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}