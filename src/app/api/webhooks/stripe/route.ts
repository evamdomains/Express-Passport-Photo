import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPrintPdf } from '@/lib/sharp-utils';
import { PHOTOS_BUCKET, storagePaths, downloadObject, createSignedDownloadUrl } from '@/lib/storage';
import {
  sendOrderConfirmationEmail,
  sendAdminNewOrderEmail,
  sendReviewRequestEmail,
  sendReviewSubmittedEmail,
} from '@/lib/resend';
import { deliverDigitalEmail } from '@/lib/email-delivery';
import { sendErrorAlert } from '@/lib/alert';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import type { DocumentTypeId } from '@/types/document';
import type { Order } from '@/types/order';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // STEP 1 — confirm the handler was reached at all
  console.log('[webhook:1] handler invoked', {
    url: req.url,
    hasSignature: !!req.headers.get('stripe-signature'),
    webhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
    // First 12 chars only — enough to confirm which secret is active without exposing it
    webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.slice(0, 12) ?? 'NOT SET',
  });

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    console.error('[webhook:2] no stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // STEP 2 — signature verification
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    console.log('[webhook:2] signature verified OK — event type:', event.type, 'id:', event.id);
  } catch (err) {
    // Log the full error message so we can see whether it's a wrong-secret or clock-skew error
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[webhook:2] signature FAILED:', msg);
    console.error('[webhook:2] hint: STRIPE_WEBHOOK_SECRET must match the signing secret of the',
      'live endpoint at https://expresspassportphoto.com/api/webhooks/stripe in the Stripe Dashboard,',
      'NOT the local `stripe listen` secret (whsec_...) from .env.local');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    console.log('[webhook:3] ignoring event type:', event.type);
    return NextResponse.json({ ok: true });
  }

  // STEP 3 — extract orderId from session metadata
  const session = event.data.object;
  const orderId = session.metadata?.orderId;
  console.log('[webhook:3] checkout.session.completed', {
    stripeSessionId: session.id,
    orderId: orderId ?? 'MISSING',
    customerEmail: session.customer_email ?? session.customer_details?.email ?? 'none',
    paymentStatus: session.payment_status,
    allMetadata: session.metadata,
  });

  if (!orderId) {
    console.error('[webhook:3] orderId missing from session.metadata — checkout session was created without it');
    return NextResponse.json({ ok: true });
  }

  // STEP 4 — fetch order from Supabase
  console.log('[webhook:4] fetching order from Supabase', orderId);
  const supabase = createAdminClient();

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) {
    console.error('[webhook:4] order fetch FAILED', {
      orderId,
      error: fetchError?.message,
      code: fetchError?.code,
    });
    await sendErrorAlert({
      api: 'Supabase',
      error: fetchError ?? new Error('Order not found after payment'),
      orderId,
      context: { operation: 'orders.select', stage: 'webhook-post-payment', stripeSessionId: session.id },
    });
    return NextResponse.json({ ok: true });
  }

  console.log('[webhook:4] order found', {
    orderId,
    sku: order.product_sku,
    status: order.status,
    hasEmail: !!order.email,
    hasCompositeUrl: !!order.photo_composite_url,
    hasStoreName: !!order.store_name,
  });

  const spec = DOCUMENT_SPECS[order.document_type as DocumentTypeId];
  const paymentIntentId = session.payment_intent as string;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://expresspassportphoto.com';
  const paths = storagePaths(orderId);

  // ── HUMAN-REVIEW PATH (Approach 2) ───────────────────────────────────────
  // For human-review orders, payment does NOT trigger generation. Instead the
  // order enters the review queue: we mark it awaiting_review, email the team a
  // review request with Approve/Reject links, and email the customer that it's
  // in review. The photo files are generated later, only when a reviewer
  // approves (see /api/review/[action]). This stops PhotoRoom credits being
  // spent before a human signs off.
  if (order.review_type === 'human') {
    console.log('[webhook:human] human-review order — entering review queue', orderId);

    const { error: reviewMarkError } = await supabase
      .from('orders')
      .update({
        status: 'processing',
        review_status: 'awaiting_review',
        stripe_payment_intent_id: paymentIntentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (reviewMarkError) {
      console.error('[webhook:human] mark awaiting_review FAILED', reviewMarkError.message);
      await sendErrorAlert({
        api: 'Supabase',
        error: reviewMarkError,
        orderId,
        context: { operation: 'orders.update', stage: 'human-mark-awaiting-review' },
      });
    }

    // Signed, time-limited link to the uploaded original so the team can see the
    // photo directly in the email.
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
      });
      console.log('[webhook:human] review-request email sent to team');
    } catch (err) {
      console.error('[webhook:human] review-request email FAILED:', err instanceof Error ? err.message : err);
    }

    if (order.email) {
      try {
        await sendReviewSubmittedEmail({ to: order.email, orderId, documentTypeName: spec.name });
        console.log('[webhook:human] in-review email sent to customer');
      } catch (err) {
        console.error('[webhook:human] in-review email FAILED:', err instanceof Error ? err.message : err);
      }
    }

    console.log('[webhook:human] human-review queue setup complete');
    return NextResponse.json({ ok: true });
  }

  // STEP 5 — generate PDF (from the PRIVATE composite; uploaded PRIVATELY)
  let pdfBuffer: Buffer | null = null;
  let pdfReady = false;

  if (order.photo_composite_url) {
    console.log('[webhook:5] downloading composite from private storage for PDF generation');
    try {
      const compositeBuffer = await downloadObject(supabase, paths.composite);
      if (!compositeBuffer) throw new Error('Composite not found in private storage');
      pdfBuffer = await createPrintPdf(compositeBuffer);
      console.log('[webhook:5] PDF generated, uploading to private storage');

      const { error: uploadError } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .upload(paths.pdf, pdfBuffer, { contentType: 'application/pdf', upsert: true });

      if (uploadError) {
        console.error('[webhook:5] PDF upload FAILED', uploadError.message);
        await sendErrorAlert({
          api: 'Supabase',
          error: uploadError,
          orderId,
          context: { operation: 'storage.upload', path: paths.pdf },
        });
        throw uploadError;
      }

      pdfReady = true;
      console.log('[webhook:5] PDF uploaded OK (private)');

      const { error: pdfUrlError } = await supabase
        .from('orders')
        .update({ pdf_url: paths.pdf, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (pdfUrlError) {
        // Don't swallow this — a failure here (e.g. a missing pdf_url column)
        // leaves the download route unable to serve a paid order.
        console.error('[webhook:5] pdf_url update FAILED', pdfUrlError.message, pdfUrlError.code);
        await sendErrorAlert({
          api: 'Supabase',
          error: pdfUrlError,
          orderId,
          context: { operation: 'orders.update', stage: 'set-pdf-url' },
        });
      }
    } catch (err) {
      const isSupabaseError = (err as { code?: string }).code !== undefined;
      if (!isSupabaseError) {
        await sendErrorAlert({
          api: 'Stripe Webhook',
          error: err,
          orderId,
          context: { operation: 'PDF generation', compositePath: paths.composite },
        });
      }
      console.error('[webhook:5] PDF generation failed (non-fatal, continuing):', err instanceof Error ? err.message : err);
    }
  } else {
    console.warn('[webhook:5] skipping PDF — order has no composite (photo processing may not have completed)');
  }

  // STEP 6 — digital download fulfillment
  if (order.product_sku === 'digital_download') {
    console.log('[webhook:6] digital_download — updating status to fulfilled, pdfReady:', pdfReady);

    const { error: fulfillError } = await supabase
      .from('orders')
      .update({
        status: 'fulfilled',
        // App download route (secure, mints signed URLs on click). Null until PDF ready.
        download_url: pdfReady ? `${appUrl}/download/pdf/${orderId}` : null,
        stripe_payment_intent_id: paymentIntentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (fulfillError) {
      console.error('[webhook:6] status update FAILED', fulfillError.message, fulfillError.code);
      await sendErrorAlert({
        api: 'Supabase',
        error: fulfillError,
        orderId,
        context: { operation: 'orders.update', stage: 'digital-fulfill' },
      });
    } else {
      console.log('[webhook:6] order status set to fulfilled OK');
    }

    // Email the customer their files AS ATTACHMENTS (JPEG + print PDF). Reliable
    // + idempotent: deliverDigitalEmail tracks email_status and is exactly-once,
    // so duplicate webhook executions never double-send. On failure the retry
    // worker (/api/cron/email-retry) takes over. Reuses the STEP-5 pdfBuffer.
    if (order.email) {
      console.log('[webhook:6] delivery email queued', { orderId });
      await deliverDigitalEmail(supabase, order as Order, { pdfBuffer });
    } else {
      console.warn('[webhook:6] delivery email skipped — no customer email', { orderId });
    }

    console.log('[webhook:7] digital_download processing complete');
    return NextResponse.json({ ok: true });
  }

  // STEP 6 (printed_ready) — mark paid
  console.log('[webhook:6] printed_ready — updating status to paid');

  const { error: paidError } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      stripe_payment_intent_id: paymentIntentId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (paidError) {
    console.error('[webhook:6] status update FAILED', paidError.message);
    await sendErrorAlert({
      api: 'Supabase',
      error: paidError,
      orderId,
      context: { operation: 'orders.update', stage: 'printed-ready-mark-paid' },
    });
  } else {
    console.log('[webhook:6] order status set to paid OK');
  }

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
      console.log('[webhook:6] customer confirmation email sent to', order.email);
    } catch (err) {
      console.error('[webhook:6] customer email FAILED:', err instanceof Error ? err.message : err);
    }
  }

  // Admin gets a short-lived signed link to the composite (private bucket).
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
    console.log('[webhook:6] admin email sent to', process.env.ADMIN_EMAIL);
  } catch (err) {
    console.error('[webhook:6] admin email FAILED:', err instanceof Error ? err.message : err);
  }

  console.log('[webhook:7] printed_ready processing complete');
  return NextResponse.json({ ok: true });
}
