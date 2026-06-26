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
const find = (r: ReturnType<typeof buildGateChecks>, key: string) => r.checks.find((c) => c.key === key);

describe('compliance gate — strict ordering + stop-on-first-fail', () => {
  it('a fully compliant face passes every check in the canonical order', () => {
    const r = buildGateChecks(makeBio(), US);
    expect(r.passed).toBe(true);
    expect(keys(r)).toEqual(GATE_STEP_LABELS.map((s) => s.key));
    expect(r.checks.every((c) => c.status === 'PASS')).toBe(true);
  });

  it('no face: stops immediately', () => {
    const r = buildGateChecks(makeBio({ faceDetected: false, faceCount: 0 }), US);
    expect(r.passed).toBe(false);
    expect(keys(r)).toEqual(['face']);
    expect(last(r).message).toMatch(/no face/i);
  });

  it('multiple faces: stops after Single Face', () => {
    const r = buildGateChecks(makeBio({ faceCount: 2 }), US);
    expect(keys(r)).toEqual(['face', 'single']);
    expect(last(r).status).toBe('FAIL');
    expect(last(r).message).toMatch(/multiple faces/i);
  });

  it('quality stages PASS by default (no metrics) so they never false-reject', () => {
    const r = buildGateChecks(makeBio(), US);
    expect(find(r, 'sharpness')?.status).toBe('PASS');
    expect(find(r, 'quality')?.status).toBe('PASS');
    expect(find(r, 'eyeVisibility')?.status).toBe('PASS');
    expect(find(r, 'objects')?.status).toBe('PASS');
    expect(find(r, 'obstruction')?.status).toBe('PASS');
  });

  it('blurry photo FAILs at Sharpness (before Face Size / geometry) — no landmark bypass', () => {
    const r = buildGateChecks(makeBio(), US, {
      quality: { sharpnessScore: 5, eyeSharpness: 50, contrast: 0.2, edgeDensity: 0.08, faceQualityScore: 0.8, measured: true },
    });
    expect(r.passed).toBe(false);
    expect(last(r).key).toBe('sharpness');
    expect(last(r).message).toMatch(/blurry/i);
  });

  it('prohibited object FAILs at Object Detection — for a NON-baby document too', () => {
    const r = buildGateChecks(makeBio(), US, {
      objects: { objects: { status: 'FAIL', reason: 'Objects detected in the photo.', items: [] }, obstruction: { status: 'PASS', reason: '' }, detectedObjects: [] },
    });
    expect(r.passed).toBe(false);
    expect(find(r, 'objects')?.status).toBe('FAIL');
  });

  it('face too small to recover: stops at Face Size', () => {
    const r = buildGateChecks(makeBio({ faceHeightNorm: 0.2, imageHeight: 400 }), US); // huge upscale
    expect(last(r).key).toBe('size');
    expect(last(r).status).toBe('FAIL');
    expect(last(r).message).toMatch(/too small|resolution/i);
  });

  it('normal selfie (small face) PASSES Face Size (auto-scaled, not rejected)', () => {
    expect(find(buildGateChecks(makeBio({ faceHeightNorm: 0.36 }), US), 'size')?.status).toBe('PASS');
  });

  it('large face within frame PASSES Face Size (auto-scaled down)', () => {
    expect(find(buildGateChecks(makeBio({ faceHeightNorm: 0.7 }), US), 'size')?.status).toBe('PASS');
  });

  it('face filling the whole frame (cut off) FAILs as too large', () => {
    const r = buildGateChecks(makeBio({ faceHeightNorm: 0.97 }), US);
    expect(last(r).key).toBe('size');
    expect(last(r).status).toBe('FAIL');
    expect(last(r).message).toMatch(/too large|cut off/i);
  });

  it('eyes closed: stops at Eye Position', () => {
    const r = buildGateChecks(makeBio({ eyesOpen: false }), US);
    expect(last(r).key).toBe('eyes');
    expect(last(r).status).toBe('FAIL');
  });

  it('visible teeth: stops at Mouth Position', () => {
    const r = buildGateChecks(makeBio({ teethVisibilityScore: 0.2 }), US);
    expect(last(r).key).toBe('mouth');
    expect(last(r).status).toBe('FAIL');
    expect(last(r).message).toMatch(/teeth/i);
  });

  it('head turned: stops at Head Position', () => {
    const r = buildGateChecks(makeBio({ yaw: 25 }), US);
    expect(last(r).key).toBe('head');
    expect(last(r).status).toBe('FAIL');
    expect(last(r).message).toMatch(/head/i);
  });
});
