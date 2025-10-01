'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface GroundingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  technique: string;
  duration: number;
  anxietyBefore: number;
  anxietyAfter?: number;
  focusBefore: number;
  focusAfter?: number;
  notes?: string;
}

const GROUNDING_TECHNIQUES = [
  {
    id: '54321',
    name: '5-4-3-2-1 Technique',
    description: 'Use your senses to ground yourself in the present moment',
    steps: [
      'Name 5 things you can see',
      'Name 4 things you can touch',
      'Name 3 things you can hear',
      'Name 2 things you can smell',
      'Name 1 thing you can taste'
    ],
    duration: 5,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'breathing',
    name: 'Breathing Grounding',
    description: 'Focus on your breath to center yourself',
    steps: [
      'Take a deep breath in for 4 counts',
      'Hold your breath for 4 counts',
      'Exhale slowly for 6 counts',
      'Repeat 3-5 times',
      'Notice how your body feels'
    ],
    duration: 3,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'body-scan',
    name: 'Body Scan',
    description: 'Systematically relax each part of your body',
    steps: [
      'Start with your toes - tense and release',
      'Move to your feet - feel the ground beneath you',
      'Focus on your legs - notice any tension',
      'Move to your torso - feel your breathing',
      'Focus on your arms and hands',
      'Finally, relax your head and neck'
    ],
    duration: 7,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'mindful-walking',
    name: 'Mindful Walking',
    description: 'Ground yourself through mindful movement',
    steps: [
      'Stand up and feel your feet on the ground',
      'Take 5 slow steps, feeling each foot placement',
      'Notice the weight shifting from foot to foot',
      'Feel the connection between your body and the earth',
      'Take 5 more steps, focusing on your balance'
    ],
    duration: 5,
    color: 'from-orange-500 to-red-500'
  }
];

