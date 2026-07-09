import { DOCUMENT_SPECS } from '@/constants/document-specs';
import { getBiometricConfig } from '@/lib/face/biometric-config';
import { computeCrop } from '@/lib/face/PassportComplianceEngine';
import { buildGateChecks, type GateExtras } from '@/lib/face/compliance-gate';
import { removeBackground } from '@/lib/photoroom';
import { composePassportPhoto, measureCrownYNorm } from '@/lib/sharp-utils';
import { isFreeCanadianDocument, DEBUG_FREE_CANADIAN } from '@/config/features';
import type { BiometricData, CropRect } from '@/types/biometric';
import type { DocumentSpec } from '@/types/document';

/**
 * FREE CANADIAN GENERATOR — fully ISOLATED from the premium pipeline.
 *
 * The premium generation lives in /api/process-photo (orders, Supabase storage,
 * watermark/preview, tiled print sheet, PDF, Stripe, email). This module does NONE
 * of that. It reuses ONLY the shared primitives — the compliance gate, the
 * PhotoRoom client, and the sharp compositor — to turn an uploaded photo into a
 * single passport JPEG that is returned directly to the browser for download.
 *
 * Deliberately absent here (and NOT imported): Stripe, Supabase storage, order
 * creation, signed URLs, email/Resend, watermark, preview, tiled sheet, PDF.
 */

export interface FreeCanadianInput {
  imageBuffer: Buffer;
  documentTypeId: string;
  biometric?: BiometricData;
  extras?: GateExtras;
}

export type FreeCanadianResult =
  | { ok: true; jpeg: Buffer }
  | { ok: false; errors: string[] };

/**
 * Generate the single passport JPEG (no tiling / PDF / storage). Same face-scaling
 * quality as the premium `processed.jpg`: PhotoRoom cut-out → true-crown refine →
 * target-ratio crop → composite on white. Reuses the shared helpers; no duplication.
 */
export async function generateFreeCanadianPhoto(
  imageBuffer: Buffer,
  spec: DocumentSpec,
  biometric?: BiometricData,
): Promise<Buffer> {
  const cfg = getBiometricConfig(spec);
  const transparentPng = await removeBackground(imageBuffer);

  let crop: CropRect | undefined;
  if (biometric?.faceDetected) {
    const crownYNorm = await measureCrownYNorm(transparentPng);
    let refined = biometric;
    if (crownYNorm != null && biometric.imageHeight > 0) {
      const chinYNorm = biometric.chinY / biometric.imageHeight;
      const trueFaceHeightNorm = Math.max(0.05, chinYNorm - crownYNorm);
      refined = { ...biometric, faceHeightNorm: trueFaceHeightNorm, faceRatio: trueFaceHeightNorm };
    }
    crop = computeCrop(refined, spec, cfg);
  }

  return composePassportPhoto(transparentPng, spec, crop);
}

/**
 * Full free-flow pipeline: COMPLIANCE GATE → (PASS) → PhotoRoom + generate → JPEG.
 * On a gate failure it returns the errors and NEVER calls PhotoRoom. This is the
 * testable core the API route delegates to.
 */
export async function runFreeCanadianPipeline(input: FreeCanadianInput): Promise<FreeCanadianResult> {
  const { imageBuffer, documentTypeId, biometric, extras } = input;

  // This pipeline is Canadian-only + flag-gated. Anything else is a routing bug.
  if (!isFreeCanadianDocument(documentTypeId)) {
    return { ok: false, errors: ['This document does not use the free Canadian flow.'] };
  }
  const spec = DOCUMENT_SPECS[documentTypeId as keyof typeof DOCUMENT_SPECS];
  if (!spec) return { ok: false, errors: ['Invalid document type'] };

  // ── COMPLIANCE (reuse the exact same gate as premium Stage-1) ──
  if (biometric) {
    const gate = buildGateChecks(biometric, spec, extras);
    if (!gate.passed) {
      const errors = gate.checks.filter((c) => c.status === 'FAIL').map((c) => c.message);
      logFree(documentTypeId, { compliance: 'FAILED', reason: errors[0] });
      return { ok: false, errors };
    }
  }

  // ── GENERATE (PhotoRoom + compose) — reached only on a compliance PASS ──
  const jpeg = await generateFreeCanadianPhoto(imageBuffer, spec, biometric);
  logFree(documentTypeId, { compliance: 'PASS' });
  return { ok: true, jpeg };
}

/** Debug block for the free Canadian flow (mirrors the premium per-request logging). */
function logFree(documentTypeId: string, o: { compliance: 'PASS' | 'FAILED'; reason?: string }): void {
  if (!DEBUG_FREE_CANADIAN) return;
  const passed = o.compliance === 'PASS';
  console.log(
    [
      '==============================',
      'FREE CANADIAN FLOW',
      `Document:   ${documentTypeId}`,
      `Compliance: ${o.compliance}`,
      ...(passed
        ? [
            'PhotoRoom:  CALLED',
            'Checkout:   SKIPPED',
            'Storage:    SKIPPED',
            'Email:      SKIPPED',
            'Download:   READY',
          ]
        : [`Reason:     ${o.reason ?? 'compliance failed'}`, 'PhotoRoom:  NOT CALLED']),
      '==============================',
    ].join('\n'),
  );
}
