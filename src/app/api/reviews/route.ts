import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/** GET — public list of APPROVED reviews, newest first. */
export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('id, name, location, document_type, rating, comment, created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(60);

  if (error) {
    console.error('[reviews:GET]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

/** POST — submit a new review. Stored as 'pending' until a moderator approves. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const name = String(body.name ?? '').trim();
    const location = String(body.location ?? '').trim();
    const documentType = String(body.documentType ?? '').trim();
    const comment = String(body.comment ?? '').trim();
    const rating = Number(body.rating);

    if (!name || !comment) {
      return NextResponse.json({ error: 'Please add your name and a review.' }, { status: 422 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Please select a star rating from 1 to 5.' }, { status: 422 });
    }
    if (name.length > 80 || location.length > 80 || comment.length > 1000) {
      return NextResponse.json({ error: 'Your submission is too long.' }, { status: 422 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from('reviews').insert({
      name,
      location: location || null,
      document_type: documentType || null,
      rating,
      comment,
      status: 'pending',
    });

    if (error) {
      console.error('[reviews:POST]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[reviews:POST]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not submit your review.' },
      { status: 500 },
    );
  }
}
