'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface GrowthReport {
  period: 'weekly' | 'monthly';
  moodTrends: {
    dominantMood: string;
    moodDistribution: { mood: string; percentage: number; emoji: string }[];
    trend: 'improving' | 'declining' | 'stable';
  };
  journalingStats: {
    totalEntries: number;
    streak: number;
    averageWords: number;
    mostActiveDay: string;
  };
  gratitudeGrowth: {
    gratitudeEntries: number;
    positiveWords: string[];
    growthPercentage: number;
  };
  lifestyleHighlights: {
    topActivities: { activity: string; frequency: number }[];
    wellnessScore: number;
    selfCareStreak: number;
  };
  insights: {
    keyPatterns: string[];
    achievements: string[];
    recommendations: string[];
  };
  auraColor: string;
  vibeScore: number;
}

interface GrowthReportsProps {
  onReportGenerated?: (report: GrowthReport) => void;
}

export default function GrowthReports({ onReportGenerated }: GrowthReportsProps) {
  const { user } = useAuth();
  const [report, setReport] = useState<GrowthReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePeriod, setActivePeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (user) {
      generateReport();
    }
  }, [user, activePeriod]);

  const generateReport = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Simulate AI-generated report based on user data
      const mockReport: GrowthReport = {
        period: activePeriod,
        moodTrends: {
          dominantMood: 'happy',
          moodDistribution: [
            { mood: 'happy', percentage: 45, emoji: '😊' },
            { mood: 'neutral', percentage: 30, emoji: '😐' },
            { mood: 'excited', percentage: 15, emoji: '🤩' },
            { mood: 'sad', percentage: 10, emoji: '😔' }
          ],
          trend: 'improving'
        },
        journalingStats: {
          totalEntries: activePeriod === 'weekly' ? 7 : 28,
          streak: activePeriod === 'weekly' ? 7 : 21,
          averageWords: 85,
          mostActiveDay: 'Tuesday'
        },
        gratitudeGrowth: {
          gratitudeEntries: activePeriod === 'weekly' ? 5 : 18,
          positiveWords: ['grateful', 'blessed', 'thankful', 'appreciative', 'fortunate'],
          growthPercentage: 23
        },
        lifestyleHighlights: {
          topActivities: [
            { activity: 'meditation', frequency: 12 },
            { activity: 'exercise', frequency: 8 },
            { activity: 'reading', frequency: 6 },
            { activity: 'music', frequency: 15 }
          ],
          wellnessScore: 78,
          selfCareStreak: 14
        },
        insights: {
          keyPatterns: [
            'You journal most consistently on Tuesdays',
            'Meditation has a strong positive correlation with your mood',
            'Your gratitude practice is growing steadily'
          ],
          achievements: [
            '🔥 7-day journal streak',
            '🧘‍♀️ Meditation champion',
            '📈 Mood improvement trend',
            '💪 Self-care consistency'
          ],
          recommendations: [
            'Try journaling in the morning for better mood throughout the day',
            'Consider adding 5 minutes of meditation to your routine',
            'Your gratitude practice is working - keep it up!'
          ]
        },
        auraColor: 'from-purple-500 to-pink-500',
        vibeScore: 78
      };
      
      setReport(mockReport);
      onReportGenerated?.(mockReport);
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600 dark:text-green-400';
      case 'declining': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const slides = [
    'mood',
    'journaling',
    'gratitude',
    'lifestyle',
    'insights'
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  if (loading) {
    return (
      <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Generating your {activePeriod} report...</span>
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
            onClick={generateReport}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="bg-white/60 dark:bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          📊 Growth Report
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActivePeriod('weekly')}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              activePeriod === 'weekly' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setActivePeriod('monthly')}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              activePeriod === 'monthly' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Header Stats */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">✨</div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Your {activePeriod === 'weekly' ? 'Week' : 'Month'} in Review
        </h3>
        <div className="flex items-center justify-center gap-4">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {report.vibeScore}/100
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Vibe Score</div>
        </div>
      </div>

      {/* Slide Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevSlide}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          ←
        </button>
        <div className="flex gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition ${
                currentSlide === index 
                  ? 'bg-purple-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
        <button
          onClick={nextSlide}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          →
        </button>
      </div>

      {/* Mood Trends Slide */}
      {currentSlide === 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-4">😊</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Mood Trends
            </h3>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl">{report.moodTrends.dominantMood === 'happy' ? '😊' : '😐'}</span>
              <span className="text-lg font-semibold capitalize">{report.moodTrends.dominantMood}</span>
              <span className={`text-lg ${getTrendColor(report.moodTrends.trend)}`}>
                {getTrendIcon(report.moodTrends.trend)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {report.moodTrends.moodDistribution.map((mood, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="font-medium text-gray-900 dark:text-white capitalize">{mood.mood}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${mood.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12 text-right">
                    {mood.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Journaling Stats Slide */}
      {currentSlide === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-4">📔</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Journaling Stats
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700 text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {report.journalingStats.totalEntries}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Entries</div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700 text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {report.journalingStats.streak}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700 text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {report.journalingStats.averageWords}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Words</div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700 text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {report.journalingStats.mostActiveDay}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Most Active</div>
            </div>
          </div>
        </div>
      )}

      {/* Gratitude Growth Slide */}
      {currentSlide === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🙏</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Gratitude Growth
            </h3>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              +{report.gratitudeGrowth.growthPercentage}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Growth this {activePeriod}</div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {report.gratitudeGrowth.gratitudeEntries}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Gratitude Entries</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Your Positive Words</h4>
              <div className="flex flex-wrap gap-2">
                {report.gratitudeGrowth.positiveWords.map((word, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lifestyle Highlights Slide */}
      {currentSlide === 3 && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-4">💪</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Lifestyle Highlights
            </h3>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {report.lifestyleHighlights.wellnessScore}/100
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Wellness Score</div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-white">Top Activities</h4>
            {report.lifestyleHighlights.topActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {activity.activity}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      style={{ width: `${(activity.frequency / 15) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
                    {activity.frequency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights Slide */}
      {currentSlide === 4 && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-4">💡</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Key Insights
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Patterns</h4>
              <div className="space-y-2">
                {report.insights.keyPatterns.map((pattern, index) => (
                  <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">🔍</span>
                      <span className="text-gray-800 dark:text-gray-200">{pattern}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Achievements</h4>
              <div className="space-y-2">
                {report.insights.achievements.map((achievement, index) => (
                  <div key={index} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">🏆</span>
                      <span className="text-gray-800 dark:text-gray-200">{achievement}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Button */}
      <div className="mt-6 text-center">
        <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:scale-105 transition font-medium">
          Share Your Growth 📈
        </button>
      </div>
    </div>
  );
}