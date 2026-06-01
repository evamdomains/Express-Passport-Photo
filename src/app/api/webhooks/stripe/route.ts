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
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    // Signature failures are usually misconfiguration or replay attacks, not infra errors
    console.error('[stripe-webhook] signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ ok: true });
  }

  const session = event.data.object;
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    console.error('[stripe-webhook] no orderId in session metadata');
    return NextResponse.json({ ok: true });
  }

  const supabase = createAdminClient();

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) {
    await sendErrorAlert({
      api: 'Supabase',
      error: fetchError ?? new Error('Order not found after payment'),
      orderId,
      context: { operation: 'orders.select', stage: 'webhook-post-payment', stripeSessionId: session.id },
    });
    console.error('[stripe-webhook] order not found', orderId, fetchError);
    return NextResponse.json({ ok: true });
  }

  console.log('[stripe-webhook] processing order', {
    orderId,
    sku: order.product_sku,
    hasEmail: !!order.email,
    hasStoreName: !!order.store_name,
    hasCompositeUrl: !!order.photo_composite_url,
  });

  const spec = DOCUMENT_SPECS[order.document_type as DocumentTypeId];
  const paymentIntentId = session.payment_intent as string;

  // --- Generate tiled PDF (best-effort for all orders) ---
  let pdfBuffer: Buffer | null = null;
  let pdfUrl: string | null = null;

  if (order.photo_composite_url) {
    try {
      const compositeRes = await fetch(order.photo_composite_url);
      if (!compositeRes.ok) {
        throw new Error(`Composite fetch failed: ${compositeRes.status} ${compositeRes.statusText}`);
      }
      const compositeBuffer = Buffer.from(await compositeRes.arrayBuffer());
      pdfBuffer = await createPrintPdf(compositeBuffer);

      const pdfPath = `orders/${orderId}/print.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(pdfPath, pdfBuffer, { contentType: 'application/pdf', upsert: true });

      if (uploadError) {
        await sendErrorAlert({
          api: 'Supabase',
          error: uploadError,
          orderId,
          context: { operation: 'storage.upload', path: pdfPath },
        });
        throw uploadError;
      }

      pdfUrl = supabase.storage.from('photos').getPublicUrl(pdfPath).data.publicUrl;

      await supabase
        .from('orders')
        .update({ pdf_url: pdfUrl, updated_at: new Date().toISOString() })
        .eq('id', orderId);
    } catch (err) {
      // Already alerted above for Supabase; alert for Sharp/fetch errors
      const isAlreadyAlerted = (err as { code?: string }).code !== undefined; // Supabase errors have codes
      if (!isAlreadyAlerted) {
        await sendErrorAlert({
          api: 'Stripe Webhook',
          error: err,
          orderId,
          context: { operation: 'PDF generation', compositeUrl: order.photo_composite_url },
        });
      }
      console.error('[stripe-webhook] PDF generation failed (non-fatal)', err instanceof Error ? err.message : err);
    }
  } else {
    console.warn('[stripe-webhook] no photo_composite_url on order', orderId);
  }

  // --- Digital download ---
  if (order.product_sku === 'digital_download') {
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
      await sendErrorAlert({
        api: 'Supabase',
        error: fulfillError,
        orderId,
        context: { operation: 'orders.update', stage: 'digital-fulfill' },
      });
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
        console.log('[stripe-webhook] digital download email sent', order.email);
      } catch (err) {
        // Resend failure — log to console only (do NOT call sendErrorAlert to avoid double Resend attempt)
        console.error('[stripe-webhook] digital email FAILED (check Resend domain verification):', err);
      }
    } else {
      console.warn('[stripe-webhook] digital email skipped', {
        hasEmail: !!order.email,
        hasPdfUrl: !!pdfUrl,
        hasProcessedUrl: !!order.photo_processed_url,
        hasCompositeUrl: !!order.photo_composite_url,
      });
    }

    return NextResponse.json({ ok: true });
  }

  // --- Printed & Ready ---
  const { error: paidError } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      stripe_payment_intent_id: paymentIntentId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (paidError) {
    await sendErrorAlert({
      api: 'Supabase',
      error: paidError,
      orderId,
      context: { operation: 'orders.update', stage: 'printed-ready-mark-paid' },
    });
  }

  // Customer confirmation email
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
      console.log('[stripe-webhook] customer confirmation email sent', order.email);
    } catch (err) {
      // Resend failure — console only
      console.error('[stripe-webhook] customer email FAILED (check Resend domain verification):', err);
    }
  } else {
    console.warn('[stripe-webhook] customer email skipped — missing fields', {
      hasEmail: !!order.email,
      hasStoreName: !!order.store_name,
      hasStoreAddress: !!order.store_address,
      hasStoreMapsUrl: !!order.store_maps_url,
    });
  }

  // Admin email — send regardless of PDF availability
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
    console.log('[stripe-webhook] admin email sent to', process.env.ADMIN_EMAIL);
  } catch (err) {
    // Resend failure — console only
    console.error('[stripe-webhook] admin email FAILED (check ADMIN_EMAIL env and Resend domain):', err);
  }

  return NextResponse.json({ ok: true });
}
