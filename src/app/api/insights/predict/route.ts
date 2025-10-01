import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, limit, Timestamp } from 'firebase/firestore';

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

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Fetch user's journal entries from the last 14 days for prediction
    const entriesRef = collection(db, 'journals', userId, 'entries');
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    const q = query(
      entriesRef,
      where('createdAt', '>=', Timestamp.fromDate(fourteenDaysAgo)),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const entries: JournalEntry[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as JournalEntry));

    if (entries.length < 3) {
      return NextResponse.json({
        prediction: {
          predictedMood: 'neutral',
          confidence: 0.3,
          riskLevel: 'low',
          factors: ['Insufficient data for accurate prediction'],
          recommendations: ['Continue journaling to improve prediction accuracy'],
          proactiveActions: ['Try to journal daily for better insights']
        },
        suggestions: generateDefaultSuggestions()
      });
    }

    // Analyze patterns and predict mood
    const prediction = predictMood(entries);
    
    // Generate proactive wellness suggestions
    const suggestions = generateWellnessSuggestions(entries, prediction);

    return NextResponse.json({ 
      prediction,
      suggestions 
    });

  } catch (error) {
    console.error('Error predicting mood:', error);
    return NextResponse.json(
      { error: 'Failed to predict mood' },
      { status: 500 }
    );
  }
}

function predictMood(entries: JournalEntry[]): MoodPrediction {
  // Analyze recent mood trends
  const recentMoods = entries.slice(0, 7).map(e => e.moodTag);
  const moodTrend = analyzeMoodTrend(recentMoods);
  
  // Analyze activity patterns
  const activityPatterns = analyzeActivityPatterns(entries);
  
  // Analyze time-based patterns
  const timePatterns = analyzeTimePatterns(entries);
  
  // Analyze stress indicators
  const stressIndicators = analyzeStressIndicators(entries);
  
  // Combine factors to make prediction
  const factors: string[] = [];
  let predictedMood = 'neutral';
  let confidence = 0.5;
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  
  // Mood trend analysis
  if (moodTrend.trend === 'declining') {
    factors.push('Declining mood trend detected');
    predictedMood = moodTrend.likelyNextMood;
    confidence += 0.2;
    if (moodTrend.severity > 0.7) {
      riskLevel = 'high';
    } else if (moodTrend.severity > 0.4) {
      riskLevel = 'medium';
    }
  } else if (moodTrend.trend === 'improving') {
    factors.push('Improving mood trend detected');
    predictedMood = moodTrend.likelyNextMood;
    confidence += 0.15;
  }
  
  // Activity pattern analysis
  if (activityPatterns.positiveActivities.length > 0) {
    factors.push(`Positive correlation with ${activityPatterns.positiveActivities[0]}`);
    if (predictedMood === 'neutral') {
      predictedMood = 'happy';
      confidence += 0.1;
    }
  }
  
  if (activityPatterns.negativeActivities.length > 0) {
    factors.push(`Negative correlation with ${activityPatterns.negativeActivities[0]}`);
    if (predictedMood === 'neutral') {
      predictedMood = 'stressed';
      confidence += 0.1;
    }
  }
  
  // Time pattern analysis
  if (timePatterns.weekendEffect) {
    factors.push('Weekend mood patterns detected');
    confidence += 0.1;
  }
  
  if (timePatterns.morningMood) {
    factors.push('Morning mood patterns detected');
    confidence += 0.1;
  }
  
  // Stress indicator analysis
  if (stressIndicators.highStress) {
    factors.push('High stress indicators detected');
    predictedMood = 'stressed';
    riskLevel = 'high';
    confidence += 0.2;
  }
  
  if (stressIndicators.anxietyPattern) {
    factors.push('Anxiety patterns detected');
    if (predictedMood === 'neutral') {
      predictedMood = 'anxious';
    }
    riskLevel = 'medium';
    confidence += 0.15;
  }
  
  // Generate recommendations based on prediction
  const recommendations = generateRecommendations(predictedMood, riskLevel, factors);
  
  // Generate proactive actions
  const proactiveActions = generateProactiveActions(predictedMood, riskLevel, activityPatterns);

  return {
    predictedMood,
    confidence: Math.min(confidence, 0.95),
    riskLevel,
    factors,
    recommendations,
    proactiveActions
  };
}

