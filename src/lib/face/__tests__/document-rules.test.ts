import { describe, it, expect } from 'vitest';
import { DOCUMENT_RULES, getBiometricConfig } from '@/lib/face/biometric-config';
import { computeCrop, evaluate, toComplianceResult } from '@/lib/face/PassportComplianceEngine';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import type { BiometricData } from '@/types/biometric';
import type { DocumentTypeId } from '@/types/document';

const DOCS: DocumentTypeId[] = ['us_passport', 'us_visa', 'baby_passport', 'canadian_passport', 'canadian_pr_card'];

function makeBio(over: Partial<BiometricData> = {}): BiometricData {
  const faceHeightNorm = over.faceHeightNorm ?? 0.4;
  const imageHeight = over.imageHeight ?? 1200;
  return {
    faceDetected: true,
    faceCount: 1,
    imageWidth: 1000,
    imageHeight,
    crownY: 120,
    chinY: 0.4 * imageHeight + faceHeightNorm * imageHeight,
    faceHeight: faceHeightNorm * imageHeight,
    faceWidth: 300,
    faceRatio: faceHeightNorm,
    faceCenterXNorm: 0.5,
    eyeCenterYNorm: 0.4,
    faceHeightNorm,
    leftEyeY: 480,
    rightEyeY: 480,
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

/** Achieved (post-scale) ratio of the produced photo. */
function achieved(bio: BiometricData, id: DocumentTypeId): number {
  const spec = DOCUMENT_SPECS[id];
  const cfg = getBiometricConfig(spec);
  const crop = computeCrop(bio, spec, cfg);
  return bio.faceHeightNorm / crop.height;
}

describe('DOCUMENT_RULES — per-document config', () => {
  it('US Visa targets 56.5% (matches passport) but keeps the wider 50–70% / 56–64% range', () => {
    expect(DOCUMENT_RULES.us_visa.targetRatio).toBe(0.565);
    expect(DOCUMENT_RULES.us_visa.optimalMin).toBe(0.56);
    expect(DOCUMENT_RULES.us_visa.optimalMax).toBe(0.64);
    expect(DOCUMENT_RULES.us_visa.faceRatioMax).toBe(0.7);
    expect(DOCUMENT_RULES.us_passport.targetRatio).toBe(0.565);
    expect(DOCUMENT_RULES.us_passport.faceRatioMax).toBe(0.69);
  });

  it('Canada passport and PR card share the 47% target / 44–51% range', () => {
    for (const id of ['canadian_passport', 'canadian_pr_card'] as const) {
      expect(DOCUMENT_RULES[id].targetRatio).toBe(0.47);
      expect(DOCUMENT_RULES[id].faceRatioMin).toBe(0.44);
      expect(DOCUMENT_RULES[id].faceRatioMax).toBe(0.51);
    }
  });

  it('Baby passport carries infant + relaxed-eyes flags and larger pose tolerance', () => {
    expect(DOCUMENT_RULES.baby_passport.infant).toBe(true);
    expect(DOCUMENT_RULES.baby_passport.relaxedEyes).toBe(true);
    expect(DOCUMENT_RULES.baby_passport.yawTol).toBeGreaterThan(DOCUMENT_RULES.us_passport.yawTol);
  });
});

describe('Face scaling targets each document ratio (before → after)', () => {
  for (const id of DOCS) {
    const target = getBiometricConfig(DOCUMENT_SPECS[id]).targetRatio;
    it(`${id}: small 0.30 and large 0.80 INPUT faces both scale to exactly ${target}`, () => {
      expect(achieved(makeBio({ faceHeightNorm: 0.3 }), id)).toBeCloseTo(target, 2); // small → up
      expect(achieved(makeBio({ faceHeightNorm: 0.8 }), id)).toBeCloseTo(target, 2); // large → down (padded)
      const r = evaluate(makeBio({ faceHeightNorm: 0.4 }), DOCUMENT_SPECS[id], getBiometricConfig(DOCUMENT_SPECS[id]), target);
      expect(r.overall).toBe('OPTIMAL');
      expect(r.faceRatioValue).toBeCloseTo(target, 2);
    });
  }

  it('reframes excess / insufficient top space to the same target', () => {
    expect(achieved(makeBio({ faceHeightNorm: 0.4, eyeCenterYNorm: 0.25 }), 'us_passport')).toBeCloseTo(0.565, 2);
    expect(achieved(makeBio({ faceHeightNorm: 0.4, eyeCenterYNorm: 0.6 }), 'us_passport')).toBeCloseTo(0.565, 2);
  });
});

describe('FINAL generated ratio is validated against the document spec (the 65% bug)', () => {
  it('Canadian passport: 44/47/51% are accepted; 65% FAILs and is NEVER COMPLIANT', () => {
    const spec = DOCUMENT_SPECS.canadian_passport;
    const cfg = getBiometricConfig(spec);
    for (const ratio of [0.44, 0.47, 0.51]) {
      const r = evaluate(makeBio(), spec, cfg, ratio);
      expect(r.faceRatio.status).not.toBe('FAIL');
      expect(r.overall).not.toBe('NON_COMPLIANT');
    }
    // The exact screenshot scenario: a 65% Canadian face must hard-FAIL.
    const bad = evaluate(makeBio(), spec, cfg, 0.65);
    expect(bad.faceRatio.status).toBe('FAIL');
    expect(bad.overall).toBe('NON_COMPLIANT');
    expect(toComplianceResult(bad, makeBio(), cfg).passed).toBe(false);
  });

  it('every document: a ratio above its max FAILs', () => {
    for (const id of DOCS) {
      const spec = DOCUMENT_SPECS[id];
      const cfg = getBiometricConfig(spec);
      const r = evaluate(makeBio(), spec, cfg, cfg.faceRatioMax + 0.05);
      expect(r.faceRatio.status).toBe('FAIL');
      expect(r.overall).toBe('NON_COMPLIANT');
    }
  });
});

describe('Strict mouth across all documents', () => {
  for (const id of DOCS) {
    const spec = DOCUMENT_SPECS[id];
    const cfg = getBiometricConfig(spec);
    it(`${id}: closed PASS · teeth FAIL · open FAIL`, () => {
      expect(evaluate(makeBio(), spec, cfg, cfg.targetRatio).mouth.status).toBe('PASS');
      expect(evaluate(makeBio({ teethVisibilityScore: 0.2 }), spec, cfg, cfg.targetRatio).mouth.status).toBe('FAIL');
      expect(evaluate(makeBio({ mouthOpen: true, mouthState: 'OPEN_MOUTH' }), spec, cfg, cfg.targetRatio).mouth.status).toBe('FAIL');
    });
  }
});

describe('Baby (infant) relaxed rules', () => {
  const spec = DOCUMENT_SPECS.baby_passport;
  const cfg = getBiometricConfig(spec);

  it('closed eyes → WARNING, not a blocking FAIL', () => {
    const r = evaluate(makeBio({ eyesOpen: false }), spec, cfg, cfg.targetRatio);
    expect(r.eyeAlignment.status).toBe('WARNING');
    expect(r.overall).not.toBe('NON_COMPLIANT');
  });

  it('adult closed eyes still hard-FAIL', () => {
    const us = DOCUMENT_SPECS.us_passport;
    const r = evaluate(makeBio({ eyesOpen: false }), us, getBiometricConfig(us), 0.565);
    expect(r.eyeAlignment.status).toBe('FAIL');
    expect(r.overall).toBe('NON_COMPLIANT');
  });

  it('parent visible (second face) → NON_COMPLIANT', () => {
    const r = evaluate(makeBio({ faceCount: 2 }), spec, cfg, cfg.targetRatio);
    expect(r.overall).toBe('NON_COMPLIANT');
  });

  it('crying (open mouth) → mouth FAIL', () => {
    expect(evaluate(makeBio({ mouthOpen: true, mouthState: 'OPEN_MOUTH' }), spec, cfg, cfg.targetRatio).mouth.status).toBe('FAIL');
  });
});
