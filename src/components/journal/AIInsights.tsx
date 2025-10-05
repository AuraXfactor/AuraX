'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface MoodPattern {
  mood: string;
  frequency: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface ActivityCorrelation {
  activity: string;
  moodImprovement: number;
  frequency: number;
  correlation: 'positive' | 'negative' | 'neutral';
}

interface WeeklyInsight {
  week: string;
  averageMood: number;
  totalEntries: number;
  topActivities: string[];
  moodTrend: 'improving' | 'declining' | 'stable';
  keyInsights: string[];
}

interface AIInsights {
  moodPatterns: MoodPattern[];
  activityCorrelations: ActivityCorrelation[];
  weeklyTrends: WeeklyInsight[];
  personalizedInsights: string[];
  recommendations: string[];
  riskFactors: string[];
  positivePatterns: string[];
}

interface AIInsightsProps {
  onInsightsLoaded?: (insights: AIInsights) => void;
}

export default function AIInsights({ onInsightsLoaded }: AIInsightsProps) {
  const { user } = useAuth();
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'patterns' | 'insights' | 'recommendations'>('patterns');

  useEffect(() => {
    if (user) {
      loadInsights();
    }
  }, [user]);

  const loadInsights = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // First get recent journal entries
      const historyResponse = await fetch(`/api/journals/history?userId=${user.uid}&limit=10`);
      const historyData = await historyResponse.json();
      const recentEntries = historyData.entries || [];
      
      if (recentEntries.length === 0) {
        setInsights({
          moodPatterns: [],
          activityCorrelations: [],
          weeklyTrends: [],
          personalizedInsights: ['Start journaling to get personalized insights! Your AI companion is ready to help you understand your patterns and emotions.'],
          recommendations: ['Try logging your mood and activities daily to see patterns emerge.'],
          riskFactors: [],
          positivePatterns: []
        });
        return;
      }
      
      // Analyze the most recent entry with AI
      const latestEntry = recentEntries[0];
      const analysisResponse = await fetch('/api/aura-ai/analyze-journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.uid,
          entryText: latestEntry.entryText,
          mood: latestEntry.moodTag,
          activities: latestEntry.activities || []
        }),
      });
      
      if (!analysisResponse.ok) {
        throw new Error('Failed to analyze journal entry');
      }
      
      const analysisData = await analysisResponse.json();
      const analysis = analysisData.analysis;
      
      // Generate insights based on the AI analysis
      const insights = {
        moodPatterns: [{
          mood: analysis.mood || latestEntry.moodTag,
          frequency: 1,
          percentage: 100,
          trend: 'stable' as const
        }],
        activityCorrelations: (latestEntry.activities || []).map((activity: string) => ({
          activity,
          moodImprovement: analysis.sentiment || 0,
          frequency: 1,
          correlation: analysis.sentiment > 0 ? 'positive' as const : analysis.sentiment < 0 ? 'negative' as const : 'neutral' as const
        })),
        weeklyTrends: [],
        personalizedInsights: analysis.insights || ['Keep journaling to discover more about yourself!'],
        recommendations: analysis.recommendations || ['Continue your journaling practice'],
        riskFactors: analysis.riskFactors || [],
        positivePatterns: analysis.positivePatterns || []
      };
      
      setInsights(insights);
      onInsightsLoaded?.(insights);
    } catch (err) {
      console.error('Error loading insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to load insights');
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '➡️';
    }
  };

  const getCorrelationColor = (correlation: string) => {
    switch (correlation) {
      case 'positive': return 'text-green-600 dark:text-green-400';
      case 'negative': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Analyzing your journal patterns...</span>
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
            onClick={loadInsights}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          🧠 AI Insights
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('patterns')}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              activeTab === 'patterns' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Patterns
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              activeTab === 'insights' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Insights
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              activeTab === 'recommendations' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Tips
          </button>
        </div>
      </div>

      {activeTab === 'patterns' && (
        <div className="space-y-6">
          {/* Mood Patterns */}
          {insights.moodPatterns.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Mood Patterns</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {insights.moodPatterns.slice(0, 4).map((pattern, index) => (
                  <div key={index} className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{getMoodEmoji(pattern.mood)}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {getTrendIcon(pattern.trend)}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {pattern.mood}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {pattern.percentage.toFixed(0)}% of the time
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${pattern.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Correlations */}
          {insights.activityCorrelations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Activity Impact</h3>
              <div className="space-y-2">
                {insights.activityCorrelations.slice(0, 3).map((correlation, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <span className={`text-lg ${getCorrelationColor(correlation.correlation)}`}>
                        {correlation.correlation === 'positive' ? '📈' : correlation.correlation === 'negative' ? '📉' : '➡️'}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {correlation.activity.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {correlation.moodImprovement > 0 ? '+' : ''}{correlation.moodImprovement.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          {/* Personalized Insights */}
          {insights.personalizedInsights.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Personalized Insights</h3>
              <div className="space-y-3">
                {insights.personalizedInsights.map((insight, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">💡</span>
                      <p className="text-gray-800 dark:text-gray-200">{insight}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Positive Patterns */}
          {insights.positivePatterns.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Positive Patterns</h3>
              <div className="space-y-2">
                {insights.positivePatterns.map((pattern, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                    <span className="text-2xl">✨</span>
                    <span className="text-green-800 dark:text-green-200">{pattern}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Factors */}
          {insights.riskFactors.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Areas to Watch</h3>
              <div className="space-y-2">
                {insights.riskFactors.map((factor, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                    <span className="text-2xl">⚠️</span>
                    <span className="text-yellow-800 dark:text-yellow-200">{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          {/* Recommendations */}
          {insights.recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Recommendations</h3>
              <div className="space-y-3">
                {insights.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                    <span className="text-2xl">🎯</span>
                    <p className="text-gray-800 dark:text-gray-200">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Trends */}
          {insights.weeklyTrends.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Weekly Trends</h3>
              <div className="space-y-3">
                {insights.weeklyTrends.slice(0, 2).map((trend, index) => (
                  <div key={index} className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        Week of {new Date(trend.week).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {trend.totalEntries} entries
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Mood:</span>
                      <span className="text-sm font-medium">
                        {trend.moodTrend === 'improving' ? '📈 Improving' : 
                         trend.moodTrend === 'declining' ? '📉 Declining' : '➡️ Stable'}
                      </span>
                    </div>
                    {trend.keyInsights.length > 0 && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {trend.keyInsights[0]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}