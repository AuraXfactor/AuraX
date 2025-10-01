'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SmartPrompt {
  id: string;
  prompt: string;
  category: 'mood' | 'gratitude' | 'reflection' | 'crisis' | 'growth' | 'celebration';
  priority: 'high' | 'medium' | 'low';
  context: string;
  suggestedActivities?: string[];
}

interface SmartPromptsProps {
  currentMood?: string;
  recentActivities?: string[];
  onPromptSelect?: (prompt: string) => void;
}

export default function SmartPrompts({ 
  currentMood, 
  recentActivities, 
  onPromptSelect 
}: SmartPromptsProps) {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<SmartPrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  useEffect(() => {
    if (user && (currentMood || recentActivities)) {
      loadPrompts();
    }
  }, [user, currentMood, recentActivities]);

  const loadPrompts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/insights/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.uid,
          currentMood,
          recentActivities 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to load prompts');
      }
      
      const data = await response.json();
      setPrompts(data.prompts);
    } catch (err) {
      console.error('Error loading prompts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  const handlePromptClick = (prompt: SmartPrompt) => {
    setSelectedPrompt(prompt.id);
    onPromptSelect?.(prompt.prompt);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'mood': '😊',
      'gratitude': '🙏',
      'reflection': '🤔',
      'crisis': '🤗',
      'growth': '🌱',
      'celebration': '🎉'
    };
    return icons[category] || '💭';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'mood': 'from-blue-500 to-cyan-500',
      'gratitude': 'from-green-500 to-emerald-500',
      'reflection': 'from-purple-500 to-violet-500',
      'crisis': 'from-red-500 to-pink-500',
      'growth': 'from-yellow-500 to-orange-500',
      'celebration': 'from-pink-500 to-rose-500'
    };
    return colors[category] || 'from-gray-500 to-gray-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-300 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'border-gray-300 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Generating personalized prompts...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
        <div className="text-center py-4">
          <div className="text-red-500 text-3xl mb-2">⚠️</div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={loadPrompts}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
        <div className="text-center py-4">
          <div className="text-4xl mb-2">💭</div>
          <p className="text-gray-600 dark:text-gray-400">
            Start journaling to get personalized prompts!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          💡 Smart Prompts
        </h3>
        <button
          onClick={loadPrompts}
          className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 transition"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedPrompt === prompt.id 
                ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                : 'hover:bg-white/80 dark:hover:bg-gray-800/80'
            } ${getPriorityColor(prompt.priority)}`}
            onClick={() => handlePromptClick(prompt)}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getCategoryColor(prompt.category)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                {getCategoryIcon(prompt.category)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {prompt.category}
                  </span>
                  {prompt.priority === 'high' && (
                    <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                      High Priority
                    </span>
                  )}
                </div>
                
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                  {prompt.prompt}
                </p>
                
                {prompt.suggestedActivities && prompt.suggestedActivities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {prompt.suggestedActivities.slice(0, 3).map((activity, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full"
                      >
                        {activity.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedPrompt === prompt.id && (
                <div className="text-purple-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedPrompt && (
        <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>This prompt has been added to your journal. Start writing your response!</span>
          </div>
        </div>
      )}
    </div>
  );
}