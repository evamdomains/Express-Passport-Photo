import { describe, it, expect } from 'vitest';
import {
  evaluateEyeOcclusion,
  buildEyeRegions,
  type Landmark,
  type EyeOcclusionResult,
} from '@/lib/face/EyeOcclusionEvaluator';
import type { ComplianceDetection, OcclusionBox } from '@/lib/face/eye-occlusion-rules';
import { evaluate } from '@/lib/face/PassportComplianceEngine';
import { getBiometricConfig } from '@/lib/face/biometric-config';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import type { BiometricData } from '@/types/biometric';

/** Face with eye landmarks around left(0.35,0.5) and right(0.65,0.5). */
function faceLandmarks(): Landmark[] {
  const lm: Landmark[] = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
  lm[33] = { x: 0.30, y: 0.50 }; lm[133] = { x: 0.40, y: 0.50 }; lm[159] = { x: 0.35, y: 0.47 }; lm[145] = { x: 0.35, y: 0.53 };
  lm[263] = { x: 0.70, y: 0.50 }; lm[362] = { x: 0.60, y: 0.50 }; lm[386] = { x: 0.65, y: 0.47 }; lm[374] = { x: 0.65, y: 0.53 };
  return lm;
}
const det = (cls: string, confidence: number, bbox: OcclusionBox): ComplianceDetection => ({ class: cls, confidence, bbox });
const BOTH_EYES: OcclusionBox = { x: 0.2, y: 0.42, width: 0.6, height: 0.16 };
const LEFT_EYE: OcclusionBox = { x: 0.22, y: 0.42, width: 0.28, height: 0.16 };
const BELOW_EYES: OcclusionBox = { x: 0.3, y: 0.62, width: 0.4, height: 0.18 };
const ABOVE_EYES: OcclusionBox = { x: 0.2, y: 0.05, width: 0.6, height: 0.2 };
const FAR_AWAY: OcclusionBox = { x: 0.0, y: 0.85, width: 0.1, height: 0.1 };

const run = (dets: ComplianceDetection[]) => evaluateEyeOcclusion(faceLandmarks(), dets);

describe('EyeOcclusionEvaluator — builds regions from eye landmarks', () => {
  it('constructs a padded box per eye', () => {
    const r = buildEyeRegions(faceLandmarks(), 0.6)!;
    expect(r.left.x).toBeGreaterThanOrEqual(0);
    expect(r.left.width).toBeGreaterThan(0);
    expect(r.right.x).toBeGreaterThan(r.left.x); // right eye is to the image-right
  });
  it('returns null when eye landmarks are missing', () => {
    expect(buildEyeRegions([], 0.6)).toBeNull();
  });
});

// ── MUST NOT fail ────────────────────────────────────────────────────────────
describe('EyeOcclusionEvaluator — valid photos PASS (gaze runs)', () => {
  it('normal eyes, no detections → PASS / EYES_VISIBLE', () => {
    const r = run([]);
    expect(r.status).toBe('PASS');
    expect(r.reason).toBe('EYES_VISIBLE');
  });
  it('mask BELOW the eyes → PASS', () => expect(run([det('mask', 0.95, BELOW_EYES)]).status).toBe('PASS'));
  it('object near but NOT overlapping the eyes → PASS', () => expect(run([det('hand', 0.95, FAR_AWAY)]).status).toBe('PASS'));
  it('transparent prescription glasses → PASS (handled separately, not an occluder)', () =>
    expect(run([det('glasses', 0.95, BOTH_EYES)]).status).toBe('PASS'));
  it('religious head covering above the eyes → PASS', () => expect(run([det('headscarf', 0.95, ABOVE_EYES)]).status).toBe('PASS'));
  it('thin bangs above the eye line → PASS', () =>
    expect(run([det('bangs', 0.9, { x: 0.25, y: 0.30, width: 0.5, height: 0.12 })]).status).toBe('PASS'));
  it('low-confidence detection is ignored → PASS', () => expect(run([det('blindfold', 0.3, BOTH_EYES)]).status).toBe('PASS'));
});

