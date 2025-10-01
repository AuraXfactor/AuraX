'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

interface AuraBoostProps {
  onBoostComplete: (points: number) => void;
}

interface BoostOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  duration: number; // in minutes
  color: string;
  requirements: string[];
}

const BOOST_OPTIONS: BoostOption[] = [
  {
    id: 'mindfulness',
    name: 'Mindfulness Boost',
    description: '5-minute guided meditation to center your mind',
    icon: '🧘',
    points: 25,
    duration: 5,
    color: 'from-purple-500 to-indigo-500',
    requirements: ['Quiet space', 'Comfortable position']
  },
  {
    id: 'gratitude',
    name: 'Gratitude Boost',
    description: 'Reflect on three things you\'re grateful for today',
    icon: '🙏',
    points: 15,
    duration: 3,
    color: 'from-yellow-500 to-orange-500',
    requirements: ['Open heart', 'Positive mindset']
  },
  {
    id: 'breathing',
    name: 'Breathing Boost',
    description: 'Deep breathing exercise to reduce stress',
    icon: '🫁',
    points: 20,
    duration: 4,
    color: 'from-cyan-500 to-blue-500',
    requirements: ['Comfortable breathing', 'Focus']
  },
  {
    id: 'movement',
    name: 'Movement Boost',
    description: 'Light stretching or gentle movement',
    icon: '🤸',
    points: 30,
    duration: 7,
    color: 'from-green-500 to-emerald-500',
    requirements: ['Safe space', 'Comfortable clothes']
  },
  {
    id: 'affirmation',
    name: 'Affirmation Boost',
    description: 'Positive self-talk and affirmation practice',
    icon: '💪',
    points: 18,
    duration: 3,
    color: 'from-pink-500 to-rose-500',
    requirements: ['Self-compassion', 'Open mind']
  }
];

export default function AuraBoost({ onBoostComplete }: AuraBoostProps) {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [selectedBoost, setSelectedBoost] = useState<BoostOption | null>(null);
  const [isBoosting, setIsBoosting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [boostProgress, setBoostProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isBoosting && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            completeBoost();
            return 0;
          }
          return prev - 1;
        });
        
        if (selectedBoost) {
          const progress = ((selectedBoost.duration * 60 - timeRemaining) / (selectedBoost.duration * 60)) * 100;
          setBoostProgress(progress);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBoosting, timeRemaining, selectedBoost]);

  const startBoost = (boost: BoostOption) => {
    setSelectedBoost(boost);
    setTimeRemaining(boost.duration * 60);
    setIsBoosting(true);
    setBoostProgress(0);
  };

  const completeBoost = () => {
    if (selectedBoost) {
      setIsBoosting(false);
      setBoostProgress(100);
      onBoostComplete(selectedBoost.points);
      
      // Show completion animation
      setTimeout(() => {
        setIsActive(false);
        setSelectedBoost(null);
        setBoostProgress(0);
      }, 2000);
    }
  };

  const cancelBoost = () => {
    setIsBoosting(false);
    setSelectedBoost(null);
    setTimeRemaining(0);
    setBoostProgress(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Aura Boost Button */}
      <button
        onClick={() => setIsActive(true)}
        className="w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
      >
        <div className="flex items-center justify-center gap-3">
          <div className="text-2xl">✨</div>
          <div className="text-left">
            <div className="font-bold text-lg">Aura Boost</div>
            <div className="text-sm opacity-90">Enhance your wellness energy</div>
          </div>
          <div className="text-2xl">⚡</div>
        </div>
      </button>

      {/* Boost Modal */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !isBoosting && setIsActive(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {!selectedBoost ? (
                // Boost Selection
                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-2">✨</div>
                    <h2 className="text-2xl font-bold mb-2">Aura Boost</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Choose a wellness activity to boost your aura and earn bonus points!
                    </p>
                  </div>

                  <div className="space-y-3">
                    {BOOST_OPTIONS.map((boost) => (
                      <button
                        key={boost.id}
                        onClick={() => startBoost(boost)}
                        className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-3xl">{boost.icon}</div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg">{boost.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {boost.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-purple-600 dark:text-purple-400 font-semibold">
                                +{boost.points} points
                              </span>
                              <span className="text-gray-500">
                                {boost.duration} min
                              </span>
                            </div>
                          </div>
                          <div className="text-purple-500">→</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      💡 How Aura Boost Works
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Complete a short wellness activity to earn bonus points and enhance your daily aura. 
                      These activities are designed to boost your mental and physical well-being while rewarding your commitment to self-care.
                    </p>
                  </div>
                </div>
              ) : (
                // Boost in Progress
                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-2">{selectedBoost.icon}</div>
                    <h2 className="text-2xl font-bold mb-2">{selectedBoost.name}</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedBoost.description}
                    </p>
                  </div>

                  {/* Progress Circle */}
                  <div className="flex justify-center mb-6">
                    <div className="relative w-32 h-32">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-gray-200 dark:text-gray-700"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - boostProgress / 100)}`}
                          className="text-purple-500 transition-all duration-1000"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-500">
                            {formatTime(timeRemaining)}
                          </div>
                          <div className="text-xs text-gray-500">remaining</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">What you'll need:</h4>
                    <div className="space-y-2">
                      {selectedBoost.requirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={cancelBoost}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={completeBoost}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition"
                    >
                      Complete Now
                    </button>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => !isBoosting && setIsActive(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}