import { describe, it, expect } from 'vitest';
import {
  evaluateEyeVisibility,
  shouldRunEyeGaze,
  type VisibilityLandmark,
} from '@/lib/face/EyeVisibilityEvaluator';
import { estimateEyeGaze } from '@/lib/face/EyeGazeEstimator';
import { evaluate } from '@/lib/face/PassportComplianceEngine';
import { getBiometricConfig } from '@/lib/face/biometric-config';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import type { BiometricData } from '@/types/biometric';
import type { EyeVisibilityResult } from '@/lib/face/EyeVisibilityEvaluator';

const L = { iris: 468, ring: [469, 470, 471, 472], outer: 33, inner: 133, upper: 159, lower: 145 };
const R = { iris: 473, ring: [474, 475, 476, 477], outer: 263, inner: 362, upper: 386, lower: 374 };
const CENTER = { left: { x: 0.35, y: 0.5 }, right: { x: 0.65, y: 0.5 } };
const HALF_W = 0.05; // eye width 0.10
const IRIS_R = 0.02;

interface EyeCfg {
  /** Vertical lid half-gap. Full-open ≈ 0.03 (EAR 0.6); narrow ≈ 0.008 (EAR 0.16); closed ≈ 0.002 (EAR 0.04). */
  halfHeight?: number;
  iris?: boolean; // false → iris center + ring absent
  irisCollapsed?: boolean; // ring on the center → radius 0 (iris "partial")
  visible?: boolean; // false → degenerate region (covered)
  offFrameX?: number; // shift the eye centre outside the frame
}

function place(lm: VisibilityLandmark[], spec: typeof L, c: { x: number; y: number }, cfg: EyeCfg) {
  const cx = c.x + (cfg.offFrameX ?? 0);
  if (cfg.visible === false) {
    for (const i of [spec.outer, spec.inner, spec.upper, spec.lower]) lm[i] = { x: cx, y: c.y };
    return;
  }
  const halfH = cfg.halfHeight ?? 0.03;
  lm[spec.outer] = { x: cx - HALF_W, y: c.y };
  lm[spec.inner] = { x: cx + HALF_W, y: c.y };
  lm[spec.upper] = { x: cx, y: c.y - halfH };
  lm[spec.lower] = { x: cx, y: c.y + halfH };
  if (cfg.iris === false) return;
  lm[spec.iris] = { x: cx, y: c.y };
  const r = cfg.irisCollapsed ? 0 : IRIS_R;
  lm[spec.ring[0]] = { x: cx, y: c.y - r };
  lm[spec.ring[1]] = { x: cx + r, y: c.y };
  lm[spec.ring[2]] = { x: cx, y: c.y + r };
  lm[spec.ring[3]] = { x: cx - r, y: c.y };
}

function face(left: EyeCfg = {}, right: EyeCfg = {}): VisibilityLandmark[] {
  const lm: VisibilityLandmark[] = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
  place(lm, L, CENTER.left, left);
  place(lm, R, CENTER.right, right);
  return lm;
}

