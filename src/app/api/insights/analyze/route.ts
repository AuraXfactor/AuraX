import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';

interface JournalEntry {
  id: string;
  entryText: string;
  moodTag: string;
  activities: string[];
  affirmation?: string;
  auraScore?: number;
  createdAt: Timestamp;
  dateKey?: string;
}

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

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Fetch user's journal entries from the last 30 days
    const entriesRef = collection(db, 'journals', userId, 'entries');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const q = query(
      entriesRef,
      where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const entries: JournalEntry[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as JournalEntry));

    if (entries.length === 0) {
      return NextResponse.json({
        insights: {
          moodPatterns: [],
          activityCorrelations: [],
          weeklyTrends: [],
          personalizedInsights: ['Start journaling to get personalized insights!'],
          recommendations: ['Try logging your mood and activities daily to see patterns emerge.'],
          riskFactors: [],
          positivePatterns: []
        }
      });
    }

    // Analyze mood patterns
    const moodPatterns = analyzeMoodPatterns(entries);
    
    // Analyze activity correlations
    const activityCorrelations = analyzeActivityCorrelations(entries);
    
    // Analyze weekly trends
    const weeklyTrends = analyzeWeeklyTrends(entries);
    
    // Generate personalized insights
    const personalizedInsights = generatePersonalizedInsights(entries, moodPatterns, activityCorrelations);
    
    // Generate recommendations
    const recommendations = generateRecommendations(entries, moodPatterns, activityCorrelations);
    
    // Identify risk factors
    const riskFactors = identifyRiskFactors(entries, moodPatterns);
    
    // Identify positive patterns
    const positivePatterns = identifyPositivePatterns(entries, activityCorrelations);

    const insights: AIInsights = {
      moodPatterns,
      activityCorrelations,
      weeklyTrends,
      personalizedInsights,
      recommendations,
      riskFactors,
      positivePatterns
    };

    return NextResponse.json({ insights });

  } catch (error) {
    console.error('Error analyzing journal insights:', error);
    return NextResponse.json(
      { error: 'Failed to analyze journal insights' },
      { status: 500 }
    );
  }
}

function analyzeMoodPatterns(entries: JournalEntry[]): MoodPattern[] {
  const moodCounts: Record<string, number> = {};
  const moodValues: Record<string, number> = {
    'excited': 5,
    'happy': 4,
    'fine': 3,
    'neutral': 3,
    'sad': 2,
    'stressed': 2,
    'anxious': 1,
    'angry': 1
  };

  entries.forEach(entry => {
    moodCounts[entry.moodTag] = (moodCounts[entry.moodTag] || 0) + 1;
  });

  const totalEntries = entries.length;
  const patterns: MoodPattern[] = [];

  Object.entries(moodCounts).forEach(([mood, count]) => {
    const percentage = (count / totalEntries) * 100;
    
    // Calculate trend (simplified - compare first half vs second half)
    const firstHalf = entries.slice(0, Math.floor(entries.length / 2));
    const secondHalf = entries.slice(Math.floor(entries.length / 2));
    
    const firstHalfCount = firstHalf.filter(e => e.moodTag === mood).length;
    const secondHalfCount = secondHalf.filter(e => e.moodTag === mood).length;
    
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (secondHalfCount > firstHalfCount * 1.2) trend = 'increasing';
    else if (secondHalfCount < firstHalfCount * 0.8) trend = 'decreasing';

    patterns.push({
      mood,
      frequency: count,
      percentage,
      trend
    });
  });

  return patterns.sort((a, b) => b.frequency - a.frequency);
}

