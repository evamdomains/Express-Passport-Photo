import type { AxisResult, BiometricConfig } from '@/types/biometric';
import type { DocumentSpec, DocumentTypeId } from '@/types/document';
import type { EyeGazeResult } from './EyeGazeEstimator';

/**
 * Document-specific eye-gaze RULES + the rule-application logic.
 *
 * Division of responsibility (do not blur these):
 *   • EyeGazeEstimator  — pure MATH. Measures where the irises point. Never
 *     decides PASS/FAIL.
 *   • gaze-rules (here) — the document THRESHOLD table + the mapping from a
 *     measurement to an AxisResult (status + reason code + message + diagnostics).
 *   • PassportComplianceEngine — orchestrates: folds this gaze axis together with
 *     the eyes-open + head-roll checks (worst result wins) into `eyeAlignment`.
 *
 * All tunable numbers live in DOCUMENT_GAZE_RULES — nothing is hardcoded elsewhere.
 */

/** Iris position that means "looking straight" — the estimator's zero offset maps here. */
export const GAZE_CENTER = 0.5;

/** A single axis tolerance, expressed in normalized iris-POSITION space (0..1, 0.5 = centered). */
export interface GazeToleranceRange {
  min: number;
  max: number;
}

export interface DocumentGazeRule {
  /** Allowed horizontal iris position. Outside ⇒ looking left/right. */
  horizontal: GazeToleranceRange;
  /** Allowed vertical iris position. Outside ⇒ looking up/down. */
  vertical: GazeToleranceRange;
}

/** Stable reason codes for the eye-gaze verdict (locale-independent). */
export type GazeReasonCode =
  | 'EYE_GAZE_OK'
  | 'EYE_GAZE_NOT_MEASURED'
  | 'EYE_LOOKING_LEFT'
  | 'EYE_LOOKING_RIGHT'
  | 'EYE_LOOKING_UP'
  | 'EYE_LOOKING_DOWN';

/**
 * DOCUMENT_GAZE_RULES — the SINGLE source of truth for per-document gaze
 * tolerances. Positions are in 0..1 space where 0.5 is a dead-center (camera-
 * facing) iris; the band half-width is how far off-center is still acceptable.
 * These are initial defaults — tune HERE, never inline. See tuning guide below.
 */
// Horizontal and vertical tolerances are INDEPENDENT, and the vertical band is
// deliberately ASYMMETRIC:
//   • UP side (min) stays lenient (0.40): a straight gaze reads slightly "up" due
//     to eyelid coverage / camera-above placement — being lenient here prevents
//     false LOOKING_UP.
//   • DOWN side (max) is stricter (0.55): a downward gaze produces only a WEAK
//     vertical signal (the eyelids move down WITH the eye, so the iris stays
//     roughly centered in the narrowed opening). A tight down bound is required to
//     actually catch "looking down" — a symmetric wide band let it pass.
// (0.50 = perfectly centered; a real straight gaze calibrates to ≈0.50, leaving a
// comfortable margin below the 0.55 down bound.)
export const DOCUMENT_GAZE_RULES: Record<DocumentTypeId, DocumentGazeRule> = {
  // US Passport / Visa — strict horizontal (±0.05); asymmetric vertical.
  us_passport: { horizontal: { min: 0.45, max: 0.55 }, vertical: { min: 0.4, max: 0.55 } },
  us_visa: { horizontal: { min: 0.45, max: 0.55 }, vertical: { min: 0.4, max: 0.55 } },

  // Canadian docs — marginally more permissive horizontally (±0.06).
  canadian_passport: { horizontal: { min: 0.44, max: 0.56 }, vertical: { min: 0.4, max: 0.56 } },
  canadian_pr_card: { horizontal: { min: 0.44, max: 0.56 }, vertical: { min: 0.4, max: 0.56 } },

  // Baby Passport — infants cannot fixate on the lens; widest band both axes.
  // NOTE: infant documents currently route through the dedicated baby engine
  // (baby-compliance.ts), which does not gate on gaze, so this entry is defined
  // for completeness / future use rather than actively enforced today.
  baby_passport: { horizontal: { min: 0.38, max: 0.62 }, vertical: { min: 0.35, max: 0.63 } },
};

