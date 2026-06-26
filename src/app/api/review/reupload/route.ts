import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { removeBackground } from '@/lib/photoroom';
import { analyzeFace } from '@/lib/rekognition';
import { composePassportPhoto, createTiledComposite } from '@/lib/sharp-utils';
import { cropFromBiometric } from '@/lib/server-face-crop';
import { generatePreview } from '@/lib/watermark';
import type { BiometricData } from '@/types/biometric';
import { PHOTOS_BUCKET, storagePaths } from '@/lib/storage';
import { fulfillDigitalOrder } from '@/lib/fulfillment';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import { sendErrorAlert } from '@/lib/alert';
import { verifyReviewToken } from '@/lib/review-token';
import type { DocumentTypeId } from '@/types/document';
import type { Order } from '@/types/order';

export const maxDuration = 60;

/**
 * EXPERT re-upload after clicking "Re-uploaded photo accepted".
 *
 * The customer emails the corrected photo to the expert. The expert, on their
 * confirm page (/review/confirm), uploads that approved photo here — the
 * customer never re-uploads. Authorised by the SAME signed token from the
 * review email (reupload-accept action), so only the expert can call this.
 *
 * Precondition: the order is in review_status='reupload_approved' (set when the
 * expert clicked the link). On a valid upload we run the SAME generation
 * pipeline as a normal approval (background removal → compose → tile), store the
 * new original + deliverables, and mark the order approved (NOT yet delivered —
 * the customer picks delivery + checks out next). The customer's status page
 * then flips to "approved" with the Continue-to-checkout button.
 */
export async function POST(req: NextRequest) {
  let orderId: string | null = null;
  try {
    const formData = await req.formData();
    const file = formData.get('photo') as File | null;
    const token = formData.get('token') as string | null;

    // Fresh MediaPipe biometric measured in the expert's browser for the photo.
    let biometric: BiometricData | undefined;
    try {
      const bioRaw = formData.get('biometric');
      if (typeof bioRaw === 'string') biometric = JSON.parse(bioRaw) as BiometricData;
    } catch { /* ignore malformed biometric — falls back to cover resize */ }

    if (!file || !token) {
      return NextResponse.json({ error: 'Missing photo or token' }, { status: 400 });
    }

    // The signed token (reupload-accept) authorises this upload and names the order.
    const verified = verifyReviewToken(token);
    if (!verified || verified.action !== 'reupload-accept') {
      return NextResponse.json({ error: 'This link is invalid or has expired.' }, { status: 401 });
    }
    orderId = verified.orderId;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json({ error: 'File must be a JPEG, PNG, WEBP, or HEIC image' }, { status: 422 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 10 MB' }, { status: 422 });
    }

    const supabase = createAdminClient();

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.review_type !== 'human') {
      return NextResponse.json({ error: 'Not a human-review order' }, { status: 400 });
    }
    if (order.review_status !== 'reupload_approved') {
      return NextResponse.json(
        { error: 'This order is not awaiting a re-upload.' },
        { status: 400 },
      );
    }

    const spec = DOCUMENT_SPECS[order.document_type as DocumentTypeId];
    const paths = storagePaths(orderId);
    const imageBuffer = Buffer.from(await file.arrayBuffer());

    // Store the new original (overwrites the rejected one — this is the photo
    // the expert approved by email).
    const { error: originalErr } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .upload(paths.original, imageBuffer, { contentType: 'image/jpeg', upsert: true });
    if (originalErr) {
      await sendErrorAlert({ api: 'Supabase', error: originalErr, orderId, context: { operation: 'storage.upload', path: paths.original, stage: 'reupload' } });
      throw originalErr;
    }

    // Same generation path as a human approval: scale the face to the document
    // target ratio using the fresh MediaPipe biometric (same computeCrop() /
    // DOCUMENT_RULES as the AI path), with the legacy cover resize as the
    // fallback. Rekognition stays only as the no-face / multi-face backstop.
    const transparentPng = await removeBackground(imageBuffer);
    const crop = await cropFromBiometric(biometric, transparentPng, spec);
    const processedJpeg = await composePassportPhoto(transparentPng, spec, crop);

    const faceAnalysis = await analyzeFace(processedJpeg, spec);
    if (!faceAnalysis.detected) {
      return NextResponse.json({ error: 'No face detected in the photo.' }, { status: 422 });
    }
    if (faceAnalysis.faceCount > 1) {
      return NextResponse.json({ error: 'Multiple faces detected — only one person allowed.' }, { status: 422 });
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
        await sendErrorAlert({ api: 'Supabase', error: r.error, orderId, context: { operation: 'storage.upload', stage: 'reupload-generate' } });
        throw r.error;
      }
    }

    // Photo generated + stored, marked APPROVED.
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        review_status: 'approved',
        photo_original_url: paths.original,
        photo_processed_url: paths.processed,
        photo_composite_url: paths.composite,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      await sendErrorAlert({ api: 'Supabase', error: updateError, orderId, context: { operation: 'orders.update', stage: 'reupload-approve' } });
      throw updateError;
    }

    // Review fee already covers the digital result — deliver it immediately:
    // generate the PDF, mark fulfilled, set the download link, and email the
    // JPEG + PDF as attachments. Printed copies stay an optional paid add-on.
    await fulfillDigitalOrder(supabase, {
      ...(order as Order),
      review_status: 'approved',
      photo_processed_url: paths.processed,
      photo_composite_url: paths.composite,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[review:reupload]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 },
    );
  }
}