function analyzeMoodTrend(moods: string[]): {
  trend: 'improving' | 'declining' | 'stable';
  severity: number;
  likelyNextMood: string;
} {
  if (moods.length < 2) {
    return { trend: 'stable', severity: 0, likelyNextMood: 'neutral' };
  }
  
  const moodValues = moods.map(m => getMoodValue(m));
  const firstHalf = moodValues.slice(0, Math.ceil(moodValues.length / 2));
  const secondHalf = moodValues.slice(Math.ceil(moodValues.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  const difference = secondAvg - firstAvg;
  const severity = Math.abs(difference);
  
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (difference > 0.3) trend = 'improving';
  else if (difference < -0.3) trend = 'declining';
  
  // Predict likely next mood based on trend
  let likelyNextMood = 'neutral';
  if (trend === 'declining') {
    const recentMood = moods[0];
    if (recentMood === 'happy') likelyNextMood = 'fine';
    else if (recentMood === 'fine') likelyNextMood = 'sad';
    else if (recentMood === 'sad') likelyNextMood = 'stressed';
    else if (recentMood === 'stressed') likelyNextMood = 'anxious';
  } else if (trend === 'improving') {
    const recentMood = moods[0];
    if (recentMood === 'sad') likelyNextMood = 'fine';
    else if (recentMood === 'fine') likelyNextMood = 'happy';
    else if (recentMood === 'happy') likelyNextMood = 'excited';
  }
  
  return { trend, severity, likelyNextMood };
}

function analyzeActivityPatterns(entries: JournalEntry[]): {
  positiveActivities: string[];
  negativeActivities: string[];
  activityFrequency: Record<string, number>;
} {
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
  
  const positiveActivities: string[] = [];
  const negativeActivities: string[] = [];
  
  Object.entries(activityMoodMap).forEach(([activity, moodValues]) => {
    if (moodValues.length < 2) return;
    
    const averageMood = moodValues.reduce((sum, mood) => sum + mood, 0) / moodValues.length;
    const baselineMood = 3;
    
    if (averageMood > baselineMood + 0.5) {
      positiveActivities.push(activity);
    } else if (averageMood < baselineMood - 0.5) {
      negativeActivities.push(activity);
    }
  });
  
  return {
    positiveActivities: positiveActivities.sort((a, b) => 
      activityFrequency[b] - activityFrequency[a]
    ),
    negativeActivities: negativeActivities.sort((a, b) => 
      activityFrequency[b] - activityFrequency[a]
    ),
    activityFrequency
  };
}

function analyzeTimePatterns(entries: JournalEntry[]): {
  weekendEffect: boolean;
  morningMood: boolean;
  timePatterns: Record<string, number>;
} {
  const timePatterns: Record<string, number> = {};
  let weekendMoodSum = 0;
  let weekendCount = 0;
  let weekdayMoodSum = 0;
  let weekdayCount = 0;
  
  entries.forEach(entry => {
    const date = entry.createdAt.toDate();
    const dayOfWeek = date.getDay();
    const hour = date.getHours();
    const moodValue = getMoodValue(entry.moodTag);
    
    // Weekend vs weekday analysis
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
      weekendMoodSum += moodValue;
      weekendCount++;
    } else {
      weekdayMoodSum += moodValue;
      weekdayCount++;
    }
    
    // Time of day analysis
    const timeKey = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    if (!timePatterns[timeKey]) {
      timePatterns[timeKey] = 0;
    }
    timePatterns[timeKey] += moodValue;
  });
  
  const weekendEffect = weekendCount > 0 && weekdayCount > 0 && 
    (weekendMoodSum / weekendCount) > (weekdayMoodSum / weekdayCount) + 0.5;
  
  const morningMood = timePatterns.morning > 0 && 
    timePatterns.morning / (entries.filter(e => e.createdAt.toDate().getHours() < 12).length) > 3.5;
  
  return {
    weekendEffect,
    morningMood,
    timePatterns
  };
}

function analyzeStressIndicators(entries: JournalEntry[]): {
  highStress: boolean;
  anxietyPattern: boolean;
  stressFactors: string[];
} {
  const stressFactors: string[] = [];
  let highStress = false;
  let anxietyPattern = false;
  
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
    highStress = true;
    stressFactors.push('Multiple consecutive negative mood days');
  }
  
  // Check for anxiety patterns
  const anxietyCount = entries.filter(e => e.moodTag === 'anxious').length;
  if (anxietyCount >= entries.length * 0.3) {
    anxietyPattern = true;
    stressFactors.push('Frequent anxiety episodes');
  }
  
  // Check for low aura scores
  const lowAuraEntries = entries.filter(e => (e.auraScore || 0) < 15);
  if (lowAuraEntries.length >= entries.length * 0.4) {
    highStress = true;
    stressFactors.push('Consistently low energy/motivation');
  }
  
  return {
    highStress,
    anxietyPattern,
    stressFactors
  };
}

