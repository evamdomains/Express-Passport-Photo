/**
 * EyeGazeEstimator — deterministic eye-gaze estimation from MediaPipe Face Mesh
 * landmarks alone (no external API, no ML model, no MediaPipe replacement).
 *
 * MediaPipe gives us 478 landmarks (incl. iris) but NOT the answer to
 * "is the person looking at the camera?". This module derives that answer
 * geometrically from the iris position relative to each eye's opening.
 *
 * Design contract:
 *   • PURE + isomorphic — no DOM, no MediaPipe import, no side effects (beyond
 *     opt-in console logging). Safe to run in the browser AND on the server, and
 *     trivially unit-testable with plain landmark arrays.
 *   • It ESTIMATES gaze only. It NEVER decides PASS/FAIL — that stays the
 *     compliance engine's job. It does not touch any existing logic.
 *   • Head-roll compensated: gaze is measured in a *head-aligned* coordinate
 *     frame built from the eye line, so a naturally tilted head does not read as
 *     "looking left/right". See the math notes at the bottom of this file.
 *
 * @see docs at the end of this file for the full algorithm, averaging rationale,
 *      threshold-tuning guide, limitations, and future-model migration notes.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** A MediaPipe landmark. `x`/`y` are normalized [0,1]; `z` is optional/unused. */
export interface GazeLandmark {
  x: number;
  y: number;
  z?: number;
}

/**
 * Gaze classification.
 * LEFT/RIGHT/UP/DOWN are expressed in the *viewer's* frame (image space):
 * LOOKING_RIGHT means the irises are displaced toward the right-hand side of the
 * image. `UNKNOWN` is returned only for degenerate input (missing/collinear
 * landmarks) so the function stays total and never throws.
 */
export type GazeDirection =
  | 'LOOKING_STRAIGHT'
  | 'LOOKING_LEFT'
  | 'LOOKING_RIGHT'
  | 'LOOKING_UP'
  | 'LOOKING_DOWN'
  | 'UNKNOWN';

/** Full estimator output. All offsets are normalized (dimensionless) ratios. */
export interface EyeGazeResult {
  direction: GazeDirection;
  /** 0..1. For STRAIGHT: how centered the gaze is. For a direction: how strong the deviation is. */
  confidence: number;
  leftEyeHorizontal: number;
  rightEyeHorizontal: number;
  /** RAW per-eye vertical offset (iris vs. eyelid midpoint ÷ eye height). Uncalibrated. */
  leftEyeVertical: number;
  rightEyeVertical: number;
  averageHorizontal: number;
  /** RAW averaged vertical offset (mean of the two eyes). Uncalibrated — kept for parity/debug. */
  averageVertical: number;
  /**
   * CALIBRATED vertical offset — averageVertical corrected for the systematic
   * "iris sits above the lid midpoint on a straight gaze" bias, then attenuated
   * for near-level head pitch (camera-placement, not gaze). THIS is the value the
   * compliance engine should judge vertically. Optional so manually-built results
   * / older payloads still type-check (the engine falls back to averageVertical).
   */
  calibratedVertical?: number;

  // ── Multi-feature quality signals (measurement only; all optional for backward
  //    compatibility). They DO NOT change the gaze direction — they feed the
  //    reliability `confidence`, which the compliance engine uses to decide whether
  //    the gaze reading is trustworthy. See computeConfidence() below. ──
  /** Left eye aspect ratio = eye height ÷ eye width (openness). Low ⇒ blink/squint. */
  leftEAR?: number;
  /** Right eye aspect ratio. */
  rightEAR?: number;
  /** Mean of the two EARs. */
  averageEAR?: number;
  /** Eyelid symmetry 0..1 (min/max EAR). 1 = both eyes equally open; low ⇒ wink/occlusion. */
  eyelidSymmetry?: number;
  /** Fraction of the left iris vertically visible between the eyelids (0..1). */
  leftIrisVisibility?: number;
  /** Fraction of the right iris vertically visible between the eyelids (0..1). */
  rightIrisVisibility?: number;
  /** Why gaze was not estimated (e.g. 'EYES_NOT_VISIBLE'), when direction is UNKNOWN. */
  reason?: string;
}

