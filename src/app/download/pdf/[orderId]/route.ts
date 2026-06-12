import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { storagePaths, createSignedDownloadUrl } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Secure download for the print-ready 4×6 PDF.
 * Verifies payment, confirms the file exists, mints a fresh 5-minute signed URL
 * and redirects. Email links point here so they never expire.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, pdf_url')
    .eq('id', orderId)
    .single();

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.status !== 'paid' && order.status !== 'fulfilled') {
    return NextResponse.json({ error: 'Payment required to download this file.' }, { status: 402 });
  }
  if (!order.pdf_url) {
    return NextResponse.json({ error: 'This file is no longer available (deleted after 48 hours).' }, { status: 410 });
  }

  const signed = await createSignedDownloadUrl(
    supabase,
    storagePaths(orderId).pdf,
    300,
    `passport-print-${orderId.slice(0, 8)}.pdf`,
  );
  if (!signed) return NextResponse.json({ error: 'Could not generate download link.' }, { status: 500 });

  return NextResponse.redirect(signed, 302);
}
