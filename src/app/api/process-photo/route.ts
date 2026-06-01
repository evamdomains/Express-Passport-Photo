import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { removeBackground } from '@/lib/photoroom';
import { analyzeFace } from '@/lib/rekognition';
import { composePassportPhoto, createTiledComposite } from '@/lib/sharp-utils';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import { sendErrorAlert } from '@/lib/alert';
import type { DocumentTypeId } from '@/types/document';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let orderId: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get('photo') as File | null;
    const documentTypeId = formData.get('documentTypeId') as DocumentTypeId | null;
    orderId = formData.get('orderId') as string | null;

    if (!file || !documentTypeId || !orderId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const spec = DOCUMENT_SPECS[documentTypeId];
    if (!spec) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json({ error: 'File must be a JPEG, PNG, WEBP, or HEIC image' }, { status: 422 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 10 MB' }, { status: 422 });
    }

    const supabase = createAdminClient();
    const imageBuffer = Buffer.from(await file.arrayBuffer());

    // Upload original
    const originalPath = `orders/${orderId}/original.jpg`;
    const { error: uploadOriginalError } = await supabase.storage
      .from('photos')
      .upload(originalPath, imageBuffer, { contentType: 'image/jpeg', upsert: true });

    if (uploadOriginalError) {
      await sendErrorAlert({
        api: 'Supabase',
        error: uploadOriginalError,
        orderId: orderId ?? undefined,
        context: { operation: 'storage.upload', path: originalPath },
      });
      throw uploadOriginalError;
    }

    const { data: originalUrlData } = supabase.storage.from('photos').getPublicUrl(originalPath);

    // Remove background (PhotoRoom — alerts internally on failure)
    const transparentPng = await removeBackground(imageBuffer);

    // Compose onto white background
    const processedJpeg = await composePassportPhoto(transparentPng, spec);

    // Face analysis (Rekognition — alerts internally on SDK failure)
    const faceAnalysis = await analyzeFace(processedJpeg, spec);

    if (!faceAnalysis.detected) {
      return NextResponse.json(
        { error: 'No face detected in your photo. Please use a clear, front-facing photo.', code: 'NO_FACE' },
        { status: 422 }
      );
    }
    if (faceAnalysis.faceCount > 1) {
      return NextResponse.json(
        { error: 'Multiple faces detected. Only one person should be in the photo.', code: 'MULTIPLE_FACES' },
        { status: 422 }
      );
    }

    // Create tiled composite
    const tiledJpeg = await createTiledComposite(processedJpeg, spec);

    // Upload processed + composite
    const processedPath = `orders/${orderId}/processed.jpg`;
    const compositePath = `orders/${orderId}/composite.jpg`;

    const [uploadProcessedResult, uploadCompositeResult] = await Promise.all([
      supabase.storage.from('photos').upload(processedPath, processedJpeg, { contentType: 'image/jpeg', upsert: true }),
      supabase.storage.from('photos').upload(compositePath, tiledJpeg, { contentType: 'image/jpeg', upsert: true }),
    ]);

    if (uploadProcessedResult.error) {
      await sendErrorAlert({
        api: 'Supabase',
        error: uploadProcessedResult.error,
        orderId: orderId ?? undefined,
        context: { operation: 'storage.upload', path: processedPath },
      });
      throw uploadProcessedResult.error;
    }
    if (uploadCompositeResult.error) {
      await sendErrorAlert({
        api: 'Supabase',
        error: uploadCompositeResult.error,
        orderId: orderId ?? undefined,
        context: { operation: 'storage.upload', path: compositePath },
      });
      throw uploadCompositeResult.error;
    }

    const { data: processedUrlData } = supabase.storage.from('photos').getPublicUrl(processedPath);
    const { data: compositeUrlData } = supabase.storage.from('photos').getPublicUrl(compositePath);

    // Update order record
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        photo_original_url: originalUrlData.publicUrl,
        photo_processed_url: processedUrlData.publicUrl,
        photo_composite_url: compositeUrlData.publicUrl,
        compliance_data: faceAnalysis.compliance,
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      await sendErrorAlert({
        api: 'Supabase',
        error: updateError,
        orderId: orderId ?? undefined,
        context: { operation: 'orders.update', stage: 'post-processing' },
      });
      // Non-fatal — photos are uploaded; order status update failure shouldn't block the user
      console.error('[process-photo] order update failed (non-fatal):', updateError);
    }

    return NextResponse.json({
      success: true,
      processedUrl: processedUrlData.publicUrl,
      compositeUrl: compositeUrlData.publicUrl,
      compliance: faceAnalysis.compliance,
    });
  } catch (err) {
    console.error('[process-photo]', err);
    // PhotoRoom/Rekognition/Supabase already sent their own alerts; catch anything else
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Processing failed' },
      { status: 500 }
    );
  }
}
