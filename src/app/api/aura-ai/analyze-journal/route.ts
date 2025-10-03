import { NextRequest, NextResponse } from 'next/server';
import { auraAI } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { entryText, mood, activities, userId } = await req.json();

    if (!entryText) {
      return NextResponse.json({ error: 'Entry text is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Analyze journal entry using AI
    const analysis = await auraAI.analyzeJournalEntry(
      entryText,
      mood || 'neutral',
      activities || []
    );

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Journal analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze journal entry' },
      { status: 500 }
    );
  }
}