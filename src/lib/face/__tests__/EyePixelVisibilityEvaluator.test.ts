import { describe, it, expect } from 'vitest';
import {
  evaluateEyePixelVisibility,
  type EyeCropMetric,
  type EyePixelVisibilityResult,
} from '@/lib/face/EyePixelVisibilityEvaluator';
import { evaluate } from '@/lib/face/PassportComplianceEngine';
import { getBiometricConfig } from '@/lib/face/biometric-config';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import type { BiometricData } from '@/types/biometric';

const m = (texture: number, edgeDensity: number, contrast: number): EyeCropMetric => ({ texture, edgeDensity, contrast });
const REAL = m(120, 0.06, 0.18); // strong texture + edges + contrast — clearly a real eye
const FLAT = m(3, 0.001, 0.01); // flat covering — no eye structure
const BORDER = m(16, 0.001, 0.01); // weighted ≈ 0.24 → review band

describe('EyePixelVisibilityEvaluator — texture/contrast gate', () => {
  it('two real (textured) eyes → PASS / EYES_VISIBLE, no warning', () => {
    const r = evaluateEyePixelVisibility({ left: REAL, right: REAL });
    expect(r.status).toBe('PASS');
    expect(r.reason).toBe('EYES_VISIBLE');
    expect(r.leftConfidence).toBeGreaterThanOrEqual(0.9);
  });

  it('both eyes flat/covered → FAIL / EYE_TEXTURE_LOW', () => {
    const r = evaluateEyePixelVisibility({ left: FLAT, right: FLAT });
    expect(r.status).toBe('FAIL');
    expect(r.reason).toBe('EYE_TEXTURE_LOW');
  });

  it('either iris not detectable (one flat eye) → FAIL', () => {
    expect(evaluateEyePixelVisibility({ left: REAL, right: FLAT }).status).toBe('FAIL');
    expect(evaluateEyePixelVisibility({ left: FLAT, right: REAL }).status).toBe('FAIL');
  });

  it('borderline texture (0.85–0.90) → WARNING / EYES_REVIEW', () => {
    const r = evaluateEyePixelVisibility({ left: BORDER, right: BORDER });
    expect(r.status).toBe('WARNING');
    expect(r.reason).toBe('EYES_REVIEW');
  });

  it('dark iris / low light but with visible eye STRUCTURE → PASS', () => {
    // Modest-but-present texture, edges, and contrast (lid line, lashes, sclera).
    const r = evaluateEyePixelVisibility({ left: m(15, 0.015, 0.08), right: m(15, 0.015, 0.08) });
    expect(r.status).toBe('PASS');
  });

  it('weighted (not MAX): contrast alone with NO texture/edges does NOT force a PASS', () => {
    // The blindfold example from the bug report — high contrast, no eye structure.
    const r = evaluateEyePixelVisibility({ left: m(3, 0.001, 0.96), right: m(3, 0.001, 0.96) });
    expect(r.status).not.toBe('PASS');
  });

  it('no metrics available (could not sample) → PASS (never fabricates a failure)', () => {
    expect(evaluateEyePixelVisibility({}).status).toBe('PASS');
    expect(evaluateEyePixelVisibility(null).status).toBe('PASS');
  });
});

// ── Engine integration ───────────────────────────────────────────────────────
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
const pv = (status: EyePixelVisibilityResult['status'], reason: EyePixelVisibilityResult['reason']): EyePixelVisibilityResult => ({
  status, leftConfidence: status === 'PASS' ? 1 : 0.4, rightConfidence: status === 'PASS' ? 1 : 0.4, reason,
});

describe('PassportComplianceEngine — pixel visibility folds into Eye Position', () => {
  it('pixel FAIL → Eye Position FAIL with the strict landmark message', () => {
    const r = evaluate(bio({ gaze: straightGaze, eyePixelVisibility: pv('FAIL', 'EYE_TEXTURE_LOW') }), US, usCfg, 0.565);
    expect(r.eyeAlignment.status).toBe('FAIL');
    expect(r.eyeAlignment.message).toMatch(/estimated landmarks alone are not sufficient/i);
    expect(r.overall).toBe('NON_COMPLIANT');
  });

  it('pixel WARNING → Eye Position WARNING (review), not a fail', () => {
    const r = evaluate(bio({ gaze: straightGaze, eyePixelVisibility: pv('WARNING', 'EYES_REVIEW') }), US, usCfg, 0.565);
    expect(r.eyeAlignment.status).toBe('WARNING');
  });

  it('pixel PASS → normal PASS (no warning for fully-visible eyes)', () => {
    const r = evaluate(bio({ gaze: straightGaze, eyePixelVisibility: pv('PASS', 'EYES_VISIBLE') }), US, usCfg, 0.565);
    expect(r.eyeAlignment.status).toBe('PASS');
  });

  it('backward compatible: no pixel-visibility field → existing behavior', () => {
    expect(evaluate(bio({ gaze: straightGaze }), US, usCfg, 0.565).eyeAlignment.status).toBe('PASS');
  });
});
