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

interface SmartPrompt {
  id: string;
  prompt: string;
  category: 'mood' | 'gratitude' | 'reflection' | 'crisis' | 'growth' | 'celebration';
  priority: 'high' | 'medium' | 'low';
  context: string;
  suggestedActivities?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { userId, currentMood, recentActivities } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Fetch recent entries for context
    const entriesRef = collection(db, 'journals', userId, 'entries');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const q = query(
      entriesRef,
      where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo)),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    const snapshot = await getDocs(q);
    const recentEntries: JournalEntry[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as JournalEntry));

    // Generate smart prompts based on current context
    const prompts = generateSmartPrompts(currentMood, recentActivities, recentEntries);

    return NextResponse.json({ prompts });

  } catch (error) {
    console.error('Error generating smart prompts:', error);
    return NextResponse.json(
      { error: 'Failed to generate smart prompts' },
      { status: 500 }
    );
  }
}

function generateSmartPrompts(
  currentMood?: string, 
  recentActivities?: string[], 
  recentEntries: JournalEntry[] = []
): SmartPrompt[] {
  const prompts: SmartPrompt[] = [];
  
  // Analyze recent patterns
  const recentMoods = recentEntries.map(e => e.moodTag);
  const recentActivitiesList = recentEntries.flatMap(e => e.activities);
  const hasNegativeStreak = checkNegativeStreak(recentMoods);
  const hasPositiveStreak = checkPositiveStreak(recentMoods);

  // Mood-based prompts
  if (currentMood) {
    prompts.push(...generateMoodBasedPrompts(currentMood, hasNegativeStreak));
  }

  // Activity-based prompts
  if (recentActivities && recentActivities.length > 0) {
    prompts.push(...generateActivityBasedPrompts(recentActivities));
  }

  // Pattern-based prompts
  prompts.push(...generatePatternBasedPrompts(recentEntries, hasNegativeStreak, hasPositiveStreak));

  // Time-based prompts
  prompts.push(...generateTimeBasedPrompts());

  // Crisis support prompts (if needed)
  if (hasNegativeStreak || (currentMood && ['sad', 'stressed', 'anxious', 'angry'].includes(currentMood))) {
    prompts.push(...generateCrisisSupportPrompts());
  }

  // Celebration prompts (if positive streak)
  if (hasPositiveStreak || (currentMood && ['happy', 'excited'].includes(currentMood))) {
    prompts.push(...generateCelebrationPrompts());
  }

  // Sort by priority and return top 5
  return prompts
    .sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, 5);
}

function generateMoodBasedPrompts(currentMood: string, hasNegativeStreak: boolean): SmartPrompt[] {
  const prompts: SmartPrompt[] = [];

  switch (currentMood) {
    case 'excited':
      prompts.push({
        id: 'excited-1',
        prompt: "What's making you feel so excited today? How can you channel this energy into something meaningful?",
        category: 'celebration',
        priority: 'high',
        context: 'User is feeling excited',
        suggestedActivities: ['exercise', 'creative_project', 'social_activity']
      });
      break;

    case 'happy':
      prompts.push({
        id: 'happy-1',
        prompt: "What brought you joy today? How can you create more moments like this?",
        category: 'celebration',
        priority: 'high',
        context: 'User is feeling happy',
        suggestedActivities: ['gratitude', 'social_connection', 'hobby']
      });
      break;

    case 'fine':
      prompts.push({
        id: 'fine-1',
        prompt: "You're feeling okay today. What small thing could you do to elevate your mood?",
        category: 'mood',
        priority: 'medium',
        context: 'User is feeling neutral',
        suggestedActivities: ['gratitude', 'music', 'outdoors']
      });
      break;

    case 'neutral':
      prompts.push({
        id: 'neutral-1',
        prompt: "How are you really feeling beneath the surface? What emotions might be present?",
        category: 'reflection',
        priority: 'medium',
        context: 'User is feeling neutral',
        suggestedActivities: ['meditation', 'journaling', 'self_reflection']
      });
      break;

    case 'sad':
      prompts.push({
        id: 'sad-1',
        prompt: "I notice you're feeling sad. What's weighing on your heart today? Remember, it's okay to feel this way.",
        category: 'crisis',
        priority: 'high',
        context: 'User is feeling sad',
        suggestedActivities: ['self_compassion', 'gentle_activity', 'support_system']
      });
      break;

    case 'stressed':
      prompts.push({
        id: 'stressed-1',
        prompt: "Stress can be overwhelming. What's causing you the most stress right now? What's one small thing you can do to help yourself?",
        category: 'crisis',
        priority: 'high',
        context: 'User is feeling stressed',
        suggestedActivities: ['breathing', 'prioritization', 'self_care']
      });
      break;

    case 'anxious':
      prompts.push({
        id: 'anxious-1',
        prompt: "Anxiety can feel consuming. What are you worried about? What's one thing that's within your control right now?",
        category: 'crisis',
        priority: 'high',
        context: 'User is feeling anxious',
        suggestedActivities: ['grounding', 'breathing', 'mindfulness']
      });
      break;

    case 'angry':
      prompts.push({
        id: 'angry-1',
        prompt: "Anger is a valid emotion. What's making you angry? How can you express this feeling in a healthy way?",
        category: 'crisis',
        priority: 'high',
        context: 'User is feeling angry',
        suggestedActivities: ['physical_release', 'communication', 'cooling_down']
      });
      break;
  }

  return prompts;
}

