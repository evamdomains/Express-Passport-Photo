import { describe, it, expect } from 'vitest';
import { evaluate, evaluateVisualAttention } from '@/lib/face/PassportComplianceEngine';
import { getBiometricConfig } from '@/lib/face/biometric-config';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import type { EyeGazeResult, GazeDirection } from '@/lib/face/EyeGazeEstimator';
import type { BiometricData } from '@/types/biometric';

const US = DOCUMENT_SPECS.us_passport;
const usCfg = getBiometricConfig(US); // pitchTol 15, poseWarnMultiplier 0.6 → warn 9

// pitch sign convention: +pitch = head/chin DOWN, −pitch = head/chin UP.
const PITCH = { level: 0, slightDown: 12, strongDown: 24, slightUp: -12, strongUp: -24 } as const;

/** Build a gaze with an explicit direction + calibrated vertical (+ = eyes down in socket). */
function gazeWith(direction: GazeDirection, calibratedVertical = 0, averageHorizontal = 0): EyeGazeResult {
  return {
    direction,
    confidence: 0.9,
    leftEyeHorizontal: averageHorizontal,
    rightEyeHorizontal: averageHorizontal,
    leftEyeVertical: calibratedVertical,
    rightEyeVertical: calibratedVertical,
    averageHorizontal,
    averageVertical: calibratedVertical,
    calibratedVertical,
  };
}

const STRAIGHT = gazeWith('LOOKING_STRAIGHT', 0);
// Eyes rolled UP in the socket to meet the lens despite a down-tilted head, but
// modestly enough to stay inside the gaze band (posV 0.44).
const COMPENSATE_UP = gazeWith('LOOKING_STRAIGHT', -0.06);
const COMPENSATE_DOWN = gazeWith('LOOKING_STRAIGHT', 0.06);

describe('evaluateVisualAttention — world-frame model', () => {
  it('Case 1: head level + eyes straight → PASS', () => {
    const r = evaluateVisualAttention(STRAIGHT, PITCH.level, usCfg);
    expect(r.status).toBe('PASS');
    expect(r.code).toBe('ATTENTION_OK');
  });

  it('head down + eyes NOT compensating up → FAIL "Raise your head…" (looking down)', () => {
    const r = evaluateVisualAttention(STRAIGHT, PITCH.slightDown, usCfg);
    expect(r.status).toBe('FAIL');
    expect(r.message).toBe('Raise your head and look directly at the camera.');
  });

  it('head down + eyes compensating up (looking at lens) → WARNING "Raise your chin slightly."', () => {
    const r = evaluateVisualAttention(COMPENSATE_UP, PITCH.slightDown, usCfg);
    expect(r.status).toBe('WARNING');
    expect(r.message).toBe('Raise your chin slightly.');
  });

  it('head down + eyes down → FAIL "Raise your head and look directly at the camera."', () => {
    const r = evaluateVisualAttention(gazeWith('LOOKING_DOWN', 0.2), PITCH.slightDown, usCfg);
    expect(r.status).toBe('FAIL');
    expect(r.message).toBe('Raise your head and look directly at the camera.');
  });

  it('head up + eyes NOT compensating down → FAIL "Lower your chin and look directly at the camera."', () => {
    const r = evaluateVisualAttention(STRAIGHT, PITCH.slightUp, usCfg);
    expect(r.status).toBe('FAIL');
    expect(r.message).toBe('Lower your chin and look directly at the camera.');
  });

  it('head up + eyes compensating down → WARNING "Lower your chin slightly."', () => {
    const r = evaluateVisualAttention(COMPENSATE_DOWN, PITCH.slightUp, usCfg);
    expect(r.status).toBe('WARNING');
    expect(r.message).toBe('Lower your chin slightly.');
  });

  it('Case 6/7: eyes to the side + head neutral → FAIL "Look directly at the camera."', () => {
    for (const dir of ['LOOKING_LEFT', 'LOOKING_RIGHT'] as const) {
      const r = evaluateVisualAttention(gazeWith(dir, 0, dir === 'LOOKING_LEFT' ? -0.2 : 0.2), PITCH.level, usCfg);
      expect(r.status).toBe('FAIL');
      expect(r.code).toBe('ATTENTION_EYES_SIDE');
      expect(r.message).toBe('Look directly at the camera.');
    }
  });

  it('looking down only (level head) → FAIL raise your head', () => {
    const r = evaluateVisualAttention(gazeWith('LOOKING_DOWN', 0.2), PITCH.level, usCfg);
    expect(r.status).toBe('FAIL');
    expect(r.message).toMatch(/raise your head/i);
  });

  it('looking up only (level head) → FAIL lower your chin', () => {
    const r = evaluateVisualAttention(gazeWith('LOOKING_UP', -0.2), PITCH.level, usCfg);
    expect(r.status).toBe('FAIL');
    expect(r.message).toMatch(/lower your chin/i);
  });

  it('slight head pitch within tolerance + eyes straight → PASS', () => {
    const r = evaluateVisualAttention(STRAIGHT, 5, usCfg); // ≤ warn 9
    expect(r.status).toBe('PASS');
  });

  it('extreme head pitch down → FAIL', () => {
    const r = evaluateVisualAttention(STRAIGHT, PITCH.strongDown, usCfg);
    expect(r.status).toBe('FAIL');
    expect(r.message).toMatch(/raise your head/i);
  });

  it('never reverses direction: a down pitch never says "lower your chin"', () => {
    for (const p of [10, 12, 15, 20, 30]) {
      const r = evaluateVisualAttention(STRAIGHT, p, usCfg);
      expect(r.message).not.toMatch(/lower your chin/i);
    }
  });
});

