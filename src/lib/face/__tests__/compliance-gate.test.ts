import { describe, it, expect } from 'vitest';
import { buildGateChecks, GATE_STEP_LABELS } from '@/lib/face/compliance-gate';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import type { BiometricData } from '@/types/biometric';

const US = DOCUMENT_SPECS.us_passport;

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

const keys = (r: ReturnType<typeof buildGateChecks>) => r.checks.map((c) => c.key);
const last = (r: ReturnType<typeof buildGateChecks>) => r.checks[r.checks.length - 1];

describe('compliance gate — ordering + stop-on-first-fail', () => {
  it('a fully compliant face passes all six checks in order', () => {
    const r = buildGateChecks(makeBio(), US);
    expect(r.passed).toBe(true);
    expect(keys(r)).toEqual(GATE_STEP_LABELS.map((s) => s.key));
    expect(r.checks.every((c) => c.status === 'PASS')).toBe(true);
  });

  it('Step 1 — no face: stops immediately', () => {
    const r = buildGateChecks(makeBio({ faceDetected: false, faceCount: 0 }), US);
    expect(r.passed).toBe(false);
    expect(keys(r)).toEqual(['face']);
    expect(last(r).message).toMatch(/no face/i);
  });

  it('Step 2 — multiple faces: stops after Single Face', () => {
    const r = buildGateChecks(makeBio({ faceCount: 2 }), US);
    expect(keys(r)).toEqual(['face', 'single']);
    expect(last(r).status).toBe('FAIL');
    expect(last(r).message).toMatch(/multiple faces/i);
  });

  it('Step 3 — face too small to recover: stops at Face Size', () => {
    const r = buildGateChecks(makeBio({ faceHeightNorm: 0.2, imageHeight: 400 }), US); // huge upscale
    expect(keys(r)).toEqual(['face', 'single', 'size']);
    expect(last(r).status).toBe('FAIL');
    expect(last(r).message).toMatch(/too small/i);
  });

  it('Step 3 — normal selfie (small face) PASSES (auto-scaled, not rejected)', () => {
    const r = buildGateChecks(makeBio({ faceHeightNorm: 0.36 }), US);
    expect(r.checks.find((c) => c.key === 'size')?.status).toBe('PASS');
  });

  it('Step 3 — large face within frame PASSES (auto-scaled down, not rejected)', () => {
    const r = buildGateChecks(makeBio({ faceHeightNorm: 0.7 }), US);
    expect(r.checks.find((c) => c.key === 'size')?.status).toBe('PASS');
  });

  it('Step 3 — face filling the whole frame (cut off) FAILs as too large', () => {
    const r = buildGateChecks(makeBio({ faceHeightNorm: 0.97 }), US);
    expect(keys(r)).toEqual(['face', 'single', 'size']);
    expect(last(r).status).toBe('FAIL');
    expect(last(r).message).toMatch(/too large|cut off/i);
  });

  it('Step 4 — eyes closed: stops at Eye Position', () => {
    const r = buildGateChecks(makeBio({ eyesOpen: false }), US);
    expect(keys(r)).toEqual(['face', 'single', 'size', 'eyes']);
    expect(last(r).status).toBe('FAIL');
  });

  it('Step 5 — visible teeth: stops at Mouth Position', () => {
    const r = buildGateChecks(makeBio({ teethVisibilityScore: 0.2 }), US);
    expect(keys(r)).toEqual(['face', 'single', 'size', 'eyes', 'mouth']);
    expect(last(r).status).toBe('FAIL');
    expect(last(r).message).toMatch(/teeth/i);
  });

  it('Step 6 — head turned: stops at Head Position', () => {
    const r = buildGateChecks(makeBio({ yaw: 25 }), US);
    expect(keys(r)).toEqual(['face', 'single', 'size', 'eyes', 'mouth', 'head']);
    expect(last(r).status).toBe('FAIL');
    expect(last(r).message).toMatch(/head/i);
  });
});
