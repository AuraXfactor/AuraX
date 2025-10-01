"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion, useReducedMotion } from 'framer-motion';
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TreatmentPlan {
  id?: string;
  userId: string;
  assessmentResults: {
    gad7?: { score: number; severity: string };
    phq9?: { score: number; severity: string };
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  tools: {
    breathing: { frequency: string; patterns: string[] };
    grounding: { frequency: string; techniques: string[] };
    journaling: { prompts: string[]; frequency: string };
    meditation: { duration: string; type: string };
  };
  goals: {
    weekly: string[];
    monthly: string[];
  };
  resources: {
    crisis: string[];
    professional: string[];
    selfHelp: string[];
  };
  createdAt: Date;
}

export default function TreatmentPlanPage() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlan, setShowPlan] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchTreatmentPlan();
  }, [user]);

  const fetchTreatmentPlan = async () => {
    if (!user) return;

    try {
      // Get latest assessment results
      const assessmentQuery = query(
        collection(db, 'assessmentResults'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(2)
      );
      const assessmentSnapshot = await getDocs(assessmentQuery);
      
      const assessmentResults: any = {};
      assessmentSnapshot.forEach(doc => {
        const data = doc.data();
        assessmentResults[data.assessmentType] = {
          score: data.score,
          severity: data.severity
        };
      });

      // Generate personalized treatment plan
      const plan = generateTreatmentPlan(assessmentResults);
      
      // Save treatment plan
      const docRef = await addDoc(collection(db, 'treatmentPlans'), {
        ...plan,
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      setTreatmentPlan({ ...plan, id: docRef.id });
      setShowPlan(true);
    } catch (error) {
      console.error('Error fetching treatment plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTreatmentPlan = (assessmentResults: any): TreatmentPlan => {
    const gad7 = assessmentResults.gad7;
    const phq9 = assessmentResults.phq9;
    
    // Determine primary concerns
    const hasAnxiety = gad7 && gad7.severity !== 'minimal';
    const hasDepression = phq9 && phq9.severity !== 'minimal';
    const isSevere = (gad7 && gad7.severity === 'severe') || (phq9 && phq9.severity === 'severe');

    // Generate recommendations based on assessment results
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    if (isSevere) {
      immediate.push('Seek immediate professional mental health support');
      immediate.push('Consider crisis resources if experiencing thoughts of self-harm');
      immediate.push('Use grounding techniques during acute episodes');
    }

    if (hasAnxiety) {
      immediate.push('Practice 4-7-8 breathing technique daily');
      immediate.push('Use 5-4-3-2-1 grounding when anxious');
      shortTerm.push('Develop anxiety management toolkit');
      shortTerm.push('Practice progressive muscle relaxation');
      longTerm.push('Consider therapy for anxiety management');
      longTerm.push('Develop healthy coping strategies');
    }

    if (hasDepression) {
      immediate.push('Maintain regular sleep schedule');
      immediate.push('Engage in gentle physical activity');
      shortTerm.push('Practice gratitude journaling daily');
      shortTerm.push('Connect with support system');
      longTerm.push('Consider therapy for depression treatment');
      longTerm.push('Develop meaningful activities and goals');
    }

    if (!hasAnxiety && !hasDepression) {
      immediate.push('Continue current self-care practices');
      immediate.push('Maintain regular wellness routines');
      shortTerm.push('Enhance stress management skills');
      longTerm.push('Develop resilience and coping strategies');
    }

    // Generate tool recommendations
    const tools = {
      breathing: {
        frequency: hasAnxiety ? '3-4 times daily' : '1-2 times daily',
        patterns: hasAnxiety ? ['4-7-8', 'Box breathing'] : ['4-7-8', 'Custom patterns']
      },
      grounding: {
        frequency: hasAnxiety ? 'As needed during episodes' : 'Daily practice',
        techniques: hasAnxiety ? ['5-4-3-2-1', 'Body scan'] : ['5-4-3-2-1', 'Mindful observation']
      },
      journaling: {
        prompts: hasDepression ? [
          'What are three things I\'m grateful for today?',
          'What went well today?',
          'What am I looking forward to?'
        ] : [
          'How am I feeling right now?',
          'What am I grateful for?',
          'What can I do to take care of myself today?'
        ],
        frequency: hasDepression ? 'Daily' : '3-4 times weekly'
      },
      meditation: {
        duration: isSevere ? '5-10 minutes' : '10-20 minutes',
        type: hasAnxiety ? 'Mindfulness and body scan' : 'Loving-kindness and mindfulness'
      }
    };

    // Generate goals
    const goals = {
      weekly: [
        'Complete 3 breathing exercises',
        'Practice grounding technique 2 times',
        'Write in journal 3 times',
        'Engage in 10 minutes of meditation'
      ],
      monthly: [
        'Track mood patterns and triggers',
        'Develop new coping strategies',
        'Connect with support system',
        'Evaluate progress and adjust plan'
      ]
    };

    // Generate resources
    const resources = {
      crisis: [
        'National Suicide Prevention Lifeline: 988',
        'Crisis Text Line: Text HOME to 741741',
        'Emergency Services: 911'
      ],
      professional: [
        'Find a therapist through Psychology Today',
        'Contact your primary care physician',
        'Use mental health apps for support'
      ],
      selfHelp: [
        'Practice daily mindfulness',
        'Maintain regular sleep schedule',
        'Engage in physical activity',
        'Connect with supportive people'
      ]
    };

    return {
      userId: user?.uid || '',
      assessmentResults,
      recommendations: { immediate, shortTerm, longTerm },
      tools,
      goals,
      resources,
      createdAt: new Date()
    };
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur motion-fade-in">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-green-400 to-blue-500 text-white animate-pop">📋</div>
          <h1 className="text-2xl font-bold">Treatment Plan requires login</h1>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login" className="px-5 py-2.5 rounded-full border border-white/30 transition pressable">Login</Link>
            <Link href="/signup" className="px-5 py-2.5 rounded-full text-white bg-gradient-to-r from-indigo-500 to-blue-500 transition pressable">Create account</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-green-400 to-blue-500 text-white animate-pulse">🔄</div>
          <p className="text-gray-600 dark:text-gray-300">Generating your personalized treatment plan...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="min-h-screen p-6 md:p-10" initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-extrabold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500 mb-8">
        Your Personalized Treatment Plan
      </h1>

      {treatmentPlan && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Assessment Summary */}
          <div className="p-6 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5">
            <h2 className="text-xl font-bold mb-4">Assessment Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {treatmentPlan.assessmentResults.gad7 && (
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200">Anxiety (GAD-7)</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    Score: {treatmentPlan.assessmentResults.gad7.score} - {treatmentPlan.assessmentResults.gad7.severity}
                  </p>
                </div>
              )}
              {treatmentPlan.assessmentResults.phq9 && (
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <h3 className="font-semibold text-purple-800 dark:text-purple-200">Depression (PHQ-9)</h3>
                  <p className="text-sm text-purple-600 dark:text-purple-300">
                    Score: {treatmentPlan.assessmentResults.phq9.score} - {treatmentPlan.assessmentResults.phq9.severity}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className="p-6 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5">
            <h2 className="text-xl font-bold mb-4">Recommendations</h2>
            <div className="space-y-4">
              {treatmentPlan.recommendations.immediate.length > 0 && (
                <div>
                  <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2">Immediate Actions</h3>
                  <ul className="space-y-1">
                    {treatmentPlan.recommendations.immediate.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div>
                <h3 className="font-semibold text-orange-600 dark:text-orange-400 mb-2">Short-term Goals (1-4 weeks)</h3>
                <ul className="space-y-1">
                  {treatmentPlan.recommendations.shortTerm.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-green-600 dark:text-green-400 mb-2">Long-term Goals (1-3 months)</h3>
                <ul className="space-y-1">
                  {treatmentPlan.recommendations.longTerm.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Tools */}
          <div className="p-6 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5">
            <h2 className="text-xl font-bold mb-4">Recommended Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-cyan-50 dark:bg-cyan-900/20">
                <h3 className="font-semibold text-cyan-800 dark:text-cyan-200 mb-2">Breathing Exercises</h3>
                <p className="text-sm text-cyan-600 dark:text-cyan-300 mb-2">Frequency: {treatmentPlan.tools.breathing.frequency}</p>
                <p className="text-sm text-cyan-600 dark:text-cyan-300">Patterns: {treatmentPlan.tools.breathing.patterns.join(', ')}</p>
              </div>
              
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Grounding Techniques</h3>
                <p className="text-sm text-amber-600 dark:text-amber-300 mb-2">Frequency: {treatmentPlan.tools.grounding.frequency}</p>
                <p className="text-sm text-amber-600 dark:text-amber-300">Techniques: {treatmentPlan.tools.grounding.techniques.join(', ')}</p>
              </div>
              
              <div className="p-4 rounded-lg bg-pink-50 dark:bg-pink-900/20">
                <h3 className="font-semibold text-pink-800 dark:text-pink-200 mb-2">Journaling</h3>
                <p className="text-sm text-pink-600 dark:text-pink-300 mb-2">Frequency: {treatmentPlan.tools.journaling.frequency}</p>
                <p className="text-sm text-pink-600 dark:text-pink-300">Prompts: {treatmentPlan.tools.journaling.prompts.length} available</p>
              </div>
              
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2">Meditation</h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-300 mb-2">Duration: {treatmentPlan.tools.meditation.duration}</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-300">Type: {treatmentPlan.tools.meditation.type}</p>
              </div>
            </div>
          </div>

          {/* Goals */}
          <div className="p-6 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5">
            <h2 className="text-xl font-bold mb-4">Your Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Weekly Goals</h3>
                <ul className="space-y-1">
                  {treatmentPlan.goals.weekly.map((goal, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span className="text-sm">{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-green-600 dark:text-green-400 mb-2">Monthly Goals</h3>
                <ul className="space-y-1">
                  {treatmentPlan.goals.monthly.map((goal, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span className="text-sm">{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="p-6 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5">
            <h2 className="text-xl font-bold mb-4">Resources & Support</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2">Crisis Resources</h3>
                <ul className="space-y-1">
                  {treatmentPlan.resources.crisis.map((resource, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span className="text-sm">{resource}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Professional Support</h3>
                <ul className="space-y-1">
                  {treatmentPlan.resources.professional.map((resource, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span className="text-sm">{resource}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-green-600 dark:text-green-400 mb-2">Self-Help Resources</h3>
                <ul className="space-y-1">
                  {treatmentPlan.resources.selfHelp.map((resource, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span className="text-sm">{resource}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Link 
              href="/toolkit/breathing" 
              className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-lg font-semibold transition hover:opacity-90"
            >
              Start Breathing Exercise
            </Link>
            <Link 
              href="/toolkit/grounding" 
              className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg font-semibold transition hover:opacity-90"
            >
              Try Grounding
            </Link>
            <Link 
              href="/journal" 
              className="px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-lg font-semibold transition hover:opacity-90"
            >
              Start Journaling
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto mt-6 text-center">
        <Link href="/toolkit" className="px-4 py-2 rounded-full border border-white/30 hover:bg-white/10 transition pressable">← Back to Toolkit</Link>
      </div>
    </motion.div>
  );
}