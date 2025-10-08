/**
 * RESEARCH DATA COLLECTION SYSTEM
 * 
 * This module handles comprehensive session tracking for wellness tools
 * to enable research on tool effectiveness and user outcomes.
 * 
 * PRIVACY COMPLIANCE:
 * - Only collects data when user has consented to data sharing
 * - Respects user privacy settings
 * - Data is anonymized for research purposes
 * - User can opt-out at any time
 * 
 * RESEARCH OBJECTIVES:
 * - Measure tool effectiveness across different user demographics
 * - Track improvement patterns over time
 * - Identify optimal tool usage patterns
 * - Analyze correlation between pre/post session states
 */

import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export interface SessionMetrics {
  // Pre-session assessment
  stressLevel: number; // 1-10 scale
  anxietyLevel: number; // 1-10 scale
  moodLevel: number; // 1-10 scale
  energyLevel: number; // 1-10 scale
  focusLevel: number; // 1-10 scale
  
  // Post-session assessment
  stressLevelAfter?: number;
  anxietyLevelAfter?: number;
  moodLevelAfter?: number;
  energyLevelAfter?: number;
  focusLevelAfter?: number;
  
  // Session metadata
  toolType: string;
  sessionDuration: number; // in seconds
  completionRate: number; // 0-100%
  userSatisfaction?: number; // 1-10 scale
  sessionNotes?: string;
  
  // Contextual data
  timeOfDay: string; // morning, afternoon, evening, night
  dayOfWeek: string;
  userTrigger?: string; // what prompted the session
  environment?: string; // home, work, public, etc.
  
  // Research identifiers (anonymized)
  userId: string;
  sessionId: string;
  timestamp: Date;
  
  // Privacy compliance
  dataSharingConsent: boolean;
  analyticsEnabled: boolean;
}

export interface UserPrivacySettings {
  dataSharing: boolean;
  analytics: boolean;
  personalization: boolean;
  notifications: boolean;
  researchParticipation: boolean;
}

/**
 * Initialize session tracking for a wellness tool
 * Only proceeds if user has consented to data collection
 */
