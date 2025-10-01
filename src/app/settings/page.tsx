'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

interface SettingsData {
  theme?: string;
  notifications?: {
    journal?: boolean;
    therapy?: boolean;
    recovery?: boolean;
    email?: boolean;
  };
  privacy?: {
    profileVisibility?: string;
    journalVisibility?: string;
    biometricEnabled?: boolean;
  };
  journals?: {
    primary?: string;
    secondary?: string[];
    collections?: Array<{
      id: string;
      name: string;
      entryCount: number;
    }>;
  };
}

interface JournalCollection {
  id: string;
  name: string;
  entryCount: number;
  createdAt?: { toDate?: () => Date } | null;
}

const themes = [
  { id: 'light', name: 'Light', preview: 'bg-white text-gray-900' },
  { id: 'dark', name: 'Dark', preview: 'bg-gray-900 text-white' },
  { id: 'auto', name: 'Auto', preview: 'bg-gradient-to-r from-white to-gray-900' },
  { id: 'purple', name: 'Purple Dream', preview: 'bg-gradient-to-r from-purple-500 to-indigo-500' },
  { id: 'ocean', name: 'Ocean Blue', preview: 'bg-gradient-to-r from-cyan-400 to-blue-500' },
  { id: 'sunset', name: 'Sunset', preview: 'bg-gradient-to-r from-orange-400 to-pink-500' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme: currentTheme, setTheme } = useTheme();
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [journalCollections, setJournalCollections] = useState<JournalCollection[]>([]);
  
  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChanging, setPasswordChanging] = useState(false);
  
  // Biometric states
  const [biometricSupported, setBiometricSupported] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadSettings();
    loadJournalCollections();
    checkBiometricSupport();
  }, [user, router]);

  const checkBiometricSupport = () => {
    // Check if WebAuthn is supported
    if (window.PublicKeyCredential) {
      setBiometricSupported(true);
    }
  };

  const loadSettings = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setSettings({
          theme: userData.theme || 'auto',
          notifications: {
            journal: userData.notifications?.journal ?? true,
            therapy: userData.notifications?.therapy ?? true,
            recovery: userData.notifications?.recovery ?? true,
            email: userData.notifications?.email ?? true,
          },
          privacy: {
            profileVisibility: userData.privacy?.profileVisibility || 'private',
            journalVisibility: userData.privacy?.journalVisibility || 'private',
            biometricEnabled: userData.privacy?.biometricEnabled || false,
          },
          journals: {
            primary: userData.journals?.primary || '',
            secondary: userData.journals?.secondary || [],
          }
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJournalCollections = async () => {
    if (!user) return;
    try {
      // For now, we'll create mock collections based on existing journal structure
      // In a real app, you'd have a proper collections system
      const collections: JournalCollection[] = [
        { id: 'default', name: 'Personal Journal', entryCount: 0 },
        { id: 'work', name: 'Work & Career', entryCount: 0 },
        { id: 'health', name: 'Health & Wellness', entryCount: 0 },
        { id: 'relationships', name: 'Relationships', entryCount: 0 },
        { id: 'growth', name: 'Personal Growth', entryCount: 0 },
      ];
      
      setJournalCollections(collections);
      
      // Update settings with collections info
      setSettings(prev => ({
        ...prev,
        journals: {
          ...prev.journals,
          collections
        }
      }));
    } catch (error) {
      console.error('Error loading journal collections:', error);
    }
  };

  const updateSetting = async (path: string, value: string | boolean | string[]) => {
    if (!user) return;
    setSaving(true);
    try {
      const updateData: Record<string, unknown> = { updatedAt: serverTimestamp() };
      
      // Handle nested paths
      if (path.includes('.')) {
        const [parent, child] = path.split('.');
        updateData[`${parent}.${child}`] = value;
      } else {
        updateData[path] = value;
      }
      
      await updateDoc(doc(db, 'users', user.uid), updateData);
      
      // Update local state
      setSettings(prev => {
        const newSettings = { ...prev };
        if (path.includes('.')) {
          const [parent, child] = path.split('.');
          if (!newSettings[parent as keyof SettingsData]) {
            (newSettings as Record<string, unknown>)[parent] = {};
          }
          ((newSettings as Record<string, unknown>)[parent] as Record<string, unknown>)[child] = value;
        } else {
          (newSettings as Record<string, unknown>)[path] = value;
        }
        return newSettings;
      });
      
      // Apply theme immediately using theme context
      if (path === 'theme' && typeof value === 'string') {
        setTheme(value as 'light' | 'dark' | 'auto' | 'purple' | 'ocean' | 'sunset');
      }
    } catch (error) {
      console.error('Error updating setting:', error);
    } finally {
      setSaving(false);
    }
  };


  const handlePasswordChange = async () => {
    if (!user || !user.email) return;
    
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setPasswordChanging(true);
    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      alert('Password updated successfully!');
      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      console.error('Error changing password:', error);
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === 'auth/wrong-password') {
        alert('Current password is incorrect');
      } else {
        alert('Error changing password: ' + (firebaseError.message || 'Unknown error'));
      }
    } finally {
      setPasswordChanging(false);
    }
  };

  const enableBiometric = async () => {
    if (!biometricSupported) {
      alert('Biometric authentication is not supported on this device');
      return;
    }

    try {
      // Create a new credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: {
            name: "AuraX",
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(user?.uid || ''),
            name: user?.email || '',
            displayName: user?.displayName || user?.email || '',
          },
          pubKeyCredParams: [{alg: -7, type: "public-key"}],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000,
          attestation: "direct"
        }
      });

      if (credential) {
        await updateSetting('privacy.biometricEnabled', true);
        alert('Biometric authentication enabled successfully!');
      }
    } catch (error) {
      console.error('Error enabling biometric:', error);
      alert('Failed to enable biometric authentication');
    }
  };

  const setPrimaryJournal = async (collectionId: string) => {
    await updateSetting('journals.primary', collectionId);
  };

  const toggleSecondaryJournal = async (collectionId: string) => {
    const current = settings.journals?.secondary || [];
    const newSecondary = current.includes(collectionId)
      ? current.filter(id => id !== collectionId)
      : [...current, collectionId];
    
    await updateSetting('journals.secondary', newSecondary);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Customize your AuraX experience
          </p>
        </div>

        <div className="space-y-6">
          {/* Theme Settings */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-2xl font-semibold mb-4">🎨 Appearance</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => updateSetting('theme', theme.id)}
                  className={`p-4 rounded-xl border-2 transition ${
                    currentTheme === theme.id
                      ? 'border-purple-500 ring-2 ring-purple-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-full h-12 rounded-lg mb-2 ${theme.preview}`}></div>
                  <p className="font-medium">{theme.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-2xl font-semibold mb-4">🔔 Notifications</h2>
            <div className="space-y-4">
              {[
                { key: 'journal', label: 'Journal Reminders', desc: 'Daily reminders to write in your journal' },
                { key: 'therapy', label: 'Therapy Sessions', desc: 'Notifications about upcoming therapy sessions' },
                { key: 'recovery', label: 'Recovery Check-ins', desc: 'Recovery support and check-in reminders' },
                { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <h3 className="font-medium">{item.label}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications?.[item.key as keyof typeof settings.notifications] || false}
                      onChange={(e) => updateSetting(`notifications.${item.key}`, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

        {/* Privacy Consent Management */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
          <h2 className="text-2xl font-semibold mb-4">🔒 Privacy & Consent Management</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Manage your privacy preferences and consent settings. You can change these anytime.
          </p>

          {/* Ethical Concerns Button */}
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                  ⚠️ Ethical Concerns & Data Rights
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Learn about your data rights, how we protect your privacy, and our ethical AI practices.
                </p>
              </div>
              <button
                onClick={() => {
                  alert(`🔒 PRIVACY & ETHICAL COMMITMENTS

📊 DATA PROTECTION:
• All data is encrypted end-to-end
• We never sell your personal information
• Your mental health data is never shared without explicit consent
• We comply with GDPR, CCPA, and HIPAA standards

🤖 AI ETHICS:
• Our AI never judges or diagnoses
• All AI responses are supportive and non-clinical
• We don't use your data to train AI models
• Human oversight for all AI interactions

🛡️ YOUR RIGHTS:
• Export all your data anytime
• Delete your account and all data
• Opt-out of any data collection
• Request data correction or updates
• File complaints about data handling

📞 CONTACT:
• Privacy Officer: privacy@auraz.app
• Data Protection: dpo@auraz.app
• Ethics Committee: ethics@auraz.app

We're committed to protecting your mental health data with the highest ethical standards.`);
                }}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition text-sm font-medium"
              >
                View Details
              </button>
            </div>
          </div>
            
            <div className="space-y-4">
              {[
                { key: 'dataCollection', label: 'Data Collection', desc: 'Allow us to collect your wellness data to provide personalized insights', icon: '📊' },
                { key: 'analytics', label: 'Analytics', desc: 'Help us improve the app with anonymous usage analytics', icon: '📈' },
                { key: 'personalization', label: 'Personalization', desc: 'Enable personalized recommendations and content', icon: '🎯' },
                { key: 'notifications', label: 'Notifications', desc: 'Receive wellness reminders and motivational messages', icon: '🔔' },
                { key: 'dataSharing', label: 'Data Sharing', desc: 'Share anonymized data for research (optional)', icon: '🤝' }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{item.icon}</div>
                    <div>
                      <h3 className="font-medium">{item.label}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.privacy?.[item.key as keyof typeof settings.privacy])}
                      onChange={(e) => updateSetting(`privacy.${item.key}`, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                ✅ Your Rights
              </h4>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• You can change these settings anytime</li>
                <li>• Your data is encrypted and secure</li>
                <li>• You can export or delete your data</li>
                <li>• We never sell your personal information</li>
              </ul>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-2xl font-semibold mb-4">🔐 Security Settings</h2>
            
            {/* Password Change */}
            <div className="mb-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h3 className="font-medium">Change Password</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Update your account password</p>
                </div>
                <button
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Change Password
                </button>
              </div>
              
              {showPasswordChange && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-4">
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handlePasswordChange}
                      disabled={passwordChanging}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                    >
                      {passwordChanging ? 'Updating...' : 'Update Password'}
                    </button>
                    <button
                      onClick={() => setShowPasswordChange(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Biometric Authentication */}
            <div className="mb-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h3 className="font-medium">Biometric Authentication</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {biometricSupported ? 'Use fingerprint or face unlock' : 'Not supported on this device'}
                  </p>
                </div>
                {biometricSupported && (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.privacy?.biometricEnabled || false}
                      onChange={() => {
                        if (!settings.privacy?.biometricEnabled) {
                          enableBiometric();
                        } else {
                          updateSetting('privacy.biometricEnabled', false);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                )}
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h3 className="font-medium">Profile Visibility</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Who can see your profile</p>
                </div>
                <select
                  value={settings.privacy?.profileVisibility || 'private'}
                  onChange={(e) => updateSetting('privacy.profileVisibility', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="private">Private</option>
                  <option value="friends">Friends Only</option>
                  <option value="public">Public</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h3 className="font-medium">Journal Visibility</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Who can see your journal entries</p>
                </div>
                <select
                  value={settings.privacy?.journalVisibility || 'private'}
                  onChange={(e) => updateSetting('privacy.journalVisibility', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="private">Private</option>
                  <option value="anonymous">Anonymous</option>
                </select>
              </div>
            </div>
          </div>

          {/* Journal Management */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-2xl font-semibold mb-4">📚 Journal Collections</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Organize your journaling experience by selecting your primary journal and additional collections
            </p>
            
            <div className="space-y-6">
              {/* Primary Journal Selection */}
              <div>
                <h3 className="text-lg font-medium mb-3">Primary Journal</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Your main journal where new entries will be saved by default
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {journalCollections.map((collection) => (
                    <button
                      key={collection.id}
                      onClick={() => setPrimaryJournal(collection.id)}
                      className={`p-4 rounded-lg border-2 text-left transition ${
                        settings.journals?.primary === collection.id
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 hover:border-gray-300 bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{collection.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {collection.entryCount} entries
                          </p>
                        </div>
                        {settings.journals?.primary === collection.id && (
                          <span className="text-purple-500 font-bold">✓ Primary</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary Journal Selection */}
              <div>
                <h3 className="text-lg font-medium mb-3">Secondary Journals</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Additional journal collections you want to keep active (you can select multiple)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {journalCollections
                    .filter(collection => collection.id !== settings.journals?.primary)
                    .map((collection) => {
                      const isSelected = settings.journals?.secondary?.includes(collection.id) || false;
                      return (
                        <button
                          key={collection.id}
                          onClick={() => toggleSecondaryJournal(collection.id)}
                          className={`p-4 rounded-lg border-2 text-left transition ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 hover:border-gray-300 bg-gray-50 dark:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{collection.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {collection.entryCount} entries
                              </p>
                            </div>
                            {isSelected && (
                              <span className="text-blue-500 font-bold">✓ Active</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Journal Quick Actions */}
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                  Quick Actions
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-1 bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200 rounded-full text-sm hover:bg-amber-300 dark:hover:bg-amber-600 transition">
                    + Create New Collection
                  </button>
                  <button className="px-3 py-1 bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200 rounded-full text-sm hover:bg-amber-300 dark:hover:bg-amber-600 transition">
                    📥 Import Journal
                  </button>
                  <button className="px-3 py-1 bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200 rounded-full text-sm hover:bg-amber-300 dark:hover:bg-amber-600 transition">
                    📤 Export Data
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Data & Storage */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-6">
            <h2 className="text-2xl font-semibold mb-4">💾 Data & Storage</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h3 className="font-medium">Export Data</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Download all your data in JSON format</p>
                </div>
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
                  Export
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h3 className="font-medium">Clear Cache</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Clear app cache and temporary data</p>
                </div>
                <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition">
                  Clear Cache
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div>
                  <h3 className="font-medium text-red-700 dark:text-red-300">Delete Account</h3>
                  <p className="text-sm text-red-600 dark:text-red-400">Permanently delete your account and all data</p>
                </div>
                <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>

        {saving && (
          <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
            Saving settings...
          </div>
        )}
      </div>
    </div>
  );
}