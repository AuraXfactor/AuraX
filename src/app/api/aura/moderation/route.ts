import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) return new Response(JSON.stringify({ flagged: false }), { status: 200 });
    // Placeholder: in production call provider moderation API server-side only
    const flagged = /suicide|kill myself|self-harm/i.test(text);
    return new Response(JSON.stringify({ flagged }), { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