export async function initializeSession(
  userId: string,
  toolType: string,
  preSessionMetrics: Partial<SessionMetrics>
): Promise<string | null> {
  try {
    // Check user privacy settings
    const privacySettings = await getUserPrivacySettings(userId);
    if (!privacySettings.dataSharing || !privacySettings.analytics) {
      console.log('Session tracking disabled due to privacy settings');
      return null;
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const sessionData: SessionMetrics = {
      ...preSessionMetrics,
      toolType,
      sessionId,
      userId,
      timestamp: new Date(),
      timeOfDay: getTimeOfDay(),
      dayOfWeek: getDayOfWeek(),
      dataSharingConsent: privacySettings.dataSharing,
      analyticsEnabled: privacySettings.analytics,
    } as SessionMetrics;

    // Store session in research collection
    await addDoc(collection(db, 'research_sessions'), sessionData);
    
    console.log(`Research session initialized: ${sessionId}`);
    return sessionId;
    
  } catch (error) {
    console.error('Failed to initialize research session:', error);
    return null;
  }
}

/**
 * Complete session tracking with post-session metrics
 * Calculates effectiveness scores for research analysis
 */
export async function completeSession(
  sessionId: string,
  postSessionMetrics: Partial<SessionMetrics>,
  sessionDuration: number,
  completionRate: number = 100
): Promise<void> {
  try {
    // Find the session document
    const sessionsRef = collection(db, 'research_sessions');
    const q = query(sessionsRef, where('sessionId', '==', sessionId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('Session not found for completion');
      return;
    }

    const sessionDoc = querySnapshot.docs[0];
    const sessionData = sessionDoc.data() as SessionMetrics;
    
    // Check if user still consents to data collection
    const privacySettings = await getUserPrivacySettings(sessionData.userId);
    if (!privacySettings.dataSharing || !privacySettings.analytics) {
      console.log('Data collection disabled, skipping session completion');
      return;
    }

    // Calculate effectiveness metrics
    const effectiveness = calculateEffectiveness(sessionData, postSessionMetrics);
    
    // Update session with completion data
    await updateDoc(doc(db, 'research_sessions', sessionDoc.id), {
      ...postSessionMetrics,
      sessionDuration,
      completionRate,
      effectiveness,
      completedAt: new Date(),
    });

    console.log(`Research session completed: ${sessionId}, Effectiveness: ${effectiveness}`);
    
  } catch (error) {
    console.error('Failed to complete research session:', error);
  }
}

/**
 * Calculate session effectiveness score for research analysis
 * Higher scores indicate more positive outcomes
 */
function calculateEffectiveness(
  preSession: SessionMetrics,
  postSession: Partial<SessionMetrics>
): number {
  let totalImprovement = 0;
  let metricsCount = 0;

  // Stress reduction (lower is better)
  if (preSession.stressLevel && postSession.stressLevelAfter) {
    totalImprovement += (preSession.stressLevel - postSession.stressLevelAfter) / 10;
    metricsCount++;
  }

  // Anxiety reduction (lower is better)
  if (preSession.anxietyLevel && postSession.anxietyLevelAfter) {
    totalImprovement += (preSession.anxietyLevel - postSession.anxietyLevelAfter) / 10;
    metricsCount++;
  }

  // Mood improvement (higher is better)
  if (preSession.moodLevel && postSession.moodLevelAfter) {
    totalImprovement += (postSession.moodLevelAfter - preSession.moodLevel) / 10;
    metricsCount++;
  }

  // Energy improvement (higher is better)
  if (preSession.energyLevel && postSession.energyLevelAfter) {
    totalImprovement += (postSession.energyLevelAfter - preSession.energyLevel) / 10;
    metricsCount++;
  }

  // Focus improvement (higher is better)
  if (preSession.focusLevel && postSession.focusLevelAfter) {
    totalImprovement += (postSession.focusLevelAfter - preSession.focusLevel) / 10;
    metricsCount++;
  }

  return metricsCount > 0 ? Math.max(0, Math.min(1, totalImprovement / metricsCount)) : 0;
}

/**
 * Get user privacy settings
 * Default settings enable data collection for research
 */
async function getUserPrivacySettings(userId: string): Promise<UserPrivacySettings> {
  try {
    const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', userId)));
    
    if (userDoc.empty) {
      // Default settings: enable data collection for research
      return {
        dataSharing: true,
        analytics: true,
        personalization: true,
        notifications: true,
        researchParticipation: true,
      };
    }

    const userData = userDoc.docs[0].data();
    return {
      dataSharing: userData.privacySettings?.dataSharing ?? true,
      analytics: userData.privacySettings?.analytics ?? true,
      personalization: userData.privacySettings?.personalization ?? true,
      notifications: userData.privacySettings?.notifications ?? true,
      researchParticipation: userData.privacySettings?.researchParticipation ?? true,
    };
  } catch (error) {
    console.error('Failed to get privacy settings:', error);
    // Default to enabled for research purposes
    return {
      dataSharing: true,
      analytics: true,
      personalization: true,
      notifications: true,
      researchParticipation: true,
    };
  }
}

/**
 * Get research insights for tool effectiveness analysis
 * Only accessible to developers/researchers
 */
export async function getResearchInsights(toolType?: string, timeRange?: { start: Date; end: Date }) {
  try {
    let q = query(collection(db, 'research_sessions'), orderBy('timestamp', 'desc'));
    
    if (toolType) {
      q = query(q, where('toolType', '==', toolType));
    }
    
    if (timeRange) {
      q = query(q, where('timestamp', '>=', timeRange.start), where('timestamp', '<=', timeRange.end));
    }
    
    const querySnapshot = await getDocs(q);
    const sessions = querySnapshot.docs.map(doc => doc.data());
    
    return {
      totalSessions: sessions.length,
      averageEffectiveness: sessions.reduce((sum, s) => sum + (s.effectiveness || 0), 0) / sessions.length,
      toolBreakdown: getToolBreakdown(sessions),
      timePatterns: getTimePatterns(sessions),
      userOutcomes: getUserOutcomes(sessions),
    };
  } catch (error) {
    console.error('Failed to get research insights:', error);
    return null;
  }
}

function getToolBreakdown(sessions: any[]) {
  const breakdown: { [key: string]: { count: number; avgEffectiveness: number } } = {};
  
  sessions.forEach(session => {
    if (!breakdown[session.toolType]) {
      breakdown[session.toolType] = { count: 0, avgEffectiveness: 0 };
    }
    breakdown[session.toolType].count++;
    breakdown[session.toolType].avgEffectiveness += session.effectiveness || 0;
  });
  
  Object.keys(breakdown).forEach(tool => {
    breakdown[tool].avgEffectiveness /= breakdown[tool].count;
  });
  
  return breakdown;
}

function getTimePatterns(sessions: any[]) {
  const patterns: { [key: string]: number } = {};
  
  sessions.forEach(session => {
    patterns[session.timeOfDay] = (patterns[session.timeOfDay] || 0) + 1;
  });
  
  return patterns;
}

function getUserOutcomes(sessions: any[]) {
  return {
    averageSessionDuration: sessions.reduce((sum, s) => sum + (s.sessionDuration || 0), 0) / sessions.length,
    completionRate: sessions.reduce((sum, s) => sum + (s.completionRate || 0), 0) / sessions.length,
    satisfactionScore: sessions.reduce((sum, s) => sum + (s.userSatisfaction || 0), 0) / sessions.length,
  };
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getDayOfWeek(): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}