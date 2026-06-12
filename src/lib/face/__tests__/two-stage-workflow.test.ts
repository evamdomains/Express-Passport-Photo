import { describe, it, expect } from 'vitest';
import { buildGateChecks } from '@/lib/face/compliance-gate';
import { computeCrop, evaluate } from '@/lib/face/PassportComplianceEngine';
import { getBiometricConfig } from '@/lib/face/biometric-config';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import type { DocumentTypeId } from '@/types/document';
import type { BiometricData } from '@/types/biometric';
import type { BabyObjectsResult } from '@/lib/face/baby-objects';

/**
 * Two-stage workflow demonstration. Stage 1 is the FREE pre-compliance gate
 * (buildGateChecks) — when it fails, PhotoRoom is never called (PhotoRoomUsed:
 * false). Stage 3 re-validates the generated photo (evaluate at the achieved
 * ratio). All five document types run the identical workflow; only the ratios
 * differ, and they all come from DOCUMENT_RULES via getBiometricConfig.
 */

const ALL_DOCS: DocumentTypeId[] = [
  'us_passport',
  'us_visa',
  'baby_passport',
  'canadian_passport',
  'canadian_pr_card',
];

function makeBio(over: Partial<BiometricData> = {}): BiometricData {
  const faceHeightNorm = over.faceHeightNorm ?? 0.5;
  const imageHeight = over.imageHeight ?? 2000; // hi-res by default → recoverable
  return {
    faceDetected: true,
    faceCount: 1,
    imageWidth: 1600,
    imageHeight,
    crownY: 0.2 * imageHeight,
    chinY: 0.4 * imageHeight + faceHeightNorm * imageHeight,
    faceHeight: faceHeightNorm * imageHeight,
    faceWidth: 480,
    faceRatio: faceHeightNorm,
    faceCenterXNorm: 0.5,
    eyeCenterYNorm: 0.4,
    faceHeightNorm,
    leftEyeY: 0.4 * imageHeight,
    rightEyeY: 0.4 * imageHeight,
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
    ...over,
  };
}

const babyFail = (reason: string): BabyObjectsResult => ({
  status: 'FAIL',
  reason,
  items: [],
});

interface WorkflowLog {
  doc: DocumentTypeId;
  uploadedFaceRatio: number;
  targetRatio: number;
  scaleFactor: number | null;
  finalRatio: number | null;
  stage1Result: 'PASS' | 'FAIL';
  stage1Errors: string[];
  stage3Result: 'PASS' | 'FAIL' | 'SKIPPED';
  PhotoRoomUsed: boolean;
}

/** Run the full two-stage decision for one document + biometric. */
function runWorkflow(doc: DocumentTypeId, bio: BiometricData, babyObjects?: BabyObjectsResult): WorkflowLog {
  const spec = DOCUMENT_SPECS[doc];
  const cfg = getBiometricConfig(spec);

  // STAGE 1 — free pre-compliance gate (no PhotoRoom).
  const stage1 = buildGateChecks(bio, spec, babyObjects);
  const stage1Errors = stage1.checks.filter((c) => c.status === 'FAIL').map((c) => c.message);

  const uploadedFaceRatio = bio.faceHeightNorm;
  const targetRatio = cfg.targetRatio;
  const scaleFactor = uploadedFaceRatio > 0 ? targetRatio / uploadedFaceRatio : null;

  if (!stage1.passed) {
    // STOP — PhotoRoom is skipped, nothing generated.
    return {
      doc, uploadedFaceRatio, targetRatio, scaleFactor,
      finalRatio: null, stage1Result: 'FAIL', stage1Errors, stage3Result: 'SKIPPED', PhotoRoomUsed: false,
    };
  }

  // STAGE 2 — generation (PhotoRoom + auto crop/scale). The scaler aims the face
  // exactly at the target ratio.
  const crop = computeCrop(bio, spec, cfg);
  const finalRatio = crop.height > 0 ? bio.faceHeightNorm / crop.height : targetRatio;

  // STAGE 3 — final compliance against the generated photo.
  const report = evaluate(bio, spec, cfg, finalRatio);
  const stage3Result = report.overall === 'NON_COMPLIANT' ? 'FAIL' : 'PASS';

  return {
    doc, uploadedFaceRatio, targetRatio, scaleFactor,
    finalRatio, stage1Result: 'PASS', stage1Errors, stage3Result, PhotoRoomUsed: true,
  };
}

function logRow(label: string, r: WorkflowLog) {
  const sf = r.scaleFactor != null ? `${r.scaleFactor.toFixed(2)}×` : '—';
  const fr = r.finalRatio != null ? `${(r.finalRatio * 100).toFixed(1)}%` : '—';
  // eslint-disable-next-line no-console
  console.log(
    `[${label}] ${r.doc.padEnd(18)} uploaded=${(r.uploadedFaceRatio * 100).toFixed(0)}% ` +
      `target=${(r.targetRatio * 100).toFixed(1)}% scale=${sf} final=${fr} ` +
      `stage1=${r.stage1Result} stage3=${r.stage3Result} PhotoRoomUsed=${r.PhotoRoomUsed}` +
      (r.stage1Errors.length ? ` :: ${r.stage1Errors.join('; ')}` : ''),
  );
}

