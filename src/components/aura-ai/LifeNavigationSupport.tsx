'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface WellnessResource {
  id: string;
  title: string;
  type: 'podcast' | 'article' | 'video' | 'therapy' | 'meditation' | 'workout';
  description: string;
  url?: string;
  duration?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  moodMatch: string[];
  priority: 'high' | 'medium' | 'low';
}

interface TherapyReferral {
  type: 'crisis' | 'general' | 'specialized';
  urgency: 'immediate' | 'soon' | 'routine';
  resources: string[];
  helplines: string[];
}

interface LifeNavigationSupportProps {
  currentMood?: string;
  userHistory?: any[];
  onResourceSelected?: (resource: WellnessResource) => void;
}

export default function LifeNavigationSupport({ 
  currentMood, 
  userHistory,
  onResourceSelected 
}: LifeNavigationSupportProps) {
  const { user } = useAuth();
  const [resources, setResources] = useState<WellnessResource[]>([]);
  const [therapyReferral, setTherapyReferral] = useState<TherapyReferral | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'therapy' | 'emergency'>('content');
  const [showCrisisSupport, setShowCrisisSupport] = useState(false);

  useEffect(() => {
    if (user) {
      loadResources();
      checkTherapyNeeds();
    }
  }, [user, currentMood, userHistory]);

  const loadResources = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call - in real implementation, this would call your AI service
      const mockResources: WellnessResource[] = [
        {
          id: '1',
          title: 'The Happiness Lab with Dr. Laurie Santos',
          type: 'podcast',
          description: 'Science-based insights on happiness and well-being',
          url: 'https://www.happinesslab.fm',
          duration: '45 min',
          difficulty: 'beginner',
          moodMatch: ['sad', 'anxious', 'neutral'],
          priority: 'high'
        },
        {
          id: '2',
          title: '5-Minute Morning Meditation',
          type: 'meditation',
          description: 'Quick mindfulness practice to start your day right',
          duration: '5 min',
          difficulty: 'beginner',
          moodMatch: ['stressed', 'anxious', 'neutral'],
          priority: 'high'
        },
        {
          id: '3',
          title: 'Productivity Tips for Mental Wellness',
          type: 'article',
          description: 'How to stay productive while maintaining mental health',
          url: 'https://example.com/productivity-wellness',
          duration: '10 min read',
          difficulty: 'intermediate',
          moodMatch: ['stressed', 'neutral'],
          priority: 'medium'
        },
        {
          id: '4',
          title: 'High-Energy Workout Playlist',
          type: 'workout',
          description: 'Music and exercises to boost your mood and energy',
          duration: '30 min',
          difficulty: 'intermediate',
          moodMatch: ['sad', 'neutral'],
          priority: 'medium'
        },
        {
          id: '5',
          title: 'RYD Therapy - Professional Support',
          type: 'therapy',
          description: 'Connect with licensed therapists for professional mental health support',
          url: 'https://rydtherapy.com',
          duration: '50 min session',
          difficulty: 'beginner',
          moodMatch: ['sad', 'anxious', 'stressed', 'crisis'],
          priority: 'high'
        }
      ];
      
      setResources(mockResources);
    } catch (err) {
      console.error('Error loading resources:', err);
      setError(err instanceof Error ? err.message : 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const checkTherapyNeeds = () => {
    // Simple logic to determine if therapy referral is needed
    const crisisKeywords = ['suicidal', 'hurt', 'emergency', 'crisis', 'help'];
    const recentEntries = userHistory?.slice(-5) || [];
    const hasCrisisContent = recentEntries.some(entry => 
      crisisKeywords.some(keyword => 
        entry.entryText?.toLowerCase().includes(keyword)
      )
    );

    if (hasCrisisContent || currentMood === 'sad' || currentMood === 'anxious') {
      setTherapyReferral({
        type: hasCrisisContent ? 'crisis' : 'general',
        urgency: hasCrisisContent ? 'immediate' : 'soon',
        resources: [
          'RYD Therapy - Professional counseling',
          'Crisis Text Line - 24/7 support',
          'National Suicide Prevention Lifeline'
        ],
        helplines: [
          '988 - Suicide & Crisis Lifeline',
          'Crisis Text Line: Text HOME to 741741',
          'National Suicide Prevention Lifeline: 1-800-273-8255'
        ]
      });
    }
  };

  const getResourceIcon = (type: string) => {
    const icons: Record<string, string> = {
      'podcast': '🎧',
      'article': '📖',
      'video': '🎥',
      'therapy': '🩺',
      'meditation': '🧘‍♀️',
      'workout': '💪'
    };
    return icons[type] || '📋';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'intermediate': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'advanced': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-300 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'border-gray-300 bg-gray-50 dark:bg-gray-900/20';
      default: return 'border-gray-300 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Finding your perfect resources...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
        <div className="text-center py-4">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={loadResources}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          🧭 Life Navigation
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              activeTab === 'content' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Content
          </button>
          <button
            onClick={() => setActiveTab('therapy')}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              activeTab === 'therapy' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Support
          </button>
          {therapyReferral && (
            <button
              onClick={() => setActiveTab('emergency')}
              className={`px-3 py-1 rounded-lg text-sm transition ${
                activeTab === 'emergency' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-red-200 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              }`}
            >
              Crisis
            </button>
          )}
        </div>
      </div>

      {activeTab === 'content' && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">📚</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Curated for You</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Based on your current mood: {currentMood || 'neutral'}
            </p>
          </div>
          
          <div className="space-y-3">
            {resources
              .filter(resource => 
                resource.moodMatch.includes(currentMood || 'neutral') || 
                resource.priority === 'high'
              )
              .slice(0, 4)
              .map((resource) => (
              <div
                key={resource.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${getPriorityColor(resource.priority)}`}
                onClick={() => onResourceSelected?.(resource)}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">
                    {getResourceIcon(resource.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {resource.title}
                      </h4>
                      {resource.priority === 'high' && (
                        <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      {resource.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>⏱️ {resource.duration}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(resource.difficulty)}`}>
                        {resource.difficulty}
                      </span>
                      {resource.url && (
                        <button className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200">
                          Open →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'therapy' && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🩺</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Professional Support</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              When you need more than self-care
            </p>
          </div>
          
          <div className="space-y-3">
            {resources
              .filter(resource => resource.type === 'therapy')
              .map((resource) => (
              <div
                key={resource.id}
                className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🩺</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {resource.title}
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      {resource.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>⏱️ {resource.duration}</span>
                      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                        Get Started
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'emergency' && therapyReferral && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🚨</div>
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Crisis Support</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You're not alone. Help is available 24/7.
            </p>
          </div>
          
          <div className="space-y-3">
            {therapyReferral.helplines.map((helpline, index) => (
              <div key={index} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📞</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-800 dark:text-red-200">
                      {helpline}
                    </h4>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Available 24/7 • Free and confidential
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                    Call Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="text-center">
              <div className="text-2xl mb-2">💙</div>
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                You Matter
              </h4>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Your feelings are valid. Reaching out for help is a sign of strength, not weakness.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}