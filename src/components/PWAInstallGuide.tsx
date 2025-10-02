'use client';
import React, { useState, useEffect } from 'react';

interface PWAInstallGuideProps {
  className?: string;
  showTitle?: boolean;
  compact?: boolean;
}

export default function PWAInstallGuide({ 
  className = '', 
  showTitle = true,
  compact = false 
}: PWAInstallGuideProps) {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent));
    setIsAndroid(/Android/.test(userAgent));
    setIsChrome(/Chrome/.test(userAgent) && !/Edge/.test(userAgent));
    setIsSafari(/Safari/.test(userAgent) && !/Chrome/.test(userAgent));
  }, []);

  if (compact) {
    return (
      <div className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">📱</span>
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200">Install AuraZ App</h3>
            <p className="text-sm text-blue-600 dark:text-blue-300">Get the full app experience</p>
          </div>
        </div>
        
        {isIOS && isSafari && (
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="mb-2">📱 <strong>iOS Safari:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Tap the Share button</li>
              <li>Scroll down and tap "Add to Home Screen"</li>
              <li>Tap "Add" to install</li>
            </ol>
          </div>
        )}
        
        {isAndroid && isChrome && (
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="mb-2">🤖 <strong>Android Chrome:</strong></p>
            <p>Look for the "Install" button in your browser menu or address bar.</p>
          </div>
        )}
        
        {!isIOS && !isAndroid && (
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p>Look for the install button in your browser menu or address bar.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 ${className}`}>
      {showTitle && (
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">📱</div>
          <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-200 mb-2">Install AuraZ App</h2>
          <p className="text-blue-600 dark:text-blue-300">Get the full app experience with faster loading and offline access</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* iOS Instructions */}
        {isIOS && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🍎</span>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">iOS Safari</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Tap the Share button</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Located at the bottom of Safari</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Scroll down and tap "Add to Home Screen"</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Look for the icon with a plus sign</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Tap "Add" to install</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">The app will appear on your home screen</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Android Instructions */}
        {isAndroid && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🤖</span>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Android Chrome</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Look for the install banner</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Chrome will show an install prompt automatically</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Tap "Install" when prompted</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Or look for the install icon in the address bar</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Confirm installation</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">The app will be added to your home screen</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Instructions */}
        {!isIOS && !isAndroid && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">💻</span>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Desktop Browser</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Look for the install icon</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Usually in the address bar or browser menu</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Click "Install" or "Add to Home Screen"</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Follow your browser's prompts</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Launch the app</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">The app will open in a new window</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-blue-600 dark:text-blue-400">
          💡 <strong>Tip:</strong> Once installed, you can use AuraZ offline and get push notifications!
        </p>
      </div>
    </div>
  );
}