export default function GroundingToolPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedTechnique, setSelectedTechnique] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionData, setSessionData] = useState<GroundingSession | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [anxietyBefore, setAnxietyBefore] = useState(5);
  const [focusBefore, setFocusBefore] = useState(5);
  const [anxietyAfter, setAnxietyAfter] = useState(5);
  const [focusAfter, setFocusAfter] = useState(5);
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionHistory, setSessionHistory] = useState<GroundingSession[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  const startSession = (techniqueId: string) => {
    const technique = GROUNDING_TECHNIQUES.find(t => t.id === techniqueId);
    if (!technique) return;

    const session: GroundingSession = {
      id: Date.now().toString(),
      startTime: new Date(),
      technique: technique.name,
      duration: 0,
      anxietyBefore,
      focusBefore
    };

    setSessionData(session);
    setSelectedTechnique(techniqueId);
    setIsSessionActive(true);
    setShowIntro(false);
    setCurrentStep(0);
  };

  const nextStep = () => {
    const technique = GROUNDING_TECHNIQUES.find(t => t.id === selectedTechnique);
    if (!technique) return;

    if (currentStep < technique.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Session complete
      endSession();
    }
  };

  const endSession = () => {
    if (!sessionData || !selectedTechnique) return;

    const technique = GROUNDING_TECHNIQUES.find(t => t.id === selectedTechnique);
    if (!technique) return;

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - sessionData.startTime.getTime()) / 1000);

    const completedSession: GroundingSession = {
      ...sessionData,
      endTime,
      duration,
      anxietyAfter,
      focusAfter,
      notes: sessionNotes
    };

    setSessionHistory(prev => [...prev, completedSession]);
    setSessionData(null);
    setIsSessionActive(false);
    setSelectedTechnique(null);
    setCurrentStep(0);
  };

  const resetSession = () => {
    setSessionData(null);
    setIsSessionActive(false);
    setSelectedTechnique(null);
    setCurrentStep(0);
    setAnxietyAfter(5);
    setFocusAfter(5);
    setSessionNotes('');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const currentTechnique = selectedTechnique ? GROUNDING_TECHNIQUES.find(t => t.id === selectedTechnique) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Grounding Techniques 🌱</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Anchor yourself in the present moment with guided grounding exercises
          </p>
        </div>

        <AnimatePresence mode="wait">
          {showIntro && !isSessionActive && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 mb-6"
            >
              <h2 className="text-2xl font-bold mb-4 text-center">Welcome to Grounding</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
                Grounding techniques help you stay connected to the present moment when you feel overwhelmed, anxious, or disconnected.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">How anxious do you feel right now? (1-10)</label>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">Very Calm</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={anxietyBefore}
                      onChange={(e) => setAnxietyBefore(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-bold">{anxietyBefore}</span>
                    <span className="text-sm">Very Anxious</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">How focused do you feel? (1-10)</label>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">Very Scattered</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={focusBefore}
                      onChange={(e) => setFocusBefore(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-bold">{focusBefore}</span>
                    <span className="text-sm">Very Focused</span>
                  </div>
                </div>
              </div>

              <div className="text-center mt-6">
                <button
                  onClick={() => setShowIntro(false)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition"
                >
                  Choose a Technique
                </button>
              </div>
            </motion.div>
          )}

          {!showIntro && !isSessionActive && (
            <motion.div
              key="techniques"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-center mb-6">Choose a Grounding Technique</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {GROUNDING_TECHNIQUES.map((technique, index) => (
                  <motion.div
                    key={technique.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6 hover:shadow-xl transition"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${technique.color} flex items-center justify-center text-white text-2xl mb-4`}>
                      {technique.id === '54321' ? '🔢' : 
                       technique.id === 'breathing' ? '🫁' :
                       technique.id === 'body-scan' ? '🧘' : '🚶'}
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2">{technique.name}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{technique.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-500">Duration: ~{technique.duration} minutes</span>
                      <span className="text-sm text-gray-500">{technique.steps.length} steps</span>
                    </div>
                    
                    <button
                      onClick={() => startSession(technique.id)}
                      className={`w-full px-4 py-2 bg-gradient-to-r ${technique.color} text-white rounded-lg hover:opacity-90 transition`}
                    >
                      Start Technique
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {isSessionActive && currentTechnique && (
            <motion.div
              key="session"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">{currentTechnique.name}</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{currentTechnique.description}</p>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className={`bg-gradient-to-r ${currentTechnique.color} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${((currentStep + 1) / currentTechnique.steps.length) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Step {currentStep + 1} of {currentTechnique.steps.length}
                </p>
              </div>

              <div className="text-center mb-8">
                <div className="text-6xl mb-4">
                  {currentTechnique.id === '54321' ? '👁️' : 
                   currentTechnique.id === 'breathing' ? '🫁' :
                   currentTechnique.id === 'body-scan' ? '🧘' : '🚶'}
                </div>
                <h3 className="text-xl font-semibold mb-4">{currentTechnique.steps[currentStep]}</h3>
                
                {currentTechnique.id === '54321' && (
                  <div className="text-4xl font-bold text-purple-600 mb-4">
                    {5 - currentStep}
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={nextStep}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full hover:from-green-600 hover:to-emerald-600 transition"
                >
                  {currentStep < currentTechnique.steps.length - 1 ? 'Next Step' : 'Complete'}
                </button>
                <button
                  onClick={resetSession}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {!showIntro && !isSessionActive && sessionData === null && (
            <motion.div
              key="outcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-6"
            >
              <h3 className="text-xl font-bold mb-4 text-center">Session Complete! 🎉</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
                How are you feeling after your grounding session?
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">How anxious do you feel now? (1-10)</label>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">Very Calm</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={anxietyAfter}
                      onChange={(e) => setAnxietyAfter(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-bold">{anxietyAfter}</span>
                    <span className="text-sm">Very Anxious</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">How focused do you feel now? (1-10)</label>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">Very Scattered</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={focusAfter}
                      onChange={(e) => setFocusAfter(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-bold">{focusAfter}</span>
                    <span className="text-sm">Very Focused</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Session Notes (optional)</label>
                  <textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="How did this session feel? Any insights or observations?"
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={endSession}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition"
                >
                  Save Session
                </button>
                <button
                  onClick={resetSession}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Start New Session
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center mt-8">
          <Link href="/toolkit" className="px-4 py-2 rounded-full border border-white/30 hover:bg-white/10 transition">
            ← Back to Toolkit
          </Link>
        </div>
      </div>
    </div>
  );
}