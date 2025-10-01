'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    type: 'click' | 'navigate' | 'scroll';
    target?: string;
    url?: string;
  };
  highlight?: boolean;
  spotlight?: boolean;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: '🌟 Welcome to AuraX!',
    description: 'Your personal wellness companion. Let\'s take a quick tour to get you started on your journey.',
    target: 'body',
    position: 'center',
    highlight: true,
    spotlight: true
  },
  {
    id: 'bottom-nav',
    title: '🧭 Navigation Hub',
    description: 'Your main navigation is right here! Tap any icon to explore different sections of your wellness journey.',
    target: 'nav[class*="fixed bottom-0"]',
    position: 'top',
    action: { type: 'click', target: 'nav[class*="fixed bottom-0"] button:first-child' }
  },
  {
    id: 'journal',
    title: '📔 Journal Your Journey',
    description: 'Start your day with mindful journaling. Track your thoughts, emotions, and growth.',
    target: 'nav[class*="fixed bottom-0"] button:first-child',
    position: 'top',
    action: { type: 'navigate', url: '/journal' }
  },
  {
    id: 'aura-feed',
    title: '✨ Share Your Aura',
    description: 'Connect with friends by sharing 24-hour glimpses of your wellness journey.',
    target: 'nav[class*="fixed bottom-0"] button:nth-child(2)',
    position: 'top',
    action: { type: 'navigate', url: '/aura' }
  },
  {
    id: 'points-system',
    title: '🏆 Earn Aura Points',
    description: 'Celebrate your wellness milestones! Points reward your self-care journey.',
    target: 'nav[class*="fixed bottom-0"] button:nth-child(3)',
    position: 'top',
    action: { type: 'navigate', url: '/aura-points' }
  },
  {
    id: 'profile',
    title: '👤 Your Profile',
    description: 'Manage your settings, view your progress, and customize your experience.',
    target: 'nav[class*="fixed bottom-0"] button:last-child',
    position: 'top',
    action: { type: 'navigate', url: '/profile' }
  },
  {
    id: 'chat-ai',
    title: '🤖 AI Wellness Assistant',
    description: 'Get instant support and guidance from your AI wellness companion.',
    target: 'nav[class*="fixed bottom-0"]',
    position: 'top',
    action: { type: 'navigate', url: '/chat' }
  },
  {
    id: 'complete',
    title: '🎉 You\'re All Set!',
    description: 'You\'re ready to start your wellness journey! Remember, small steps lead to big changes. 🌟',
    target: 'body',
    position: 'center',
    highlight: true,
    spotlight: true
  }
];

interface TourGuideProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function TourGuide({ isActive, onComplete, onSkip }: TourGuideProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    if (isActive && currentStep < TOUR_STEPS.length) {
      setIsVisible(true);
      updateTargetElement();
    } else {
      setIsVisible(false);
    }
  }, [isActive, currentStep]);

  const updateTargetElement = () => {
    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    const element = document.querySelector(step.target) as HTMLElement;
    if (element) {
      setTargetElement(element);
      updateTooltipPosition(element);
    }
  };

  const updateTooltipPosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    setTooltipPosition({
      x: rect.left + scrollX,
      y: rect.top + scrollY,
      width: rect.width,
      height: rect.height
    });
  };

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    setIsVisible(false);
    onComplete();
    // Mark tour as completed in user preferences
    if (user) {
      localStorage.setItem(`tour_completed_${user.uid}`, 'true');
    }
  };

  const skipTour = () => {
    setIsVisible(false);
    onSkip();
  };

  const handleAction = () => {
    const step = TOUR_STEPS[currentStep];
    if (!step?.action) {
      nextStep();
      return;
    }

    switch (step.action.type) {
      case 'click':
        if (step.action.target) {
          const target = document.querySelector(step.action.target) as HTMLElement;
          target?.click();
        }
        break;
      case 'navigate':
        if (step.action.url) {
          window.location.href = step.action.url;
        }
        break;
    }

    // Move to next step after action
    setTimeout(() => nextStep(), 500);
  };

  if (!isVisible || !isActive) return null;

  const currentStepData = TOUR_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
      >
        {/* Backdrop with spotlight effect */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm">
          {currentStepData.spotlight && targetElement && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at ${tooltipPosition.x + tooltipPosition.width/2}px ${tooltipPosition.y + tooltipPosition.height/2}px, transparent 0px, transparent 200px, rgba(0,0,0,0.8) 300px)`
              }}
            />
          )}
        </div>

        {/* Highlight overlay for target element */}
        {currentStepData.highlight && targetElement && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute border-4 border-yellow-400 rounded-xl shadow-2xl"
            style={{
              left: tooltipPosition.x - 8,
              top: tooltipPosition.y - 8,
              width: tooltipPosition.width + 16,
              height: tooltipPosition.height + 16,
              boxShadow: '0 0 0 4px rgba(255, 255, 0, 0.3), 0 0 20px rgba(255, 255, 0, 0.5)'
            }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          className="absolute z-10"
          style={{
            left: currentStepData.position === 'left' ? tooltipPosition.x - 320 : 
                  currentStepData.position === 'right' ? tooltipPosition.x + tooltipPosition.width + 20 :
                  tooltipPosition.x + tooltipPosition.width/2 - 160,
            top: currentStepData.position === 'top' ? tooltipPosition.y - 200 :
                 currentStepData.position === 'bottom' ? tooltipPosition.y + tooltipPosition.height + 20 :
                 currentStepData.position === 'center' ? '50%' :
                 tooltipPosition.y + tooltipPosition.height/2 - 100,
            transform: currentStepData.position === 'center' ? 'translateY(-50%)' : 'none'
          }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-white/20 p-6 max-w-sm mx-auto">
            {/* Progress indicator */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                  {currentStep + 1}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Step {currentStep + 1} of {TOUR_STEPS.length}
                </span>
              </div>
              <button
                onClick={skipTour}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                ✕
              </button>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
              <motion.div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Content */}
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                {currentStepData.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {currentStepData.description}
              </p>

              {/* Action buttons */}
              <div className="flex gap-3">
                {!isFirstStep && (
                  <button
                    onClick={prevStep}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    ← Back
                  </button>
                )}
                
                <button
                  onClick={isLastStep ? completeTour : handleAction}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition shadow-lg"
                >
                  {isLastStep ? '🎉 Start Journey' : 'Next →'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Skip tour button */}
        <button
          onClick={skipTour}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition px-3 py-1 rounded-lg hover:bg-white/10"
        >
          Skip Tour
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook to manage tour state
export function useTourGuide() {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);

  const startTour = () => {
    setIsActive(true);
  };

  const completeTour = () => {
    setIsActive(false);
  };

  const skipTour = () => {
    setIsActive(false);
  };

  const shouldShowTour = () => {
    if (!user) return false;
    return !localStorage.getItem(`tour_completed_${user.uid}`);
  };

  return {
    isActive,
    startTour,
    completeTour,
    skipTour,
    shouldShowTour
  };
}