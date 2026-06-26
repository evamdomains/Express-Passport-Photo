import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { removeBackground } from '@/lib/photoroom';
import { analyzeFace } from '@/lib/rekognition';
import { composePassportPhoto, createTiledComposite } from '@/lib/sharp-utils';
import { cropFromBiometric } from '@/lib/server-face-crop';
import { generatePreview } from '@/lib/watermark';
import { PHOTOS_BUCKET, storagePaths, downloadObject } from '@/lib/storage';
import { fulfillDigitalOrder } from '@/lib/fulfillment';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import { sendErrorAlert } from '@/lib/alert';
import { verifyReviewToken } from '@/lib/review-token';
import type { DocumentTypeId } from '@/types/document';
import type { Order } from '@/types/order';

export const maxDuration = 60;

/**
 * Reviewer action endpoint for the human-review path (Approach 2).
 *
 * Reached from the confirmation page (/review/confirm), which forwards the
 * signed token from the Approve / Reject email link. The token itself encodes
 * the action and the order it applies to, and is HMAC-verified here, so this
 * route trusts the token, not the caller.
 *
 *   approve → run the generation pipeline against the stored original
 *             (background removal → compose → tile → PDF), mark the order
 *             approved + fulfilled, and email the customer their files.
 *   reject  → record the verdict only. The expert then emails the customer the
 *             reasons; the customer replies with a corrected photo.
 *   reupload-accept → allowed ONLY on a rejected order, after the customer has
 *             emailed a corrected photo the expert is happy with. Sets the order
 *             to reupload_approved, which unlocks an upload box ON THE EXPERT'S
 *             confirm page. The EXPERT then uploads the approved photo there and
 *             generation runs at that point (see /api/review/reupload). The
 *             customer only watches their status page and clicks "Continue to
 *             delivery & checkout" once it flips to approved.
 *
 * Idempotent: a second click on an already-finalised order is a no-op that
 * reports the existing outcome rather than regenerating or overwriting.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;

  let token: string | null = null;
  try {
    const body = (await req.json()) as { token?: string };
    token = body.token ?? null;
  } catch {
    token = null;
  }
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const verified = verifyReviewToken(token);
  if (!verified) {
    return NextResponse.json({ error: 'This link is invalid or has expired.' }, { status: 401 });
  }

  // The token's action is authoritative; the URL segment must match it so a
  // token minted for "reject" can't be replayed against the approve route.
  if (verified.action !== action) {
    return NextResponse.json({ error: 'Action does not match this link.' }, { status: 400 });
  }

  const orderId = verified.orderId;
  const supabase = createAdminClient();

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  if (order.review_type !== 'human') {
    return NextResponse.json({ error: 'This order is not a human-review order.' }, { status: 400 });
  }

  // Idempotency / terminal states. 'approved' and 'reupload_approved' are
  // terminal. 'rejected' is terminal for approve/reject, but is the REQUIRED
  // precondition for reupload-accept, so it's handled per-action below.
  if (order.review_status === 'approved' || order.review_status === 'reupload_approved') {
    return NextResponse.json({
      ok: true,
      alreadyDecided: true,
      reviewStatus: order.review_status,
      documentType: order.document_type,
    });
  }
  if (order.review_status === 'rejected' && action !== 'reupload-accept') {
    return NextResponse.json({
      ok: true,
      alreadyDecided: true,
      reviewStatus: order.review_status,
    });
  }

  const spec = DOCUMENT_SPECS[order.document_type as DocumentTypeId];
  const paths = storagePaths(orderId);

  // ── RE-UPLOAD ACCEPTED ──────────────────────────────────────────────────
  // Only valid on a rejected order. Flips to reupload_approved, which unlocks an
  // upload box on the EXPERT'S confirm page. Generation happens when the expert
  // uploads the approved photo there (see /api/review/reupload).
  if (action === 'reupload-accept') {
    if (order.review_status !== 'rejected') {
      return NextResponse.json(
        { error: 'This action only applies to a rejected order awaiting a re-upload.' },
        { status: 400 },
      );
    }
    const { error } = await supabase
      .from('orders')
      .update({
        review_status: 'reupload_approved',
        status: 'processing',
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      await sendErrorAlert({
        api: 'Supabase',
        error,
        orderId,
        context: { operation: 'orders.update', stage: 'review-reupload-accept' },
      });
      return NextResponse.json({ error: 'Could not record this action.' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, reviewStatus: 'reupload_approved', documentType: order.document_type });
  }

  // ── REJECT ────────────────────────────────────────────────────────────────
  if (action === 'reject') {
    const { error } = await supabase
      .from('orders')
      .update({
        review_status: 'rejected',
        status: 'failed',
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      await sendErrorAlert({
        api: 'Supabase',
        error,
        orderId,
        context: { operation: 'orders.update', stage: 'review-reject' },
      });
      return NextResponse.json({ error: 'Could not record rejection.' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, reviewStatus: 'rejected' });
  }

  // ── APPROVE — run the generation pipeline against the stored original ───────
  try {
    if (!order.photo_original_url) {
      return NextResponse.json(
        { error: 'No uploaded photo found for this order.' },
        { status: 422 },
      );
    }

    const originalBuffer = await downloadObject(supabase, paths.original);
    if (!originalBuffer) {
      return NextResponse.json(
        { error: 'Uploaded photo could not be read from storage.' },
        { status: 422 },
      );
    }

    // Same generation as the instant-AI path: scale the face to the document's
    // target ratio. The human path has no browser MediaPipe biometric, so we
    // measure the face server-side (Rekognition landmarks + the crown from the
    // PhotoRoom alpha) and build the same crop computeCrop() uses. If the
    // measurement is unavailable, we fall back to the legacy cover resize.
    const transparentPng = await removeBackground(originalBuffer);

    // Scale the face to the document target ratio using the SAME MediaPipe
    // biometric the customer's browser measured at upload (stored on the order)
    // → computeCrop() → DOCUMENT_RULES — identical to the instant-AI path. Falls
    // back to the legacy cover resize only if no biometric was stored.
    const crop = await cropFromBiometric(order.compliance_data?.biometric, transparentPng, spec);
    const processedJpeg = await composePassportPhoto(transparentPng, spec, crop);

    const faceAnalysis = await analyzeFace(processedJpeg, spec);
    if (!faceAnalysis.detected) {
      return NextResponse.json(
        { error: 'No face detected in the photo — cannot generate passport files.' },
        { status: 422 },
      );
    }
    if (faceAnalysis.faceCount > 1) {
      return NextResponse.json(
        { error: 'Multiple faces detected — only one person allowed.' },
        { status: 422 },
      );
    }

    const tiledJpeg = await createTiledComposite(processedJpeg, spec);
    const previewJpeg = await generatePreview(processedJpeg);

    const [up1, up2, up3] = await Promise.all([
      supabase.storage.from(PHOTOS_BUCKET).upload(paths.processed, processedJpeg, { contentType: 'image/jpeg', upsert: true }),
      supabase.storage.from(PHOTOS_BUCKET).upload(paths.composite, tiledJpeg, { contentType: 'image/jpeg', upsert: true }),
      supabase.storage.from(PHOTOS_BUCKET).upload(paths.preview, previewJpeg, { contentType: 'image/jpeg', upsert: true }),
    ]);

    for (const r of [up1, up2, up3]) {
      if (r.error) {
        await sendErrorAlert({
          api: 'Supabase',
          error: r.error,
          orderId,
          context: { operation: 'storage.upload', stage: 'review-approve-generate' },
        });
        throw r.error;
      }
    }

    // Mark APPROVED and record the generated photos.
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        review_status: 'approved',
        reviewed_at: new Date().toISOString(),
        photo_processed_url: paths.processed,
        photo_composite_url: paths.composite,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      await sendErrorAlert({
        api: 'Supabase',
        error: updateError,
        orderId,
        context: { operation: 'orders.update', stage: 'review-approve' },
      });
      throw updateError;
    }

    // The review fee already covers the digital result, so deliver it now:
    // generate the print PDF, mark the order fulfilled, set the download link,
    // and email the JPEG + PDF as attachments. The customer can download
    // immediately from their status page; printed copies remain an optional paid
    // add-on they can order from there.
    await fulfillDigitalOrder(supabase, {
      ...(order as Order),
      review_status: 'approved',
      photo_processed_url: paths.processed,
      photo_composite_url: paths.composite,
    });

    return NextResponse.json({ ok: true, reviewStatus: 'approved' });
  } catch (err) {
    console.error('[review:approve]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Approval failed.' },
      { status: 500 },
    );
  }
}
