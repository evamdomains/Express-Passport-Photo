import { describe, it, expect } from 'vitest';
// Real production code under test — no mirror/demo.
import { computeCrop, evaluate, toComplianceResult } from '@/lib/face/PassportComplianceEngine';
import { getBiometricConfig, targetFaceRatio } from '@/lib/face/biometric-config';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import type { BiometricData } from '@/types/biometric';

const US = DOCUMENT_SPECS.us_passport;
const CA = DOCUMENT_SPECS.canadian_passport;
const usCfg = getBiometricConfig(US);
const caCfg = getBiometricConfig(CA);

/** A compliant baseline BiometricData; override per test. */
function makeBio(over: Partial<BiometricData> = {}): BiometricData {
  const faceHeightNorm = over.faceHeightNorm ?? 0.5;
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

/** Achieved ratio the produced photo will have after cropping to the target. */
const achievedFrom = (bio: BiometricData, spec = US, cfg = usCfg) => {
  const crop = computeCrop(bio, spec, cfg);
  return bio.faceHeightNorm / crop.height;
};

describe('1. US passport target ratio (56.5%)', () => {
  it('targets 0.565 and reports OPTIMAL', () => {
    expect(targetFaceRatio(usCfg)).toBe(0.565);
    const bio = makeBio({ faceHeightNorm: 0.4 });
    const achieved = achievedFrom(bio);
    expect(achieved).toBeCloseTo(0.565, 2);

    const report = evaluate(bio, US, usCfg, achieved);
    expect(report.country).toBe('US');
    expect(report.targetRatio).toBe(0.565);
    expect(report.faceRatio.value).toBeCloseTo(0.565, 2);
    expect(report.faceRatio.status).toBe('PASS');
    expect(report.overall).toBe('OPTIMAL');
    expect(toComplianceResult(report, bio, usCfg).passed).toBe(true);
  });
});

describe('2. Canadian passport target ratio (47%)', () => {
  it('targets 0.47 and reports OPTIMAL', () => {
    expect(targetFaceRatio(caCfg)).toBe(0.47);
    const bio = makeBio({ faceHeightNorm: 0.31 });
    const achieved = achievedFrom(bio, CA, caCfg);
    expect(achieved).toBeCloseTo(0.47, 2);

    const report = evaluate(bio, CA, caCfg, achieved);
    expect(report.country).toBe('CANADA');
    expect(report.optimalRange).toBe('46%-48%');
    expect(report.faceRatio.value).toBeCloseTo(0.47, 2);
    expect(report.overall).toBe('OPTIMAL');
  });
});

describe('3. Final ratio below the official minimum → FAIL (never COMPLIANT)', () => {
  it('a GENERATED ratio under the official minimum FAILs', () => {
    const report = evaluate(makeBio(), US, usCfg, 0.4); // < 0.50
    expect(report.faceRatio.status).toBe('FAIL');
    expect(report.overall).toBe('NON_COMPLIANT');
    expect(toComplianceResult(report, makeBio(), usCfg).passed).toBe(false);
  });

  it('but auto-scaling lifts an under-sized INPUT to exactly the target', () => {
    expect(achievedFrom(makeBio({ faceHeightNorm: 0.3 }))).toBeCloseTo(0.565, 2);
  });
});

describe('4. Final ratio above the official maximum → FAIL (never COMPLIANT)', () => {
  it('a GENERATED ratio over the official maximum FAILs', () => {
    const report = evaluate(makeBio(), US, usCfg, 0.75); // > 0.69
    expect(report.faceRatio.status).toBe('FAIL');
    expect(report.overall).toBe('NON_COMPLIANT');
  });

  it('but auto-scaling shrinks an over-sized INPUT to exactly the target (background-padded)', () => {
    const crop = computeCrop(makeBio({ faceHeightNorm: 0.8 }), US, usCfg);
    expect(crop.height).toBeGreaterThan(1); // crop taller than source → background padded
    expect(achievedFrom(makeBio({ faceHeightNorm: 0.8 }))).toBeCloseTo(0.565, 2);
  });
});

describe('5. Auto scaling calculations', () => {
  it('crop height = faceRatio / target (scaleFactor = target / current)', () => {
    const bio = makeBio({ faceHeightNorm: 0.38 });
    const crop = computeCrop(bio, US, usCfg);
    expect(crop.height).toBeCloseTo(0.38 / 0.565, 3); // 0.6726
    expect(0.565 / 0.38).toBeCloseTo(1.487, 2); // documented scale factor
    expect(achievedFrom(bio)).toBeCloseTo(0.565, 2);
  });

  it('centres the face horizontally and seats the eye line', () => {
    const bio = makeBio({ faceHeightNorm: 0.4, faceCenterXNorm: 0.5, eyeCenterYNorm: 0.4 });
    const crop = computeCrop(bio, US, usCfg);
    // horizontal centre of crop ≈ face centre
    expect(crop.left + crop.width / 2).toBeCloseTo(0.5, 3);
    // eye line seated at US target (mid of 31.25%–43.75% = 37.5% from top)
    const eyeTarget = (usCfg.eyeLineFromTopMin + usCfg.eyeLineFromTopMax) / 2;
    expect(crop.top + eyeTarget * crop.height).toBeCloseTo(0.4, 3);
  });
});

describe('6. Eye position validation', () => {
  it('PASS when level, WARNING when slightly tilted, FAIL when very tilted', () => {
    expect(evaluate(makeBio({ roll: 2 }), US, usCfg).eyeAlignment.status).toBe('PASS');
    expect(evaluate(makeBio({ roll: 8 }), US, usCfg).eyeAlignment.status).toBe('WARNING'); // warn 6 < 8 ≤ tol 10
    expect(evaluate(makeBio({ roll: 14 }), US, usCfg).eyeAlignment.status).toBe('FAIL');
  });

  it('FAILs when eyes are closed (hard fail, not a warning)', () => {
    const report = evaluate(makeBio({ eyesOpen: false, roll: 0 }), US, usCfg);
    expect(report.eyeAlignment.status).toBe('FAIL');
    expect(report.eyeAlignment.message).toMatch(/open/i);
    expect(report.overall).toBe('NON_COMPLIANT');
  });
});

describe('7 & 11–18. Strict mouth validation (no visible teeth)', () => {
  const teethThr = usCfg.teethThreshold; // 0.05

  it('11. fully closed mouth → PASS', () => {
    const r = evaluate(makeBio({ mouthState: 'NEUTRAL', teethVisibilityScore: 0 }), US, usCfg);
    expect(r.mouth.status).toBe('PASS');
  });

  it('12. slight smile with no teeth → PASS', () => {
    const r = evaluate(makeBio({ mouthState: 'SLIGHT_SMILE', smileScore: 0.3, teethVisibilityScore: 0 }), US, usCfg);
    expect(r.mouth.status).toBe('PASS');
  });

  it('13. one visible tooth → FAIL with teeth reason', () => {
    const r = evaluate(makeBio({ teethVisibilityScore: teethThr + 0.03 }), US, usCfg);
    expect(r.mouth.status).toBe('FAIL');
    expect(r.mouth.message).toMatch(/teeth/i);
    expect(r.overall).toBe('NON_COMPLIANT');
  });

  it('14. partial upper teeth → FAIL', () => {
    expect(evaluate(makeBio({ teethVisibilityScore: 0.12 }), US, usCfg).mouth.status).toBe('FAIL');
  });

  it('15. partial lower teeth → FAIL', () => {
    expect(evaluate(makeBio({ teethVisibilityScore: 0.09 }), US, usCfg).mouth.status).toBe('FAIL');
  });

  it('16. broad smile showing teeth → FAIL (US and Canada)', () => {
    const bio = makeBio({ mouthState: 'BROAD_SMILE', smileScore: 0.7, teethVisibilityScore: 0.2 });
    expect(evaluate(bio, US, usCfg).mouth.status).toBe('FAIL');
    expect(evaluate(bio, CA, caCfg).mouth.status).toBe('FAIL');
  });

  it('16b. broad smile with lips closed (no teeth) → still FAIL in strict mode', () => {
    const bio = makeBio({ mouthState: 'BROAD_SMILE', smileScore: 0.7, teethVisibilityScore: 0 });
    expect(evaluate(bio, US, usCfg).mouth.status).toBe('FAIL');
  });

  it('17. open mouth → FAIL', () => {
    const r = evaluate(makeBio({ mouthState: 'OPEN_MOUTH', mouthOpen: true }), US, usCfg);
    expect(r.mouth.status).toBe('FAIL');
    expect(r.overall).toBe('NON_COMPLIANT');
  });

  it('18. tiny tooth gap just over threshold → FAIL (conservative)', () => {
    expect(evaluate(makeBio({ teethVisibilityScore: teethThr + 0.005 }), US, usCfg).mouth.status).toBe('FAIL');
    // just under threshold → PASS
    expect(evaluate(makeBio({ teethVisibilityScore: teethThr - 0.005 }), US, usCfg).mouth.status).toBe('PASS');
  });
});

describe('8. Head pose validation', () => {
  it('PASS within tolerance, FAIL beyond, with friendly guidance', () => {
    expect(evaluate(makeBio({ yaw: 5 }), US, usCfg).headPosition.status).toBe('PASS');

    const turned = evaluate(makeBio({ yaw: 20 }), US, usCfg); // yawTol 15
    expect(turned.headPosition.status).toBe('FAIL');
    expect(turned.headPosition.message).toMatch(/head/i);
    expect(turned.overall).toBe('NON_COMPLIANT');

    const tilted = evaluate(makeBio({ pitch: 20 }), US, usCfg); // pitchTol 15
    expect(tilted.headPosition.status).toBe('FAIL');
    expect(tilted.headPosition.message).toMatch(/chin/i);
  });
});
