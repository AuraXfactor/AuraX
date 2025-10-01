/**
 * Comprehensive Database Tracking System for Aura Z
 * Tracks effectiveness, efficiency, and user outcomes for mental health interventions
 */

import { collection, addDoc, updateDoc, doc, query, where, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import EthicalFramework from './ethicalFramework';

export interface SessionMetrics {
  sessionId: string;
  userId: string;
  toolType: 'breathing' | 'grounding' | 'meditation' | 'journaling';
  startTime: Date;
  endTime: Date;
  duration: number; // seconds
  effectiveness: number; // 0-10 scale
  helpfulness: number; // 0-10 scale
  reliefLevel: number; // 0-10 scale
  trigger: string;
  followUpResponses: {
    helpfulAspects: string[];
    improvements: string;
    reliefDuration: string;
  };
  anonymized: boolean;
  createdAt: Date;
}

export interface AssessmentMetrics {
  assessmentId: string;
  userId: string;
  assessmentType: 'gad7' | 'phq9';
  score: number;
  severity: string;
  recommendations: string[];
  completedAt: Date;
  followUpScore?: number; // Re-assessment score
  followUpDate?: Date;
  improvement: number; // Score change over time
  anonymized: boolean;
  createdAt: Date;
}

export interface TreatmentPlanMetrics {
  planId: string;
  userId: string;
  assessmentResults: any;
  recommendations: any;
  tools: any;
  goals: any;
  adherence: {
    weeklyGoals: number; // Percentage completed
    monthlyGoals: number; // Percentage completed
    toolUsage: {
      breathing: number; // Sessions per week
      grounding: number; // Sessions per week
      journaling: number; // Sessions per week
      meditation: number; // Sessions per week
    };
  };
  outcomes: {
    moodImprovement: number; // 0-10 scale
    anxietyReduction: number; // 0-10 scale
    depressionReduction: number; // 0-10 scale
    overallSatisfaction: number; // 0-10 scale
  };
  anonymized: boolean;
  createdAt: Date;
}

export interface UserOutcomes {
  userId: string;
  totalSessions: number;
  averageSessionDuration: number;
  mostEffectiveTool: string;
  improvementAreas: string[];
  crisisInterventions: number;
  professionalReferrals: number;
  overallProgress: number; // 0-10 scale
  anonymized: boolean;
  createdAt: Date;
}

export class DatabaseTracking {
  /**
   * Track breathing session metrics
   */
  static async trackBreathingSession(
    userId: string,
    sessionData: {
      startTime: Date;
      endTime: Date;
      pattern: string;
      effectiveness: number;
      helpfulness: number;
      trigger: string;
      helpfulAspects: string[];
      improvements: string;
    }
  ): Promise<string> {
    try {
      const duration = Math.floor((sessionData.endTime.getTime() - sessionData.startTime.getTime()) / 1000);
      
      const metrics: SessionMetrics = {
        sessionId: `breathing_${Date.now()}`,
        userId,
        toolType: 'breathing',
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
        duration,
        effectiveness: sessionData.effectiveness,
        helpfulness: sessionData.helpfulness,
        reliefLevel: sessionData.effectiveness, // Use effectiveness as relief level
        trigger: sessionData.trigger,
        followUpResponses: {
          helpfulAspects: sessionData.helpfulAspects,
          improvements: sessionData.improvements,
          reliefDuration: 'immediate' // Default for breathing
        },
        anonymized: false,
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'sessionMetrics'), {
        ...metrics,
        createdAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error tracking breathing session:', error);
      throw error;
    }
  }

  /**
   * Track grounding session metrics
   */
  static async trackGroundingSession(
    userId: string,
    sessionData: {
      startTime: Date;
      endTime: Date;
      stepsCompleted: any;
      reliefLevel: number;
      trigger: string;
      helpfulAspects: string[];
      improvements: string;
      reliefDuration: string;
    }
  ): Promise<string> {
    try {
      const duration = Math.floor((sessionData.endTime.getTime() - sessionData.startTime.getTime()) / 1000);
      
      const metrics: SessionMetrics = {
        sessionId: `grounding_${Date.now()}`,
        userId,
        toolType: 'grounding',
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
        duration,
        effectiveness: sessionData.reliefLevel,
        helpfulness: sessionData.reliefLevel,
        reliefLevel: sessionData.reliefLevel,
        trigger: sessionData.trigger,
        followUpResponses: {
          helpfulAspects: sessionData.helpfulAspects,
          improvements: sessionData.improvements,
          reliefDuration: sessionData.reliefDuration
        },
        anonymized: false,
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'sessionMetrics'), {
        ...metrics,
        createdAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error tracking grounding session:', error);
      throw error;
    }
  }

  /**
   * Track assessment metrics
   */
  static async trackAssessment(
    userId: string,
    assessmentData: {
      assessmentType: 'gad7' | 'phq9';
      score: number;
      severity: string;
      recommendations: string[];
    }
  ): Promise<string> {
    try {
      const metrics: AssessmentMetrics = {
        assessmentId: `${assessmentData.assessmentType}_${Date.now()}`,
        userId,
        assessmentType: assessmentData.assessmentType,
        score: assessmentData.score,
        severity: assessmentData.severity,
        recommendations: assessmentData.recommendations,
        completedAt: new Date(),
        improvement: 0, // Will be calculated on follow-up
        anonymized: false,
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'assessmentMetrics'), {
        ...metrics,
        createdAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error tracking assessment:', error);
      throw error;
    }
  }

  /**
   * Track treatment plan metrics
   */
  static async trackTreatmentPlan(
    userId: string,
    planData: {
      assessmentResults: any;
      recommendations: any;
      tools: any;
      goals: any;
    }
  ): Promise<string> {
    try {
      const metrics: TreatmentPlanMetrics = {
        planId: `plan_${Date.now()}`,
        userId,
        assessmentResults: planData.assessmentResults,
        recommendations: planData.recommendations,
        tools: planData.tools,
        goals: planData.goals,
        adherence: {
          weeklyGoals: 0, // Will be updated over time
          monthlyGoals: 0, // Will be updated over time
          toolUsage: {
            breathing: 0,
            grounding: 0,
            journaling: 0,
            meditation: 0
          }
        },
        outcomes: {
          moodImprovement: 0,
          anxietyReduction: 0,
          depressionReduction: 0,
          overallSatisfaction: 0
        },
        anonymized: false,
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'treatmentPlanMetrics'), {
        ...metrics,
        createdAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error tracking treatment plan:', error);
      throw error;
    }
  }

  /**
   * Update treatment plan adherence
   */
  static async updateTreatmentPlanAdherence(
    planId: string,
    adherence: {
      weeklyGoals: number;
      monthlyGoals: number;
      toolUsage: {
        breathing: number;
        grounding: number;
        journaling: number;
        meditation: number;
      };
    }
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'treatmentPlanMetrics', planId), {
        'adherence.weeklyGoals': adherence.weeklyGoals,
        'adherence.monthlyGoals': adherence.monthlyGoals,
        'adherence.toolUsage': adherence.toolUsage,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating treatment plan adherence:', error);
      throw error;
    }
  }

  /**
   * Update treatment plan outcomes
   */
  static async updateTreatmentPlanOutcomes(
    planId: string,
    outcomes: {
      moodImprovement: number;
      anxietyReduction: number;
      depressionReduction: number;
      overallSatisfaction: number;
    }
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'treatmentPlanMetrics', planId), {
        'outcomes.moodImprovement': outcomes.moodImprovement,
        'outcomes.anxietyReduction': outcomes.anxietyReduction,
        'outcomes.depressionReduction': outcomes.depressionReduction,
        'outcomes.overallSatisfaction': outcomes.overallSatisfaction,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating treatment plan outcomes:', error);
      throw error;
    }
  }

  /**
   * Calculate user outcomes
   */
  static async calculateUserOutcomes(userId: string): Promise<UserOutcomes> {
    try {
      // Get all sessions for user
      const sessionsQuery = query(
        collection(db, 'sessionMetrics'),
        where('userId', '==', userId)
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      
      // Get all assessments for user
      const assessmentsQuery = query(
        collection(db, 'assessmentMetrics'),
        where('userId', '==', userId)
      );
      const assessmentsSnapshot = await getDocs(assessmentsQuery);
      
      // Get treatment plans for user
      const plansQuery = query(
        collection(db, 'treatmentPlanMetrics'),
        where('userId', '==', userId)
      );
      const plansSnapshot = await getDocs(plansQuery);
      
      const sessions = sessionsSnapshot.docs.map(doc => doc.data());
      const assessments = assessmentsSnapshot.docs.map(doc => doc.data());
      const plans = plansSnapshot.docs.map(doc => doc.data());
      
      // Calculate metrics
      const totalSessions = sessions.length;
      const averageSessionDuration = sessions.reduce((sum, session) => sum + session.duration, 0) / totalSessions || 0;
      
      // Find most effective tool
      const toolEffectiveness = sessions.reduce((acc, session) => {
        const tool = session.toolType;
        if (!acc[tool]) acc[tool] = { total: 0, count: 0 };
        acc[tool].total += session.effectiveness;
        acc[tool].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);
      
      const mostEffectiveTool = Object.entries(toolEffectiveness)
        .map(([tool, data]) => ({ tool, average: data.total / data.count }))
        .sort((a, b) => b.average - a.average)[0]?.tool || 'none';
      
      // Calculate improvement areas
      const improvementAreas = [];
      if (assessments.some(a => a.assessmentType === 'gad7' && a.severity !== 'minimal')) {
        improvementAreas.push('anxiety');
      }
      if (assessments.some(a => a.assessmentType === 'phq9' && a.severity !== 'minimal')) {
        improvementAreas.push('depression');
      }
      
      // Calculate overall progress
      const overallProgress = sessions.reduce((sum, session) => sum + session.effectiveness, 0) / totalSessions || 0;
      
      const outcomes: UserOutcomes = {
        userId,
        totalSessions,
        averageSessionDuration,
        mostEffectiveTool,
        improvementAreas,
        crisisInterventions: 0, // Would be tracked separately
        professionalReferrals: 0, // Would be tracked separately
        overallProgress,
        anonymized: false,
        createdAt: new Date()
      };
      
      return outcomes;
    } catch (error) {
      console.error('Error calculating user outcomes:', error);
      throw error;
    }
  }

  /**
   * Get effectiveness analytics
   */
  static async getEffectivenessAnalytics(): Promise<{
    breathingEffectiveness: number;
    groundingEffectiveness: number;
    averageSessionDuration: number;
    mostCommonTriggers: string[];
    improvementAreas: string[];
  }> {
    try {
      // Get all session metrics
      const sessionsQuery = query(collection(db, 'sessionMetrics'));
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = sessionsSnapshot.docs.map(doc => doc.data());
      
      // Calculate breathing effectiveness
      const breathingSessions = sessions.filter(s => s.toolType === 'breathing');
      const breathingEffectiveness = breathingSessions.reduce((sum, session) => sum + session.effectiveness, 0) / breathingSessions.length || 0;
      
      // Calculate grounding effectiveness
      const groundingSessions = sessions.filter(s => s.toolType === 'grounding');
      const groundingEffectiveness = groundingSessions.reduce((sum, session) => sum + session.effectiveness, 0) / groundingSessions.length || 0;
      
      // Calculate average session duration
      const averageSessionDuration = sessions.reduce((sum, session) => sum + session.duration, 0) / sessions.length || 0;
      
      // Find most common triggers
      const triggerCounts = sessions.reduce((acc, session) => {
        const trigger = session.trigger;
        acc[trigger] = (acc[trigger] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const mostCommonTriggers = Object.entries(triggerCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([trigger]) => trigger);
      
      // Find improvement areas
      const improvementAreas = [...new Set(sessions.flatMap(s => s.followUpResponses.helpfulAspects))];
      
      return {
        breathingEffectiveness,
        groundingEffectiveness,
        averageSessionDuration,
        mostCommonTriggers,
        improvementAreas
      };
    } catch (error) {
      console.error('Error getting effectiveness analytics:', error);
      throw error;
    }
  }

  /**
   * Anonymize data for research
   */
  static async anonymizeDataForResearch(): Promise<void> {
    try {
      // Get all data that needs anonymization
      const sessionsQuery = query(collection(db, 'sessionMetrics'));
      const sessionsSnapshot = await getDocs(sessionsQuery);
      
      const assessmentsQuery = query(collection(db, 'assessmentMetrics'));
      const assessmentsSnapshot = await getDocs(assessmentsQuery);
      
      const plansQuery = query(collection(db, 'treatmentPlanMetrics'));
      const plansSnapshot = await getDocs(plansQuery);
      
      // Anonymize sessions
      for (const docSnapshot of sessionsSnapshot.docs) {
        const data = docSnapshot.data();
        if (!data.anonymized) {
          const anonymizedData = EthicalFramework.anonymizeData(data);
          await updateDoc(doc(db, 'sessionMetrics', docSnapshot.id), {
            ...anonymizedData,
            anonymized: true,
            anonymizedAt: serverTimestamp()
          });
        }
      }
      
      // Anonymize assessments
      for (const docSnapshot of assessmentsSnapshot.docs) {
        const data = docSnapshot.data();
        if (!data.anonymized) {
          const anonymizedData = EthicalFramework.anonymizeData(data);
          await updateDoc(doc(db, 'assessmentMetrics', docSnapshot.id), {
            ...anonymizedData,
            anonymized: true,
            anonymizedAt: serverTimestamp()
          });
        }
      }
      
      // Anonymize treatment plans
      for (const docSnapshot of plansSnapshot.docs) {
        const data = docSnapshot.data();
        if (!data.anonymized) {
          const anonymizedData = EthicalFramework.anonymizeData(data);
          await updateDoc(doc(db, 'treatmentPlanMetrics', docSnapshot.id), {
            ...anonymizedData,
            anonymized: true,
            anonymizedAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Error anonymizing data for research:', error);
      throw error;
    }
  }
}

export default DatabaseTracking;