import { NextRequest, NextResponse } from 'next/server';
import { auraAI } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { userHistory, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!userHistory || userHistory.length === 0) {
      return NextResponse.json({
        success: true,
        prediction: {
          predictedMood: 'neutral',
          confidence: 0.5,
          riskLevel: 'low',
          factors: ['Insufficient data for prediction'],
          recommendations: ['Keep journaling to get better predictions'],
          proactiveActions: ['Continue your journaling practice']
        }
      });
    }

    // Generate mood prediction using AI
    const prediction = await auraAI.predictMood(userHistory);

    return NextResponse.json({
      success: true,
      prediction
    });

  } catch (error) {
    console.error('Mood prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to predict mood' },
      { status: 500 }
    );
  }
}