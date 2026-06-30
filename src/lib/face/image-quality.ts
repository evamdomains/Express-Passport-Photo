import type { AxisResult, ImageQualityMetrics } from '@/types/biometric';
import { QUALITY } from './quality-config';

/**
 * Pure evaluator (no DOM/MediaPipe) that turns measured ImageQualityMetrics into
 * Sharpness / Face Quality / Eye Visibility verdicts. Unit-testable with
 * synthetic metrics.
 *
 * If metrics are unknown (`measured === false` — e.g. the canvas couldn't sample
 * pixels), the checks PASS rather than block a good photo: the geometric gate
 * still applies. We never fabricate a failure from missing data.
 */

export interface QualityChecks {
  sharpness: AxisResult;
  faceQuality: AxisResult;
  eyeVisibility: AxisResult;
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Face-region exposure thresholds (0–255 luminance scale). Single source of
 * truth shared by the browser gate (evaluateExposure, below) and the server
 * analyzer (src/lib/exposure-analysis.ts imports this), so both agree.
 */
export const EXPOSURE = {
  darkPx: 45, // a face pixel below this counts as "very dark"
  brightPx: 235, // above this counts as a blown highlight
  underFailMean: 70, // mean face luminance below → underexposed (FAIL)
  underWarnMean: 95,
  overWarnMean: 200,
  overFailMean: 218, // mean above → overexposed (FAIL)
  overBlownWarn: 0.06, // blown-highlight fraction
  overBlownFail: 0.15,
  balanceWarn: 30, // |left−right| luminance
  balanceFail: 60,
  shadowWarn: 0.18, // deep-shadow fraction
  shadowFail: 0.35,
  shadowDelta: 50, // "deep shadow" = more than this below the face mean
} as const;

/**
 * Eyeglasses detection threshold. `glassesScore` is the ratio of strong-edge
 * density on the nose bridge (between the eyes) to smooth cheek skin: a glasses
 * bridge/frame is a hard edge that bare skin lacks, so the ratio spikes. The
 * cheek baseline normalizes for overall image sharpness, and the ROI sits
 * BETWEEN the eyes (not on the brows), so thick eyebrows / shadows don't trip it.
 * Conservative default — tune against real uploads.
 */
export const GLASSES = {
  // Variance-of-Laplacian ratio (nose bridge ÷ cheek) — used ONLY by the
  // heuristic fallback when the ONNX model is unavailable. A hard frame line
  // spikes the bridge variance; a bare bridge stays near the cheek (~1–1.5).
  failRatio: 2.0,
} as const;

/** Customer-facing eyeglasses rejection copy (shared by the model + heuristic). */
export const GLASSES_FAIL_MESSAGE =
  'Eyeglasses detected. Passport & visa photos require your eyes fully visible without glasses — please remove your glasses and retake or upload a new photo.';

/**
 * Eyeglasses verdict from the browser-measured nose-bridge edge ratio. PASS when
 * unmeasured (no face / sampling failed) — never fabricate a rejection.
 */
export function evaluateGlasses(m?: Pick<ImageQualityMetrics, 'measured' | 'glassesScore'>): AxisResult {
  if (!m || !m.measured || m.glassesScore == null) {
    return { status: 'PASS', message: 'Eyeglasses check not measured.' };
  }
  if (m.glassesScore >= GLASSES.failRatio) {
    return { status: 'FAIL', value: round(m.glassesScore), message: GLASSES_FAIL_MESSAGE };
  }
  return { status: 'PASS', value: round(m.glassesScore), message: 'No eyeglasses detected.' };
}

/**
 * Exposure verdict from the browser-measured face-region metrics. Mirrors the
 * server analyzer's logic. PASS when metrics are unmeasured (never fabricate a
 * failure from missing data — the server analyzer is the authoritative backstop).
 */
export function evaluateExposure(m?: ImageQualityMetrics): AxisResult {
  if (!m || !m.measured || m.meanBrightness == null) {
    return { status: 'PASS', message: 'Exposure not measured.' };
  }
  const mean = m.meanBrightness;
  const over = m.overExposureScore ?? 0;
  const balance = m.lightingBalanceScore ?? 0;
  const shadow = m.shadowScore ?? 0;

  const fail =
    mean < EXPOSURE.underFailMean ||
    mean > EXPOSURE.overFailMean ||
    over > EXPOSURE.overBlownFail ||
    balance > EXPOSURE.balanceFail ||
    shadow > EXPOSURE.shadowFail;
  const warn =
    mean < EXPOSURE.underWarnMean ||
    mean > EXPOSURE.overWarnMean ||
    over > EXPOSURE.overBlownWarn ||
    balance > EXPOSURE.balanceWarn ||
    shadow > EXPOSURE.shadowWarn;
  const status = fail ? 'FAIL' : warn ? 'WARNING' : 'PASS';

  const message =
    status === 'PASS'
      ? 'Face exposure looks good.'
      : mean < EXPOSURE.underWarnMean
        ? 'Face looks underexposed (too dark). Use even, front-facing lighting.'
        : mean > EXPOSURE.overWarnMean || over > EXPOSURE.overBlownWarn
          ? 'Face looks overexposed (too bright / blown highlights).'
          : balance > EXPOSURE.balanceWarn
            ? 'Uneven lighting across the face. Face an even light source.'
            : 'Deep facial shadows detected. Use even, front-facing lighting.';

  return { status, value: round(mean), message };
}

/**
 * @param opts.infant  Infant documents soften eye-visibility to a WARNING
 *                      (newborns can't always keep eyes wide/clear); adults FAIL.
 */
export function evaluateImageQuality(m?: ImageQualityMetrics, opts?: { infant?: boolean }): QualityChecks {
  if (!m || !m.measured) {
    return {
      sharpness: { status: 'PASS', message: 'Sharpness not measured.' },
      faceQuality: { status: 'PASS', message: 'Face quality not measured.' },
      eyeVisibility: { status: 'PASS', message: 'Eye visibility not measured.' },
    };
  }

  const sharpness: AxisResult =
    m.sharpnessScore < QUALITY.sharpnessFail
      ? { status: 'FAIL', value: round(m.sharpnessScore), message: 'Photo is too blurry. Please upload a sharper image.' }
      : m.sharpnessScore < QUALITY.sharpnessWarn
        ? { status: 'WARNING', value: round(m.sharpnessScore), message: 'Photo looks slightly soft — a sharper image is recommended.' }
        : { status: 'PASS', value: round(m.sharpnessScore), message: 'Photo is sharp.' };

  const faceQuality: AxisResult =
    m.faceQualityScore < QUALITY.faceQualityFail
      ? { status: 'FAIL', value: m.faceQualityScore, message: 'Face quality is insufficient for passport processing.' }
      : { status: 'PASS', value: m.faceQualityScore, message: 'Face quality is sufficient.' };

  const eyeVisibility: AxisResult =
    m.eyeSharpness < QUALITY.eyeSharpnessFail
      ? {
          status: opts?.infant ? 'WARNING' : 'FAIL',
          value: round(m.eyeSharpness),
          message: opts?.infant
            ? 'Eyes look unclear — for infants this is allowed, but a clearer photo is preferred.'
            : 'Eyes are not clearly visible. Please upload a clearer photo.',
        }
      : { status: 'PASS', value: round(m.eyeSharpness), message: 'Eyes are clearly visible.' };

  return { sharpness, faceQuality, eyeVisibility };
}