// Baseline compliant bio; eyes open & level, pitch 0.
function makeBio(over: Partial<BiometricData> = {}): BiometricData {
  return {
    faceDetected: true, faceCount: 1, imageWidth: 1000, imageHeight: 1200,
    crownY: 120, chinY: 900, faceHeight: 600, faceWidth: 300, faceRatio: 0.5,
    faceCenterXNorm: 0.5, eyeCenterYNorm: 0.4, faceHeightNorm: 0.5,
    leftEyeY: 480, rightEyeY: 480, eyesOpen: true,
    yaw: 0, pitch: 0, roll: 0, headTilt: 0,
    mouthOpen: false, mouthGap: 0.01, smileScore: 0.05, mouthState: 'NEUTRAL',
    teethVisibilityScore: 0,
    ...over,
  };
}

describe('evaluate — reported downcast photos must FAIL (regression)', () => {
  // The reported images: head pitched DOWN + eyes centred in their (down-pointing)
  // sockets. The estimator reports the eyes as ~STRAIGHT with only a small vertical
  // reading, so previously Eye Position PASSED and only Head Position nudged.
  it('Eye Position now FAILS for a down-tilted head with non-compensating eyes', () => {
    const r = evaluate(makeBio({ pitch: PITCH.slightDown, gaze: STRAIGHT }), US, usCfg, 0.565);
    expect(r.eyeAlignment.status).toBe('FAIL');
    expect(r.eyeAlignment.code).toBe('ATTENTION_HEAD_DOWN');
    expect(r.eyeAlignment.message).toMatch(/look directly at the camera/i);
  });

  it('Head Position FAILS with "raise your head", never a lonely "move chin up" pass', () => {
    const r = evaluate(makeBio({ pitch: PITCH.slightDown, gaze: STRAIGHT }), US, usCfg, 0.565);
    expect(r.headPosition.status).toBe('FAIL');
    expect(r.headPosition.message).toMatch(/raise your head/i);
    expect(r.headPosition.message).not.toMatch(/lower/i);
    expect(r.visualAttention?.status).toBe('FAIL');
    expect(r.overall).toBe('NON_COMPLIANT');
  });

  it('a weak downward eye reading + down head still FAILS the eye check', () => {
    const downcast = gazeWith('LOOKING_STRAIGHT', 0.09); // posV 0.59, weak but real
    const r = evaluate(makeBio({ pitch: PITCH.slightDown, gaze: downcast }), US, usCfg, 0.565);
    expect(r.eyeAlignment.status).toBe('FAIL');
    expect(r.overall).toBe('NON_COMPLIANT');
  });
});

describe('evaluate — no regressions', () => {
  it('a neutral passport photo (level head, eyes straight) PASSES', () => {
    const r = evaluate(makeBio({ pitch: PITCH.level, gaze: STRAIGHT }), US, usCfg, 0.565);
    expect(r.eyeAlignment.status).toBe('PASS');
    expect(r.headPosition.status).toBe('PASS');
    expect(r.visualAttention?.status).toBe('PASS');
  });

  it('false-LOOKING_UP fix intact: a straight gaze on a level head still passes', () => {
    const r = evaluate(makeBio({ pitch: 0, gaze: STRAIGHT }), US, usCfg, 0.565);
    expect(r.eyeAlignment.status).toBe('PASS');
  });

  it('head down but eyes compensating up (looking at lens) → WARNING, eyes still PASS', () => {
    const r = evaluate(makeBio({ pitch: PITCH.slightDown, gaze: COMPENSATE_UP }), US, usCfg, 0.565);
    expect(r.headPosition.status).toBe('WARNING');
    expect(r.headPosition.message).toMatch(/raise your chin/i);
    expect(r.eyeAlignment.status).toBe('PASS');
  });

  it('eyes to the side stays owned by eyeAlignment, head not hijacked', () => {
    const r = evaluate(makeBio({ gaze: gazeWith('LOOKING_LEFT', 0, -0.2) }), US, usCfg, 0.565);
    expect(r.eyeAlignment.status).toBe('FAIL');
    expect(r.headPosition.status).toBe('PASS');
  });
});
