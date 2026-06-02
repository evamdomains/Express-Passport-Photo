import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPrintPdf } from '@/lib/sharp-utils';
import {
  sendDigitalDownloadEmail,
  sendOrderConfirmationEmail,
  sendAdminNewOrderEmail,
} from '@/lib/resend';
import { sendErrorAlert } from '@/lib/alert';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import type { DocumentTypeId } from '@/types/document';

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

  // STEP 5 — generate PDF
  let pdfBuffer: Buffer | null = null;
  let pdfUrl: string | null = null;

  if (order.photo_composite_url) {
    console.log('[webhook:5] fetching composite image for PDF generation');
    try {
      const compositeRes = await fetch(order.photo_composite_url);
      if (!compositeRes.ok) {
        throw new Error(`Composite fetch failed: ${compositeRes.status} ${compositeRes.statusText}`);
      }
      console.log('[webhook:5] composite fetched, generating PDF');
      const compositeBuffer = Buffer.from(await compositeRes.arrayBuffer());
      pdfBuffer = await createPrintPdf(compositeBuffer);
      console.log('[webhook:5] PDF generated, uploading to Supabase storage');

      const pdfPath = `orders/${orderId}/print.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(pdfPath, pdfBuffer, { contentType: 'application/pdf', upsert: true });

      if (uploadError) {
        console.error('[webhook:5] PDF upload FAILED', uploadError.message);
        await sendErrorAlert({
          api: 'Supabase',
          error: uploadError,
          orderId,
          context: { operation: 'storage.upload', path: pdfPath },
        });
        throw uploadError;
      }

      pdfUrl = supabase.storage.from('photos').getPublicUrl(pdfPath).data.publicUrl;
      console.log('[webhook:5] PDF uploaded OK', pdfUrl);

      await supabase
        .from('orders')
        .update({ pdf_url: pdfUrl, updated_at: new Date().toISOString() })
        .eq('id', orderId);
    } catch (err) {
      const isSupabaseError = (err as { code?: string }).code !== undefined;
      if (!isSupabaseError) {
        await sendErrorAlert({
          api: 'Stripe Webhook',
          error: err,
          orderId,
          context: { operation: 'PDF generation', compositeUrl: order.photo_composite_url },
        });
      }
      console.error('[webhook:5] PDF generation failed (non-fatal, continuing):', err instanceof Error ? err.message : err);
    }
  } else {
    console.warn('[webhook:5] skipping PDF — order has no photo_composite_url (photo processing may not have completed)');
  }

  // STEP 6 — digital download fulfillment
  if (order.product_sku === 'digital_download') {
    console.log('[webhook:6] digital_download — updating status to fulfilled, pdfUrl:', pdfUrl ?? 'null (will show "preparing" message)');

    const { error: fulfillError } = await supabase
      .from('orders')
      .update({
        status: 'fulfilled',
        download_url: pdfUrl,
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

    if (order.email && pdfUrl && order.photo_processed_url && order.photo_composite_url) {
      try {
        await sendDigitalDownloadEmail({
          to: order.email,
          orderId,
          downloadUrl: pdfUrl,
          processedUrl: order.photo_processed_url,
          compositeUrl: order.photo_composite_url,
          documentTypeName: spec.name,
        });
        console.log('[webhook:6] download email sent to', order.email);
      } catch (err) {
        console.error('[webhook:6] download email FAILED (check Resend domain verification):', err instanceof Error ? err.message : err);
      }
    } else {
      console.warn('[webhook:6] download email skipped', {
        hasEmail: !!order.email,
        hasPdfUrl: !!pdfUrl,
        hasProcessedUrl: !!order.photo_processed_url,
        hasCompositeUrl: !!order.photo_composite_url,
      });
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

  try {
    await sendAdminNewOrderEmail({
      orderId,
      customerEmail: order.email ?? 'unknown',
      documentTypeName: spec.name,
      storeName: order.store_name ?? 'Unknown store',
      storeAddress: order.store_address ?? 'Unknown address',
      storeMapsUrl: order.store_maps_url ?? '#',
      photoCompositeUrl: order.photo_composite_url ?? null,
      pdfBuffer,
    });
    console.log('[webhook:6] admin email sent to', process.env.ADMIN_EMAIL);
  } catch (err) {
    console.error('[webhook:6] admin email FAILED:', err instanceof Error ? err.message : err);
  }

  console.log('[webhook:7] printed_ready processing complete');
  return NextResponse.json({ ok: true });
}
