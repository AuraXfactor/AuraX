"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, useReducedMotion } from 'framer-motion';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import EthicalFramework, { PrivacySettings, EthicalConsent } from '@/lib/ethicalFramework';
import DatabaseTracking from '@/lib/databaseTracking';

export default function PrivacySettingsPage() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(EthicalFramework.getDefaultPrivacySettings());
  const [consentRecord, setConsentRecord] = useState<EthicalConsent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDataExport, setShowDataExport] = useState(false);
  const [userData, setUserData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    loadPrivacySettings();
  }, [user]);

  const loadPrivacySettings = async () => {
    if (!user) return;

    try {
      // Load existing consent record
      const consentQuery = query(
        collection(db, 'privacyConsent'),
        where('userId', '==', user.uid),
        where('version', '==', EthicalFramework.getDefaultPrivacySettings().dataCollection ? '1.0' : '1.0')
      );
      const consentSnapshot = await getDocs(consentQuery);
      
      if (!consentSnapshot.empty) {
        const consentData = consentSnapshot.docs[0].data();
        setConsentRecord(consentData as EthicalConsent);
        setPrivacySettings({
          dataCollection: consentData.dataCollection,
          researchParticipation: consentData.researchParticipation,
          dataSharing: consentData.dataSharing,
          anonymization: consentData.anonymization,
          locationTracking: false, // Default
          analytics: false // Default
        });
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePrivacySettings = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const consent = EthicalFramework.createConsentRecord(privacySettings);
      
      // Save consent record
      await addDoc(collection(db, 'privacyConsent'), {
        ...consent,
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      setConsentRecord(consent);
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const exportUserData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get all user data
      const sessionsQuery = query(
        collection(db, 'sessionMetrics'),
        where('userId', '==', user.uid)
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      
      const assessmentsQuery = query(
        collection(db, 'assessmentMetrics'),
        where('userId', '==', user.uid)
      );
      const assessmentsSnapshot = await getDocs(assessmentsQuery);
      
      const plansQuery = query(
        collection(db, 'treatmentPlanMetrics'),
        where('userId', '==', user.uid)
      );
      const plansSnapshot = await getDocs(plansQuery);
      
      const allData = [
        ...sessionsSnapshot.docs.map(doc => ({ type: 'session', ...doc.data() })),
        ...assessmentsSnapshot.docs.map(doc => ({ type: 'assessment', ...doc.data() })),
        ...plansSnapshot.docs.map(doc => ({ type: 'treatment_plan', ...doc.data() }))
      ];
      
      setUserData(allData);
      setShowDataExport(true);
    } catch (error) {
      console.error('Error exporting user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadDataExport = () => {
    const exportData = EthicalFramework.createDataExport(userData);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura-z-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur motion-fade-in">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-blue-400 to-purple-500 text-white animate-pop">🔒</div>
          <h1 className="text-2xl font-bold">Privacy Settings requires login</h1>
          <p className="text-gray-600 dark:text-gray-300">Sign in to manage your privacy and data settings.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-blue-400 to-purple-500 text-white animate-pulse">🔄</div>
          <p className="text-gray-600 dark:text-gray-300">Loading privacy settings...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="min-h-screen p-6 md:p-10" initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-extrabold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-8">
        Privacy & Data Settings
      </h1>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Privacy Notice */}
        <div className="p-6 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5">
          <h2 className="text-xl font-bold mb-4">Privacy & Ethics Notice</h2>
          <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
            {EthicalFramework.getPrivacyNotice()}
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="p-6 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5">
          <h2 className="text-xl font-bold mb-4">Your Privacy Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Data Collection</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Required for app functionality</p>
              </div>
              <input
                type="checkbox"
                checked={privacySettings.dataCollection}
                disabled
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Research Participation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Help improve mental health tools (anonymized)</p>
              </div>
              <input
                type="checkbox"
                checked={privacySettings.researchParticipation}
                onChange={(e) => setPrivacySettings({...privacySettings, researchParticipation: e.target.checked})}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Data Sharing</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Share anonymized data for research</p>
              </div>
              <input
                type="checkbox"
                checked={privacySettings.dataSharing}
                onChange={(e) => setPrivacySettings({...privacySettings, dataSharing: e.target.checked})}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Anonymization</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Remove personal identifiers from data</p>
              </div>
              <input
                type="checkbox"
                checked={privacySettings.anonymization}
                onChange={(e) => setPrivacySettings({...privacySettings, anonymization: e.target.checked})}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Location Tracking</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Track location for personalized resources</p>
              </div>
              <input
                type="checkbox"
                checked={privacySettings.locationTracking}
                onChange={(e) => setPrivacySettings({...privacySettings, locationTracking: e.target.checked})}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Analytics</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Help improve app performance</p>
              </div>
              <input
                type="checkbox"
                checked={privacySettings.analytics}
                onChange={(e) => setPrivacySettings({...privacySettings, analytics: e.target.checked})}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={savePrivacySettings}
            disabled={saving}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-400 to-purple-500 text-white rounded-lg font-semibold transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Data Management */}
        <div className="p-6 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5">
          <h2 className="text-xl font-bold mb-4">Data Management</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Export Your Data</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Download all your data in JSON format</p>
              </div>
              <button
                onClick={exportUserData}
                className="px-4 py-2 bg-green-500 text-white rounded-lg transition hover:opacity-90"
              >
                Export Data
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Delete Your Data</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Permanently delete all your data</p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
                    // Implement data deletion
                    alert('Data deletion feature coming soon');
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg transition hover:opacity-90"
              >
                Delete Data
              </button>
            </div>
          </div>
        </div>

        {/* Crisis Resources */}
        <div className="p-6 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5">
          <h2 className="text-xl font-bold mb-4">Crisis Resources</h2>
          <div className="space-y-2">
            {EthicalFramework.getCrisisResources().map((resource, index) => (
              <div key={index} className="text-sm text-gray-600 dark:text-gray-300">
                {resource}
              </div>
            ))}
          </div>
        </div>

        {/* Data Export Modal */}
        {showDataExport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-bold">Data Export</h2>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Your data has been prepared for export. This includes all your sessions, assessments, and treatment plans.
                </p>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-semibold mb-2">Export Summary:</h3>
                  <ul className="text-sm space-y-1">
                    <li>Total records: {userData.length}</li>
                    <li>Sessions: {userData.filter(d => d.type === 'session').length}</li>
                    <li>Assessments: {userData.filter(d => d.type === 'assessment').length}</li>
                    <li>Treatment Plans: {userData.filter(d => d.type === 'treatment_plan').length}</li>
                  </ul>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={downloadDataExport}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg transition hover:opacity-90"
                  >
                    Download JSON
                  </button>
                  <button
                    onClick={() => setShowDataExport(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}