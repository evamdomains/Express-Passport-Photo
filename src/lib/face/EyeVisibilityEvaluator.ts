/**
 * EyeVisibilityEvaluator — a RELIABILITY GATE, not a classifier.
 *
 * It answers exactly one question:
 *     "Is there enough reliable eye information to ALLOW gaze estimation?"
 *
 * It does NOT decide passport compliance and it does NOT try to be strict. Gaze is
 * blocked ONLY when it is genuinely impossible (both eyes closed, both eyes
 * covered, both eyes out of frame, or no eye landmarks). Everything else PASSES —
 * a false PASS here is preferable to a false FAIL, because the
 * PassportComplianceEngine makes the final decision.
 *
 * Design consequences (deliberate):
 *   • We NEVER fail for imperfect iris detection, different eye shapes, hooded /
 *     deep-set / naturally narrow eyes, ethnicity, camera angle, lighting, eyelid
 *     thickness, or minor landmark instability.
 *   • We do NOT use per-landmark "confidence" — MediaPipe does not provide a
 *     reliable value, so inventing a threshold only causes false rejections.
 *   • One eye closed / one iris missing is NOT a gate failure — the compliance
 *     engine's own eye-openness rule remains the authority on that.
 *
 * Strict separation of concerns:
 *   • EyeVisibilityEvaluator (this) — CAN we estimate gaze?  (gate)
 *   • EyeGazeEstimator             — WHERE are they looking?
 *   • PassportComplianceEngine     — is the photo COMPLIANT?
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** A MediaPipe landmark (geometry only — no confidence fields are consulted). */
export interface VisibilityLandmark {
  x: number;
  y: number;
  z?: number;
}

/**
 * Four-state gate result:
 *   • VISIBLE     — enough information for gaze estimation. Run Eye Gaze.
 *   • PARTIAL     — minor imperfection (e.g. one iris not fully detected). Run Eye Gaze.
 *   • UNKNOWN     — cannot confidently decide. Run Eye Gaze anyway (do NOT reject).
 *   • NOT_VISIBLE — eyes genuinely unavailable. Do NOT run Eye Gaze. Reject.
 * Only NOT_VISIBLE blocks.
 */
export type EyeVisibilityStatus = 'VISIBLE' | 'PARTIAL' | 'UNKNOWN' | 'NOT_VISIBLE';

/** Explicit reason codes — never generic strings. */
export type EyeVisibilityReason =
  | 'OK'
  | 'LOW_GEOMETRIC_CONFIDENCE'
  | 'LEFT_IRIS_PARTIAL'
  | 'RIGHT_IRIS_PARTIAL'
  | 'LEFT_EYE_CLOSED'
  | 'RIGHT_EYE_CLOSED'
  | 'BOTH_EYES_CLOSED'
  | 'EYES_COVERED'
  | 'EYES_OUT_OF_FRAME'
  | 'NO_EYE_LANDMARKS';

export interface EyeVisibilityResult {
  status: EyeVisibilityStatus;
  reason: EyeVisibilityReason;
  /** Convenience: gaze runs unless the status is NOT_VISIBLE. */
  runEyeGaze: boolean;
  leftEyeLandmarks: boolean;
  rightEyeLandmarks: boolean;
  leftEyeOpen: boolean;
  rightEyeOpen: boolean;
  occluded: boolean;
  // ── Optional diagnostics (safe to ignore) ──
  leftEAR?: number;
  rightEAR?: number;
  leftIrisDetected?: boolean;
  rightIrisDetected?: boolean;
}