// ── MUST PASS (gate lets gaze run) ──────────────────────────────────────────
describe('EyeVisibilityEvaluator — valid photos across shapes/conditions MUST run gaze', () => {
  const passing: [string, EyeCfg, EyeCfg][] = [
    ['studio passport photo', {}, {}],
    ['mobile selfie', {}, {}],
    ['slightly sleepy eyes', { halfHeight: 0.014 }, { halfHeight: 0.014 }], // EAR ~0.28
    ['hooded eyelids', { halfHeight: 0.010 }, { halfHeight: 0.010 }], // EAR ~0.20
    ['naturally narrow eyes', { halfHeight: 0.007 }, { halfHeight: 0.007 }], // EAR ~0.14
    ['Indian eyes', { halfHeight: 0.009 }, { halfHeight: 0.009 }],
    ['Asian eyes', { halfHeight: 0.006 }, { halfHeight: 0.006 }], // EAR ~0.12, still > 0.08
    ['slight eyelid asymmetry', { halfHeight: 0.03 }, { halfHeight: 0.02 }],
    ['slight shadow / camera tilt', {}, {}],
  ];
  it.each(passing)('%s → runs gaze (not NOT_VISIBLE)', (_name, l, r) => {
    const res = evaluateEyeVisibility(face(l, r));
    expect(res.status).not.toBe('NOT_VISIBLE');
    expect(res.runEyeGaze).toBe(true);
  });

  it('minor iris instability / one iris partially detected → PARTIAL, still runs gaze', () => {
    const res = evaluateEyeVisibility(face({}, { irisCollapsed: true }));
    expect(res.status).toBe('PARTIAL');
    expect(res.reason).toBe('RIGHT_IRIS_PARTIAL');
    expect(res.runEyeGaze).toBe(true);
  });

  it('both irises missing but eyes open → UNKNOWN, still runs gaze (never fails on iris)', () => {
    const res = evaluateEyeVisibility(face({ iris: false }, { iris: false }));
    expect(res.status).toBe('UNKNOWN');
    expect(res.runEyeGaze).toBe(true);
  });
});

// ── MUST FAIL (gate blocks gaze) ────────────────────────────────────────────
describe('EyeVisibilityEvaluator — genuinely unavailable eyes MUST block gaze', () => {
  it('both eyes closed → NOT_VISIBLE / BOTH_EYES_CLOSED', () => {
    const res = evaluateEyeVisibility(face({ halfHeight: 0.002 }, { halfHeight: 0.002 })); // EAR 0.04
    expect(res.status).toBe('NOT_VISIBLE');
    expect(res.reason).toBe('BOTH_EYES_CLOSED');
    expect(res.runEyeGaze).toBe(false);
  });

  it('blindfold / hair / heavy hand over both eyes → NOT_VISIBLE / EYES_COVERED', () => {
    const res = evaluateEyeVisibility(face({ visible: false }, { visible: false }));
    expect(res.status).toBe('NOT_VISIBLE');
    expect(res.reason).toBe('EYES_COVERED');
    expect(res.runEyeGaze).toBe(false);
  });

  it('eyes completely outside the frame → NOT_VISIBLE / EYES_OUT_OF_FRAME', () => {
    const res = evaluateEyeVisibility(face({ offFrameX: -1.5 }, { offFrameX: 1.5 }));
    expect(res.status).toBe('NOT_VISIBLE');
    expect(res.reason).toBe('EYES_OUT_OF_FRAME');
  });

  it('eyes completely missing / no landmarks → NOT_VISIBLE / NO_EYE_LANDMARKS', () => {
    expect(evaluateEyeVisibility([]).reason).toBe('NO_EYE_LANDMARKS');
    expect(evaluateEyeVisibility(null).status).toBe('NOT_VISIBLE');
  });

  it('ONE eye closed → NOT_VISIBLE (passport standard: both eyes must be open)', () => {
    const left = evaluateEyeVisibility(face({ halfHeight: 0.002 }, {})); // left closed, right open
    expect(left.status).toBe('NOT_VISIBLE');
    expect(left.reason).toBe('LEFT_EYE_CLOSED');
    const right = evaluateEyeVisibility(face({}, { halfHeight: 0.002 }));
    expect(right.status).toBe('NOT_VISIBLE');
    expect(right.reason).toBe('RIGHT_EYE_CLOSED');
  });
});

describe('EyeVisibilityEvaluator — regression: a valid open-eyed photo must NEVER be blocked', () => {
  // Permanent guard against the original false-rejection bug.
  it('both eyes open + visible + irises visible + no occlusion → VISIBLE, runs gaze', () => {
    const res = evaluateEyeVisibility(face({}, {}));
    expect(res.status).toBe('VISIBLE');
    expect(res.reason).toBe('OK');
    expect(res.runEyeGaze).toBe(true);
    expect(shouldRunEyeGaze(res)).toBe(true);
  });
});

