import { createAdminClient } from './supabase/admin';
import { createPrintPdf } from './sharp-utils';
import { PHOTOS_BUCKET, storagePaths, downloadObject, createSignedDownloadUrl } from './storage';
import {
  sendOrderConfirmationEmail,
  sendAdminNewOrderEmail,
  sendReviewRequestEmail,
  sendReviewSubmittedEmail,
} from './resend';
import { deliverDigitalEmail } from './email-delivery';
import { sendErrorAlert } from './alert';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import type { DocumentTypeId } from '@/types/document';
import type { Order } from '@/types/order';

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Fulfill a DIGITAL download order: generate the print-ready 4×6 PDF from the
 * (private) composite, store it, mark the order `fulfilled` with a download link,
 * and email the customer their files.
 *
 * Shared by the paid Stripe webhook and the FREE ($0) checkout bypass — Stripe
 * can't process a $0 charge, so free digital orders are fulfilled here directly.
 * Best-effort throughout: failures are alerted/logged but never throw, so the
 * order is always marked fulfilled (download route serves a 410 if the PDF is
 * genuinely missing).
 */
export async function fulfillDigitalOrder(
  supabase: Admin,
  order: Order,
  opts?: { paymentIntentId?: string | null },
): Promise<{ pdfReady: boolean }> {
  const orderId = order.id;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://expresspassportphoto.com';
  const paths = storagePaths(orderId);
  const spec = DOCUMENT_SPECS[order.document_type as DocumentTypeId];

  // ── Generate + store the PDF from the private composite ──
  // Keep the PDF buffer in scope so we can attach it to the delivery email
  // without re-reading or regenerating it.
  let pdfReady = false;
  let pdfBuffer: Buffer | null = null;
  if (order.photo_composite_url) {
    try {
      const compositeBuffer = await downloadObject(supabase, paths.composite);
      if (!compositeBuffer) throw new Error('Composite not found in private storage');
      pdfBuffer = await createPrintPdf(compositeBuffer);
      const { error: uploadError } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .upload(paths.pdf, pdfBuffer, { contentType: 'application/pdf', upsert: true });
      if (uploadError) throw uploadError;
      pdfReady = true;
      await supabase.from('orders').update({ pdf_url: paths.pdf, updated_at: new Date().toISOString() }).eq('id', orderId);
    } catch (err) {
      console.error('[fulfillment] PDF generation failed (non-fatal):', err instanceof Error ? err.message : err);
      await sendErrorAlert({ api: 'Stripe Webhook', error: err, orderId, context: { operation: 'PDF generation', compositePath: paths.composite } });
    }
  } else {
    console.warn('[fulfillment] no composite — skipping PDF', orderId);
  }

  // ── Mark fulfilled + set the download link ──
  // download_url still backs the confirmation/status pages; the EMAIL no longer
  // uses it — it attaches the files instead.
  const { error: fulfillError } = await supabase
    .from('orders')
    .update({
      status: 'fulfilled',
      download_url: pdfReady ? `${appUrl}/download/pdf/${orderId}` : null,
      ...(opts?.paymentIntentId ? { stripe_payment_intent_id: opts.paymentIntentId } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);
  if (fulfillError) {
    console.error('[fulfillment] status update FAILED', fulfillError.message);
    await sendErrorAlert({ api: 'Supabase', error: fulfillError, orderId, context: { operation: 'orders.update', stage: 'digital-fulfill' } });
  }

  // ── Email the customer their files AS ATTACHMENTS (reliable, retryable) ──
  // deliverDigitalEmail tracks email_status, is idempotent (exactly-once across
  // duplicate webhooks), and never throws. If it fails, the retry worker
  // (/api/cron/email-retry) keeps trying every 5 min until it sends or alerts.
  if (order.email) {
    console.log('[email-delivery] queued (digital fulfilment)', orderId);
    await deliverDigitalEmail(supabase, { ...order, email: order.email }, { pdfBuffer });
  }

  return { pdfReady };
}

/**
 * Fulfill a PRINTED & READY order: generate the print-ready 4×6 PDF from the
 * (private) composite, store it, mark the order `paid`, email the customer their
 * pickup confirmation, and email the admin/store-fulfilment team the order
 * details + PDF so the prints can be sent to the chosen CVS/Walgreens.
 *
 * Mirrors the Stripe webhook's printed_ready branch so the FREE ($0) checkout
 * fulfils printed orders directly (Stripe can't process a $0 charge). The admin
 * email is the channel by which the team learns which store to upload to.
 * Best-effort throughout — never throws.
 */
export async function fulfillPrintedOrder(supabase: Admin, order: Order): Promise<void> {
  const orderId = order.id;
  const paths = storagePaths(orderId);
  const spec = DOCUMENT_SPECS[order.document_type as DocumentTypeId];

  // ── Generate + store the print PDF from the private composite ──
  let pdfBuffer: Buffer | null = null;
  if (order.photo_composite_url) {
    try {
      const compositeBuffer = await downloadObject(supabase, paths.composite);
      if (!compositeBuffer) throw new Error('Composite not found in private storage');
      pdfBuffer = await createPrintPdf(compositeBuffer);
      const { error: uploadError } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .upload(paths.pdf, pdfBuffer, { contentType: 'application/pdf', upsert: true });
      if (uploadError) throw uploadError;
      await supabase.from('orders').update({ pdf_url: paths.pdf, updated_at: new Date().toISOString() }).eq('id', orderId);
    } catch (err) {
      console.error('[fulfillment] printed PDF generation failed (non-fatal):', err instanceof Error ? err.message : err);
      await sendErrorAlert({ api: 'Stripe Webhook', error: err, orderId, context: { operation: 'PDF generation', stage: 'free-printed', compositePath: paths.composite } });
    }
  } else {
    console.warn('[fulfillment] no composite — skipping printed PDF', orderId);
  }

  // ── Mark paid ──
  const { error: paidError } = await supabase
    .from('orders')
    .update({ status: 'paid', updated_at: new Date().toISOString() })
    .eq('id', orderId);
  if (paidError) {
    console.error('[fulfillment] printed status update FAILED', paidError.message);
    await sendErrorAlert({ api: 'Supabase', error: paidError, orderId, context: { operation: 'orders.update', stage: 'free-printed-mark-paid' } });
  }

  // ── Customer pickup confirmation ──
  if (order.email && order.store_name && order.store_address && order.store_maps_url) {
    try {
      await sendOrderConfirmationEmail({
        to: order.email,
        orderId,
        documentTypeName: spec.name,
        storeName: order.store_name,
        storeAddress: order.store_address,
        storeMapsUrl: order.store_maps_url,
      });
    } catch (err) {
      console.error('[fulfillment] printed customer email FAILED:', err instanceof Error ? err.message : err);
    }
  }

  // ── Admin / store-fulfilment email — tells the team which store to send to ──
  const adminCompositeUrl = order.photo_composite_url
    ? await createSignedDownloadUrl(supabase, paths.composite, 60 * 60 * 24)
    : null;
  try {
    await sendAdminNewOrderEmail({
      orderId,
      customerEmail: order.email ?? 'unknown',
      documentTypeName: spec.name,
      storeName: order.store_name ?? 'Unknown store',
      storeAddress: order.store_address ?? 'Unknown address',
      storeMapsUrl: order.store_maps_url ?? '#',
      photoCompositeUrl: adminCompositeUrl,
      pdfBuffer,
    });
  } catch (err) {
    console.error('[fulfillment] printed admin email FAILED:', err instanceof Error ? err.message : err);
  }
}

/**
 * Queue a HUMAN-REVIEW order: mark it awaiting_review, email the team a review
 * request (with a signed link to the original), and email the customer that
 * their photo is in review. No photo is generated here — a reviewer approves
 * later (which runs generation). Mirrors the Stripe webhook's human branch so
 * the FREE ($0) checkout queues human orders instead of trying to fulfill them.
 * Best-effort throughout — never throws.
 */
export async function queueHumanReview(supabase: Admin, order: Order): Promise<void> {
  const orderId = order.id;
  const paths = storagePaths(orderId);
  const spec = DOCUMENT_SPECS[order.document_type as DocumentTypeId];

  const { error } = await supabase
    .from('orders')
    .update({ status: 'processing', review_status: 'awaiting_review', updated_at: new Date().toISOString() })
    .eq('id', orderId);
  if (error) {
    console.error('[fulfillment] human-review queue update FAILED', error.message);
    await sendErrorAlert({ api: 'Supabase', error, orderId, context: { operation: 'orders.update', stage: 'free-human-awaiting-review' } });
  }

  // Signed, time-limited link to the uploaded original so the team can review it.
  const reviewPhotoUrl = order.photo_original_url
    ? await createSignedDownloadUrl(supabase, paths.original, 60 * 60 * 24 * 7)
    : null;

  try {
    await sendReviewRequestEmail({
      orderId,
      customerName: order.customer_name ?? null,
      customerEmail: order.email ?? 'unknown',
      customerPhone: order.customer_phone ?? null,
      documentTypeName: spec.name,
      photoUrl: reviewPhotoUrl,
      glassesDetected: order.compliance_data?.glasses?.status === 'FAIL',
      babyCompliance: order.compliance_data?.babyCompliance,
    });
  } catch (err) {
    console.error('[fulfillment] review-request email FAILED:', err instanceof Error ? err.message : err);
  }

  if (order.email) {
    try {
      await sendReviewSubmittedEmail({ to: order.email, orderId, documentTypeName: spec.name });
    } catch (err) {
      console.error('[fulfillment] in-review email FAILED:', err instanceof Error ? err.message : err);
    }
  }
}
