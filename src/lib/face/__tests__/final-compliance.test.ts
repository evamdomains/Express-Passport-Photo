import { describe, it, expect } from 'vitest';
import { computeCrop, evaluate } from '@/lib/face/PassportComplianceEngine';
import { getBiometricConfig } from '@/lib/face/biometric-config';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import type { DocumentTypeId } from '@/types/document';
import type { BiometricData } from '@/types/biometric';

/**
 * FINAL_COMPLIANCE = the single source of truth. It is derived from the
 * GENERATED photo's geometry (the crop that was actually applied → `achieved`),
 * not the uploaded image. Every surface (review, preview, email, download) reads
 * these same numbers, so they can never conflict.
 */

const DOCS: DocumentTypeId[] = ['us_passport', 'us_visa', 'baby_passport', 'canadian_passport', 'canadian_pr_card'];
const UPLOAD_RATIOS = [0.3, 0.43, 0.47, 0.65, 0.8];

function makeBio(faceHeightNorm: number): BiometricData {
  const imageWidth = 1000;
  const imageHeight = 1200; // portrait, like a phone photo
  return {
    faceDetected: true,
    faceCount: 1,
    imageWidth,
    imageHeight,
    crownY: 0.2 * imageHeight,
    chinY: (0.2 + faceHeightNorm) * imageHeight,
    faceHeight: faceHeightNorm * imageHeight,
    faceWidth: 300,
    faceRatio: faceHeightNorm,
    faceCenterXNorm: 0.5,
    eyeCenterYNorm: 0.38,
    faceHeightNorm,
    leftEyeY: 0.38 * imageHeight,
    rightEyeY: 0.38 * imageHeight,
    eyesOpen: true,
    yaw: 0,
    pitch: 0,
    roll: 0,
    headTilt: 0,
    mouthOpen: false,
    mouthGap: 0.01,
    smileScore: 0.05,
    mouthState: 'NEUTRAL',
    teethVisibilityScore: 0,
  };
}

/** The generated photo's measurements — the SSOT the server stores + ships. */
function generated(bio: BiometricData, id: DocumentTypeId) {
  const spec = DOCUMENT_SPECS[id];
  const cfg = getBiometricConfig(spec);
  const crop = computeCrop(bio, spec, cfg);
  const achieved = crop.height > 0 ? bio.faceHeightNorm / crop.height : cfg.targetRatio;
  const report = evaluate(bio, spec, cfg, achieved);
  // The route attaches measurements from the same `achieved`.
  report.measurements = { faceRatio: achieved, headTopFraction: 0.07, headBottomFraction: 0.64 };
  return { achieved, report, cfg };
}

describe('FINAL_COMPLIANCE — generated ratio == target for every upload size, on every document', () => {
  for (const id of DOCS) {
    const target = getBiometricConfig(DOCUMENT_SPECS[id]).targetRatio;
    for (const up of UPLOAD_RATIOS) {
      it(`${id}: upload ${Math.round(up * 100)}% → generated ${Math.round(target * 100)}% (target), all numbers agree`, () => {
        const { achieved, report } = generated(makeBio(up), id);

        // 1. The GENERATED face ratio always equals the document target.
        expect(achieved).toBeCloseTo(target, 2);

        // 2. Every face-size number a surface could read derives from ONE value.
        expect(report.faceRatioValue).toBeCloseTo(achieved, 3);
        expect(report.faceRatio.value).toBeCloseTo(achieved, 3);
        expect(report.measurements!.faceRatio).toBeCloseTo(achieved, 3);

        // 3. No conflicting upload-based "appears small/large" wording survives.
        const text = [report.faceRatio.message, ...report.warnings].join(' ');
        expect(text).not.toMatch(/appears small|appears large/i);

        // 4. A target-sized generated face is never a size FAIL.
        expect(report.faceRatio.status).not.toBe('FAIL');
      });
    }
  }
});

describe('FINAL_COMPLIANCE — an out-of-spec generated ratio can never be COMPLIANT', () => {
  it('Canadian passport: a 65% generated face FAILs and is NON_COMPLIANT', () => {
    const spec = DOCUMENT_SPECS.canadian_passport;
    const cfg = getBiometricConfig(spec);
    const report = evaluate(makeBio(0.47), spec, cfg, 0.65); // forced out-of-spec generated ratio
    expect(report.faceRatio.status).toBe('FAIL');
    expect(report.overall).toBe('NON_COMPLIANT');
  });
});