function analyzeActivityCorrelations(entries: JournalEntry[]): ActivityCorrelation[] {
  const activityMoodMap: Record<string, number[]> = {};
  const activityFrequency: Record<string, number> = {};

  entries.forEach(entry => {
    const moodValue = getMoodValue(entry.moodTag);
    entry.activities.forEach(activity => {
      if (!activityMoodMap[activity]) {
        activityMoodMap[activity] = [];
      }
      activityMoodMap[activity].push(moodValue);
      activityFrequency[activity] = (activityFrequency[activity] || 0) + 1;
    });
  });

  const correlations: ActivityCorrelation[] = [];

  Object.entries(activityMoodMap).forEach(([activity, moodValues]) => {
    if (moodValues.length < 2) return; // Need at least 2 data points
    
    const averageMood = moodValues.reduce((sum, mood) => sum + mood, 0) / moodValues.length;
    const baselineMood = 3; // Neutral mood baseline
    const moodImprovement = averageMood - baselineMood;
    
    let correlation: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (moodImprovement > 0.5) correlation = 'positive';
    else if (moodImprovement < -0.5) correlation = 'negative';

    correlations.push({
      activity,
      moodImprovement,
      frequency: activityFrequency[activity],
      correlation
    });
  });

  return correlations.sort((a, b) => b.moodImprovement - a.moodImprovement);
}

function analyzeWeeklyTrends(entries: JournalEntry[]): WeeklyInsight[] {
  const weeklyData: Record<string, JournalEntry[]> = {};
  
  entries.forEach(entry => {
    const date = entry.createdAt.toDate();
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = [];
    }
    weeklyData[weekKey].push(entry);
  });

  const weeklyTrends: WeeklyInsight[] = [];

  Object.entries(weeklyData).forEach(([week, weekEntries]) => {
    const averageMood = weekEntries.reduce((sum, entry) => sum + getMoodValue(entry.moodTag), 0) / weekEntries.length;
    
    const activityCounts: Record<string, number> = {};
    weekEntries.forEach(entry => {
      entry.activities.forEach(activity => {
        activityCounts[activity] = (activityCounts[activity] || 0) + 1;
      });
    });
    
    const topActivities = Object.entries(activityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([activity]) => activity);

    // Calculate mood trend for this week
    const midWeek = Math.floor(weekEntries.length / 2);
    const firstHalfMood = weekEntries.slice(0, midWeek).reduce((sum, entry) => sum + getMoodValue(entry.moodTag), 0) / midWeek;
    const secondHalfMood = weekEntries.slice(midWeek).reduce((sum, entry) => sum + getMoodValue(entry.moodTag), 0) / (weekEntries.length - midWeek);
    
    let moodTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (secondHalfMood > firstHalfMood + 0.3) moodTrend = 'improving';
    else if (secondHalfMood < firstHalfMood - 0.3) moodTrend = 'declining';

    const keyInsights = generateWeeklyInsights(weekEntries, averageMood, moodTrend);

    weeklyTrends.push({
      week,
      averageMood,
      totalEntries: weekEntries.length,
      topActivities,
      moodTrend,
      keyInsights
    });
  });

  return weeklyTrends.sort((a, b) => new Date(b.week).getTime() - new Date(a.week).getTime());
}

function generatePersonalizedInsights(
  entries: JournalEntry[], 
  moodPatterns: MoodPattern[], 
  activityCorrelations: ActivityCorrelation[]
): string[] {
  const insights: string[] = [];
  
  // Mood pattern insights
  const mostCommonMood = moodPatterns[0];
  if (mostCommonMood) {
    if (mostCommonMood.mood === 'happy' || mostCommonMood.mood === 'excited') {
      insights.push(`You're feeling ${mostCommonMood.mood} ${mostCommonMood.percentage.toFixed(0)}% of the time - that's wonderful!`);
    } else if (mostCommonMood.mood === 'sad' || mostCommonMood.mood === 'stressed') {
      insights.push(`You've been feeling ${mostCommonMood.mood} ${mostCommonMood.percentage.toFixed(0)}% of the time. Consider reaching out for support.`);
    }
  }

  // Activity correlation insights
  const positiveActivities = activityCorrelations.filter(a => a.correlation === 'positive');
  if (positiveActivities.length > 0) {
    const topActivity = positiveActivities[0];
    insights.push(`Your mood improves significantly when you ${topActivity.activity.toLowerCase()}. Keep it up!`);
  }

  // Streak insights
  const recentEntries = entries.slice(0, 7);
  if (recentEntries.length >= 5) {
    insights.push(`You've been consistent with journaling - ${recentEntries.length} entries in the last week!`);
  }

  return insights;
}

