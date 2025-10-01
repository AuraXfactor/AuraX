import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // Create the first weekly quest
    const weeklyQuest = {
      title: 'Mindful Week Challenge',
      description: 'Complete 5 meditation sessions and 3 journal entries this week',
      requirement: {
        type: 'variety',
        target: 8,
        activities: ['meditation_complete', 'journal_entry']
      },
      reward: {
        points: 100,
        badge: 'mindful_warrior',
        special: 'unlock_zen_theme'
      },
      duration: {
        startDate: serverTimestamp(),
        endDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7 days from now
      },
      isActive: true,
      difficulty: 'medium',
      category: 'mindfulness',
      maxParticipants: 1000,
      currentParticipants: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Create the 7-day challenge
    const sevenDayChallenge = {
      title: '7-Day Wellness Transformation',
      description: 'Complete daily activities for 7 consecutive days to transform your wellness journey',
      requirement: {
        type: 'streak',
        target: 7,
        activities: ['journal_entry', 'meditation_complete', 'workout_complete']
      },
      reward: {
        points: 200,
        badge: 'transformation_master',
        special: 'unlock_golden_aura_theme'
      },
      duration: {
        startDate: serverTimestamp(),
        endDate: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)) // 14 days to complete
      },
      isActive: true,
      difficulty: 'hard',
      category: 'transformation',
      maxParticipants: 500,
      currentParticipants: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Add both quests to Firestore
    const questsRef = collection(db, 'weeklyQuests');
    const [weeklyQuestDoc, challengeDoc] = await Promise.all([
      addDoc(questsRef, weeklyQuest),
      addDoc(questsRef, sevenDayChallenge)
    ]);

    return NextResponse.json({
      success: true,
      message: 'Weekly quest and 7-day challenge created successfully',
      quests: {
        weeklyQuest: { id: weeklyQuestDoc.id, ...weeklyQuest },
        sevenDayChallenge: { id: challengeDoc.id, ...sevenDayChallenge }
      }
    });

  } catch (error) {
    console.error('Error setting up quests:', error);
    return NextResponse.json(
      { error: 'Failed to setup quests' },
      { status: 500 }
    );
  }
}