/** Safe default when a document id is unknown (mirrors the strict US band). */
export const DEFAULT_GAZE_RULE: DocumentGazeRule = {
  horizontal: { min: 0.45, max: 0.55 },
  vertical: { min: 0.4, max: 0.55 },
};

/** Resolve the gaze rule for a document (falls back to the strict default). */
export function getGazeRule(spec: DocumentSpec): DocumentGazeRule {
  return DOCUMENT_GAZE_RULES[spec.id] ?? DEFAULT_GAZE_RULE;
}

/** Module-level debug flag. Off in production to avoid console spam. */
export const DEBUG_GAZE_RULES = false;

const round = (n: number, d = 4): number => Math.round(n * 10 ** d) / 10 ** d;

const MESSAGES: Record<GazeReasonCode, string> = {
  EYE_GAZE_OK: 'Looking directly at the camera.',
  EYE_GAZE_NOT_MEASURED: 'Eye gaze could not be measured — skipped.',
  EYE_LOOKING_LEFT: 'Look directly at the camera. Your eyes appear to be looking left.',
  EYE_LOOKING_RIGHT: 'Look directly at the camera. Your eyes appear to be looking right.',
  EYE_LOOKING_UP: 'Look directly at the camera. Your eyes appear to be looking up.',
  EYE_LOOKING_DOWN: 'Look directly at the camera. Your eyes appear to be looking down.',
};

export interface EvaluateGazeOptions {
  debug?: boolean;
  logger?: Pick<Console, 'log'>;
}

/**
 * Apply the document's gaze rule to a gaze MEASUREMENT and return a structured
 * AxisResult (status + reason code + message + diagnostics). This is the RULE
 * layer — the estimator supplies the numbers, this decides whether they satisfy
 * the selected document.
 *
 * Decision:
 *   position = GAZE_CENTER + averageOffset            (offset 0 → 0.5 centered)
 *   in-range on BOTH axes                → PASS  (EYE_GAZE_OK)
 *   out of range                         → FAIL  (or WARNING for relaxed/infant),
 *     coded by the axis that deviates the most (left/right/up/down).
 *   no measurement / UNKNOWN             → PASS  (EYE_GAZE_NOT_MEASURED) — we do
 *     not fail a photo on a signal we could not measure.
 */
export function evaluateEyeGaze(
  gaze: EyeGazeResult | undefined,
  spec: DocumentSpec,
  cfg: BiometricConfig,
  opts: EvaluateGazeOptions = {},
): AxisResult {
  const rule = getGazeRule(spec);
  const allowedHorizontal: [number, number] = [rule.horizontal.min, rule.horizontal.max];
  const allowedVertical: [number, number] = [rule.vertical.min, rule.vertical.max];

  // No usable estimate → don't gate on gaze (PASS, but flagged as not-measured).
  if (!gaze || gaze.direction === 'UNKNOWN') {
    const result: AxisResult = {
      status: 'PASS',
      code: 'EYE_GAZE_NOT_MEASURED',
      message: MESSAGES.EYE_GAZE_NOT_MEASURED,
    };
    logGazeRule(spec, allowedHorizontal, allowedVertical, undefined, undefined, result, opts);
    return result;
  }

  // NOTE: gaze `confidence` is NO LONGER used to gate compliance. Eye reliability
  // (eyes present / open / unoccluded) is owned by the EyeVisibilityEvaluator +
  // EyeOcclusionEvaluator upstream. A confidence-based WARNING here double-judged
  // the same thing and, because confidence is a product of several sub-1 quality
  // factors, false-warned perfectly valid photos. The gaze rule now judges only
  // DIRECTION. `confidence` remains on the result for debug/telemetry.

  // Horizontal uses the raw averaged offset (unchanged — it works well).
  // Vertical uses the CALIBRATED offset (bias- + pitch-corrected) to avoid false
  // LOOKING_UP; falls back to the raw average for older payloads without it.
  const posH = round(GAZE_CENTER + gaze.averageHorizontal);
  const posV = round(GAZE_CENTER + (gaze.calibratedVertical ?? gaze.averageVertical));
  const detail = { averageHorizontal: posH, averageVertical: posV, allowedHorizontal, allowedVertical };

  // How far outside each band (0 when inside). Drives the dominant-axis reason code.
  const hViolation = Math.max(rule.horizontal.min - posH, posH - rule.horizontal.max, 0);
  const vViolation = Math.max(rule.vertical.min - posV, posV - rule.vertical.max, 0);

  if (hViolation === 0 && vViolation === 0) {
    const result: AxisResult = {
      status: 'PASS',
      code: 'EYE_GAZE_OK',
      message: MESSAGES.EYE_GAZE_OK,
      gaze: detail,
    };
    logGazeRule(spec, allowedHorizontal, allowedVertical, posH, posV, result, opts);
    return result;
  }

  // Pick the axis with the larger violation for the reason code + which value to report.
  let code: GazeReasonCode;
  let value: number;
  if (hViolation >= vViolation) {
    code = posH < rule.horizontal.min ? 'EYE_LOOKING_LEFT' : 'EYE_LOOKING_RIGHT';
    value = posH;
  } else {
    code = posV < rule.vertical.min ? 'EYE_LOOKING_UP' : 'EYE_LOOKING_DOWN';
    value = posV;
  }

  // Relaxed/infant documents downgrade a gaze miss to a WARNING (mirrors the
  // existing eyes-open relaxed behaviour); everyone else hard-FAILs.
  const status = cfg.relaxedEyes ? 'WARNING' : 'FAIL';
  const result: AxisResult = { status, code, message: MESSAGES[code], value, gaze: detail };
  logGazeRule(spec, allowedHorizontal, allowedVertical, posH, posV, result, opts);
  return result;
}

