import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { deliverDigitalEmail, MAX_EMAIL_RETRIES, STALE_SENDING_MS } from '@/lib/email-delivery';
import type { Order } from '@/types/order';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Vercel Cron sends Authorization: Bearer <CRON_SECRET> automatically.
// Manual invocations must include the same header.
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('[email-retry] CRON_SECRET is not set — endpoint is unprotected');
    return false;
  }
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

/**
 * Delivery-email retry worker — runs every 5 minutes (see vercel.json).
 *
 * 1. Reclaims crashed SENDING rows (a previous attempt died mid-send) back to
 *    FAILED so they retry.
 * 2. Retries FAILED rows under the retry cap, oldest first. deliverDigitalEmail
 *    handles the exactly-once claim, status transitions, retry-count increment,
 *    and the admin alert when the cap is reached.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // 1 — Reclaim stale SENDING (crashed mid-send) → FAILED so they get retried.
  const staleCutoff = new Date(Date.now() - STALE_SENDING_MS).toISOString();
  const { error: reclaimError } = await supabase
    .from('orders')
    .update({ email_status: 'FAILED', updated_at: new Date().toISOString() })
    .eq('email_status', 'SENDING')
    .lt('last_email_attempt_at', staleCutoff);
  if (reclaimError) {
    console.error('[email-retry] stale-SENDING reclaim failed', reclaimError.message);
  }

  // 2 — Find FAILED rows still under the retry cap (oldest attempt first).
  const { data: rows, error } = await supabase
    .from('orders')
    .select('*')
    .eq('email_status', 'FAILED')
    .lt('email_retry_count', MAX_EMAIL_RETRIES)
    .order('last_email_attempt_at', { ascending: true, nullsFirst: true })
    .limit(50);

  if (error) {
    console.error('[email-retry] query failed', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orders = (rows ?? []) as Order[];
  if (orders.length === 0) {
    return NextResponse.json({ retried: 0, message: 'No emails to retry' });
  }

  let sent = 0;
  let stillFailing = 0;
  for (const order of orders) {
    console.log('[email-retry] retry started', order.id, `(attempt ${order.email_retry_count + 1}/${MAX_EMAIL_RETRIES})`);
    const result = await deliverDigitalEmail(supabase, order);
    if (result === 'SENT') {
      sent++;
      console.log('[email-retry] retry success', order.id);
    } else if (result === 'FAILED') {
      stillFailing++;
      console.log('[email-retry] retry failed', order.id);
    }
  }

  console.log(`[email-retry] done — retried ${orders.length}, sent ${sent}, still failing ${stillFailing}`);
  return NextResponse.json({ retried: orders.length, sent, stillFailing });
}