/** Optional per-call overrides. */
export interface EyeGazeOptions {
  /** Override the centralized thresholds (deep-merged). Use for calibration/tests. */
  thresholds?: GazeThresholds;
  /** Override the vertical calibration config (shallow-merged). Use for tuning/tests. */
  vertical?: Partial<VerticalGazeConfig>;
  /** Override the eye-quality/confidence config (shallow-merged). Use for tuning/tests. */
  quality?: Partial<EyeQualityConfig>;
  /**
   * Head pitch in degrees (nod up/down) from the pose estimator, if available.
   * Enables perspective compensation: when the head is near-level (|pitch| small),
   * a residual vertical iris offset is treated as camera placement, not gaze.
   */
  headPitchDeg?: number;
  /**
   * Head yaw in degrees (turn left/right) from the pose estimator, if available.
   * Only used to REDUCE confidence when the head is turned far off-axis (iris-based
   * gaze degrades under strong yaw). Never changes the direction.
   */
  headYawDeg?: number;
  /** Optional document label for the debug block (estimator is document-agnostic otherwise). */
  documentLabel?: string;
  /**
   * Early-exit guard set by the caller after the EyeVisibilityEvaluator runs. When
   * `false`, gaze is NOT estimated — we return UNKNOWN immediately (reason
   * 'EYES_NOT_VISIBLE'). Defaults to true, so existing callers are unaffected. This
   * only short-circuits; it does not change the gaze mathematics.
   */
  eyesVisible?: boolean;
  /** Emit the detailed debug block. Defaults to the module-level DEBUG_EYE_GAZE flag. */
  debug?: boolean;
  /** Inject a logger (defaults to console). Handy for tests / structured logging. */
  logger?: Pick<Console, 'log'>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Landmark indices (MediaPipe 478-point Face Mesh, refine_landmarks = true)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The exact landmark indices this estimator consumes. "left"/"right" here are in
 * IMAGE space to match the classification frame:
 *   • leftEye  → the eye on the image-left  (subject's right eye), iris ring 468
 *   • rightEye → the eye on the image-right (subject's left eye),  iris ring 473
 *
 * Each iris index is anatomically paired with its own eye's corners/lids so the
 * offset math is correct (468 belongs with 33/133/159/145; 473 with 263/362/386/374).
 */
export const GAZE_LANDMARKS = {
  leftEye: {
    iris: 468, // iris center (ring 468–472)
    outer: 33, // outer/temporal corner
    inner: 133, // inner/nasal corner
    upper: 159, // upper eyelid mid
    lower: 145, // lower eyelid mid
  },
  rightEye: {
    iris: 473, // iris center (ring 473–477)
    outer: 263,
    inner: 362,
    upper: 386,
    lower: 374,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Thresholds — centralized, no magic numbers scattered through the code
// ─────────────────────────────────────────────────────────────────────────────

export interface GazeThresholds {
  /**
   * Horizontal "straight" dead-band on the averaged iris offset (fraction of eye
   * WIDTH). Inside [straightMin, straightMax] ⇒ looking straight horizontally.
   */
  horizontal: { straightMin: number; straightMax: number };
  /**
   * Vertical "straight" dead-band on the averaged iris offset (fraction of eye
   * HEIGHT). Vertical eye travel is small relative to eye height and the eyelid
   * reference is noisier, so this band is intentionally wider than horizontal.
   */
  vertical: { straightMin: number; straightMax: number };
  /**
   * Confidence shaping. A directional deviation of `saturationMultiplier` × the
   * band half-width (or beyond) maps to full confidence 1.0. Keeps confidence
   * out of the classification math (it never changes the direction).
   */
  confidence: { saturationMultiplier: number };
}

/**
 * DEFAULT thresholds. These are conservative starting points calibrated for
 * front-facing passport-style photos; see the "Threshold tuning guide" at the
 * bottom of the file before changing them. All tuning happens HERE, once.
 */
export const GAZE_THRESHOLDS: GazeThresholds = {
  horizontal: { straightMin: -0.06, straightMax: 0.06 },
  // NOTE: vertical.straightMin/Max are retained for reference/parity only. Vertical
  // classification now uses the dedicated, calibrated pipeline in VERTICAL_GAZE_CONFIG
  // (dead-zone + pitch compensation + confidence gate) — see classify().
  vertical: { straightMin: -0.12, straightMax: 0.12 },
  confidence: { saturationMultiplier: 3 },
};

// ─────────────────────────────────────────────────────────────────────────────
// Vertical gaze calibration — the fix for false "LOOKING_UP" on straight gazes.
//
// A straight-ahead gaze does NOT put the iris at the eyelid midpoint: the upper
// lid drapes over the top of the iris and cameras usually sit above eye level, so
// the raw vertical offset reads slightly negative ("up") even when the subject is
// looking dead-on. These constants correct that bias with real gaze-estimation
// technique rather than a blunt threshold widening. Horizontal is unaffected.
// ─────────────────────────────────────────────────────────────────────────────

export interface VerticalGazeConfig {
  /** Added to the raw vertical offset to re-center a true straight gaze at 0. */
  centerOffset: number;
  /** |calibrated vertical| below this ⇒ LOOKING_STRAIGHT (independent of horizontal). */
  deadZone: number;
  /** |head pitch| ≤ this (deg) ⇒ head is level ⇒ attenuate residual vertical. */
  pitchNeutralDeg: number;
  /** Multiplier applied to the calibrated vertical when the head is level (0..1). */
  pitchNeutralGain: number;
  /** Vertical confidence below this ⇒ prefer STRAIGHT (false positives are worse). */
  confidenceMin: number;
}

/** Calibration offset — irises naturally sit above the lid midpoint on a straight gaze. */
export const VERTICAL_CENTER_OFFSET = 0.06;
/** Neutral zone: small vertical deviations stay STRAIGHT rather than flipping to up/down. */
export const VERTICAL_DEAD_ZONE = 0.1;
/** Head considered "level" within ±this many degrees of pitch. */
export const PITCH_NEUTRAL_DEG = 5;
/** How much to shrink the residual vertical offset when the head is level. */
export const PITCH_NEUTRAL_GAIN = 0.6;
/** Vertical up/down is only asserted above this confidence; else STRAIGHT. */
export const VERTICAL_CONFIDENCE_MIN = 0.35;

/** Centralized vertical calibration config (single source of truth; override per-call via options.vertical). */
export const VERTICAL_GAZE_CONFIG: VerticalGazeConfig = {
  centerOffset: VERTICAL_CENTER_OFFSET,
  deadZone: VERTICAL_DEAD_ZONE,
  pitchNeutralDeg: PITCH_NEUTRAL_DEG,
  pitchNeutralGain: PITCH_NEUTRAL_GAIN,
  confidenceMin: VERTICAL_CONFIDENCE_MIN,
};

// MediaPipe iris RING indices (refine_landmarks). The center is in GAZE_LANDMARKS;
// these 4 ring points per eye give the iris radius for the visibility estimate.
export const IRIS_RING = {
  leftEye: [469, 470, 471, 472],
  rightEye: [474, 475, 476, 477],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Eye-quality / confidence configuration (multi-feature reliability).
// Centralized — no magic numbers scattered through the code. All values are
// deterministic and tunable. Used ONLY to compute the reliability `confidence`;
// they never change the measured gaze direction.
// ─────────────────────────────────────────────────────────────────────────────

export interface EyeQualityConfig {
  /** EAR ≥ this ⇒ eyes fully open ⇒ EAR confidence factor = 1.0. */
  earFull: number;
  /** EAR ≤ this ⇒ eyes (near) closed ⇒ EAR factor = earFloor. */
  earLow: number;
  /** Minimum EAR confidence factor (a blink lowers, never zeroes, confidence). */
  earFloor: number;
  /** Minimum eyelid-symmetry factor. */
  symmetryFloor: number;
  /** Minimum iris-visibility factor. */
  visibilityFloor: number;
  /** Summed L/R offset disagreement that drops the eye-agreement factor to its floor. */
  agreementScale: number;
  /** Minimum eye-agreement factor. */
  agreementFloor: number;
  /** |yaw| ≤ this (deg) ⇒ no pose penalty. */
  yawFree: number;
  /** |yaw| ≥ this (deg) ⇒ pose factor = poseFloor. */
  yawMax: number;
  /** Minimum head-pose confidence factor. */
  poseFloor: number;
  /** Iris radius ≈ this × eye width, used ONLY when the iris ring landmarks are absent. */
  irisRadiusRatioFallback: number;
}

/** Default eye-quality config (adult). Tune here; override per-call via options.quality. */
export const EYE_QUALITY_CONFIG: EyeQualityConfig = {
  earFull: 0.2,
  earLow: 0.08,
  earFloor: 0.2,
  symmetryFloor: 0.2,
  visibilityFloor: 0.2,
  agreementScale: 0.5,
  agreementFloor: 0.3,
  yawFree: 10,
  yawMax: 30,
  poseFloor: 0.4,
  irisRadiusRatioFallback: 0.19,
};

/** Module-level default for debug logging. Off in production to avoid console spam. */
export const DEBUG_EYE_GAZE = false;

// ─────────────────────────────────────────────────────────────────────────────
// Vector helpers (2-D, normalized landmark space). Reusable, no duplication.
// ─────────────────────────────────────────────────────────────────────────────

interface Vec2 {
  x: number;
  y: number;
}

const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
const mid = (a: Vec2, b: Vec2): Vec2 => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
const len = (a: Vec2): number => Math.hypot(a.x, a.y);

/** Unit vector; returns null when the input is (near) zero-length (degenerate). */
function normalize(v: Vec2): Vec2 | null {
  const m = len(v);
  if (m < 1e-9) return null;
  return { x: v.x / m, y: v.y / m };
}

/** Rotate a vector +90° (counter-clockwise in image space where y grows down). */
const perpendicular = (v: Vec2): Vec2 => ({ x: -v.y, y: v.x });

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));
const round = (n: number, d = 4): number => Math.round(n * 10 ** d) / 10 ** d;

// ─────────────────────────────────────────────────────────────────────────────
// Per-eye geometry
// ─────────────────────────────────────────────────────────────────────────────

interface EyeSpec {
  iris: number;
  outer: number;
  inner: number;
  upper: number;
  lower: number;
}

interface EyeFeatures {
  /** Iris horizontal displacement ÷ eye width, projected onto the head axis. +right. */
  horizontal: number;
  /** Iris vertical displacement ÷ eye height, projected onto the head axis. +down. */
  vertical: number;
  /** Eye aspect ratio = eye height ÷ eye width (openness). */
  ear: number;
  /** Fraction of the iris vertically visible between the eyelids (0..1). */
  irisVisibility: number;
  valid: boolean;
}

const INVALID_EYE: EyeFeatures = { horizontal: 0, vertical: 0, ear: 0, irisVisibility: 0, valid: false };

/** All indices for an eye present and numeric? */
function pickEyePoints(
  landmarks: GazeLandmark[],
  spec: EyeSpec,
): { iris: Vec2; outer: Vec2; inner: Vec2; upper: Vec2; lower: Vec2 } | null {
  const idxs = [spec.iris, spec.outer, spec.inner, spec.upper, spec.lower];
  for (const i of idxs) {
    const p = landmarks[i];
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
  }
  return {
    iris: landmarks[spec.iris],
    outer: landmarks[spec.outer],
    inner: landmarks[spec.inner],
    upper: landmarks[spec.upper],
    lower: landmarks[spec.lower],
  };
}

/**
 * Iris radius in normalized units. Uses the 4 MediaPipe iris RING landmarks when
 * present (mean distance from the iris center); falls back to a fraction of the
 * eye width when the ring is unavailable (older payloads / synthetic input).
 */
function irisRadius(
  landmarks: GazeLandmark[],
  center: Vec2,
  ring: readonly number[],
  eyeWidth: number,
  cfg: EyeQualityConfig,
): number {
  const rs: number[] = [];
  for (const i of ring) {
    const p = landmarks[i];
    if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) rs.push(len(sub(p, center)));
  }
  if (rs.length) return rs.reduce((a, b) => a + b, 0) / rs.length;
  return eyeWidth * cfg.irisRadiusRatioFallback;
}

/**
 * Iris visibility: the fraction of the iris's vertical diameter that lies between
 * the eyelids, measured along the head-down axis. 1.0 = the full iris height is
 * exposed; < 1 means an eyelid clips the top/bottom of the iris (drooping /
 * squinting / blink), which makes the gaze reading less reliable.
 */
function computeIrisVisibility(
  iris: Vec2,
  upper: Vec2,
  lower: Vec2,
  headV: Vec2,
  radius: number,
): number {
  if (radius < 1e-9) return 0;
  const proj = (p: Vec2) => dot(p, headV); // position along image-down axis
  const c = proj(iris);
  const irisTop = c - radius; // smaller headV coord = higher in image
  const irisBottom = c + radius;
  const lidTop = proj(upper);
  const lidBottom = proj(lower);
  const visibleTop = Math.max(irisTop, lidTop);
  const visibleBottom = Math.min(irisBottom, lidBottom);
  return clamp01((visibleBottom - visibleTop) / (2 * radius));
}

/**
 * Compute one eye's gaze offsets PLUS its quality signals (EAR, iris visibility)
 * in the HEAD-ALIGNED frame. `headH`/`headV` are the shared roll-compensated axes:
 * headH points image-right along the eye line, headV points image-down. Projecting
 * the iris displacement onto these axes cancels head roll; widths/heights use each
 * eye's own scale so differing eye sizes normalize out.
 */
function computeEyeFeatures(
  landmarks: GazeLandmark[],
  spec: EyeSpec,
  ring: readonly number[],
  headH: Vec2,
  headV: Vec2,
  cfg: EyeQualityConfig,
): EyeFeatures {
  const pts = pickEyePoints(landmarks, spec);
  if (!pts) return INVALID_EYE;

  const eyeWidth = len(sub(pts.outer, pts.inner));
  const eyeHeight = len(sub(pts.upper, pts.lower));
  if (eyeWidth < 1e-9 || eyeHeight < 1e-9) return INVALID_EYE;

  // Horizontal reference: midpoint of the corners. Vertical reference: midpoint
  // of the eyelids. Each is the natural "center" for its axis.
  const cornerCenter = mid(pts.outer, pts.inner);
  const lidCenter = mid(pts.upper, pts.lower);

  const horizontal = dot(sub(pts.iris, cornerCenter), headH) / eyeWidth;
  const vertical = dot(sub(pts.iris, lidCenter), headV) / eyeHeight;

  // Quality signals. EAR is scale-free (a ratio); it assumes near-square document
  // images (the estimator has no image dimensions) — thresholds absorb the rest.
  const ear = eyeHeight / eyeWidth;
  const radius = irisRadius(landmarks, pts.iris, ring, eyeWidth, cfg);
  const irisVisibility = computeIrisVisibility(pts.iris, pts.upper, pts.lower, headV, radius);

  return { horizontal, vertical, ear, irisVisibility, valid: true };
}

/** Linear ramp: `floorV` at x ≤ lo, `ceilV` at x ≥ hi, linear in between. */
function ramp(x: number, lo: number, hi: number, floorV: number, ceilV: number): number {
  if (hi <= lo) return ceilV;
  const t = clamp01((x - lo) / (hi - lo));
  return floorV + t * (ceilV - floorV);
}

/**
 * MULTI-FEATURE reliability confidence (0..1). This is NOT "how far from straight";
 * it is "how much can we trust this gaze reading". It multiplies independent
 * quality factors so any single problem (blink, wink, occluded iris, eyes
 * disagreeing, extreme yaw) lowers — but never zeroes — confidence. The compliance
 * engine turns a low value into a soft WARNING, never a hard fail.
 */
function computeConfidence(
  averageEAR: number,
  eyelidSymmetry: number,
  leftIrisVisibility: number,
  rightIrisVisibility: number,
  agreement: number,
  yawDeg: number | undefined,
  cfg: EyeQualityConfig,
): number {
  const earFactor = ramp(averageEAR, cfg.earLow, cfg.earFull, cfg.earFloor, 1);
  const symmetryFactor = Math.max(cfg.symmetryFloor, eyelidSymmetry);
  const visibilityFactor = Math.max(cfg.visibilityFloor, (leftIrisVisibility + rightIrisVisibility) / 2);
  const agreementFactor = Math.max(cfg.agreementFloor, agreement);
  const poseFactor = yawDeg == null ? 1 : ramp(Math.abs(yawDeg), cfg.yawFree, cfg.yawMax, 1, cfg.poseFloor);
  return clamp01(earFactor * symmetryFactor * visibilityFactor * agreementFactor * poseFactor);
}

/**
 * Build the head-aligned axes from the two eyes' corner centers.
 * headH runs image-left-eye → image-right-eye (so it tracks head roll); headV is
 * its downward perpendicular. Returns null if the eye centers are missing or
 * coincident (degenerate — cannot define an orientation).
 */
function buildHeadAxes(landmarks: GazeLandmark[]): { headH: Vec2; headV: Vec2 } | null {
  const l = pickEyePoints(landmarks, GAZE_LANDMARKS.leftEye);
  const r = pickEyePoints(landmarks, GAZE_LANDMARKS.rightEye);
  if (!l || !r) return null;

  const leftCenter = mid(l.outer, l.inner);
  const rightCenter = mid(r.outer, r.inner);
  const headH = normalize(sub(rightCenter, leftCenter)); // image-right, roll-aligned
  if (!headH) return null;

  return { headH, headV: perpendicular(headH) }; // headV → image-down
}

// ─────────────────────────────────────────────────────────────────────────────
// Classification
// ─────────────────────────────────────────────────────────────────────────────

/** Signed distance of `value` from the band center, in units of the band half-width. */
function bandScore(value: number, min: number, max: number): number {
  const center = (min + max) / 2;
  const half = (max - min) / 2 || 1e-9;
  return (value - center) / half; // |score| ≤ 1 ⇒ inside the straight band
}

interface Classification {
  direction: GazeDirection;
  confidence: number;
}

/**
 * Calibrate the raw averaged vertical offset:
 *   1. add centerOffset      → re-center a true straight gaze at 0 (bias removal),
 *   2. attenuate near-level UP-ONLY → if |pitch| ≤ pitchNeutralDeg the head is
 *      facing forward, a residual UPWARD (negative) offset is most likely camera
 *      placement (camera above eye level makes a straight gaze read slightly up),
 *      so shrink it toward 0 by pitchNeutralGain.
 *
 * CRITICAL: the attenuation is ASYMMETRIC — it applies ONLY to upward (negative)
 * residual. A DOWNWARD (positive) offset on a level head has no camera-placement
 * excuse; attenuating it was suppressing genuine "looking down" (the eyelids follow
 * the eye down, so the down signal is already weak) and letting eyes-down PASS.
 * This is the fix for false LOOKING_UP that does NOT weaken real LOOKING_DOWN.
 */
function calibrateVertical(rawAverageVertical: number, headPitchDeg: number | undefined, v: VerticalGazeConfig): number {
  let value = rawAverageVertical + v.centerOffset;
  if (headPitchDeg != null && Math.abs(headPitchDeg) <= v.pitchNeutralDeg && value < 0) {
    value *= v.pitchNeutralGain; // up-only: never shrink a downward gaze
  }
  return value;
}

/**
 * Decide the direction. HORIZONTAL path is unchanged (band-score, dominant-axis).
 * VERTICAL uses the calibrated value against an independent dead-zone plus a
 * confidence gate — borderline vertical prefers STRAIGHT because a false
 * "looking up/down" is far worse than a small false negative for passport photos.
 */
function classify(
  averageHorizontal: number,
  calibratedVertical: number,
  t: GazeThresholds,
  v: VerticalGazeConfig,
): Classification {
  const hScore = bandScore(averageHorizontal, t.horizontal.straightMin, t.horizontal.straightMax);
  // Vertical is scored against its OWN symmetric dead-zone (calibrated ≈ 0 = straight).
  const vScore = calibratedVertical / (v.deadZone || 1e-9);
  const hAbs = Math.abs(hScore);
  const vAbs = Math.abs(vScore);
  const sat = t.confidence.saturationMultiplier;

  // Inside both ⇒ straight. Confidence peaks (1) dead-center, fades to 0 at the edge.
  if (hAbs <= 1 && vAbs <= 1) {
    return { direction: 'LOOKING_STRAIGHT', confidence: round(clamp01(1 - Math.max(hAbs, vAbs))) };
  }

  // Horizontal wins when it is at least as far out of band as vertical — UNCHANGED.
  if (hAbs >= vAbs) {
    const confidence = round(clamp01((hAbs - 1) / Math.max(sat - 1, 1e-9)));
    return { direction: hScore > 0 ? 'LOOKING_RIGHT' : 'LOOKING_LEFT', confidence };
  }

  // Vertical dominant. Apply the confidence gate — but never suppress a genuine
  // horizontal miss (only prefer STRAIGHT when horizontal is comfortably in band).
  const vConfidence = clamp01((vAbs - 1) / Math.max(sat - 1, 1e-9));
  if (vConfidence < v.confidenceMin && hAbs <= 1) {
    return { direction: 'LOOKING_STRAIGHT', confidence: round(clamp01(1 - Math.min(1, vAbs))) };
  }
  return { direction: calibratedVertical > 0 ? 'LOOKING_DOWN' : 'LOOKING_UP', confidence: round(vConfidence) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Debug logging
// ─────────────────────────────────────────────────────────────────────────────

/** Extra context for the debug block (diagnostics not stored on the result). */
interface GazeLogContext {
  headPitchDeg?: number;
  calibratedVertical: number;
  vConfig: VerticalGazeConfig;
  directionBeforeCalibration: GazeDirection;
  directionAfterCalibration: GazeDirection;
  documentLabel?: string;
}

function logGaze(r: EyeGazeResult, ctx: GazeLogContext, logger: Pick<Console, 'log'>): void {
  const f = (n?: number) => (n == null ? '  n/a' : n.toFixed(4));
  const pitch = ctx.headPitchDeg == null ? 'n/a' : `${ctx.headPitchDeg.toFixed(1)}°`;
  logger.log(
    [
      '======== EYE GAZE DEBUG ========',
      `Document:               ${ctx.documentLabel ?? 'n/a'}`,
      `Horizontal Offset:      ${f(r.averageHorizontal)}`,
      `Vertical Offset:        ${f(r.averageVertical)}`,
      `Calibrated Vertical:    ${f(ctx.calibratedVertical)}`,
      `Head Pitch:             ${pitch}`,
      `Left EAR:               ${f(r.leftEAR)}`,
      `Right EAR:              ${f(r.rightEAR)}`,
      `Average EAR:            ${f(r.averageEAR)}`,
      `Left Iris Visibility:   ${f(r.leftIrisVisibility)}`,
      `Right Iris Visibility:  ${f(r.rightIrisVisibility)}`,
      `Eyelid Symmetry:        ${f(r.eyelidSymmetry)}`,
      `Confidence:             ${f(r.confidence)}`,
      `Direction Before Calib: ${ctx.directionBeforeCalibration}`,
      `Direction:              ${r.direction}`,
      '===============================',
    ].join('\n'),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

const UNKNOWN_RESULT: EyeGazeResult = {
  direction: 'UNKNOWN',
  confidence: 0,
  leftEyeHorizontal: 0,
  rightEyeHorizontal: 0,
  leftEyeVertical: 0,
  rightEyeVertical: 0,
  averageHorizontal: 0,
  averageVertical: 0,
  calibratedVertical: 0,
};

/** Minimal log context for degenerate (UNKNOWN/partial) results. */
function unknownLogContext(
  headPitchDeg: number | undefined,
  v: VerticalGazeConfig,
  documentLabel?: string,
): GazeLogContext {
  return {
    headPitchDeg,
    calibratedVertical: 0,
    vConfig: v,
    directionBeforeCalibration: 'UNKNOWN',
    directionAfterCalibration: 'UNKNOWN',
    documentLabel,
  };
}

/**
 * Estimate eye gaze from a full MediaPipe landmark array.
 *
 * Deterministic and side-effect-free (aside from opt-in logging). Returns
 * `UNKNOWN` (confidence 0) when the landmarks needed for BOTH eyes are missing
 * or degenerate — we deliberately never estimate from a single eye (see the
 * "Why averaging both eyes" note below).
 */
export function estimateEyeGaze(
  landmarks: GazeLandmark[] | null | undefined,
  options: EyeGazeOptions = {},
): EyeGazeResult {
  const t = mergeThresholds(options.thresholds);
  const v: VerticalGazeConfig = { ...VERTICAL_GAZE_CONFIG, ...options.vertical };
  const q: EyeQualityConfig = { ...EYE_QUALITY_CONFIG, ...options.quality };
  const debug = options.debug ?? DEBUG_EYE_GAZE;
  const logger = options.logger ?? console;
  const pitch = options.headPitchDeg;

  // Early exit — eye visibility already FAILED upstream. Do NOT estimate gaze from
  // invalid visual data (closed / covered / occluded eyes). Math untouched below.
  if (options.eyesVisible === false) {
    const result: EyeGazeResult = { ...UNKNOWN_RESULT, reason: 'EYES_NOT_VISIBLE' };
    if (debug) logGaze(result, unknownLogContext(pitch, v, options.documentLabel), logger);
    return result;
  }

  if (!landmarks || landmarks.length === 0) {
    if (debug) logGaze(UNKNOWN_RESULT, unknownLogContext(pitch, v, options.documentLabel), logger);
    return UNKNOWN_RESULT;
  }

  const axes = buildHeadAxes(landmarks);
  if (!axes) {
    if (debug) logGaze(UNKNOWN_RESULT, unknownLogContext(pitch, v, options.documentLabel), logger);
    return UNKNOWN_RESULT;
  }

  const left = computeEyeFeatures(landmarks, GAZE_LANDMARKS.leftEye, IRIS_RING.leftEye, axes.headH, axes.headV, q);
  const right = computeEyeFeatures(landmarks, GAZE_LANDMARKS.rightEye, IRIS_RING.rightEye, axes.headH, axes.headV, q);

  // Hard requirement: never rely on a single eye. Both must be valid to classify.
  if (!left.valid || !right.valid) {
    const partial: EyeGazeResult = {
      ...UNKNOWN_RESULT,
      leftEyeHorizontal: round(left.horizontal),
      rightEyeHorizontal: round(right.horizontal),
      leftEyeVertical: round(left.vertical),
      rightEyeVertical: round(right.vertical),
    };
    if (debug) logGaze(partial, unknownLogContext(pitch, v, options.documentLabel), logger);
    return partial;
  }

  const averageHorizontal = (left.horizontal + right.horizontal) / 2;
  const averageVertical = (left.vertical + right.vertical) / 2; // RAW mean (unchanged)

  // Vertical calibration: remove the systematic upward bias + compensate camera pitch.
  const calibratedVertical = calibrateVertical(averageVertical, pitch, v);
  const { direction } = classify(averageHorizontal, calibratedVertical, t, v);

  // ── Multi-feature quality signals + reliability confidence ──
  const leftEAR = left.ear;
  const rightEAR = right.ear;
  const averageEAR = (leftEAR + rightEAR) / 2;
  // Eyelid symmetry = min/max EAR (1 = equally open; low ⇒ wink / one eye closed).
  const eyelidSymmetry = clamp01(Math.min(leftEAR, rightEAR) / Math.max(Math.max(leftEAR, rightEAR), 1e-9));
  // Left/right eye AGREEMENT — the two eyes should report the same gaze; disagreement ⇒ noise.
  const agreement =
    1 - clamp01((Math.abs(left.horizontal - right.horizontal) + Math.abs(left.vertical - right.vertical)) / q.agreementScale);
  const confidence = computeConfidence(
    averageEAR,
    eyelidSymmetry,
    left.irisVisibility,
    right.irisVisibility,
    agreement,
    options.headYawDeg,
    q,
  );

  const result: EyeGazeResult = {
    direction,
    confidence: round(confidence),
    leftEyeHorizontal: round(left.horizontal),
    rightEyeHorizontal: round(right.horizontal),
    leftEyeVertical: round(left.vertical),
    rightEyeVertical: round(right.vertical),
    averageHorizontal: round(averageHorizontal),
    averageVertical: round(averageVertical),
    calibratedVertical: round(calibratedVertical),
    leftEAR: round(leftEAR),
    rightEAR: round(rightEAR),
    averageEAR: round(averageEAR),
    eyelidSymmetry: round(eyelidSymmetry),
    leftIrisVisibility: round(left.irisVisibility),
    rightIrisVisibility: round(right.irisVisibility),
  };

  if (debug) {
    // "Before" = what the raw (uncalibrated) vertical would have decided — the value
    // that produced the false LOOKING_UP; "After" = the calibrated verdict.
    const before = classify(averageHorizontal, averageVertical, t, v).direction;
    logGaze(result, {
      headPitchDeg: pitch,
      calibratedVertical: round(calibratedVertical),
      vConfig: v,
      directionBeforeCalibration: before,
      directionAfterCalibration: direction,
      documentLabel: options.documentLabel,
    }, logger);
  }
  return result;
}

/** Deep-merge caller thresholds over the defaults (single source of truth stays GAZE_THRESHOLDS). */
function mergeThresholds(override?: GazeThresholds): GazeThresholds {
  if (!override) return GAZE_THRESHOLDS;
  return {
    horizontal: { ...GAZE_THRESHOLDS.horizontal, ...override.horizontal },
    vertical: { ...GAZE_THRESHOLDS.vertical, ...override.vertical },
    confidence: { ...GAZE_THRESHOLDS.confidence, ...override.confidence },
  };
}

/** True only for a confident, camera-facing gaze. Convenience for the compliance engine. */
export function isLookingStraight(result: EyeGazeResult): boolean {
  return result.direction === 'LOOKING_STRAIGHT';
}

/* ═══════════════════════════════════════════════════════════════════════════
 * DOCUMENTATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 1) MATHEMATICAL EXPLANATION OF THE IRIS-OFFSET ALGORITHM
 * --------------------------------------------------------
 * For each eye we treat the palpebral fissure (eye opening) as a small local
 * coordinate box:
 *   • eyeWidth  = ‖outerCorner − innerCorner‖               (33↔133 / 263↔362)
 *   • eyeHeight = ‖upperLid   − lowerLid‖                   (159↔145 / 386↔374)
 *   • cornerCenter = midpoint(outerCorner, innerCorner)     → horizontal origin
 *   • lidCenter    = midpoint(upperLid,   lowerLid)         → vertical origin
 *
 * We do NOT read the iris's raw (x, y). Instead we build a HEAD-ALIGNED basis:
 *   headH = unit(rightEyeCornerCenter − leftEyeCornerCenter)  // along the eye line
 *   headV = perpendicular(headH)                              // downward
 * and project the iris displacement onto it:
 *   horizontalOffset = ((iris − cornerCenter) · headH) / eyeWidth
 *   verticalOffset   = ((iris − lidCenter)    · headV) / eyeHeight
 *
 * Because headH/headV rotate WITH the face (they come from the eye line), the
 * projection is invariant to head roll: a tilted-but-forward-looking head yields
 * offsets ≈ 0. Dividing by eyeWidth/eyeHeight makes the result scale-invariant
 * (works the same for a large close-up face and a small distant one) and
 * dimensionless. A centered iris ⇒ offset ≈ 0; the iris can travel up to ≈ ±0.5
 * of eye width/height before touching a corner/lid.
 *
 * Sign convention (viewer/image frame): +horizontal = iris toward image-right
 * (LOOKING_RIGHT); +vertical = iris toward image-bottom (LOOKING_DOWN).
 *
 * 1b) VERTICAL CALIBRATION — why it exists and how it works
 * ---------------------------------------------------------
 * A straight-ahead gaze does NOT place the iris at the lid midpoint: the upper
 * eyelid drapes over the top of the iris and cameras usually sit above eye level,
 * so the RAW verticalOffset reads slightly negative ("up") even when the subject
 * looks dead-on. Uncorrected, this misfires as LOOKING_UP. We correct it with
 * three composable, configurable steps (VERTICAL_GAZE_CONFIG) — NOT by widening
 * the threshold:
 *   1. Bias removal:  calibrated = rawAverageVertical + centerOffset
 *      (centerOffset re-centers a true straight gaze at 0).
 *   2. Perspective compensation: if |headPitch| ≤ pitchNeutralDeg the head is
 *      facing forward, so any residual vertical offset is most likely camera
 *      placement, not gaze → shrink it by pitchNeutralGain.
 *   3. Confidence gate + dead-zone: a small |calibrated| stays STRAIGHT, and a
 *      low-confidence vertical prefers STRAIGHT (a false LOOKING_UP is far worse
 *      than a small false negative for passports).
 * The raw values are still reported (averageVertical, leftEyeVertical,
 * rightEyeVertical) for debugging; `calibratedVertical` is what the compliance
 * engine should judge. Horizontal is completely untouched by all of this.
 *
 * 2) WHY AVERAGING BOTH EYES IMPROVES STABILITY
 * ---------------------------------------------
 * Single-eye estimates are noisy: MediaPipe iris/lid landmarks jitter frame to
 * frame, one eye may be partially shadowed, squinting, or slightly occluded, and
 * micro-strabismus means the two eyes are rarely perfectly identical. Because
 * both eyes physically rotate together (conjugate gaze), their true horizontal
 * offsets share the SAME sign in the head-aligned frame, so averaging:
 *   • cancels zero-mean landmark noise (≈ 1/√2 standard-deviation reduction),
 *   • dampens per-eye asymmetries and transient occlusions,
 *   • prevents a single mis-detected eye from flipping the verdict.
 * This is why the estimator refuses to classify from only one valid eye
 * (returns UNKNOWN): a lone eye is exactly the unreliable signal we're avoiding.
 *
 * 3) THRESHOLD TUNING GUIDE
 * -------------------------
 * All tuning lives in GAZE_THRESHOLDS (or a per-call `thresholds` override).
 *   • horizontal.straightMin/Max — the acceptable left/right dead-band as a
 *     fraction of EYE WIDTH. Widen (e.g. ±0.08) to be more permissive of slight
 *     glances; narrow (±0.04) for stricter passport enforcement. Keep it
 *     symmetric unless you have a camera-parallax bias to correct.
 *   • vertical.straightMin/Max — same, as a fraction of EYE HEIGHT. Vertical is
 *     inherently noisier (eye height is small; lids move when blinking), so this
 *     band is wider by default. Tune UP if blinks/partial lids cause false
 *     "looking up/down".
 *   • confidence.saturationMultiplier — only shapes the reported confidence, not
 *     the direction. Larger ⇒ confidence rises more slowly with deviation.
 * Calibration procedure: collect ~30 known-good "looking straight" photos and
 * ~30 known-bad glances, log averageHorizontal/averageVertical (set debug:true),
 * then set each band just outside the spread of the good set. Re-run the unit
 * tests after any change.
 *
 * 4) LIMITATIONS OF MEDIAPIPE GAZE ESTIMATION
 * -------------------------------------------
 *   • It infers gaze from 2-D iris-in-socket geometry, not true 3-D eyeball
 *     orientation. Large head YAW couples with apparent iris offset (the socket
 *     foreshortens), so extreme off-axis heads reduce accuracy — the compliance
 *     engine's separate yaw/pitch checks should catch those first.
 *   • Iris landmarks require refine_landmarks/the 478-point model. Without them
 *     (or under heavy occlusion — glasses glare, hair, half-closed lids) the
 *     estimator returns UNKNOWN rather than guessing.
 *   • Squinting or a blink shrinks eyeHeight and destabilizes the vertical
 *     ratio; treat low-confidence vertical results cautiously.
 *   • It cannot distinguish gaze from a lazy/misaligned eye (strabismus); the
 *     both-eyes average partially masks it but cannot correct a true condition.
 *   • Sub-pixel landmark jitter sets a noise floor; very tight bands will
 *     flicker. The dead-band + confidence shaping mitigate but don't eliminate it.
 *
 * 5) FUTURE IMPROVEMENTS (dedicated gaze model)
 * ---------------------------------------------
 * If we later add a real gaze network (e.g. an appearance-based model such as
 * L2CS-Net / MPIIGaze-style, exported to ONNX and run via the existing
 * onnxruntime-web — no new paid service), it can be dropped in behind THIS
 * SAME interface: keep `EyeGazeResult`/`GazeDirection`, add a `source` field,
 * and have `estimateEyeGaze` prefer the model and fall back to this geometric
 * estimator when the model is unavailable — mirroring the GlassesDetector
 * model→heuristic pattern. Such a model would output true pitch/yaw gaze angles
 * (degrees), be robust to head pose and partial occlusion, and let thresholds be
 * expressed in intuitive degrees. Until then, this deterministic estimator is
 * the dependency-free, offline, explainable baseline.
 * ═══════════════════════════════════════════════════════════════════════════ */
