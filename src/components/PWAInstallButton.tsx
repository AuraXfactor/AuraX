'use client';
import React, { useState, useEffect } from 'react';

interface PWAInstallButtonProps {
  className?: string;
  children?: React.ReactNode;
  showText?: boolean;
}

export default function PWAInstallButton({ 
  className = '', 
  children,
  showText = true 
}: PWAInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(Boolean(isInStandaloneMode || isStandalone));

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  // Don't show button if already installed
  if (isInstalled) {
    return null;
  }

  // Don't show button if not installable and not iOS
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl ${className}`}
      >
        <span className="text-lg">📱</span>
        {showText && (
          <span className="font-semibold">
            {isIOS ? 'Install App' : 'Install AuraZ'}
          </span>
        )}
        {children}
      </button>

      {/* iOS Install Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-bold mb-4 text-gray-800">Install AuraZ on iOS</h3>
            <div className="text-left space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <span className="text-gray-700">Tap the <strong>Share</strong> button in Safari</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <span className="text-gray-700">Scroll down and tap <strong>"Add to Home Screen"</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <span className="text-gray-700">Tap <strong>"Add"</strong> to install the app</span>
              </div>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}