import { NextRequest, NextResponse } from 'next/server';
import { sendContactEmail } from '@/lib/resend';

export const maxDuration = 15;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Contact Us form handler — emails our expert (REVIEW_TEAM_EMAIL / ADMIN_EMAIL)
 * with the customer's enquiry and sets reply-to so they can respond directly.
 * No database writes; this is a pure notification handoff.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim();
    const phone = String(body.phone ?? '').trim();
    const documentType = String(body.documentType ?? '').trim();
    const message = String(body.message ?? '').trim();

    if (!name || !email || !documentType || !message) {
      return NextResponse.json(
        { error: 'Please fill in your name, email, document type, and message.' },
        { status: 422 },
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 422 });
    }
    if (message.length > 5000 || name.length > 200) {
      return NextResponse.json({ error: 'Your submission is too long.' }, { status: 422 });
    }

    await sendContactEmail({
      name,
      email,
      phone: phone || null,
      documentType,
      message,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[contact]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not send your message.' },
      { status: 500 },
    );
  }
}
