import { NextRequest, NextResponse } from 'next/server';
import { auraAI } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { mood, context, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Generate motivational content using AI
    const content = await auraAI.generateMotivationalContent(
      mood || 'neutral',
      context || 'general'
    );

    return NextResponse.json({
      success: true,
      content
    });

  } catch (error) {
    console.error('Motivational content error:', error);
    return NextResponse.json(
      { error: 'Failed to generate motivational content' },
      { status: 500 }
    );
  }
}