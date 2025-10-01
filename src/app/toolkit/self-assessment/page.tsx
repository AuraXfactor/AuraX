"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AssessmentResult {
  id?: string;
  assessmentType: string;
  score: number;
  severity: 'minimal' | 'mild' | 'moderate' | 'severe';
  recommendations: string[];
  completedAt: Date;
  userId: string;
}

interface AssessmentQuestion {
  id: string;
  text: string;
  options: { value: number; label: string }[];
}

const GAD7_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'gad1',
    text: 'Feeling nervous, anxious, or on edge',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' }
    ]
  },
  {
    id: 'gad2',
    text: 'Not being able to stop or control worrying',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' }
    ]
  },
  {
    id: 'gad3',
    text: 'Worrying too much about different things',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' }
    ]
  },
  {
    id: 'gad4',
    text: 'Trouble relaxing',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' }
    ]
  },
  {
    id: 'gad5',
    text: 'Being so restless that it is hard to sit still',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' }
    ]
  },
  {
    id: 'gad6',
    text: 'Becoming easily annoyed or irritable',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' }
    ]
  },
  {
    id: 'gad7',
    text: 'Feeling afraid as if something awful might happen',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' }
    ]
  }
];

const PHQ9_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'phq1',
    text: 'Little interest or pleasure in doing things',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' }
    ]
  },
  {
    id: 'phq2',
    text: 'Feeling down, depressed, or hopeless',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' }
    ]
  },
  {
    id: 'phq3',
    text: 'Trouble falling or staying asleep, or sleeping too much',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' }
    ]
  },
  {
    id: 'phq4',
    text: 'Feeling tired or having little energy',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' }
    ]
  },
  {
    id: 'phq5',
    text: 'Poor appetite or overeating',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' }
    ]
  },
  {
    id: 'phq6',
    text: 'Feeling bad about yourself or that you are a failure',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' }
    ]
  },
  {
    id: 'phq7',
    text: 'Trouble concentrating on things',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' }
    ]
  },
  {
    id: 'phq8',
    text: 'Moving or speaking so slowly that other people could have noticed',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' }
    ]
  },
  {
    id: 'phq9',
    text: 'Thoughts that you would be better off dead or of hurting yourself',
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' }
    ]
  }
];

const PERSONALITY_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'pers1',
    text: 'I enjoy meeting new people and making friends',
    options: [
      { value: 1, label: 'Strongly Disagree' },
      { value: 2, label: 'Disagree' },
      { value: 3, label: 'Neutral' },
      { value: 4, label: 'Agree' },
      { value: 5, label: 'Strongly Agree' }
    ]
  },
  {
    id: 'pers2',
    text: 'I prefer to work alone rather than in groups',
    options: [
      { value: 1, label: 'Strongly Disagree' },
      { value: 2, label: 'Disagree' },
      { value: 3, label: 'Neutral' },
      { value: 4, label: 'Agree' },
      { value: 5, label: 'Strongly Agree' }
    ]
  },
  {
    id: 'pers3',
    text: 'I am organized and like to plan things in advance',
    options: [
      { value: 1, label: 'Strongly Disagree' },
      { value: 2, label: 'Disagree' },
      { value: 3, label: 'Neutral' },
      { value: 4, label: 'Agree' },
      { value: 5, label: 'Strongly Agree' }
    ]
  },
  {
    id: 'pers4',
    text: 'I am sensitive to criticism and rejection',
    options: [
      { value: 1, label: 'Strongly Disagree' },
      { value: 2, label: 'Disagree' },
      { value: 3, label: 'Neutral' },
      { value: 4, label: 'Agree' },
      { value: 5, label: 'Strongly Agree' }
    ]
  },
  {
    id: 'pers5',
    text: 'I enjoy trying new experiences and activities',
    options: [
      { value: 1, label: 'Strongly Disagree' },
      { value: 2, label: 'Disagree' },
      { value: 3, label: 'Neutral' },
      { value: 4, label: 'Agree' },
      { value: 5, label: 'Strongly Agree' }
    ]
  }
];

