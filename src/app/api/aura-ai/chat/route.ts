import { NextRequest, NextResponse } from 'next/server';
import { auraAI } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { message, context, userId, userHistory } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Generate empathetic response using OpenAI
    const aiResponse = await auraAI.generateEmpatheticResponse(
      message,
      context || 'general',
      userHistory
    );

    return NextResponse.json({
      success: true,
      response: aiResponse
    });

  } catch (error) {
    console.error('Aura AI Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}