import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { toUid, lastUserInput, authUid } = await req.json();
    if (!toUid) return new Response(JSON.stringify({ error: 'Missing toUid' }), { status: 400 });

    // In production, verify Firebase auth token on server if needed.
    // Proxy to Cloud Function (or server) that holds AI keys.
    const fnUrl = process.env.AURA_COACH_URL; // e.g., https://<region>-<proj>.cloudfunctions.net/auraCoach
    if (!fnUrl) {
      // Fallback suggestion without AI if function not configured yet
      return new Response(JSON.stringify({ suggestion: 'I hear you. Would it help to try 4-7-8 breathing together? Inhale 4, hold 7, exhale 8. I can guide you.' }), { status: 200 });
    }

    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-uid': authUid ?? '' },
      body: JSON.stringify({ toUid, lastUserInput }),
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), { status: res.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