export default function SelfAssessmentPage() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [currentAssessment, setCurrentAssessment] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  const getCurrentQuestions = () => {
    if (currentAssessment === 'gad7') return GAD7_QUESTIONS;
    if (currentAssessment === 'phq9') return PHQ9_QUESTIONS;
    if (currentAssessment === 'personality') return PERSONALITY_QUESTIONS;
    return [];
  };

  const calculateScore = () => {
    const questions = getCurrentQuestions();
    return questions.reduce((total, question) => total + (answers[question.id] || 0), 0);
  };

  const getSeverity = (score: number, type: string) => {
    if (type === 'gad7') {
      if (score <= 4) return 'minimal';
      if (score <= 9) return 'mild';
      if (score <= 14) return 'moderate';
      return 'severe';
    }
    if (type === 'phq9') {
      if (score <= 4) return 'minimal';
      if (score <= 9) return 'mild';
      if (score <= 14) return 'moderate';
      if (score <= 19) return 'moderately severe';
      return 'severe';
    }
    return 'minimal';
  };

  const getRecommendations = (severity: string, type: string) => {
    const recommendations: string[] = [];
    
    if (severity === 'minimal') {
      recommendations.push('Continue current self-care practices');
      recommendations.push('Regular exercise and healthy sleep habits');
      recommendations.push('Mindfulness and stress management techniques');
    } else if (severity === 'mild') {
      recommendations.push('Enhanced self-care and stress management');
      recommendations.push('Consider therapy or counseling');
      recommendations.push('Regular mood tracking and journaling');
    } else if (severity === 'moderate') {
      recommendations.push('Professional mental health support recommended');
      recommendations.push('Consider therapy and/or medication evaluation');
      recommendations.push('Regular monitoring and support system');
    } else {
      recommendations.push('Immediate professional mental health support');
      recommendations.push('Consider crisis resources if needed');
      recommendations.push('Regular therapy and potential medication evaluation');
    }

    if (type === 'phq9' && severity !== 'minimal') {
      recommendations.push('Safety planning and crisis resources');
    }

    return recommendations;
  };

  const startAssessment = (type: string) => {
    setCurrentAssessment(type);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setShowIntro(false);
  };

  const nextQuestion = () => {
    const questions = getCurrentQuestions();
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      completeAssessment();
    }
  };

  const completeAssessment = async () => {
    if (!user || !currentAssessment) return;

    const score = calculateScore();
    const severity = getSeverity(score, currentAssessment);
    const recommendations = getRecommendations(severity, currentAssessment);

    const result: AssessmentResult = {
      assessmentType: currentAssessment,
      score,
      severity: severity as 'minimal' | 'mild' | 'moderate' | 'severe',
      recommendations,
      completedAt: new Date(),
      userId: user.uid
    };

    try {
      const docRef = await addDoc(collection(db, 'assessmentResults'), {
        ...result,
        answers,
        createdAt: serverTimestamp()
      });
      setAssessmentResult({ ...result, id: docRef.id });
    } catch (error) {
      console.error('Error saving assessment:', error);
    }

    setShowResults(true);
  };

  const resetAssessment = () => {
    setCurrentAssessment(null);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setAssessmentResult(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur motion-fade-in">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-purple-400 to-pink-500 text-white animate-pop">📋</div>
          <h1 className="text-2xl font-bold">Self-Assessment requires login</h1>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login" className="px-5 py-2.5 rounded-full border border-white/30 transition pressable">Login</Link>
            <Link href="/signup" className="px-5 py-2.5 rounded-full text-white bg-gradient-to-r from-indigo-500 to-blue-500 transition pressable">Create account</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="min-h-screen p-6 md:p-10" initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-extrabold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 mb-8">
        Mental Health Self-Assessment
      </h1>

      {/* Introduction Modal */}
      <AnimatePresence>
        {showIntro && (
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-xl font-bold text-center">Mental Health Screening Tools</h2>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <p><strong>About these assessments:</strong></p>
                <p>These are standardized screening tools used by mental health professionals to assess common mental health conditions. They are based on DSM-5 criteria and published research.</p>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p><strong>Important:</strong> These assessments are for screening purposes only and do not replace professional diagnosis. If you're experiencing severe symptoms or thoughts of self-harm, please seek immediate professional help.</p>
                </div>

                <div className="space-y-2">
                  <p><strong>Available Assessments:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>GAD-7:</strong> Generalized Anxiety Disorder screening (7 questions)</li>
                    <li><strong>PHQ-9:</strong> Depression screening (9 questions)</li>
                  </ul>
                </div>

                <p><strong>Sources:</strong> Spitzer et al. (2006), Kroenke et al. (2001), DSM-5 criteria</p>
              </div>
              <button 
                onClick={() => setShowIntro(false)}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-500 text-white rounded-lg transition hover:opacity-90"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assessment Selection */}
      {!currentAssessment && !showResults && (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            className="p-6 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5 cursor-pointer hover:bg-white/80 dark:hover:bg-white/10 transition"
            whileHover={{ scale: 1.02 }}
            onClick={() => startAssessment('gad7')}
          >
            <div className="text-center space-y-4">
              <div className="text-4xl">😰</div>
              <h3 className="text-xl font-bold">GAD-7 Anxiety Screening</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Assess symptoms of generalized anxiety disorder over the past 2 weeks
              </p>
              <div className="text-xs text-gray-500">
                Source: Spitzer et al. (2006) • 7 questions • 2-3 minutes
              </div>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-400 to-cyan-500 text-white rounded-lg transition hover:opacity-90">
                Start Assessment
              </button>
            </div>
          </motion.div>

          <motion.div 
            className="p-6 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5 cursor-pointer hover:bg-white/80 dark:hover:bg-white/10 transition"
            whileHover={{ scale: 1.02 }}
            onClick={() => startAssessment('phq9')}
          >
            <div className="text-center space-y-4">
              <div className="text-4xl">😔</div>
              <h3 className="text-xl font-bold">PHQ-9 Depression Screening</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Assess symptoms of depression over the past 2 weeks
              </p>
              <div className="text-xs text-gray-500">
                Source: Kroenke et al. (2001) • 9 questions • 3-4 minutes
              </div>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-500 text-white rounded-lg transition hover:opacity-90">
                Start Assessment
              </button>
            </div>
          </motion.div>

          <motion.div 
            className="p-6 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5 cursor-pointer hover:bg-white/80 dark:hover:bg-white/10 transition"
            whileHover={{ scale: 1.02 }}
            onClick={() => startAssessment('personality')}
          >
            <div className="text-center space-y-4">
              <div className="text-4xl">🧠</div>
              <h3 className="text-xl font-bold">Personality Traits</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Explore your personality characteristics and preferences
              </p>
              <div className="text-xs text-gray-500">
                Based on Big Five model • 5 questions • 2-3 minutes
              </div>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-lg transition hover:opacity-90">
                Start Assessment
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Assessment Questions */}
      {currentAssessment && !showResults && (
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                {currentAssessment === 'gad7' ? 'GAD-7 Anxiety Screening' : 'PHQ-9 Depression Screening'}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Question {currentQuestion + 1} of {getCurrentQuestions().length}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div 
                className="bg-gradient-to-r from-purple-400 to-pink-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestion + 1) / getCurrentQuestions().length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div className="p-6 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5">
            <h3 className="text-lg font-semibold mb-4">
              {getCurrentQuestions()[currentQuestion]?.text}
            </h3>
            <div className="space-y-3">
              {getCurrentQuestions()[currentQuestion]?.options.map((option, index) => (
                <label key={index} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <input
                    type="radio"
                    name={`question-${getCurrentQuestions()[currentQuestion]?.id}`}
                    value={option.value}
                    checked={answers[getCurrentQuestions()[currentQuestion]?.id] === option.value}
                    onChange={(e) => setAnswers({
                      ...answers,
                      [getCurrentQuestions()[currentQuestion]?.id]: parseInt(e.target.value)
                    })}
                    className="text-purple-500"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={nextQuestion}
              disabled={answers[getCurrentQuestions()[currentQuestion]?.id] === undefined}
              className="px-6 py-2 bg-gradient-to-r from-purple-400 to-pink-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuestion === getCurrentQuestions().length - 1 ? 'Complete' : 'Next'}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {showResults && assessmentResult && (
        <div className="max-w-2xl mx-auto">
          <div className="p-6 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">📊</div>
              <h2 className="text-2xl font-bold">Assessment Results</h2>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <h3 className="font-semibold mb-2">Score: {assessmentResult.score}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Severity Level: <span className="font-semibold capitalize">{assessmentResult.severity}</span>
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Simple Coping Tools:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">🌬️ Breathing Exercises</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-300">Try 4-7-8 breathing or box breathing for immediate relief</p>
                    <Link href="/toolkit/breathing" className="text-xs text-blue-500 hover:underline">Start Breathing Exercise →</Link>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">🪨 Grounding Techniques</h4>
                    <p className="text-sm text-amber-600 dark:text-amber-300">Use 5-4-3-2-1 grounding to stay present and calm</p>
                    <Link href="/toolkit/grounding" className="text-xs text-amber-500 hover:underline">Try Grounding →</Link>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">📝 Journaling</h4>
                    <p className="text-sm text-green-600 dark:text-green-300">Write about your feelings and thoughts to process emotions</p>
                    <Link href="/journal" className="text-xs text-green-500 hover:underline">Start Journaling →</Link>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">🧘 Mindfulness</h4>
                    <p className="text-sm text-purple-600 dark:text-purple-300">Practice mindfulness and meditation for mental clarity</p>
                    <Link href="/toolkit/meditations" className="text-xs text-purple-500 hover:underline">Try Meditation →</Link>
                  </div>
                </div>
              </div>

              {assessmentResult.severity === 'severe' && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Important Notice</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Your assessment indicates severe symptoms. Please consider seeking immediate professional mental health support. 
                    If you're having thoughts of self-harm, please contact a crisis helpline or emergency services.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={resetAssessment}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                Take Another Assessment
              </button>
              <Link
                href="/toolkit"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-500 text-white rounded-lg text-center block"
              >
                Explore Coping Tools
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto mt-6 text-center">
        <Link href="/toolkit" className="px-4 py-2 rounded-full border border-white/30 hover:bg-white/10 transition pressable">← Back to Toolkit</Link>
      </div>
    </motion.div>
  );
}