function generateRecommendations(
  entries: JournalEntry[], 
  moodPatterns: MoodPattern[], 
  activityCorrelations: ActivityCorrelation[]
): string[] {
  const recommendations: string[] = [];
  
  // Activity recommendations
  const positiveActivities = activityCorrelations.filter(a => a.correlation === 'positive');
  if (positiveActivities.length > 0) {
    recommendations.push(`Try to incorporate more ${positiveActivities[0].activity.toLowerCase()} into your routine.`);
  }

  // Mood-based recommendations
  const negativeMoods = moodPatterns.filter(p => ['sad', 'stressed', 'anxious', 'angry'].includes(p.mood));
  if (negativeMoods.length > 0) {
    recommendations.push('Consider practicing mindfulness or reaching out to a friend when you notice negative emotions.');
  }

  // Consistency recommendations
  if (entries.length < 10) {
    recommendations.push('Try to journal daily to get better insights into your patterns.');
  }

  return recommendations;
}

function identifyRiskFactors(entries: JournalEntry[], moodPatterns: MoodPattern[]): string[] {
  const riskFactors: string[] = [];
  
  // Check for consecutive negative moods
  let consecutiveNegative = 0;
  let maxConsecutive = 0;
  
  entries.forEach(entry => {
    if (['sad', 'stressed', 'anxious', 'angry'].includes(entry.moodTag)) {
      consecutiveNegative++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveNegative);
    } else {
      consecutiveNegative = 0;
    }
  });

  if (maxConsecutive >= 3) {
    riskFactors.push('Multiple consecutive days of negative mood detected');
  }

  // Check for declining mood trend
  const decliningMoods = moodPatterns.filter(p => p.trend === 'decreasing' && ['sad', 'stressed', 'anxious', 'angry'].includes(p.mood));
  if (decliningMoods.length > 0) {
    riskFactors.push('Declining mood trend detected');
  }

  return riskFactors;
}

function identifyPositivePatterns(entries: JournalEntry[], activityCorrelations: ActivityCorrelation[]): string[] {
  const patterns: string[] = [];
  
  const positiveActivities = activityCorrelations.filter(a => a.correlation === 'positive');
  if (positiveActivities.length > 0) {
    patterns.push(`Strong positive correlation with ${positiveActivities[0].activity.toLowerCase()}`);
  }

  const highAuraEntries = entries.filter(e => (e.auraScore || 0) > 20);
  if (highAuraEntries.length > entries.length * 0.3) {
    patterns.push('Frequently achieving high Aura scores');
  }

  return patterns;
}

function generateWeeklyInsights(entries: JournalEntry[], averageMood: number, moodTrend: string): string[] {
  const insights: string[] = [];
  
  if (averageMood > 4) {
    insights.push('Great week with positive mood overall');
  } else if (averageMood < 2.5) {
    insights.push('Challenging week - consider self-care activities');
  }

  if (moodTrend === 'improving') {
    insights.push('Mood is trending upward this week');
  } else if (moodTrend === 'declining') {
    insights.push('Mood trend declining - reach out for support if needed');
  }

  return insights;
}

function getMoodValue(mood: string): number {
  const moodValues: Record<string, number> = {
    'excited': 5,
    'happy': 4,
    'fine': 3,
    'neutral': 3,
    'sad': 2,
    'stressed': 2,
    'anxious': 1,
    'angry': 1
  };
  return moodValues[mood] || 3;
}