import { NextRequest, NextResponse } from 'next/server';
import { auraAI } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { currentMood, recentActivities, userId, userHistory } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Generate smart prompts using AI
    const prompts = await auraAI.generateSmartPrompts(
      currentMood || 'neutral',
      recentActivities || [],
      userHistory
    );

    return NextResponse.json({
      success: true,
      prompts
    });

  } catch (error) {
    console.error('Smart prompts error:', error);
    return NextResponse.json(
      { error: 'Failed to generate prompts' },
      { status: 500 }
    );
  }
}