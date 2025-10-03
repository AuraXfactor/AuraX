'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface PrivacySettings {
  aiAnalysisEnabled: boolean;
  moodTrackingEnabled: boolean;
  dataSharingEnabled: boolean;
  therapyReferralEnabled: boolean;
  socialSharingEnabled: boolean;
  analyticsEnabled: boolean;
  lastUpdated: Date;
}

interface PrivacyControlsProps {
  onSettingsChanged?: (settings: PrivacySettings) => void;
}

export default function PrivacyControls({ onSettingsChanged }: PrivacyControlsProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>({
    aiAnalysisEnabled: false,
    moodTrackingEnabled: false,
    dataSharingEnabled: false,
    therapyReferralEnabled: false,
    socialSharingEnabled: false,
    analyticsEnabled: false,
    lastUpdated: new Date()
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (user) {
      loadPrivacySettings();
    }
  }, [user]);

  const loadPrivacySettings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        const privacySettings = data.privacySettings as PrivacySettings;
        if (privacySettings) {
          setSettings(privacySettings);
        }
      }
    } catch (err) {
      console.error('Error loading privacy settings:', err);
      setError('Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof PrivacySettings, value: boolean) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const newSettings = { ...settings, [key]: value, lastUpdated: new Date() };
      setSettings(newSettings);
      
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        privacySettings: newSettings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      onSettingsChanged?.(newSettings);
    } catch (err) {
      console.error('Error updating privacy setting:', err);
      setError('Failed to update privacy setting');
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = async () => {
    if (!user) return;
    
    const defaultSettings: PrivacySettings = {
      aiAnalysisEnabled: true,
      moodTrackingEnabled: true,
      dataSharingEnabled: false,
      therapyReferralEnabled: true,
      socialSharingEnabled: false,
      analyticsEnabled: true,
      lastUpdated: new Date()
    };
    
    try {
      setLoading(true);
      setSettings(defaultSettings);
      
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        privacySettings: defaultSettings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      onSettingsChanged?.(defaultSettings);
    } catch (err) {
      console.error('Error resetting privacy settings:', err);
      setError('Failed to reset privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const getSettingDescription = (key: keyof PrivacySettings) => {
    const descriptions: Record<keyof PrivacySettings, string> = {
      aiAnalysisEnabled: 'Allow AI to analyze your journal entries for insights and recommendations',
      moodTrackingEnabled: 'Enable mood tracking and sentiment analysis of your entries',
      dataSharingEnabled: 'Share anonymized data for research and app improvement',
      therapyReferralEnabled: 'Allow AI to suggest professional therapy when needed',
      socialSharingEnabled: 'Enable sharing achievements and progress with your squad',
      analyticsEnabled: 'Collect usage analytics to improve your experience',
      lastUpdated: ''
    };
    return descriptions[key];
  };

  const getSettingIcon = (key: keyof PrivacySettings) => {
    const icons: Record<keyof PrivacySettings, string> = {
      aiAnalysisEnabled: '🧠',
      moodTrackingEnabled: '😊',
      dataSharingEnabled: '📊',
      therapyReferralEnabled: '🩺',
      socialSharingEnabled: '👥',
      analyticsEnabled: '📈',
      lastUpdated: ''
    };
    return icons[key];
  };

  if (loading && !settings.aiAnalysisEnabled) {
    return (
      <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading privacy settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          🔒 Privacy Controls
        </h2>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 transition"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Core Settings */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Core AI Features</h3>
          
          {Object.entries(settings).filter(([key]) => 
            ['aiAnalysisEnabled', 'moodTrackingEnabled', 'therapyReferralEnabled'].includes(key)
          ).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getSettingIcon(key as keyof PrivacySettings)}</span>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('Enabled', '')}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getSettingDescription(key as keyof PrivacySettings)}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value as boolean}
                  onChange={(e) => updateSetting(key as keyof PrivacySettings, e.target.checked)}
                  className="sr-only peer"
                  disabled={loading}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
              </label>
            </div>
          ))}
        </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Advanced Settings</h3>
            
            {Object.entries(settings).filter(([key]) => 
              ['dataSharingEnabled', 'socialSharingEnabled', 'analyticsEnabled'].includes(key)
            ).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getSettingIcon(key as keyof PrivacySettings)}</span>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('Enabled', '')}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getSettingDescription(key as keyof PrivacySettings)}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value as boolean}
                    onChange={(e) => updateSetting(key as keyof PrivacySettings, e.target.checked)}
                    className="sr-only peer"
                    disabled={loading}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>
            ))}
          </div>
        )}

        {/* Data Summary */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Your Data Summary</h4>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <p>• AI Analysis: {settings.aiAnalysisEnabled ? 'Enabled' : 'Disabled'}</p>
                <p>• Mood Tracking: {settings.moodTrackingEnabled ? 'Enabled' : 'Disabled'}</p>
                <p>• Therapy Referrals: {settings.therapyReferralEnabled ? 'Enabled' : 'Disabled'}</p>
                {showAdvanced && (
                  <>
                    <p>• Data Sharing: {settings.dataSharingEnabled ? 'Enabled' : 'Disabled'}</p>
                    <p>• Social Sharing: {settings.socialSharingEnabled ? 'Enabled' : 'Disabled'}</p>
                    <p>• Analytics: {settings.analyticsEnabled ? 'Enabled' : 'Disabled'}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
            disabled={loading}
          >
            Reset to Defaults
          </button>
          <button
            onClick={loadPrivacySettings}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
            disabled={loading}
          >
            Refresh Settings
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Privacy Notice</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Your data is encrypted and stored securely. You can change these settings at any time. 
                When disabled, AI features will use minimal data processing while still providing support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}