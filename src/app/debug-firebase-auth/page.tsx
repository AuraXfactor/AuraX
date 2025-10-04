'use client';
import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier } from 'firebase/auth';

export default function DebugFirebaseAuth() {
  const [domainInfo, setDomainInfo] = useState<any>({});
  const [recaptchaStatus, setRecaptchaStatus] = useState<string>('');

  useEffect(() => {
    // Get current domain information
    const currentDomain = window.location.hostname;
    const currentOrigin = window.location.origin;
    const userAgent = navigator.userAgent;
    
    setDomainInfo({
      hostname: currentDomain,
      origin: currentOrigin,
      protocol: window.location.protocol,
      userAgent: userAgent,
      timestamp: new Date().toISOString()
    });

    // Test reCAPTCHA initialization
    try {
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          setRecaptchaStatus('✅ reCAPTCHA initialized successfully');
        },
        'expired-callback': () => {
          setRecaptchaStatus('❌ reCAPTCHA expired');
        }
      });
      
      setRecaptchaStatus('✅ reCAPTCHA verifier created');
    } catch (error: any) {
      setRecaptchaStatus(`❌ reCAPTCHA error: ${error.message}`);
    }
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          🔥 Firebase Auth Debug Tool
        </h1>

        <div className="space-y-6">
          {/* Domain Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🌐 Domain Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Current Hostname:</span>
                <code className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded text-sm">
                  {domainInfo.hostname}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Current Origin:</span>
                <code className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded text-sm">
                  {domainInfo.origin}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Protocol:</span>
                <code className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded text-sm">
                  {domainInfo.protocol}
                </code>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                📋 Add this domain to Firebase:
              </h3>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white dark:bg-gray-800 px-3 py-2 rounded border">
                  {domainInfo.hostname}
                </code>
                <button
                  onClick={() => copyToClipboard(domainInfo.hostname)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          {/* reCAPTCHA Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🤖 reCAPTCHA Status
            </h2>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-800 dark:text-gray-200">{recaptchaStatus}</p>
            </div>
            <div id="recaptcha-container"></div>
          </div>

          {/* Firebase Config */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              ⚙️ Firebase Configuration
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Project ID:</span>
                <code className="text-gray-800 dark:text-gray-200">aura-app-prod-4dc34</code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Auth Domain:</span>
                <code className="text-gray-800 dark:text-gray-200">aura-app-prod-4dc34.firebaseapp.com</code>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
            <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200 mb-4">
              📝 Quick Fix Instructions
            </h2>
            <ol className="space-y-2 text-yellow-700 dark:text-yellow-300">
              <li>1. Go to <a href="https://console.firebase.google.com/" target="_blank" className="underline">Firebase Console</a></li>
              <li>2. Select project: <code className="bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded">aura-app-prod-4dc34</code></li>
              <li>3. Go to <strong>Authentication</strong> → <strong>Settings</strong> → <strong>Authorized domains</strong></li>
              <li>4. Add: <code className="bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded">{domainInfo.hostname}</code></li>
              <li>5. Also add: <code className="bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded">localhost</code></li>
              <li>6. Save and redeploy your app</li>
            </ol>
          </div>

          {/* Test Buttons */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🧪 Test Authentication
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  After adding the domain to Firebase, test these:
                </p>
                <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li>• Phone number sign-up</li>
                  <li>• Google sign-in</li>
                  <li>• Apple sign-in</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}