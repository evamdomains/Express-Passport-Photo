import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { removeBackground } from '@/lib/photoroom';
import { analyzeFace } from '@/lib/rekognition';
import { composePassportPhoto, createTiledComposite, measureCrownYNorm } from '@/lib/sharp-utils';
import { generatePreview } from '@/lib/watermark';
import { PHOTOS_BUCKET, storagePaths } from '@/lib/storage';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import { getBiometricConfig } from '@/lib/face/biometric-config';
import { computeCrop, evaluate, toComplianceResult } from '@/lib/face/PassportComplianceEngine';
import { buildGateChecks } from '@/lib/face/compliance-gate';
import type { ObjectsAndObstruction } from '@/lib/face/object-compliance';
import { analyzeExposure } from '@/lib/exposure-analysis';
import { analyzeBlur } from '@/lib/blur-analysis';
import { sendErrorAlert } from '@/lib/alert';
import type { DocumentTypeId } from '@/types/document';
import type { CropRect, BiometricData, ImageQualityMetrics } from '@/types/biometric';
import type { ComplianceResult, ExposureAnalysis, BlurAnalysis } from '@/types/order';

export const maxDuration = 60;

/**
 * Two-stage compliance pipeline (identical for all five document types; all
 * ratios/rules come from DOCUMENT_RULES via getBiometricConfig):
 *
 *   STAGE 1 — FREE pre-compliance gate (NO PhotoRoom). Runs the same
 *     buildGateChecks() the browser ran, against the MediaPipe biometric +
 *     baby-object result. A failure STOPS here: no PhotoRoom credit is spent and
 *     no asset is generated.
 *   STAGE 2 — Generation. Only reached on a Stage-1 pass: PhotoRoom background
 *     removal → target-ratio auto crop/scale → composite.
 *   STAGE 3 — Final compliance against the GENERATED photo. A failure deletes
 *     the candidate assets and creates none of the deliverables.
 *
 * Only when Stage 1 AND Stage 3 pass are the deliverables persisted.
 */

/** Remove any candidate assets written for this order (Stage-3 failure cleanup). */
async function deleteCandidateAssets(
  supabase: ReturnType<typeof createAdminClient>,
  paths: ReturnType<typeof storagePaths>,
): Promise<void> {
  try {
    await supabase.storage
      .from(PHOTOS_BUCKET)
      .remove([paths.original, paths.processed, paths.composite, paths.preview]);
  } catch {
    /* best-effort cleanup — never mask the original rejection */
  }
}

