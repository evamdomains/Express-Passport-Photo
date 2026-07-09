import { describe, it, expect } from 'vitest';
import {
  evaluateEyeGaze,
  getGazeRule,
  DOCUMENT_GAZE_RULES,
  GAZE_CENTER,
} from '@/lib/face/gaze-rules';
import { evaluate } from '@/lib/face/PassportComplianceEngine';
import { getBiometricConfig } from '@/lib/face/biometric-config';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import type { EyeGazeResult } from '@/lib/face/EyeGazeEstimator';
import type { BiometricData } from '@/types/biometric';

const US = DOCUMENT_SPECS.us_passport;
const CA = DOCUMENT_SPECS.canadian_passport;
const usCfg = getBiometricConfig(US);
const caCfg = getBiometricConfig(CA);

/** Build a gaze measurement whose iris POSITION lands at 0.5 + offset. */
function gaze(offsetH: number, offsetV: number, direction: EyeGazeResult['direction'] = 'LOOKING_STRAIGHT'): EyeGazeResult {
  return {
    direction,
    confidence: 1,
    leftEyeHorizontal: offsetH,
    rightEyeHorizontal: offsetH,
    leftEyeVertical: offsetV,
    rightEyeVertical: offsetV,
    averageHorizontal: offsetH,
    averageVertical: offsetV,
  };
}

describe('gaze-rules — document tolerance table', () => {
  it('resolves each supported document to a rule', () => {
    expect(getGazeRule(US)).toEqual(DOCUMENT_GAZE_RULES.us_passport);
    expect(getGazeRule(CA)).toEqual(DOCUMENT_GAZE_RULES.canadian_passport);
  });

  it('Canada is more permissive than the US', () => {
    expect(DOCUMENT_GAZE_RULES.canadian_passport.horizontal.min).toBeLessThan(
      DOCUMENT_GAZE_RULES.us_passport.horizontal.min,
    );
  });

  it('Baby is the most permissive', () => {
    expect(DOCUMENT_GAZE_RULES.baby_passport.horizontal.min).toBeLessThan(
      DOCUMENT_GAZE_RULES.canadian_passport.horizontal.min,
    );
  });
});

describe('evaluateEyeGaze — rule application + reason codes', () => {
  it('PASSES a centered gaze with EYE_GAZE_OK', () => {
    const r = evaluateEyeGaze(gaze(0, 0), US, usCfg);
    expect(r.status).toBe('PASS');
    expect(r.code).toBe('EYE_GAZE_OK');
    expect(r.gaze?.averageHorizontal).toBeCloseTo(GAZE_CENTER, 5);
    expect(r.gaze?.allowedHorizontal).toEqual([0.45, 0.55]);
  });

  it('FAILS looking left with EYE_LOOKING_LEFT and the measured/allowed detail', () => {
    // position = 0.5 - 0.11 = 0.39 < 0.45
    const r = evaluateEyeGaze(gaze(-0.11, 0), US, usCfg);
    expect(r.status).toBe('FAIL');
    expect(r.code).toBe('EYE_LOOKING_LEFT');
    expect(r.value).toBeCloseTo(0.39, 5);
    expect(r.gaze?.allowedHorizontal).toEqual([0.45, 0.55]);
    expect(r.message).toMatch(/looking left/i);
  });

  it('FAILS looking right with EYE_LOOKING_RIGHT', () => {
    const r = evaluateEyeGaze(gaze(0.11, 0), US, usCfg);
    expect(r.status).toBe('FAIL');
    expect(r.code).toBe('EYE_LOOKING_RIGHT');
  });

  it('FAILS looking up / down on the vertical axis', () => {
    expect(evaluateEyeGaze(gaze(0, -0.11), US, usCfg).code).toBe('EYE_LOOKING_UP');
    expect(evaluateEyeGaze(gaze(0, 0.11), US, usCfg).code).toBe('EYE_LOOKING_DOWN');
  });

  it('reports the dominant axis when both are out of range', () => {
    // horizontal violation (0.20) > vertical violation (0.06) → horizontal wins
    const r = evaluateEyeGaze(gaze(-0.25, -0.11), US, usCfg);
    expect(r.code).toBe('EYE_LOOKING_LEFT');
  });

  it('accepts a slight glance inside the document band as PASS', () => {
    expect(evaluateEyeGaze(gaze(0.04, 0), US, usCfg).status).toBe('PASS'); // 0.54 ≤ 0.55
  });

  it('honors the wider Canadian band for the same glance the US would fail', () => {
    // position 0.555: fails US (max 0.55) but passes Canada (max 0.56)
    expect(evaluateEyeGaze(gaze(0.055, 0), US, usCfg).status).toBe('FAIL');
    expect(evaluateEyeGaze(gaze(0.055, 0), CA, caCfg).status).toBe('PASS');
  });

  it('does NOT fail when there is no measurement (PASS / EYE_GAZE_NOT_MEASURED)', () => {
    expect(evaluateEyeGaze(undefined, US, usCfg).code).toBe('EYE_GAZE_NOT_MEASURED');
    expect(evaluateEyeGaze(gaze(0.5, 0.5, 'UNKNOWN'), US, usCfg).code).toBe('EYE_GAZE_NOT_MEASURED');
    expect(evaluateEyeGaze(undefined, US, usCfg).status).toBe('PASS');
  });
});

