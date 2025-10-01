'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuraAIChat from '@/components/aura-ai/AuraAIChat';

interface AutoAIInsightsProps {
  journalType: string;
  entryData: any;
  onClose?: () => void;
  autoTrigger?: boolean;
}

export default function AutoAIInsights({ 
  journalType, 
  entryData, 
  onClose, 
  autoTrigger = true 
}: AutoAIInsightsProps) {
  const { user } = useAuth();
  const [showInsights, setShowInsights] = useState(false);
  const [userAccepted, setUserAccepted] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');

  useEffect(() => {
    if (autoTrigger && entryData) {
      // Auto-trigger AI insights after a short delay
      const timer = setTimeout(() => {
        setShowInsights(true);
        generateInitialMessage();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [entryData, autoTrigger]);

  const generateInitialMessage = () => {
    const messages = {
      'cbt-therapy': `I see you just completed a CBT thought reframe exercise. I'd love to help you process what you discovered and provide additional insights about your cognitive patterns. Would you like to explore this further?`,
      'daily-checkin': `I notice you just completed your daily check-in. I can help you reflect on your mood patterns, identify trends, and suggest personalized wellness strategies. Shall we dive deeper?`,
      'gratitude': `You just wrote about gratitude - that's wonderful! I can help you explore the deeper meaning behind what you're grateful for and suggest ways to expand your gratitude practice. Interested?`,
      'goal-achievement': `I see you're tracking your goals and achievements. I can help you analyze your progress patterns, identify what's working, and suggest strategies for continued success. Want to explore this?`,
      'relationship': `You just reflected on your relationships. I can help you understand your connection patterns, communication styles, and suggest ways to strengthen your relationships. Shall we discuss this?`,
      'default': `I see you just completed a journal entry. I'd love to help you reflect on what you've written and provide personalized insights. Would you like to explore this together?`
    };

    const message = messages[journalType as keyof typeof messages] || messages.default;
    setInitialMessage(message);
  };

  const handleAccept = () => {
    setUserAccepted(true);
  };

  const handleDecline = () => {
    setShowInsights(false);
    if (onClose) onClose();
  };

  if (!showInsights) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-2xl">
              ✨
            </div>
            <div>
              <h2 className="text-xl font-bold">Aura AI Insights</h2>
              <p className="text-purple-100 text-sm">Personalized wellness guidance</p>
            </div>
          </div>
          <button
            onClick={handleDecline}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {!userAccepted ? (
            /* AI Insights Prompt */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-2xl">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-3xl">
                  ✨
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  Ready for AI Insights?
                </h3>
                
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                  {initialMessage}
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Personalized mood analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Pattern recognition</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Wellness recommendations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Goal optimization</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-8 justify-center">
                  <button
                    onClick={handleDecline}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={handleAccept}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition font-semibold"
                  >
                    Yes, Let's Explore! 🚀
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* AI Chat Interface */
            <div className="flex-1">
              <AuraAIChat
                context={journalType === 'cbt-therapy' ? 'therapy' : 
                        journalType === 'goal-achievement' ? 'goals' : 
                        journalType === 'mood-tracker' ? 'mood' : 'journal'}
                initialMessage={initialMessage}
                onClose={handleDecline}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}