function generateRecommendations(
  predictedMood: string, 
  riskLevel: string, 
  factors: string[]
): string[] {
  const recommendations: string[] = [];
  
  if (riskLevel === 'high') {
    recommendations.push('Consider reaching out to a mental health professional');
    recommendations.push('Prioritize self-care and stress management');
  }
  
  if (predictedMood === 'stressed' || predictedMood === 'anxious') {
    recommendations.push('Practice deep breathing or meditation');
    recommendations.push('Try to identify and address stress sources');
  }
  
  if (predictedMood === 'sad') {
    recommendations.push('Engage in activities that usually bring you joy');
    recommendations.push('Connect with supportive friends or family');
  }
  
  if (predictedMood === 'angry') {
    recommendations.push('Find healthy ways to express your emotions');
    recommendations.push('Consider what might be triggering these feelings');
  }
  
  return recommendations;
}

function generateProactiveActions(
  predictedMood: string, 
  riskLevel: string, 
  activityPatterns: any
): string[] {
  const actions: string[] = [];
  
  // Suggest positive activities
  if (activityPatterns.positiveActivities.length > 0) {
    actions.push(`Try ${activityPatterns.positiveActivities[0]} - it usually helps your mood`);
  }
  
  // Mood-specific proactive actions
  switch (predictedMood) {
    case 'stressed':
      actions.push('Schedule some relaxation time today');
      actions.push('Break down overwhelming tasks into smaller steps');
      break;
    case 'anxious':
      actions.push('Practice grounding techniques');
      actions.push('Limit caffeine and get adequate sleep');
      break;
    case 'sad':
      actions.push('Reach out to a friend or loved one');
      actions.push('Engage in gentle, comforting activities');
      break;
    case 'angry':
      actions.push('Take a walk or engage in physical activity');
      actions.push('Practice mindfulness or meditation');
      break;
    default:
      actions.push('Continue with activities that support your wellbeing');
  }
  
  return actions;
}

function generateWellnessSuggestions(entries: JournalEntry[], prediction: MoodPrediction): WellnessSuggestion[] {
  const suggestions: WellnessSuggestion[] = [];
  
  // Mood-based suggestions
  if (prediction.predictedMood === 'stressed' || prediction.riskLevel === 'high') {
    suggestions.push({
      type: 'mindfulness',
      title: '5-Minute Breathing Exercise',
      description: 'A quick breathing exercise to help reduce stress and anxiety',
      priority: 'high',
      estimatedDuration: '5 minutes',
      moodImpact: 'positive'
    });
    
    suggestions.push({
      type: 'self_care',
      title: 'Gentle Self-Care Routine',
      description: 'Take time for gentle activities that nurture your wellbeing',
      priority: 'high',
      estimatedDuration: '15-30 minutes',
      moodImpact: 'positive'
    });
  }
  
  if (prediction.predictedMood === 'anxious') {
    suggestions.push({
      type: 'mindfulness',
      title: 'Grounding Exercise',
      description: 'Use your senses to ground yourself in the present moment',
      priority: 'high',
      estimatedDuration: '10 minutes',
      moodImpact: 'positive'
    });
  }
  
  if (prediction.predictedMood === 'sad') {
    suggestions.push({
      type: 'social',
      title: 'Connect with Support System',
      description: 'Reach out to friends, family, or support groups',
      priority: 'high',
      estimatedDuration: '20-30 minutes',
      moodImpact: 'positive'
    });
  }
  
  // General wellness suggestions
  suggestions.push({
    type: 'activity',
    title: 'Light Physical Activity',
    description: 'A gentle walk or stretching to boost mood and energy',
    priority: 'medium',
    estimatedDuration: '10-20 minutes',
    moodImpact: 'positive'
  });
  
  suggestions.push({
    type: 'mindfulness',
    title: 'Gratitude Practice',
    description: 'Reflect on three things you\'re grateful for today',
    priority: 'medium',
    estimatedDuration: '5-10 minutes',
    moodImpact: 'positive'
  });
  
  return suggestions.slice(0, 4); // Return top 4 suggestions
}

function generateDefaultSuggestions(): WellnessSuggestion[] {
  return [
    {
      type: 'mindfulness',
      title: 'Daily Check-in',
      description: 'Take a moment to check in with yourself and your emotions',
      priority: 'medium',
      estimatedDuration: '5 minutes',
      moodImpact: 'positive'
    },
    {
      type: 'activity',
      title: 'Gentle Movement',
      description: 'Engage in light physical activity to boost your mood',
      priority: 'medium',
      estimatedDuration: '15 minutes',
      moodImpact: 'positive'
    }
  ];
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