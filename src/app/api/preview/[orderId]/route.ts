import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { storagePaths, downloadObject } from '@/lib/storage';

export const runtime = 'nodejs';

/**
 * Streams the watermarked, low-resolution PREVIEW asset from the private bucket.
 * This is the only image the browser receives before payment — it's already
 * watermarked + downscaled, so it's safe to expose. The clean processed.jpg /
 * print.pdf are never served here.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

  const supabase = createAdminClient();
  const buf = await downloadObject(supabase, storagePaths(orderId).preview);
  if (!buf) return NextResponse.json({ error: 'Preview not available' }, { status: 404 });

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=300' },
  });
}
