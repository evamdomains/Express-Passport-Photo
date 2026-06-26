import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PHOTOS_BUCKET, storagePaths } from '@/lib/storage';
import { sendErrorAlert } from '@/lib/alert';
import type { BiometricData } from '@/types/biometric';
import type { ComplianceResult } from '@/types/order';

export const maxDuration = 30;

/**
 * Stores the uploaded original for a HUMAN-REVIEW order — no AI gate, no
 * PhotoRoom, no compliance. The instant-AI path uploads the original inside
 * /api/process-photo (which also runs the compliance gate + generation); the
 * human path deliberately skips all of that, because a person is the compliance
 * authority. We only need the original saved so the reviewer can see it and so
 * the approve step can generate the files later.
 *
 * Flow: called from the upload step BEFORE the $0 checkout. After checkout
 * completes, the Stripe webhook sees review_type='human' + this stored original
 * and enters the review queue.
 */
export async function POST(req: NextRequest) {
  let orderId: string | null = null;
  try {
    const formData = await req.formData();
    const file = formData.get('photo') as File | null;
    orderId = formData.get('orderId') as string | null;

    // MediaPipe biometric measured in the browser (same as the AI path). Stored
    // so the reviewer's approval can scale the face with the identical crop math.
    let biometric: BiometricData | undefined;
    try {
      const bioRaw = formData.get('biometric');
      if (typeof bioRaw === 'string') biometric = JSON.parse(bioRaw) as BiometricData;
    } catch { /* ignore malformed biometric — approval falls back to cover resize */ }

    if (!file || !orderId) {
      return NextResponse.json({ error: 'Missing photo or orderId' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json({ error: 'File must be a JPEG, PNG, WEBP, or HEIC image' }, { status: 422 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 10 MB' }, { status: 422 });
    }

    const supabase = createAdminClient();

    // Confirm this is a human-review order before storing anything.
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, review_type')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.review_type !== 'human') {
      return NextResponse.json({ error: 'Not a human-review order' }, { status: 400 });
    }

    const paths = storagePaths(orderId);
    const imageBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .upload(paths.original, imageBuffer, { contentType: 'image/jpeg', upsert: true });

    if (uploadError) {
      await sendErrorAlert({
        api: 'Supabase',
        error: uploadError,
        orderId,
        context: { operation: 'storage.upload', path: paths.original, stage: 'review-submit' },
      });
      throw uploadError;
    }

    // Record the stored path (also a "file exists" flag for the 48h cleanup job)
    // and persist the MediaPipe biometric so approval reuses it for scaling.
    const complianceData: ComplianceResult | undefined = biometric
      ? {
          passed: true,
          faceDetected: biometric.faceDetected,
          faceCount: biometric.faceCount,
          headHeightPercent: null,
          eyesOpen: null,
          mouthClosed: null,
          facingForward: null,
          issues: [],
          warnings: [],
          biometric,
        }
      : undefined;

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        photo_original_url: paths.original,
        ...(complianceData ? { compliance_data: complianceData } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('[review:submit] order update failed (non-fatal):', updateError.message);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[review:submit]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 },
    );
  }
}
