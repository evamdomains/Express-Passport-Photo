import { createAdminClient } from './supabase/admin';
import { storagePaths, downloadObject } from './storage';
import { sendDigitalDownloadEmail, sendEmailFailureAdminAlert } from './resend';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import type { DocumentTypeId } from '@/types/document';
import type { Order } from '@/types/order';

type Admin = ReturnType<typeof createAdminClient>;

/** Max delivery-email attempts before we give up and alert the admin. */
export const MAX_EMAIL_RETRIES = 5;

/** A SENDING row older than this is treated as a crashed attempt and reclaimed. */
export const STALE_SENDING_MS = 10 * 60 * 1000;

const nowIso = () => new Date().toISOString();

/**
 * Load both delivery attachments. The processed JPEG always comes from storage;
 * the PDF uses the in-memory buffer when fulfilment just generated it, else it
 * reads the stored PDF (the retry worker has no in-memory buffer). One transient
 * retry on each read. Never regenerates anything.
 */
async function loadAttachments(
  supabase: Admin,
  orderId: string,
  pdfHint?: Buffer | null,
): Promise<{ jpegBuffer: Buffer | null; pdfBuffer: Buffer | null }> {
  const paths = storagePaths(orderId);
  let jpegBuffer = await downloadObject(supabase, paths.processed);
  if (!jpegBuffer) jpegBuffer = await downloadObject(supabase, paths.processed);
  let pdfBuffer = pdfHint ?? (await downloadObject(supabase, paths.pdf));
  if (!pdfBuffer) pdfBuffer = await downloadObject(supabase, paths.pdf);
  return { jpegBuffer, pdfBuffer };
}

/**
 * Reliable, idempotent customer delivery email with DB-tracked status.
 *
 * Exactly-once: atomically claims the row (PENDING/FAILED + under the retry cap)
 * to SENDING before sending, so duplicate webhook executions and overlapping
 * retries can never double-send — an already-SENT or in-flight row is skipped.
 *
 * On success → email_status SENT (+ email_sent_at). On failure → email_status
 * FAILED (+ incremented email_retry_count, last_email_error, last_email_attempt_at,
 * full stack trace logged); when the cap is reached, the admin is alerted.
 *
 * Never throws — returns the outcome so callers (webhook, fulfilment, retry
 * worker) keep running regardless.
 */
export async function deliverDigitalEmail(
  supabase: Admin,
  order: Order,
  opts?: { pdfBuffer?: Buffer | null },
): Promise<'SENT' | 'FAILED' | 'SKIPPED'> {
  const orderId = order.id;

  // ── Claim (atomic exactly-once lock) ──
  const { data: claimed, error: claimErr } = await supabase
    .from('orders')
    .update({ email_status: 'SENDING', last_email_attempt_at: nowIso(), updated_at: nowIso() })
    .eq('id', orderId)
    .in('email_status', ['PENDING', 'FAILED'])
    .lt('email_retry_count', MAX_EMAIL_RETRIES)
    .select('id')
    .maybeSingle();

  if (claimErr) {
    console.error('[email-delivery] claim error', orderId, claimErr.message);
    return 'FAILED';
  }
  if (!claimed) {
    // Already SENT, currently SENDING in another worker, or retries exhausted.
    console.log('[email-delivery] skipped (already sent / in progress / exhausted)', orderId);
    return 'SKIPPED';
  }

  console.log('[email-delivery] sending', orderId);
  try {
    if (!order.email) throw new Error('Order has no customer email address');
    const spec = DOCUMENT_SPECS[order.document_type as DocumentTypeId];
    const { jpegBuffer, pdfBuffer } = await loadAttachments(supabase, orderId, opts?.pdfBuffer);
    if (!jpegBuffer || !pdfBuffer) {
      throw new Error(
        `Missing delivery attachment(s): ${!jpegBuffer ? 'JPEG' : ''}${!jpegBuffer && !pdfBuffer ? ' and ' : ''}${!pdfBuffer ? 'PDF' : ''}`,
      );
    }

    await sendDigitalDownloadEmail({
      to: order.email,
      orderId,
      documentTypeName: spec.name,
      jpegBuffer,
      pdfBuffer,
    });

    await supabase
      .from('orders')
      .update({ email_status: 'SENT', email_sent_at: nowIso(), last_email_error: null, updated_at: nowIso() })
      .eq('id', orderId);
    console.log('[email-delivery] success', orderId);
    return 'SENT';
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[email-delivery] failed', orderId, '—', message);
    if (err instanceof Error && err.stack) console.error(err.stack);

    // Increment the retry count (serialized by the SENDING claim — only one
    // worker holds the row at a time, so read-modify-write is safe here).
    const { data: row } = await supabase.from('orders').select('email_retry_count').eq('id', orderId).single();
    const retryCount = (row?.email_retry_count ?? order.email_retry_count ?? 0) + 1;

    await supabase
      .from('orders')
      .update({
        email_status: 'FAILED',
        email_retry_count: retryCount,
        last_email_error: message.slice(0, 2000),
        last_email_attempt_at: nowIso(),
        updated_at: nowIso(),
      })
      .eq('id', orderId);

    if (retryCount >= MAX_EMAIL_RETRIES) {
      console.error('[email-delivery] retries exhausted', orderId, `(attempts: ${retryCount})`);
      try {
        await sendEmailFailureAdminAlert({
          orderId,
          customerEmail: order.email ?? 'unknown',
          retryCount,
          error: message,
        });
      } catch (alertErr) {
        console.error('[email-delivery] admin alert FAILED', orderId, alertErr instanceof Error ? alertErr.message : alertErr);
      }
    }
    return 'FAILED';
  }
}
