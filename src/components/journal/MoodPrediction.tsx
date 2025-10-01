'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface MoodPrediction {
  predictedMood: string;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
  recommendations: string[];
  proactiveActions: string[];
}

interface WellnessSuggestion {
  type: 'activity' | 'mindfulness' | 'social' | 'self_care';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: string;
  moodImpact: 'positive' | 'neutral' | 'negative';
}

interface MoodPredictionProps {
  onPredictionLoaded?: (prediction: MoodPrediction) => void;
}

export default function MoodPrediction({ onPredictionLoaded }: MoodPredictionProps) {
  const { user } = useAuth();
  const [prediction, setPrediction] = useState<MoodPrediction | null>(null);
  const [suggestions, setSuggestions] = useState<WellnessSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'prediction' | 'suggestions'>('prediction');

  useEffect(() => {
    if (user) {
      loadPrediction();
    }
  }, [user]);

  const loadPrediction = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/insights/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to load prediction');
      }
      
      const data = await response.json();
      setPrediction(data.prediction);
      setSuggestions(data.suggestions);
      onPredictionLoaded?.(data.prediction);
    } catch (err) {
      console.error('Error loading prediction:', err);
      setError(err instanceof Error ? err.message : 'Failed to load prediction');
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (mood: string) => {
    const moodEmojis: Record<string, string> = {
      'excited': '🤩',
      'happy': '😊',
      'fine': '😌',
      'neutral': '😐',
      'sad': '😔',
      'stressed': '😩',
      'anxious': '😰',
      'angry': '😡'
    };
    return moodEmojis[mood] || '😐';
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getSuggestionIcon = (type: string) => {
    const icons: Record<string, string> = {
      'activity': '🏃‍♀️',
      'mindfulness': '🧘‍♀️',
      'social': '👥',
      'self_care': '💆‍♀️'
    };
    return icons[type] || '💡';
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
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Analyzing your patterns...</span>
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
            onClick={loadPrediction}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!prediction) {
    return null;
  }

  return (
    <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          🔮 Mood Prediction
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('prediction')}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              activeTab === 'prediction' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Prediction
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              activeTab === 'suggestions' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Suggestions
          </button>
        </div>
      </div>

      {activeTab === 'prediction' && (
        <div className="space-y-6">
          {/* Main Prediction */}
          <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
            <div className="text-6xl mb-4">{getMoodEmoji(prediction.predictedMood)}</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 capitalize">
              {prediction.predictedMood}
            </h3>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(prediction.riskLevel)}`}>
                {prediction.riskLevel.toUpperCase()} RISK
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
                {Math.round(prediction.confidence * 100)}% CONFIDENCE
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Based on your recent journal patterns and mood trends
            </p>
          </div>

          {/* Factors */}
          {prediction.factors.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Key Factors</h3>
              <div className="space-y-2">
                {prediction.factors.map((factor, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="text-lg">🔍</span>
                    <span className="text-gray-800 dark:text-gray-200">{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {prediction.recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Recommendations</h3>
              <div className="space-y-2">
                {prediction.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <span className="text-lg">💡</span>
                    <span className="text-blue-800 dark:text-blue-200">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proactive Actions */}
          {prediction.proactiveActions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Proactive Actions</h3>
              <div className="space-y-2">
                {prediction.proactiveActions.map((action, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                    <span className="text-lg">🎯</span>
                    <span className="text-green-800 dark:text-green-200">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          {suggestions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">💭</div>
              <p className="text-gray-600 dark:text-gray-400">
                No suggestions available. Keep journaling to get personalized recommendations!
              </p>
            </div>
          ) : (
            suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${getPriorityColor(suggestion.priority)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {suggestion.title}
                      </h4>
                      {suggestion.priority === 'high' && (
                        <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                          High Priority
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      {suggestion.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>⏱️ {suggestion.estimatedDuration}</span>
                      <span className={`${
                        suggestion.moodImpact === 'positive' ? 'text-green-600 dark:text-green-400' : 
                        suggestion.moodImpact === 'negative' ? 'text-red-600 dark:text-red-400' : 
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {suggestion.moodImpact === 'positive' ? '📈 Positive Impact' : 
                         suggestion.moodImpact === 'negative' ? '📉 Negative Impact' : 
                         '➡️ Neutral Impact'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}