describe('evaluateEyeGaze — confidence does NOT gate compliance (regression: no false warnings)', () => {
  it('a centered gaze with LOW confidence still PASSES (no "unable to determine" warning)', () => {
    // Real valid photos produce a modest multi-factor confidence; it must never warn.
    const r = evaluateEyeGaze({ ...gaze(0, 0), confidence: 0.3 }, US, usCfg);
    expect(r.status).toBe('PASS');
    expect(r.code).toBe('EYE_GAZE_OK');
  });

  it('direction is judged regardless of confidence — a genuine off-axis gaze still FAILS', () => {
    const r = evaluateEyeGaze({ ...gaze(-0.2, 0, 'LOOKING_LEFT'), confidence: 0.2 }, US, usCfg);
    expect(r.status).toBe('FAIL');
    expect(r.code).toBe('EYE_LOOKING_LEFT');
  });
});

// Minimal biometric fixture: eyes open, level, so eyeAlignment is driven by gaze.
function makeBio(overrides: Partial<BiometricData> = {}): BiometricData {
  return {
    faceDetected: true, faceCount: 1, imageWidth: 600, imageHeight: 600,
    crownY: 60, chinY: 400, faceHeight: 340, faceWidth: 250, faceRatio: 0.56,
    faceCenterXNorm: 0.5, eyeCenterYNorm: 0.4, faceHeightNorm: 0.56,
    leftEyeY: 240, rightEyeY: 240, eyesOpen: true, eyeOpenness: 0.3,
    yaw: 0, pitch: 0, roll: 0, headTilt: 0,
    mouthOpen: false, mouthGap: 0.02, smileScore: 0, mouthState: 'NEUTRAL',
    teethVisibilityScore: 0,
    ...overrides,
  };
}

describe('PassportComplianceEngine.evaluate — eye alignment folds in gaze', () => {
  it('is backwards compatible: no gaze → eye alignment PASS on an open, level face', () => {
    const r = evaluate(makeBio(), US, usCfg, 0.565);
    expect(r.eyeAlignment.status).toBe('PASS');
  });

  it('FAILS eye alignment when the gaze is out of range (worst result wins)', () => {
    const r = evaluate(makeBio({ gaze: gaze(-0.15, 0) }), US, usCfg, 0.565);
    expect(r.eyeAlignment.status).toBe('FAIL');
    expect(r.eyeAlignment.code).toBe('EYE_LOOKING_LEFT');
    expect(r.overall).toBe('NON_COMPLIANT');
  });

  it('head-roll FAIL still wins over a good gaze', () => {
    const r = evaluate(makeBio({ roll: 20, gaze: gaze(0, 0) }), US, usCfg, 0.565);
    expect(r.eyeAlignment.status).toBe('FAIL');
    expect(r.eyeAlignment.code).toBe('EYE_NOT_LEVEL');
  });

  it('eyes-closed FAIL takes precedence over gaze', () => {
    const r = evaluate(makeBio({ eyesOpen: false, gaze: gaze(0, 0) }), US, usCfg, 0.565);
    expect(r.eyeAlignment.status).toBe('FAIL');
    expect(r.eyeAlignment.code).toBe('EYE_CLOSED');
  });

  it('passes the explicit gaze param even when bio.gaze is absent', () => {
    const r = evaluate(makeBio(), US, usCfg, 0.565, gaze(0.2, 0));
    expect(r.eyeAlignment.status).toBe('FAIL');
    expect(r.eyeAlignment.code).toBe('EYE_LOOKING_RIGHT');
  });
});