describe('Two-stage workflow — identical across all five document types', () => {
  it('VALID photo: Stage 1 passes, PhotoRoom IS used, Stage 3 passes, output = target ratio', () => {
    for (const doc of ALL_DOCS) {
      const r = runWorkflow(doc, makeBio({ faceHeightNorm: getBiometricConfig(DOCUMENT_SPECS[doc]).targetRatio }));
      logRow('VALID', r);
      expect(r.stage1Result).toBe('PASS');
      expect(r.PhotoRoomUsed).toBe(true);
      expect(r.stage3Result).toBe('PASS');
      expect(r.finalRatio).toBeCloseTo(r.targetRatio, 2);
    }
  });

  it('Face TOO SMALL but recoverable (40%, hi-res): scaled UP to target, PhotoRoom used', () => {
    for (const doc of ALL_DOCS) {
      const r = runWorkflow(doc, makeBio({ faceHeightNorm: 0.4, imageHeight: 2400 }));
      logRow('SMALL-OK', r);
      expect(r.stage1Result).toBe('PASS');
      expect(r.PhotoRoomUsed).toBe(true);
      expect(r.scaleFactor! > 1).toBe(true); // enlarged
      expect(r.finalRatio).toBeCloseTo(r.targetRatio, 2);
    }
  });

  it('Face TOO LARGE but recoverable (80%, in-frame): scaled DOWN to target, PhotoRoom used', () => {
    for (const doc of ALL_DOCS) {
      const r = runWorkflow(doc, makeBio({ faceHeightNorm: 0.8, imageHeight: 2400 }));
      logRow('LARGE-OK', r);
      expect(r.stage1Result).toBe('PASS');
      expect(r.PhotoRoomUsed).toBe(true);
      expect(r.scaleFactor! < 1).toBe(true); // shrunk
      expect(r.finalRatio).toBeCloseTo(r.targetRatio, 2);
    }
  });
});

describe('Two-stage workflow — bad photos are rejected BEFORE PhotoRoom (0 credits)', () => {
  it('Visible TEETH → Stage 1 FAIL, PhotoRoom skipped', () => {
    const r = runWorkflow('us_passport', makeBio({ teethVisibilityScore: 0.2 }));
    logRow('TEETH', r);
    expect(r.stage1Result).toBe('FAIL');
    expect(r.PhotoRoomUsed).toBe(false);
    expect(r.stage1Errors.join(' ')).toMatch(/teeth/i);
  });

  it('Eyes CLOSED → Stage 1 FAIL (non-infant), PhotoRoom skipped', () => {
    const r = runWorkflow('us_passport', makeBio({ eyesOpen: false }));
    logRow('EYES-CLOSED', r);
    expect(r.stage1Result).toBe('FAIL');
    expect(r.PhotoRoomUsed).toBe(false);
  });

  it('Eyes CLOSED on a BABY → Stage 1 PASSES (infant relaxed rule), PhotoRoom used', () => {
    const r = runWorkflow('baby_passport', makeBio({ eyesOpen: false }));
    logRow('EYES-CLOSED-BABY', r);
    expect(r.stage1Result).toBe('PASS');
    expect(r.PhotoRoomUsed).toBe(true);
  });

  it('LOW RESOLUTION (40% face on a 200px image) → Stage 1 FAIL, PhotoRoom skipped', () => {
    const r = runWorkflow('us_passport', makeBio({ faceHeightNorm: 0.4, imageHeight: 200 }));
    logRow('LOW-RES', r);
    expect(r.stage1Result).toBe('FAIL');
    expect(r.PhotoRoomUsed).toBe(false);
    expect(r.stage1Errors.join(' ')).toMatch(/resolution|too small/i);
  });

  it('MULTIPLE FACES → Stage 1 FAIL, PhotoRoom skipped', () => {
    const r = runWorkflow('us_passport', makeBio({ faceCount: 2 }));
    logRow('MULTI-FACE', r);
    expect(r.stage1Result).toBe('FAIL');
    expect(r.PhotoRoomUsed).toBe(false);
    expect(r.stage1Errors.join(' ')).toMatch(/multiple/i);
  });

  it('BABY with PARENT visible → Stage 1 FAIL (baby objects), PhotoRoom skipped', () => {
    const r = runWorkflow('baby_passport', makeBio(), babyFail('Another person detected. Remove it and keep the baby alone in the frame.'));
    logRow('BABY-PARENT', r);
    expect(r.stage1Result).toBe('FAIL');
    expect(r.PhotoRoomUsed).toBe(false);
    expect(r.stage1Errors.join(' ')).toMatch(/person/i);
  });

  it('BABY with PACIFIER → Stage 1 FAIL (baby objects), PhotoRoom skipped', () => {
    const r = runWorkflow('baby_passport', makeBio(), babyFail('Pacifier detected. Remove it and keep the baby alone in the frame.'));
    logRow('BABY-PACIFIER', r);
    expect(r.stage1Result).toBe('FAIL');
    expect(r.PhotoRoomUsed).toBe(false);
    expect(r.stage1Errors.join(' ')).toMatch(/pacifier/i);
  });

  it('baby object FAIL does NOT affect non-baby docs (objects check is infant-only)', () => {
    // Same biometric, US passport: no baby-object gate runs → Stage 1 passes.
    const r = runWorkflow('us_passport', makeBio(), babyFail('Pacifier detected.'));
    expect(r.stage1Result).toBe('PASS');
    expect(r.PhotoRoomUsed).toBe(true);
  });
});
