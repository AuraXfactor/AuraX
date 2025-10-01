"use client";
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface GroundingSession {
  id?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  stepsCompleted: {
    see: number;
    touch: number;
    hear: number;
    smell: number;
    taste: number;
  };
  reliefLevel?: number;
  effectiveness?: number;
  followUpResponses?: {
    trigger?: string;
    helpfulAspects?: string[];
    improvements?: string;
    reliefDuration?: string;
  };
}

export default function EnhancedGroundingPage() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [steps, setSteps] = useState({ see: 0, touch: 0, hear: 0, smell: 0, taste: 0 });
  const [currentSession, setCurrentSession] = useState<GroundingSession | null>(null);
  const [sessionState, setSessionState] = useState<'idle' | 'active' | 'completed'>('idle');
  const [showIntro, setShowIntro] = useState(true);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [reliefLevel, setReliefLevel] = useState(0);
  const [followUpData, setFollowUpData] = useState({
    trigger: '',
    helpfulAspects: [] as string[],
    improvements: '',
    reliefDuration: ''
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraOn, setCameraOn] = useState(false);

  useEffect(() => {
    if (!cameraOn) return;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setCameraOn(false);
      }
    })();
  }, [cameraOn]);

  // Session timer
  useEffect(() => {
    if (sessionState !== 'active') return;

    const interval = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionState]);

  const startSession = async () => {
    if (!user) return;
    
    const session: GroundingSession = {
      startTime: new Date(),
      stepsCompleted: { see: 0, touch: 0, hear: 0, smell: 0, taste: 0 }
    };

    try {
      const docRef = await addDoc(collection(db, 'groundingSessions'), {
        ...session,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      setCurrentSession({ ...session, id: docRef.id });
    } catch (error) {
      console.error('Error starting session:', error);
    }

    setSessionState('active');
    setShowIntro(false);
  };

  const completeSession = async () => {
    if (!currentSession || !user) return;

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - currentSession.startTime.getTime()) / 1000);

    try {
      if (currentSession.id) {
        await updateDoc(doc(db, 'groundingSessions', currentSession.id), {
          endTime: serverTimestamp(),
          duration: duration,
          stepsCompleted: steps,
          reliefLevel: reliefLevel,
          status: 'completed'
        });
      }
    } catch (error) {
      console.error('Error completing session:', error);
    }

    setSessionState('completed');
    setShowFollowUp(true);
  };

  const saveFollowUpData = async () => {
    if (!currentSession?.id || !user) return;

    try {
      await updateDoc(doc(db, 'groundingSessions', currentSession.id), {
        followUpResponses: followUpData,
        effectiveness: followUpData.helpfulAspects.length > 0 ? 1 : 0
      });
    } catch (error) {
      console.error('Error saving follow-up data:', error);
    }

    setShowFollowUp(false);
    setSessionState('idle');
    setCurrentSession(null);
    setSessionDuration(0);
    setSteps({ see: 0, touch: 0, hear: 0, smell: 0, taste: 0 });
    setReliefLevel(0);
  };

  const set = (key: keyof typeof steps, val: number) => {
    setSteps((s) => ({ ...s, [key]: val }));
    
    // Update session in real-time
    if (currentSession?.id) {
      updateDoc(doc(db, 'groundingSessions', currentSession.id), {
        stepsCompleted: { ...steps, [key]: val }
      }).catch(console.error);
    }
  };

  const totalSteps = steps.see + steps.touch + steps.hear + steps.smell + steps.taste;
  const maxSteps = 15; // 5+4+3+2+1
  const progress = (totalSteps / maxSteps) * 100;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur motion-fade-in">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white animate-pop">🪨</div>
          <h1 className="text-2xl font-bold">Grounding requires login</h1>
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
      <h1 className="text-3xl font-extrabold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500 mb-8">
        Enhanced 5-4-3-2-1 Grounding
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
              className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-xl font-bold text-center">Welcome to Enhanced Grounding</h2>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <p><strong>What it helps with:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Anxiety and panic attacks</li>
                  <li>Overwhelming emotions</li>
                  <li>Dissociation and derealization</li>
                  <li>Stress and tension</li>
                </ul>
                <p><strong>How it works:</strong></p>
                <p>Use your five senses to ground yourself in the present moment. We'll track your progress and measure your relief levels.</p>
              </div>
              <button 
                onClick={() => setShowIntro(false)}
                className="w-full px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg transition hover:opacity-90"
              >
                Get Started
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Follow-up Modal */}
      <AnimatePresence>
        {showFollowUp && (
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-xl font-bold text-center">How was your grounding session?</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">What triggered you to use this tool?</label>
                  <input 
                    type="text" 
                    value={followUpData.trigger}
                    onChange={(e) => setFollowUpData({...followUpData, trigger: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="e.g., panic attack, anxiety, overwhelming emotions..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">What was most helpful? (select all that apply)</label>
                  <div className="space-y-2">
                    {['Visual grounding (5 things)', 'Tactile grounding (4 things)', 'Auditory grounding (3 things)', 'Olfactory grounding (2 things)', 'Gustatory grounding (1 thing)', 'The camera feature', 'The progress tracking'].map((option) => (
                      <label key={option} className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={followUpData.helpfulAspects.includes(option)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFollowUpData({
                                ...followUpData, 
                                helpfulAspects: [...followUpData.helpfulAspects, option]
                              });
                            } else {
                              setFollowUpData({
                                ...followUpData, 
                                helpfulAspects: followUpData.helpfulAspects.filter(item => item !== option)
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">How long did the relief last?</label>
                  <select 
                    value={followUpData.reliefDuration}
                    onChange={(e) => setFollowUpData({...followUpData, reliefDuration: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="">Select duration...</option>
                    <option value="immediate">Immediate relief</option>
                    <option value="5-15min">5-15 minutes</option>
                    <option value="15-30min">15-30 minutes</option>
                    <option value="30-60min">30-60 minutes</option>
                    <option value="1-2hours">1-2 hours</option>
                    <option value="2+hours">2+ hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">How could we improve this experience?</label>
                  <textarea 
                    value={followUpData.improvements}
                    onChange={(e) => setFollowUpData({...followUpData, improvements: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 h-20"
                    placeholder="Your suggestions..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={saveFollowUpData}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg transition hover:opacity-90"
                >
                  Save & Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Controls */}
      {sessionState === 'idle' && (
        <div className="text-center mb-8">
          <button 
            onClick={startSession}
            className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full font-semibold transition hover:opacity-90"
          >
            Start Grounding Session
          </button>
        </div>
      )}

      {/* Progress Bar */}
      {sessionState === 'active' && (
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-600 dark:text-gray-300">{totalSteps}/{maxSteps} steps</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <motion.div 
              className="bg-gradient-to-r from-amber-400 to-orange-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-center mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Session Duration: {Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      )}

      {/* Grounding Steps */}
      <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div 
          className="p-4 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="font-semibold text-lg mb-3">5 things you can see</div>
          <input 
            type="range" 
            min={0} 
            max={5} 
            value={steps.see} 
            onChange={(e) => set('see', Number(e.target.value))} 
            className="w-full mb-2"
            disabled={sessionState !== 'active'}
          />
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {steps.see} / 5 noticed
            {steps.see === 5 && <span className="text-green-500 ml-2">✓ Complete</span>}
          </div>
        </motion.div>

        <motion.div 
          className="p-4 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="font-semibold text-lg mb-3">4 things you can touch</div>
          <input 
            type="range" 
            min={0} 
            max={4} 
            value={steps.touch} 
            onChange={(e) => set('touch', Number(e.target.value))} 
            className="w-full mb-2"
            disabled={sessionState !== 'active'}
          />
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {steps.touch} / 4 noticed
            {steps.touch === 4 && <span className="text-green-500 ml-2">✓ Complete</span>}
          </div>
        </motion.div>

        <motion.div 
          className="p-4 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="font-semibold text-lg mb-3">3 things you can hear</div>
          <input 
            type="range" 
            min={0} 
            max={3} 
            value={steps.hear} 
            onChange={(e) => set('hear', Number(e.target.value))} 
            className="w-full mb-2"
            disabled={sessionState !== 'active'}
          />
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {steps.hear} / 3 noticed
            {steps.hear === 3 && <span className="text-green-500 ml-2">✓ Complete</span>}
          </div>
        </motion.div>

        <motion.div 
          className="p-4 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="font-semibold text-lg mb-3">2 things you can smell</div>
          <input 
            type="range" 
            min={0} 
            max={2} 
            value={steps.smell} 
            onChange={(e) => set('smell', Number(e.target.value))} 
            className="w-full mb-2"
            disabled={sessionState !== 'active'}
          />
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {steps.smell} / 2 noticed
            {steps.smell === 2 && <span className="text-green-500 ml-2">✓ Complete</span>}
          </div>
        </motion.div>

        <motion.div 
          className="p-4 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5 sm:col-span-2"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="font-semibold text-lg mb-3">1 thing you can taste</div>
          <input 
            type="range" 
            min={0} 
            max={1} 
            value={steps.taste} 
            onChange={(e) => set('taste', Number(e.target.value))} 
            className="w-full mb-2"
            disabled={sessionState !== 'active'}
          />
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {steps.taste} / 1 noticed
            {steps.taste === 1 && <span className="text-green-500 ml-2">✓ Complete</span>}
          </div>
        </motion.div>
      </div>

      {/* Relief Level */}
      {sessionState === 'active' && (
        <div className="max-w-3xl mx-auto mt-8 p-4 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5">
          <div className="font-semibold text-lg mb-3 text-center">How much relief do you feel?</div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">No relief</span>
            <span className="text-sm">Complete relief</span>
          </div>
          <input 
            type="range" 
            min={0} 
            max={10} 
            value={reliefLevel} 
            onChange={(e) => setReliefLevel(Number(e.target.value))} 
            className="w-full"
          />
          <div className="text-center mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">Relief Level: {reliefLevel}/10</span>
          </div>
        </div>
      )}

      {/* Camera Feature */}
      {sessionState === 'active' && (
        <div className="max-w-3xl mx-auto mt-6 flex items-center gap-3 justify-center">
          <button 
            onClick={() => setCameraOn((v) => !v)} 
            className="px-4 py-2 rounded-full border border-white/30 hover:bg-white/10 transition pressable"
          >
            {cameraOn ? 'Turn off camera' : 'Open camera (optional)'}
          </button>
        </div>
      )}
      
      {cameraOn && sessionState === 'active' && (
        <div className="max-w-3xl mx-auto mt-4">
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl border border-white/20"></video>
        </div>
      )}

      {/* Complete Session Button */}
      {sessionState === 'active' && (
        <div className="max-w-3xl mx-auto mt-8 text-center">
          <button 
            onClick={completeSession}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-semibold transition hover:opacity-90"
          >
            Complete Session
          </button>
        </div>
      )}

      {/* Session Completed */}
      {sessionState === 'completed' && !showFollowUp && (
        <div className="text-center space-y-4 mt-8">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold text-green-500">Session Complete!</h2>
          <p className="text-gray-600 dark:text-gray-300">Duration: {Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}</p>
          <p className="text-gray-600 dark:text-gray-300">Final Relief Level: {reliefLevel}/10</p>
          <button 
            onClick={() => {
              setSessionState('idle');
              setSessionDuration(0);
              setSteps({ see: 0, touch: 0, hear: 0, smell: 0, taste: 0 });
              setReliefLevel(0);
            }}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full transition hover:opacity-90"
          >
            Start New Session
          </button>
        </div>
      )}

      <div className="max-w-3xl mx-auto mt-6 text-center">
        <Link href="/toolkit" className="px-4 py-2 rounded-full border border-white/30 hover:bg-white/10 transition pressable">← Back to Toolkit</Link>
      </div>
    </motion.div>
  );
}