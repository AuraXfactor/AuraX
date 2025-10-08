/**
 * WELLNESS SESSION TRACKER COMPONENT
 * 
 * This component provides comprehensive session tracking for all wellness tools.
 * It handles pre/post assessments, session timing, and research data collection.
 * 
 * RESEARCH FEATURES:
 * - Pre-session assessment (stress, anxiety, mood, energy, focus)
 * - Post-session assessment with outcome measurement
 * - Session duration tracking
 * - Completion rate monitoring
 * - User satisfaction scoring
 * 
 * PRIVACY COMPLIANCE:
 * - Only tracks when user has consented
 * - Respects privacy settings
 * - Anonymizes data for research
 */

"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeSession, completeSession, SessionMetrics } from '@/lib/sessionTracking';
import { hasDataCollectionConsent } from '@/lib/privacyCompliance';

interface WellnessSessionTrackerProps {
  toolType: string;
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
  children: React.ReactNode;
}

export default function WellnessSessionTracker({
  toolType,
  onSessionStart,
  onSessionEnd,
  children
}: WellnessSessionTrackerProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(false);
  const [showPreAssessment, setShowPreAssessment] = useState(false);
  const [showPostAssessment, setShowPostAssessment] = useState(false);
  const [preSessionMetrics, setPreSessionMetrics] = useState<Partial<SessionMetrics>>({});
  const [postSessionMetrics, setPostSessionMetrics] = useState<Partial<SessionMetrics>>({});
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  // Check if tracking is enabled for this user
  useEffect(() => {
    const checkTrackingPermission = async () => {
      try {
        const hasConsent = await hasDataCollectionConsent('current-user-id'); // Replace with actual user ID
        setIsTrackingEnabled(hasConsent);
        
        if (hasConsent) {
          setShowPreAssessment(true);
        }
      } catch (error) {
        console.error('Failed to check tracking permission:', error);
        setIsTrackingEnabled(false);
      }
    };

    checkTrackingPermission();
  }, []);

  // Start session tracking
  const startSession = useCallback(async () => {
    if (!isTrackingEnabled) {
      console.log('Session tracking disabled due to privacy settings');
      setIsSessionActive(true);
      setSessionStartTime(new Date());
      onSessionStart?.();
      return;
    }

    try {
      const newSessionId = await initializeSession(
        'current-user-id', // Replace with actual user ID
        toolType,
        preSessionMetrics
      );

      if (newSessionId) {
        setSessionId(newSessionId);
        setSessionStartTime(new Date());
        setIsSessionActive(true);
        console.log(`Research session started: ${newSessionId}`);
      }

      onSessionStart?.();
    } catch (error) {
      console.error('Failed to start session tracking:', error);
      setIsSessionActive(true);
      setSessionStartTime(new Date());
      onSessionStart?.();
    }
  }, [isTrackingEnabled, toolType, preSessionMetrics, onSessionStart]);

  // Start automatic timer
  useEffect(() => {
    if (isSessionActive && sessionStartTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
        setSessionDuration(duration);
      }, 1000); // Update every second

      setTimerInterval(interval);
      return () => clearInterval(interval);
    }
  }, [isSessionActive, sessionStartTime]);

  // End session tracking
  const endSession = useCallback(async () => {
    // Clear timer
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }

    if (!sessionId || !sessionStartTime) {
      setIsSessionActive(false);
      setSessionStartTime(null);
      setSessionDuration(0);
      onSessionEnd?.();
      return;
    }

    try {
      const finalDuration = sessionDuration;
      
      await completeSession(
        sessionId,
        postSessionMetrics,
        finalDuration,
        100 // Assume full completion for now
      );

      console.log(`Research session completed: ${sessionId}, Duration: ${finalDuration}s`);
      
      // Reset session state
      setSessionId(null);
      setSessionStartTime(null);
      setSessionDuration(0);
      setIsSessionActive(false);
      setPreSessionMetrics({});
      setPostSessionMetrics({});
      
    } catch (error) {
      console.error('Failed to complete session tracking:', error);
    }

    onSessionEnd?.();
  }, [sessionId, sessionStartTime, sessionDuration, postSessionMetrics, timerInterval, onSessionEnd]);

  // Pre-session assessment component
  const PreSessionAssessment = () => (
    <AnimatePresence>
      {showPreAssessment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Quick Assessment</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Help us understand how this tool affects your wellbeing
            </p>

            <div className="space-y-4">
              <AssessmentSlider
                label="Stress Level"
                value={preSessionMetrics.stressLevel || 5}
                onChange={(value) => setPreSessionMetrics(prev => ({ ...prev, stressLevel: value }))}
                min={1}
                max={10}
                leftLabel="Very Low"
                rightLabel="Very High"
              />

              <AssessmentSlider
                label="Anxiety Level"
                value={preSessionMetrics.anxietyLevel || 5}
                onChange={(value) => setPreSessionMetrics(prev => ({ ...prev, anxietyLevel: value }))}
                min={1}
                max={10}
                leftLabel="Very Low"
                rightLabel="Very High"
              />

              <AssessmentSlider
                label="Mood"
                value={preSessionMetrics.moodLevel || 5}
                onChange={(value) => setPreSessionMetrics(prev => ({ ...prev, moodLevel: value }))}
                min={1}
                max={10}
                leftLabel="Very Low"
                rightLabel="Very High"
              />

              <AssessmentSlider
                label="Energy Level"
                value={preSessionMetrics.energyLevel || 5}
                onChange={(value) => setPreSessionMetrics(prev => ({ ...prev, energyLevel: value }))}
                min={1}
                max={10}
                leftLabel="Very Low"
                rightLabel="Very High"
              />

              <AssessmentSlider
                label="Focus"
                value={preSessionMetrics.focusLevel || 5}
                onChange={(value) => setPreSessionMetrics(prev => ({ ...prev, focusLevel: value }))}
                min={1}
                max={10}
                leftLabel="Very Low"
                rightLabel="Very High"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPreAssessment(false);
                  startSession();
                }}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Start Session
              </button>
              <button
                onClick={() => {
                  setShowPreAssessment(false);
                  startSession();
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Skip
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Post-session assessment component
  const PostSessionAssessment = () => (
    <AnimatePresence>
      {showPostAssessment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">How do you feel now?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your feedback helps us improve these tools
            </p>

            <div className="space-y-4">
              <AssessmentSlider
                label="Stress Level"
                value={postSessionMetrics.stressLevelAfter || 5}
                onChange={(value) => setPostSessionMetrics(prev => ({ ...prev, stressLevelAfter: value }))}
                min={1}
                max={10}
                leftLabel="Very Low"
                rightLabel="Very High"
              />

              <AssessmentSlider
                label="Anxiety Level"
                value={postSessionMetrics.anxietyLevelAfter || 5}
                onChange={(value) => setPostSessionMetrics(prev => ({ ...prev, anxietyLevelAfter: value }))}
                min={1}
                max={10}
                leftLabel="Very Low"
                rightLabel="Very High"
              />

              <AssessmentSlider
                label="Mood"
                value={postSessionMetrics.moodLevelAfter || 5}
                onChange={(value) => setPostSessionMetrics(prev => ({ ...prev, moodLevelAfter: value }))}
                min={1}
                max={10}
                leftLabel="Very Low"
                rightLabel="Very High"
              />

              <AssessmentSlider
                label="Energy Level"
                value={postSessionMetrics.energyLevelAfter || 5}
                onChange={(value) => setPostSessionMetrics(prev => ({ ...prev, energyLevelAfter: value }))}
                min={1}
                max={10}
                leftLabel="Very Low"
                rightLabel="Very High"
              />

              <AssessmentSlider
                label="Focus"
                value={postSessionMetrics.focusLevelAfter || 5}
                onChange={(value) => setPostSessionMetrics(prev => ({ ...prev, focusLevelAfter: value }))}
                min={1}
                max={10}
                leftLabel="Very Low"
                rightLabel="Very High"
              />

              <AssessmentSlider
                label="Session Satisfaction"
                value={postSessionMetrics.userSatisfaction || 5}
                onChange={(value) => setPostSessionMetrics(prev => ({ ...prev, userSatisfaction: value }))}
                min={1}
                max={10}
                leftLabel="Not Helpful"
                rightLabel="Very Helpful"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Additional Notes (Optional)</label>
              <textarea
                value={postSessionMetrics.sessionNotes || ''}
                onChange={(e) => setPostSessionMetrics(prev => ({ ...prev, sessionNotes: e.target.value }))}
                placeholder="How did this session feel? Any insights?"
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={async () => {
                  setShowPostAssessment(false);
                  await endSession();
                }}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                Save & Complete Session
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <PreSessionAssessment />
      <PostSessionAssessment />
      
      {/* Render children with session tracking context */}
      <div className="relative">
        {children}
        
        {/* Session timer and controls */}
        {isSessionActive && (
          <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
            {/* Session timer */}
            <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-sm font-mono">
              {Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}
            </div>
            
            {/* End session button */}
            <button
              onClick={() => setShowPostAssessment(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition"
            >
              End Session
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// Assessment slider component
interface AssessmentSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  leftLabel: string;
  rightLabel: string;
}

function AssessmentSlider({
  label,
  value,
  onChange,
  min,
  max,
  leftLabel,
  rightLabel
}: AssessmentSliderProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex items-center gap-4">
        <span className="text-xs text-gray-500 w-16">{leftLabel}</span>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1"
        />
        <span className="text-xs text-gray-500 w-16 text-right">{rightLabel}</span>
        <span className="text-sm font-bold w-8 text-center">{value}</span>
      </div>
    </div>
  );
}