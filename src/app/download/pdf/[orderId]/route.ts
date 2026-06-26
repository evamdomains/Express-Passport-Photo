import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { storagePaths, createSignedDownloadUrl } from '@/lib/storage';
import { sendErrorAlert } from '@/lib/alert';

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
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, status, pdf_url')
    .eq('id', orderId)
    .single();

  // PGRST116 = "no rows" (a genuine missing order). Any OTHER error is an
  // infrastructure/config problem — most often this deployment pointing at a
  // different Supabase project than the one the order lives in. Surface it
  // (log + alert + 503) instead of masking it as a misleading 404.
  if (error && error.code !== 'PGRST116') {
    console.error('[download/pdf] order lookup failed', { orderId, code: error.code, message: error.message });
    await sendErrorAlert({
      api: 'Supabase',
      error,
      orderId,
      context: { operation: 'orders.select', route: 'download/pdf' },
    });
    return NextResponse.json({ error: 'Download temporarily unavailable. Please try again shortly.' }, { status: 503 });
  }
  if (!order) {
    console.warn('[download/pdf] order not found in this database', {
      orderId,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    });
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
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
