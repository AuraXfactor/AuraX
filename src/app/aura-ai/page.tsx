'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AuraAIChat from '@/components/aura-ai/AuraAIChat';
import SwagSocialLayer from '@/components/aura-ai/SwagSocialLayer';
import LifeNavigationSupport from '@/components/aura-ai/LifeNavigationSupport';
import GrowthReports from '@/components/aura-ai/GrowthReports';

const aiPersonalities = [
  {
    id: 'wellness_coach',
    name: 'Wellness Coach',
    avatar: '💪',
    description: 'Motivational and goal-oriented support',
    context: 'general'
  },
  {
    id: 'mindfulness_guide',
    name: 'Mindfulness Guide',
    avatar: '🧘',
    description: 'Calm and present-moment focused',
    context: 'journal'
  },
  {
    id: 'crisis_support',
    name: 'Crisis Support',
    avatar: '🤗',
    description: 'Compassionate support during difficult times',
    context: 'crisis'
  },
  {
    id: 'celebration_buddy',
    name: 'Celebration Buddy',
    avatar: '🎉',
    description: 'Enthusiastic and encouraging for your wins',
    context: 'celebration'
  }
];

const quickPrompts = [
  "I'm feeling overwhelmed today",
  "I want to celebrate a win",
  "Help me set a wellness goal",
  "I'm struggling with motivation",
  "I need help processing my emotions",
  "What should I journal about today?",
  "I'm proud of my progress",
  "I'm having a tough day"
];

export default function AuraAIPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPersonality, setSelectedPersonality] = useState(aiPersonalities[0]);
  const [showChat, setShowChat] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'swag' | 'navigation' | 'reports'>('chat');
  const [currentMood, setCurrentMood] = useState('neutral');

  React.useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  const handlePersonalitySelect = (personality: typeof aiPersonalities[0]) => {
    setSelectedPersonality(personality);
    setShowChat(true);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInitialMessage(prompt);
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setInitialMessage('');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (showChat) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto h-screen flex flex-col">
          <AuraAIChat
            onClose={handleCloseChat}
            initialMessage={initialMessage}
            context={selectedPersonality.context as any}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">✨</div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            Aura AI
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Your intelligent mental wellness companion, powered by empathy and understanding. 
            Get personalized support, guidance, and encouragement whenever you need it.
          </p>
        </div>

        {/* AI Personalities */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Choose Your AI Companion
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiPersonalities.map((personality) => (
              <button
                key={personality.id}
                onClick={() => handlePersonalitySelect(personality)}
                className="group p-6 bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 hover:border-purple-300 dark:hover:border-purple-500 transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <div className="text-center">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                    {personality.avatar}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    {personality.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {personality.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Start */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Quick Start Conversations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleQuickPrompt(prompt)}
                className="p-4 bg-white/40 dark:bg-white/5 backdrop-blur rounded-xl border border-white/20 hover:border-purple-300 dark:hover:border-purple-500 transition-all duration-300 hover:scale-105 text-left"
              >
                <p className="text-gray-800 dark:text-gray-200 font-medium">
                  {prompt}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced AI Features */}
        <div className="space-y-8">
          {/* Tab Navigation */}
          <div className="flex justify-center">
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-2xl border border-white/20 p-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    activeTab === 'chat' 
                      ? 'bg-purple-500 text-white' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  💬 Chat
                </button>
                <button
                  onClick={() => setActiveTab('swag')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    activeTab === 'swag' 
                      ? 'bg-purple-500 text-white' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  ✨ Swag
                </button>
                <button
                  onClick={() => setActiveTab('navigation')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    activeTab === 'navigation' 
                      ? 'bg-purple-500 text-white' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  🧭 Guide
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    activeTab === 'reports' 
                      ? 'bg-purple-500 text-white' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  📊 Reports
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'chat' && (
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-3xl border border-white/20 p-8">
              <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
                Chat with Aura AI
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-4xl mb-4">🧠</div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                    Emotional Intelligence
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Understands your emotions and provides empathetic responses tailored to your mental state.
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                    Personalized Guidance
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Offers customized advice and strategies based on your unique wellness journey.
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">💝</div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                    24/7 Support
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Always available when you need someone to talk to, day or night.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'swag' && (
            <SwagSocialLayer 
              currentMood={currentMood}
              onContentLoaded={(content) => {
                console.log('Swag content loaded:', content);
              }}
            />
          )}

          {activeTab === 'navigation' && (
            <LifeNavigationSupport 
              currentMood={currentMood}
              onResourceSelected={(resource) => {
                console.log('Resource selected:', resource);
              }}
            />
          )}

          {activeTab === 'reports' && (
            <GrowthReports 
              onReportGenerated={(report) => {
                console.log('Report generated:', report);
              }}
            />
          )}
        </div>

        {/* Safety Notice */}
        <div className="mt-12 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Important Safety Notice
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                Aura AI is designed to provide emotional support and guidance, but it's not a replacement for professional mental health care. 
                If you're experiencing a mental health crisis, please contact a mental health professional or emergency services immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}