export async function POST(req: NextRequest) {
  let orderId: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get('photo') as File | null;
    const documentTypeId = formData.get('documentTypeId') as DocumentTypeId | null;
    orderId = formData.get('orderId') as string | null;

    // Browser-measured biometrics (MediaPipe) drive Stage 1 + the crop. Absent
    // biometric → the legacy resize + Rekognition fallback (the only path that
    // can reach PhotoRoom without a Stage-1 gate; happens only on MP failure).
    let biometric: BiometricData | undefined;
    let quality: ImageQualityMetrics | undefined;
    let objects: ObjectsAndObstruction | undefined;
    let objectSharpness: number | undefined;
    let fallbackCrop: CropRect | undefined;
    try {
      const bioRaw = formData.get('biometric');
      if (typeof bioRaw === 'string') biometric = JSON.parse(bioRaw) as BiometricData;
    } catch { /* ignore malformed biometric → fallback */ }
    try {
      const qRaw = formData.get('quality');
      if (typeof qRaw === 'string') quality = JSON.parse(qRaw) as ImageQualityMetrics;
    } catch { /* ignore malformed quality metrics */ }
    try {
      const objRaw = formData.get('objects');
      if (typeof objRaw === 'string') objects = JSON.parse(objRaw) as ObjectsAndObstruction;
    } catch { /* ignore malformed object-detection result */ }
    try {
      const osRaw = formData.get('objectSharpness');
      if (typeof osRaw === 'string') objectSharpness = Number(osRaw);
    } catch { /* ignore */ }
    try {
      const cropRaw = formData.get('crop');
      if (typeof cropRaw === 'string') fallbackCrop = JSON.parse(cropRaw) as CropRect;
    } catch { /* ignore */ }

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

    const cfg = getBiometricConfig(spec);

    // ── STAGE 1 — FREE PRE-COMPLIANCE GATE (no PhotoRoom) ────────────────────
    // Server-side re-run of the browser gate, so a direct API call can't spend a
    // PhotoRoom credit on a photo that has no chance of becoming compliant.
    if (biometric) {
      const stage1 = buildGateChecks(biometric, spec, { quality, objects, objectSharpness });
      if (!stage1.passed) {
        const errors = stage1.checks.filter((c) => c.status === 'FAIL').map((c) => c.message);
        console.log('[process-photo] STAGE 1 REJECTED', { orderId, documentTypeId, PhotoRoomUsed: false, errors });
        return NextResponse.json(
          {
            status: 'REJECTED',
            stage: 'PRE_COMPLIANCE',
            errors,
            error: errors[0] ?? 'Photo did not pass pre-compliance.',
            detectedObjects: objects?.detectedObjects ?? [],
          },
          { status: 422 },
        );
      }
    }

    const supabase = createAdminClient();
    const imageBuffer = Buffer.from(await file.arrayBuffer());
    const paths = storagePaths(orderId);

    // Upload original (PRIVATE — never exposed publicly). Reached only after a
    // Stage-1 pass (or the no-biometric fallback).
    const { error: uploadOriginalError } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .upload(paths.original, imageBuffer, { contentType: 'image/jpeg', upsert: true });

    if (uploadOriginalError) {
      await sendErrorAlert({
        api: 'Supabase',
        error: uploadOriginalError,
        orderId: orderId ?? undefined,
        context: { operation: 'storage.upload', path: paths.original },
      });
      throw uploadOriginalError;
    }

    // ── Exposure + blur analysis (face region only; after compliance, before
    // PhotoRoom). Analysis ONLY — read-only compliance checks that do NOT modify
    // the image; results are stored in compliance_data and shown in the panel.
    let exposure: ExposureAnalysis | undefined;
    let blur: BlurAnalysis | undefined;
    if (biometric?.faceDetected) {
      exposure = await analyzeExposure(imageBuffer, biometric, biometric.imageWidth, biometric.imageHeight);
      blur = await analyzeBlur(imageBuffer, biometric, biometric.imageWidth, biometric.imageHeight);
      console.log('[process-photo] quality-analysis', {
        orderId, exposure: exposure.status, blur: blur.status, blurScore: blur.blurScore,
      });

      // Authoritative exposure gate (measured from the real pixels, not the
      // browser metrics): a FAIL stops here so PhotoRoom is NEVER called on a
      // badly-lit photo. Applies to every document type.
      if (exposure.status === 'FAIL') {
        console.log('[process-photo] EXPOSURE REJECTED (pre-PhotoRoom)', { orderId, reason: exposure.reason });
        return NextResponse.json(
          {
            status: 'REJECTED',
            stage: 'PRE_COMPLIANCE',
            errors: [exposure.reason],
            error: exposure.reason,
            detectedObjects: objects?.detectedObjects ?? [],
          },
          { status: 422 },
        );
      }
    }

    // ── STAGE 2 — GENERATION ────────────────────────────────────────────────
    // The ONLY PhotoRoom call in the pipeline. The user's uploaded image is sent
    // as-is (no enhancement) — reached only on a Stage-1 pass.
    const transparentPng = await removeBackground(imageBuffer);

    // Biometric crop (target-driven face scaling). MediaPipe (browser) measured
    // chin/eyes/face-centre/pose/mouth; here the server measures the TRUE crown
    // (top of hair) from the PhotoRoom alpha silhouette, refines face height to
    // crown→chin, and scales the face to the document's target ratio.
    let crop: CropRect | undefined = fallbackCrop;
    let mpCompliance: ComplianceResult | undefined;
    let uploadedFaceRatio = 0;
    let achievedRatio = cfg.targetRatio;

    if (biometric?.faceDetected) {
      const crownYNorm = await measureCrownYNorm(transparentPng);

      let refined = biometric;
      if (crownYNorm != null && biometric.imageHeight > 0) {
        const chinYNorm = biometric.chinY / biometric.imageHeight;
        const trueFaceHeightNorm = Math.max(0.05, chinYNorm - crownYNorm);
        refined = { ...biometric, faceHeightNorm: trueFaceHeightNorm, faceRatio: trueFaceHeightNorm };
      }
      uploadedFaceRatio = refined.faceHeightNorm;

      crop = computeCrop(refined, spec, cfg);
      // Achieved ratio = (true crown→chin) / crop height → equals target by design.
      achievedRatio = crop.height > 0 ? refined.faceHeightNorm / crop.height : cfg.targetRatio;
      const report = evaluate(refined, spec, cfg, achievedRatio);

      // Clean, non-conflicting note (same crown→chin metric, upload → generated).
      // Replaces any "face appears small/large" wording so the review page shows
      // one consistent story.
      const upPct = Math.round(uploadedFaceRatio * 100);
      const genPct = Math.round(achievedRatio * 100);
      if (Math.abs(upPct - genPct) >= 2) {
        report.warnings.unshift(`Auto-scaled from ${upPct}% to ${genPct}% (document target ${Math.round(cfg.targetRatio * 100)}%).`);
      }

      // Crown/chin position in the FINAL composed image (review overlay SSOT):
      // map the source crown/chin through the exact crop used to scale the face.
      const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
      const chinYNormFinal = refined.imageHeight > 0 ? refined.chinY / refined.imageHeight : 0;
      const crownYNormFinal = chinYNormFinal - refined.faceHeightNorm;
      if (crop.height > 0) {
        report.measurements = {
          faceRatio: achievedRatio,
          headTopFraction: clamp01((crownYNormFinal - crop.top) / crop.height),
          headBottomFraction: clamp01((chinYNormFinal - crop.top) / crop.height),
        };
      }

      mpCompliance = toComplianceResult(report, refined, cfg);
    }

    // Compose onto white background (guarantees passport dimensions + white
    // background + margins by construction). With a crop the FACE is scaled to
    // the target ratio; otherwise the legacy cover/top resize is used.
    const processedJpeg = await composePassportPhoto(transparentPng, spec, crop);

    // ── STAGE 3 — FINAL COMPLIANCE (against the GENERATED photo) ─────────────
    // Rekognition runs on the *scaled* photo as the no-face / multi-face backstop
    // and to enrich advisory warnings; MediaPipe (server-refined) is primary.
    const faceAnalysis = await analyzeFace(processedJpeg, spec);

    let compliance: ComplianceResult = faceAnalysis.compliance;
    if (mpCompliance) {
      compliance = {
        ...mpCompliance,
        warnings: Array.from(new Set([...mpCompliance.warnings, ...faceAnalysis.compliance.warnings])),
      };
      if (faceAnalysis.faceCount > 1) {
        compliance.faceCount = faceAnalysis.faceCount;
        compliance.passed = false;
        if (!compliance.issues.some((i) => i.toLowerCase().includes('multiple'))) {
          compliance.issues = [...compliance.issues, 'Multiple faces detected — only one person allowed'];
        }
      }
    }
    // Single source of truth carries the (read-only) exposure + blur analysis.
    compliance = { ...compliance, exposure, blur };

    // Stage-3 failures → DELETE the candidate assets and create NONE of the
    // deliverables (processed/composite/preview, and later the webhook PDF).
    const stage3Errors: string[] = [];
    // Explicit guard on the FINAL generated face ratio (single source of truth:
    // the same `achievedRatio` the report + overlay use). A generated image can
    // NEVER be COMPLIANT while violating the document sizing spec.
    const ratioInSpec = achievedRatio >= cfg.faceRatioMin && achievedRatio <= cfg.faceRatioMax;
    if (!faceAnalysis.detected) {
      stage3Errors.push('No face detected in the generated photo.');
    } else if (faceAnalysis.faceCount > 1) {
      stage3Errors.push('Multiple faces detected — only one person allowed.');
    } else if (!ratioInSpec) {
      stage3Errors.push(
        `Generated image violates ${spec.name} sizing rules: face ${Math.round(achievedRatio * 100)}% ` +
          `of frame (allowed ${Math.round(cfg.faceRatioMin * 100)}–${Math.round(cfg.faceRatioMax * 100)}%).`,
      );
    } else if (!compliance.passed) {
      stage3Errors.push(...(compliance.issues.length ? compliance.issues : ['Generated photo failed final compliance.']));
    }

    if (stage3Errors.length > 0) {
      await deleteCandidateAssets(supabase, paths);
      console.log('[process-photo] STAGE 3 REJECTED', {
        orderId, documentTypeId, PhotoRoomUsed: true, uploadedFaceRatio, targetRatio: cfg.targetRatio,
        finalRatio: achievedRatio, errors: stage3Errors,
      });
      const code = !faceAnalysis.detected ? 'NO_FACE' : faceAnalysis.faceCount > 1 ? 'MULTIPLE_FACES' : 'FINAL_COMPLIANCE';
      return NextResponse.json(
        { status: 'REJECTED', stage: 'FINAL_COMPLIANCE', code, errors: stage3Errors, error: stage3Errors[0] },
        { status: 422 },
      );
    }

    // ── PASS — generate + persist all deliverables ──────────────────────────
    const tiledJpeg = await createTiledComposite(processedJpeg, spec);
    const previewJpeg = await generatePreview(processedJpeg);

    const [uploadProcessedResult, uploadCompositeResult, uploadPreviewResult] = await Promise.all([
      supabase.storage.from(PHOTOS_BUCKET).upload(paths.processed, processedJpeg, { contentType: 'image/jpeg', upsert: true }),
      supabase.storage.from(PHOTOS_BUCKET).upload(paths.composite, tiledJpeg, { contentType: 'image/jpeg', upsert: true }),
      supabase.storage.from(PHOTOS_BUCKET).upload(paths.preview, previewJpeg, { contentType: 'image/jpeg', upsert: true }),
    ]);

    if (uploadProcessedResult.error) {
      await sendErrorAlert({ api: 'Supabase', error: uploadProcessedResult.error, orderId: orderId ?? undefined, context: { operation: 'storage.upload', path: paths.processed } });
      throw uploadProcessedResult.error;
    }
    if (uploadCompositeResult.error) {
      await sendErrorAlert({ api: 'Supabase', error: uploadCompositeResult.error, orderId: orderId ?? undefined, context: { operation: 'storage.upload', path: paths.composite } });
      throw uploadCompositeResult.error;
    }
    if (uploadPreviewResult.error) {
      await sendErrorAlert({ api: 'Supabase', error: uploadPreviewResult.error, orderId: orderId ?? undefined, context: { operation: 'storage.upload', path: paths.preview } });
      throw uploadPreviewResult.error;
    }

    // Store storage PATHS (not public URLs). These also act as the
    // "files still exist" flags the 48h cleanup job reads.
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        photo_original_url: paths.original,
        photo_processed_url: paths.processed,
        photo_composite_url: paths.composite,
        compliance_data: compliance,
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

    console.log('[process-photo] PASSED', {
      orderId, documentTypeId, PhotoRoomUsed: true, uploadedFaceRatio, targetRatio: cfg.targetRatio,
      scaleFactor: uploadedFaceRatio > 0 ? cfg.targetRatio / uploadedFaceRatio : null, finalRatio: achievedRatio,
    });

    return NextResponse.json({ success: true, compliance, detectedObjects: objects?.detectedObjects ?? [] });
  } catch (err) {
    console.error('[process-photo]', err);
    // PhotoRoom/Rekognition/Supabase already sent their own alerts; catch anything else
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Processing failed' },
      { status: 500 }
    );
  }
}