function generateActivityBasedPrompts(recentActivities: string[]): SmartPrompt[] {
  const prompts: SmartPrompt[] = [];

  if (recentActivities.includes('exercise')) {
    prompts.push({
      id: 'exercise-1',
      prompt: "You've been exercising! How did your body feel during and after? What did you learn about your physical strength?",
      category: 'growth',
      priority: 'medium',
      context: 'User has been exercising',
      suggestedActivities: ['reflection', 'goal_setting', 'celebration']
    });
  }

  if (recentActivities.includes('meditation')) {
    prompts.push({
      id: 'meditation-1',
      prompt: "Meditation is a powerful practice. What thoughts or feelings came up during your practice? How did you feel afterward?",
      category: 'reflection',
      priority: 'medium',
      context: 'User has been meditating',
      suggestedActivities: ['mindfulness', 'self_awareness', 'peace']
    });
  }

  if (recentActivities.includes('gratitude')) {
    prompts.push({
      id: 'gratitude-1',
      prompt: "Gratitude practice is wonderful! What are three things you're grateful for today that you might not have noticed before?",
      category: 'gratitude',
      priority: 'high',
      context: 'User has been practicing gratitude',
      suggestedActivities: ['appreciation', 'mindfulness', 'positive_thinking']
    });
  }

  return prompts;
}

function generatePatternBasedPrompts(
  recentEntries: JournalEntry[], 
  hasNegativeStreak: boolean, 
  hasPositiveStreak: boolean
): SmartPrompt[] {
  const prompts: SmartPrompt[] = [];

  if (hasNegativeStreak) {
    prompts.push({
      id: 'negative-streak-1',
      prompt: "I notice you've been having some challenging days. What's one small thing that brought you comfort or joy recently?",
      category: 'crisis',
      priority: 'high',
      context: 'User has had multiple negative mood days',
      suggestedActivities: ['self_compassion', 'support_seeking', 'gentle_activities']
    });
  }

  if (hasPositiveStreak) {
    prompts.push({
      id: 'positive-streak-1',
      prompt: "You've been feeling good lately! What patterns or activities do you think are contributing to this positive streak?",
      category: 'celebration',
      priority: 'high',
      context: 'User has had multiple positive mood days',
      suggestedActivities: ['pattern_recognition', 'celebration', 'goal_setting']
    });
  }

  // Check for lack of activities
  const recentActivityCount = recentEntries.reduce((sum, entry) => sum + entry.activities.length, 0);
  if (recentActivityCount < recentEntries.length * 0.5) {
    prompts.push({
      id: 'low-activity-1',
      prompt: "I notice you haven't been logging many activities lately. What's one thing you did today that brought you any kind of satisfaction?",
      category: 'reflection',
      priority: 'medium',
      context: 'User has been logging fewer activities',
      suggestedActivities: ['activity_tracking', 'self_awareness', 'routine_building']
    });
  }

  return prompts;
}