export interface EyeVisibilityOptions {
  config?: Partial<EyeVisibilityConfig>;
  debug?: boolean;
  logger?: Pick<Console, 'log'>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Landmark indices (own copy — independent of the gaze estimator)
// ─────────────────────────────────────────────────────────────────────────────

const EYES = {
  left: { iris: 468, ring: [469, 470, 471, 472], outer: 33, inner: 133, upper: 159, lower: 145 },
  right: { iris: 473, ring: [474, 475, 476, 477], outer: 263, inner: 362, upper: 386, lower: 374 },
} as const;

interface EyeSpec {
  iris: number;
  ring: readonly number[];
  outer: number;
  inner: number;
  upper: number;
  lower: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration — intentionally PERMISSIVE
// ─────────────────────────────────────────────────────────────────────────────

export interface EyeVisibilityConfig {
  /** Eye width (normalized) below this ⇒ the eye region has collapsed (covered). */
  minEyeWidth: number;
  /**
   * Eye aspect ratio (height ÷ width) below which an eye is CLEARLY closed. Set
   * conservatively LOW so naturally narrow / hooded / small eyes (EAR ≈ 0.12–0.25)
   * are never mistaken for closed — only genuine near-shut lids (EAR ≈ 0.0–0.05).
   * Both eyes must be below this before we block.
   */
  clearlyClosedEAR: number;
  /** Iris ring radius ÷ eye width for a "fully detected" iris — else PARTIAL, never a fail. */
  minIrisRadiusRatio: number;
  /** Eye centre must sit within [−margin, 1+margin]; both outside ⇒ out of frame. */
  frameMargin: number;
}

export const EYE_VISIBILITY_CONFIG: EyeVisibilityConfig = {
  minEyeWidth: 0.005,
  clearlyClosedEAR: 0.08,
  minIrisRadiusRatio: 0.03,
  frameMargin: 0.15,
};

/** Module-level debug flag. Off in production to avoid console spam. */
export const DEBUG_EYE_VISIBILITY = false;

// ─────────────────────────────────────────────────────────────────────────────
// Geometry helpers
// ─────────────────────────────────────────────────────────────────────────────

const finite = (p?: VisibilityLandmark): p is VisibilityLandmark =>
  !!p && Number.isFinite(p.x) && Number.isFinite(p.y);
const dist = (a: VisibilityLandmark, b: VisibilityLandmark) => Math.hypot(a.x - b.x, a.y - b.y);
const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d;

interface EyeState {
  present: boolean; // core corner/lid landmarks exist
  inFrame: boolean; // eye centre inside the (padded) frame
  usable: boolean; // present + non-degenerate + in frame → gaze can use this eye
  ear: number;
  open: boolean; // NOT clearly closed
  irisDetected: boolean;
}

function evaluateEye(lm: VisibilityLandmark[], e: EyeSpec, cfg: EyeVisibilityConfig): EyeState {
  const outer = lm[e.outer];
  const inner = lm[e.inner];
  const upper = lm[e.upper];
  const lower = lm[e.lower];
  const present = [outer, inner, upper, lower].every(finite);
  if (!present) {
    return { present: false, inFrame: false, usable: false, ear: 0, open: false, irisDetected: false };
  }

  const eyeWidth = dist(outer, inner);
  const eyeHeight = dist(upper, lower);
  const cx = (outer.x + inner.x) / 2;
  const cy = (outer.y + inner.y) / 2;
  const m = cfg.frameMargin;
  const inFrame = cx >= -m && cx <= 1 + m && cy >= -m && cy <= 1 + m;
  const nonDegenerate = eyeWidth >= cfg.minEyeWidth;
  const usable = nonDegenerate && inFrame;

  const ear = nonDegenerate ? eyeHeight / eyeWidth : 0;
  const open = ear >= cfg.clearlyClosedEAR;

  // Iris detection is ONLY used to distinguish VISIBLE from PARTIAL — never to fail.
  let irisDetected = false;
  const iris = lm[e.iris];
  if (nonDegenerate && finite(iris)) {
    const rs: number[] = [];
    for (const i of e.ring) {
      const p = lm[i];
      if (finite(p)) rs.push(dist(p, iris));
    }
    const radius = rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : 0;
    irisDetected = rs.length > 0 && radius / eyeWidth >= cfg.minIrisRadiusRatio;
  }

  return { present, inFrame, usable, ear, open, irisDetected };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gate the eyes for gaze estimation. Returns NOT_VISIBLE (block) ONLY when gaze is
 * genuinely impossible; otherwise VISIBLE / PARTIAL / UNKNOWN (all run gaze).
 */
export function evaluateEyeVisibility(
  landmarks: VisibilityLandmark[] | null | undefined,
  options: EyeVisibilityOptions = {},
): EyeVisibilityResult {
  const cfg: EyeVisibilityConfig = { ...EYE_VISIBILITY_CONFIG, ...options.config };
  const debug = options.debug ?? DEBUG_EYE_VISIBILITY;
  const logger = options.logger ?? console;

  const build = (
    status: EyeVisibilityStatus,
    reason: EyeVisibilityReason,
    L: EyeState,
    R: EyeState,
    occluded: boolean,
  ): EyeVisibilityResult => {
    const result: EyeVisibilityResult = {
      status,
      reason,
      runEyeGaze: status !== 'NOT_VISIBLE',
      leftEyeLandmarks: L.present,
      rightEyeLandmarks: R.present,
      leftEyeOpen: L.open,
      rightEyeOpen: R.open,
      occluded,
      leftEAR: round(L.ear),
      rightEAR: round(R.ear),
      leftIrisDetected: L.irisDetected,
      rightIrisDetected: R.irisDetected,
    };
    if (debug) logVisibility(result, logger);
    return result;
  };

  const NONE: EyeState = { present: false, inFrame: false, usable: false, ear: 0, open: false, irisDetected: false };

  if (!landmarks || landmarks.length === 0) {
    return build('NOT_VISIBLE', 'NO_EYE_LANDMARKS', NONE, NONE, false);
  }

  const L = evaluateEye(landmarks, EYES.left, cfg);
  const R = evaluateEye(landmarks, EYES.right, cfg);

  // ── NOT_VISIBLE — both eyes genuinely unusable ──
  if (!L.usable && !R.usable) {
    if (!L.present && !R.present) return build('NOT_VISIBLE', 'NO_EYE_LANDMARKS', L, R, false);
    if (L.present && R.present && !L.inFrame && !R.inFrame) {
      return build('NOT_VISIBLE', 'EYES_OUT_OF_FRAME', L, R, false);
    }
    // Present but geometry collapsed on both eyes ⇒ covered (blindfold / hair / hand).
    return build('NOT_VISIBLE', 'EYES_COVERED', L, R, true);
  }

  // ── NOT_VISIBLE — a CLOSED eye (per-eye EAR). Passport standard: BOTH eyes open.
  //    Threshold is conservative (clearlyClosedEAR) so naturally narrow / hooded /
  //    small eyes (EAR ≈ 0.12+) are never mistaken for closed — only genuine
  //    near-shut lids. Either eye closed fails (not just both). ──
  if (L.usable && R.usable) {
    if (!L.open && !R.open) return build('NOT_VISIBLE', 'BOTH_EYES_CLOSED', L, R, false);
    if (!L.open) return build('NOT_VISIBLE', 'LEFT_EYE_CLOSED', L, R, false);
    if (!R.open) return build('NOT_VISIBLE', 'RIGHT_EYE_CLOSED', L, R, false);
  }

  // ── Everything else runs gaze: VISIBLE / PARTIAL / UNKNOWN ──
  if (!L.usable || !R.usable) return build('UNKNOWN', 'LOW_GEOMETRIC_CONFIDENCE', L, R, false);
  if (L.irisDetected && R.irisDetected) return build('VISIBLE', 'OK', L, R, false);
  if (!L.irisDetected && !R.irisDetected) return build('UNKNOWN', 'LOW_GEOMETRIC_CONFIDENCE', L, R, false);
  if (!L.irisDetected) return build('PARTIAL', 'LEFT_IRIS_PARTIAL', L, R, false);
  return build('PARTIAL', 'RIGHT_IRIS_PARTIAL', L, R, false);
}

/** True unless the eyes are genuinely unavailable (the only reason to skip gaze). */
export function shouldRunEyeGaze(result: EyeVisibilityResult | undefined): boolean {
  return !result || result.status !== 'NOT_VISIBLE';
}

/** True only when the gate genuinely blocks (NOT_VISIBLE). */
export function isEyeVisibilityBlocking(result: EyeVisibilityResult | undefined): boolean {
  return !!result && result.status === 'NOT_VISIBLE';
}

function logVisibility(r: EyeVisibilityResult, logger: Pick<Console, 'log'>): void {
  const b = (v: boolean) => (v ? 'YES' : 'NO');
  logger.log(
    [
      '==============================',
      'EYE VISIBILITY',
      `Left Eye Landmarks   ${b(r.leftEyeLandmarks)}`,
      `Right Eye Landmarks  ${b(r.rightEyeLandmarks)}`,
      `Left Eye Open        ${b(r.leftEyeOpen)}`,
      `Right Eye Open       ${b(r.rightEyeOpen)}`,
      `Occluded             ${b(r.occluded)}`,
      `Status               ${r.status}`,
      `Reason               ${r.reason}`,
      `Run Eye Gaze         ${b(r.runEyeGaze)}`,
      '==============================',
    ].join('\n'),
  );
}