// ── MUST fail ────────────────────────────────────────────────────────────────
describe('EyeOcclusionEvaluator — covered eyes FAIL (gaze must not run)', () => {
  it('blindfold over both eyes → FAIL / BLINDFOLD', () => {
    const r = run([det('blindfold', 0.98, BOTH_EYES)]);
    expect(r.status).toBe('FAIL');
    expect(r.reason).toBe('BLINDFOLD');
    expect(r.leftEyeOccluded && r.rightEyeOccluded).toBe(true);
  });
  it('hair over both eyes → FAIL / HAIR_OVER_EYES', () => expect(run([det('hair', 0.9, BOTH_EYES)]).reason).toBe('HAIR_OVER_EYES'));
  it('heavy bangs over the eyes → FAIL / HAIR_OVER_EYES', () => expect(run([det('bangs', 0.9, BOTH_EYES)]).reason).toBe('HAIR_OVER_EYES'));
  it('hand over the eyes → FAIL / HAND_OVER_EYES', () => expect(run([det('hand', 0.9, BOTH_EYES)]).reason).toBe('HAND_OVER_EYES'));
  it('finger over one eye → FAIL / HAND_OVER_EYES, only left occluded', () => {
    const r = run([det('finger', 0.9, LEFT_EYE)]);
    expect(r.status).toBe('FAIL');
    expect(r.reason).toBe('HAND_OVER_EYES');
    expect(r.leftEyeOccluded).toBe(true);
    expect(r.rightEyeOccluded).toBe(false);
  });
  it('mask OVER the eyes → FAIL / MASK_OVER_EYES', () => expect(run([det('mask', 0.9, BOTH_EYES)]).reason).toBe('MASK_OVER_EYES'));
  it('sunglasses over the eyes → FAIL / OBJECT_OVER_EYES', () => expect(run([det('sunglasses', 0.9, BOTH_EYES)]).reason).toBe('OBJECT_OVER_EYES'));
  it('eye patch over one eye → FAIL / OBJECT_OVER_EYES', () => {
    const r = run([det('eye patch', 0.9, LEFT_EYE)]);
    expect(r.status).toBe('FAIL');
    expect(r.reason).toBe('OBJECT_OVER_EYES');
  });
  it('large cloth over both eyes → FAIL', () => expect(run([det('cloth', 0.9, BOTH_EYES)]).status).toBe('FAIL'));
});

// ── Engine integration: occlusion FAIL blocks Eye Position + PhotoRoom ────────
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
const occ = (status: 'PASS' | 'FAIL', reason: EyeOcclusionResult['reason']): EyeOcclusionResult => ({
  status, leftEyeOccluded: status === 'FAIL', rightEyeOccluded: status === 'FAIL', confidence: 0.9, reason,
});

describe('PassportComplianceEngine — occlusion FAIL fails Eye Position (gaze ignored)', () => {
  it('occlusion FAIL → Eye Position FAIL with the occlusion reason, even if gaze is STRAIGHT', () => {
    const r = evaluate(bio({ gaze: straightGaze, eyeOcclusion: occ('FAIL', 'BLINDFOLD') }), US, usCfg, 0.565);
    expect(r.eyeAlignment.status).toBe('FAIL');
    expect(r.eyeAlignment.code).toBe('BLINDFOLD');
    expect(r.eyeAlignment.message).toBe('Both eyes must be clearly visible.');
    expect(r.overall).toBe('NON_COMPLIANT');
  });
  it('occlusion PASS → normal behavior', () => {
    const r = evaluate(bio({ gaze: straightGaze, eyeOcclusion: occ('PASS', 'EYES_VISIBLE') }), US, usCfg, 0.565);
    expect(r.eyeAlignment.status).toBe('PASS');
  });
  it('backward compatible: no occlusion field → existing behavior', () => {
    expect(evaluate(bio({ gaze: straightGaze }), US, usCfg, 0.565).eyeAlignment.status).toBe('PASS');
  });
});