// ── Integration: only NOT_VISIBLE fails Eye Position in the compliance engine ──
function bio(over: Partial<BiometricData> = {}): BiometricData {
  return {
    faceDetected: true, faceCount: 1, imageWidth: 600, imageHeight: 600,
    crownY: 60, chinY: 400, faceHeight: 340, faceWidth: 250, faceRatio: 0.56,
    faceCenterXNorm: 0.5, eyeCenterYNorm: 0.4, faceHeightNorm: 0.56,
    leftEyeY: 240, rightEyeY: 240, eyesOpen: true, eyeOpenness: 0.3,
    yaw: 0, pitch: 0, roll: 0, headTilt: 0,
    mouthOpen: false, mouthGap: 0.02, smileScore: 0, mouthState: 'NEUTRAL',
    teethVisibilityScore: 0,
    ...over,
  };
}
const US = DOCUMENT_SPECS.us_passport;
const usCfg = getBiometricConfig(US);
const straightGaze = { direction: 'LOOKING_STRAIGHT' as const, confidence: 0.95, leftEyeHorizontal: 0, rightEyeHorizontal: 0, leftEyeVertical: 0, rightEyeVertical: 0, averageHorizontal: 0, averageVertical: 0, calibratedVertical: 0 };
const vis = (status: EyeVisibilityResult['status'], reason: EyeVisibilityResult['reason']): EyeVisibilityResult => ({
  status, reason, runEyeGaze: status !== 'NOT_VISIBLE',
  leftEyeLandmarks: true, rightEyeLandmarks: true, leftEyeOpen: true, rightEyeOpen: true, occluded: false,
});

describe('PassportComplianceEngine — visibility gate only fails on NOT_VISIBLE', () => {
  it('NOT_VISIBLE (both closed) → Eye Position FAIL', () => {
    const r = evaluate(bio({ gaze: straightGaze, eyeVisibility: vis('NOT_VISIBLE', 'BOTH_EYES_CLOSED') }), US, usCfg, 0.565);
    expect(r.eyeAlignment.status).toBe('FAIL');
    expect(r.eyeAlignment.code).toBe('BOTH_EYES_CLOSED');
    expect(r.eyeAlignment.message).toBe('Both eyes must be open and clearly visible.');
  });

  it('PARTIAL does NOT fail eye alignment (falls through to normal checks)', () => {
    const r = evaluate(bio({ gaze: straightGaze, eyeVisibility: vis('PARTIAL', 'RIGHT_IRIS_PARTIAL') }), US, usCfg, 0.565);
    expect(r.eyeAlignment.status).toBe('PASS');
  });

  it('UNKNOWN does NOT fail eye alignment', () => {
    const r = evaluate(bio({ gaze: straightGaze, eyeVisibility: vis('UNKNOWN', 'LOW_GEOMETRIC_CONFIDENCE') }), US, usCfg, 0.565);
    expect(r.eyeAlignment.status).toBe('PASS');
  });

  it('VISIBLE → normal PASS', () => {
    const r = evaluate(bio({ gaze: straightGaze, eyeVisibility: vis('VISIBLE', 'OK') }), US, usCfg, 0.565);
    expect(r.eyeAlignment.status).toBe('PASS');
  });

  it('backward compatible: no visibility field → existing behavior', () => {
    expect(evaluate(bio({ gaze: straightGaze }), US, usCfg, 0.565).eyeAlignment.status).toBe('PASS');
  });
});

describe('EyeGazeEstimator early-exit still honored', () => {
  it('eyesVisible=false → UNKNOWN with reason', () => {
    const r = estimateEyeGaze(face({}, {}), { eyesVisible: false });
    expect(r.direction).toBe('UNKNOWN');
    expect(r.reason).toBe('EYES_NOT_VISIBLE');
  });
});
