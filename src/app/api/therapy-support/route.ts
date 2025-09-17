import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      preferredLanguage,
      therapistGender,
      sessionMode,
      preferredTime,
      notes,
      contactVia,
    } = body || {};

    if (!name || !email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // For now, send via basic mailto-like integration using a third-party email API placeholder.
    // In production, wire to SMTP or provider. We craft a formatted payload and POST to a webhook if configured.

    const subject = `[Aura X] Therapy Support Request - ${name}`;
    const text = `New therapy support request\n\n` +
      `Name: ${name}\n` +
      `Email: ${email}\n` +
      `Preferred Language: ${preferredLanguage}\n` +
      `Preferred Therapist Gender: ${therapistGender}\n` +
      `Session Mode: ${sessionMode}\n` +
      `Preferred Time: ${preferredTime}\n` +
      `Contact Via: ${contactVia}\n` +
      `Notes: ${notes || 'N/A'}\n`;

    // If EMAIL_WEBHOOK_URL is set, forward; otherwise just log (prevents build-time SMTP setup)
    const webhook = process.env.EMAIL_WEBHOOK_URL;
    if (webhook) {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'therapy@rydmentalhealth.org',
          subject,
          text,
        }),
      });
    } else {
      console.log('[TherapySupportEmailDraft]', { to: 'therapy@rydmentalhealth.org', subject, text });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

