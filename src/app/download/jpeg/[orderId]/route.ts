import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { storagePaths, createSignedDownloadUrl } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Secure download for the clean passport JPEG.
 * Verifies payment, confirms the file still exists, mints a fresh 5-minute
 * signed URL and redirects. Email links point here, so they keep working
 * indefinitely while the storage stays private.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, photo_processed_url')
    .eq('id', orderId)
    .single();

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.status !== 'paid' && order.status !== 'fulfilled') {
    return NextResponse.json({ error: 'Payment required to download this photo.' }, { status: 402 });
  }
  if (!order.photo_processed_url) {
    return NextResponse.json({ error: 'This file is no longer available (deleted after 48 hours).' }, { status: 410 });
  }

  const signed = await createSignedDownloadUrl(
    supabase,
    storagePaths(orderId).processed,
    300,
    `passport-photo-${orderId.slice(0, 8)}.jpg`,
  );
  if (!signed) return NextResponse.json({ error: 'Could not generate download link.' }, { status: 500 });

  return NextResponse.redirect(signed, 302);
}