function logGazeRule(
  spec: DocumentSpec,
  allowedHorizontal: [number, number],
  allowedVertical: [number, number],
  measuredHorizontal: number | undefined,
  measuredVertical: number | undefined,
  result: AxisResult,
  opts: EvaluateGazeOptions,
): void {
  if (!(opts.debug ?? DEBUG_GAZE_RULES)) return;
  const logger = opts.logger ?? console;
  const fmt = (n: number | undefined) => (n == null ? '   n/a' : n.toFixed(4));
  logger.log(
    [
      '================================',
      'Eye Gaze Rule (Compliance Engine)',
      `Selected Document:        ${spec.id}`,
      `Allowed Horizontal Range: [${allowedHorizontal[0]}, ${allowedHorizontal[1]}]`,
      `Allowed Vertical Range:   [${allowedVertical[0]}, ${allowedVertical[1]}]`,
      `Measured Horizontal:      ${fmt(measuredHorizontal)}`,
      `Measured Vertical:        ${fmt(measuredVertical)}`,
      `Final Eye Position Result: ${result.status} (${result.code})`,
      '================================',
    ].join('\n'),
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * THRESHOLD TUNING GUIDE
 * ─────────────────────────────────────────────────────────────────────────────
 * All gaze tolerances live in DOCUMENT_GAZE_RULES, keyed by DocumentTypeId, in
 * normalized iris-POSITION space (0..1, 0.5 = perfectly centered / camera-facing).
 *
 *   • Narrow the band (e.g. 0.47–0.53) to be STRICTER — smaller off-axis glances
 *     start failing. Widen (e.g. 0.42–0.58) to be more lenient.
 *   • Keep bands symmetric around 0.5 unless you are correcting a systematic
 *     camera-parallax bias.
 *   • horizontal and vertical tune independently. Vertical is noisier (eye height
 *     is small; eyelids move on blink) — if you see false "looking up/down",
 *     widen the vertical band first.
 *   • Relationship to the estimator: position = 0.5 + averageOffset, and the
 *     estimator normalizes the offset by eye width/height. So a horizontal band of
 *     0.45–0.55 accepts an iris up to 5% of eye width off center — matching the
 *     estimator's own default GAZE_THRESHOLDS dead-band.
 *   • Calibration: set DEBUG_GAZE_RULES = true (or pass { debug: true }), collect
 *     ~30 known-good and ~30 known-bad photos, read the logged Measured values,
 *     and set each band just outside the spread of the good set. Re-run the tests.
 * ───────────────────────────────────────────────────────────────────────────── */