function generateTimeBasedPrompts(): SmartPrompt[] {
  const prompts: SmartPrompt[] = [];
  const hour = new Date().getHours();

  if (hour < 12) {
    prompts.push({
      id: 'morning-1',
      prompt: "Good morning! What's one thing you're looking forward to today? How do you want to feel by the end of the day?",
      category: 'reflection',
      priority: 'medium',
      context: 'Morning journaling',
      suggestedActivities: ['goal_setting', 'intention_setting', 'planning']
    });
  } else if (hour < 18) {
    prompts.push({
      id: 'afternoon-1',
      prompt: "How's your day going so far? What's been the highlight? What's been challenging?",
      category: 'reflection',
      priority: 'medium',
      context: 'Afternoon journaling',
      suggestedActivities: ['midday_checkin', 'reflection', 'adjustment']
    });
  } else {
    prompts.push({
      id: 'evening-1',
      prompt: "As your day winds down, what are you most grateful for today? What did you learn about yourself?",
      category: 'gratitude',
      priority: 'high',
      context: 'Evening journaling',
      suggestedActivities: ['gratitude', 'reflection', 'celebration']
    });
  }

  return prompts;
}

function generateCrisisSupportPrompts(): SmartPrompt[] {
  return [
    {
      id: 'crisis-1',
      prompt: "You're going through a tough time, and that's okay. What's one thing that's still good in your life right now?",
      category: 'crisis',
      priority: 'high',
      context: 'Crisis support needed',
      suggestedActivities: ['self_compassion', 'support_seeking', 'gentle_activities']
    },
    {
      id: 'crisis-2',
      prompt: "When you're feeling overwhelmed, what usually helps you feel a little better? Can you try that today?",
      category: 'crisis',
      priority: 'high',
      context: 'Crisis support needed',
      suggestedActivities: ['coping_strategies', 'self_care', 'support_system']
    },
    {
      id: 'crisis-3',
      prompt: "Remember, this feeling is temporary. What's one small step you can take right now to care for yourself?",
      category: 'crisis',
      priority: 'high',
      context: 'Crisis support needed',
      suggestedActivities: ['immediate_self_care', 'grounding', 'support_seeking']
    }
  ];
}

function generateCelebrationPrompts(): SmartPrompt[] {
  return [
    {
      id: 'celebration-1',
      prompt: "You're on a positive streak! What's working well for you? How can you maintain this momentum?",
      category: 'celebration',
      priority: 'high',
      context: 'Positive streak celebration',
      suggestedActivities: ['pattern_recognition', 'goal_setting', 'celebration']
    },
    {
      id: 'celebration-2',
      prompt: "Your positive energy is wonderful! What would you like to accomplish while you're feeling this good?",
      category: 'celebration',
      priority: 'medium',
      context: 'Positive energy celebration',
      suggestedActivities: ['goal_setting', 'creative_expression', 'social_connection']
    }
  ];
}

function checkNegativeStreak(moods: string[]): boolean {
  const negativeMoods = ['sad', 'stressed', 'anxious', 'angry'];
  let consecutiveNegative = 0;
  
  for (const mood of moods.slice(0, 3)) { // Check last 3 entries
    if (negativeMoods.includes(mood)) {
      consecutiveNegative++;
    } else {
      break;
    }
  }
  
  return consecutiveNegative >= 2;
}

function checkPositiveStreak(moods: string[]): boolean {
  const positiveMoods = ['happy', 'excited'];
  let consecutivePositive = 0;
  
  for (const mood of moods.slice(0, 3)) { // Check last 3 entries
    if (positiveMoods.includes(mood)) {
      consecutivePositive++;
    } else {
      break;
    }
  }
  
  return consecutivePositive >= 2;
}