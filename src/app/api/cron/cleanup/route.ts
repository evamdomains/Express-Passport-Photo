import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Vercel Cron sends Authorization: Bearer <CRON_SECRET> automatically.
// Manual invocations must include the same header.
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('[cleanup] CRON_SECRET is not set — endpoint is unprotected');
    return false;
  }
  const auth = req.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Find all orders with photo files that are older than 48 hours
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, photo_original_url, photo_processed_url, photo_composite_url, pdf_url, download_url')
    .in('status', ['fulfilled', 'paid'])
    .lt('updated_at', cutoff)
    .not('photo_original_url', 'is', null); // only rows that still have files

  if (error) {
    console.error('[cleanup] DB query failed', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json({ deleted: 0, message: 'Nothing to clean up' });
  }

  let deleted = 0;
  const failures: string[] = [];

  for (const order of orders) {
    const paths = [
      `orders/${order.id}/original.jpg`,
      `orders/${order.id}/processed.jpg`,
      `orders/${order.id}/composite.jpg`,
      `orders/${order.id}/print.pdf`,
    ];

    const { error: removeError } = await supabase.storage
      .from('photos')
      .remove(paths);

    if (removeError) {
      // Storage removal errors are non-fatal — some files may not exist
      console.warn(`[cleanup] storage remove partial failure for ${order.id}:`, removeError.message);
    }

    // Null out all photo URL columns so the app knows files are gone
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        photo_original_url: null,
        photo_processed_url: null,
        photo_composite_url: null,
        pdf_url: null,
        download_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateError) {
      failures.push(order.id);
      console.error(`[cleanup] failed to null URLs for order ${order.id}:`, updateError.message);
    } else {
      deleted++;
    }
  }

  console.log(`[cleanup] deleted files for ${deleted} orders; ${failures.length} failures`);

  return NextResponse.json({
    deleted,
    failures: failures.length > 0 ? failures : undefined,
  });
}
