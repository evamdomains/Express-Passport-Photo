import type {
  BiometricData,
  BiometricConfig,
  CropRect,
  ComplianceReport,
  AxisResult,
  AxisStatus,
} from '@/types/biometric';
import type { DocumentSpec } from '@/types/document';
import type { ComplianceResult } from '@/types/order';
import type { EyeGazeResult } from './EyeGazeEstimator';
import type { EyeVisibilityResult } from './EyeVisibilityEvaluator';
import type { EyeOcclusionResult } from './EyeOcclusionEvaluator';
import type { EyePixelVisibilityResult } from './EyePixelVisibilityEvaluator';
import { getBiometricConfig, targetFaceRatio, targetEyeLineFromTop } from './biometric-config';
import { evaluateEyeGaze } from './gaze-rules';

/**
 * PassportComplianceEngine — pure, isomorphic (no DOM / MediaPipe imports).
 * Runs in the browser to drive the crop + report, and can be reused on the
 * server. Two responsibilities:
 *   • computeCrop()  — the automatic FACE-scaling math (the headline feature)
 *   • evaluate()     — per-axis PASS/WARNING/FAIL compliance report
 */

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

/**
 * Compute the normalized crop rectangle that scales the FACE to EXACTLY the
 * document target ratio and seats the eye line at the target height.
 *
 * The crop always produces the target ratio: `cropHeight = faceHeight / target`.
 * When the resulting rectangle extends past the source (e.g. a tall crop of a
 * square/portrait aspect on a narrow PORTRAIT photo), the compositor pads those
 * areas with the white passport background — the HEAD stays the legally-required
 * size, which is what matters. We deliberately do NOT zoom-to-fill, because that
 * would oversize the head above the document's max ratio (the Canadian-65% bug).
 * Result values may fall outside [0,1]; the server pads with white.
 */
export function computeCrop(
  bio: BiometricData,
  spec: DocumentSpec,
  cfg: BiometricConfig = getBiometricConfig(spec),
): CropRect {
  const target = targetFaceRatio(cfg);
  const aspect = spec.widthPx / spec.heightPx;

  // Crop height (normalized to source height) so the face fills `target` of it.
  const cropHeightNorm = bio.faceHeightNorm / target;
  const cropHeightPx = cropHeightNorm * bio.imageHeight;
  const cropWidthPx = cropHeightPx * aspect;
  const cropWidthNorm = cropWidthPx / bio.imageWidth;

  // Seat the eye line; centre horizontally on the face.
  const eyeTarget = targetEyeLineFromTop(cfg);
  const top = bio.eyeCenterYNorm - eyeTarget * cropHeightNorm;
  const left = bio.faceCenterXNorm - cropWidthNorm / 2;

  return {
    left: round(left, 5),
    top: round(top, 5),
    width: round(cropWidthNorm, 5),
    height: round(cropHeightNorm, 5),
    upscale: round(spec.heightPx / cropHeightPx, 3),
  };
}

function poseAxis(angle: number, tol: number, warnTol: number, msgs: { ok: string; nudge: string }): AxisResult {
  const a = Math.abs(angle);
  if (a <= warnTol) return { status: 'PASS', value: round(angle, 1), message: msgs.ok };
  if (a <= tol) return { status: 'WARNING', value: round(angle, 1), message: msgs.nudge };
  return { status: 'FAIL', value: round(angle, 1), message: msgs.nudge };
}

/** Toggle for the combined-attention debug block. Off in production to avoid console spam. */
export const DEBUG_VISUAL_ATTENTION = false;

/**
 * Eye-roll magnitude (calibratedVertical, in position units) that counts as the
 * eyes actively COMPENSATING for a tilted head — i.e. rolling toward the lens.
 * When the head is pitched down, the gaze only reaches the camera if the eyes roll
 * up by at least this much; otherwise the gaze follows the head (looking down) and
 * we FAIL. A straight gaze calibrates to ≈0 and does not count as compensation.
 */
export const EYE_GAZE_CORROBORATION = 0.04;

/**
 * Head-PITCH axis with DIRECTION-CORRECT guidance.
 *
 * Sign convention (matches the whole pipeline): +pitch = head/chin DOWN,
 * −pitch = head/chin UP (and +vertical gaze = eyes DOWN — the two agree). The
 * previous code told a chin-down user to "lower your chin", which was backwards.
 * Down ⇒ raise; Up ⇒ lower. WARNING and FAIL get distinct, escalating copy.
 */
function pitchAxis(pitch: number, cfg: BiometricConfig): AxisResult {
  const warnTol = cfg.pitchTol * cfg.poseWarnMultiplier;
  const a = Math.abs(pitch);
  const value = round(pitch, 1);
  if (a <= warnTol) return { status: 'PASS', value, message: 'Head level.', code: 'HEAD_LEVEL' };

  const down = pitch > 0; // +pitch = chin DOWN
  if (a <= cfg.pitchTol) {
    return down
      ? { status: 'WARNING', value, message: 'Raise your chin slightly.', code: 'HEAD_PITCH_DOWN' }
      : { status: 'WARNING', value, message: 'Lower your chin slightly.', code: 'HEAD_PITCH_UP' };
  }
  return down
    ? { status: 'FAIL', value, message: 'Raise your head and look directly at the camera.', code: 'HEAD_PITCH_DOWN' }
    : { status: 'FAIL', value, message: 'Lower your chin and look directly at the camera.', code: 'HEAD_PITCH_UP' };
}

/**
 * COMBINED visual-attention consistency check (Task 2).
 *
 * Reconciles head PITCH and eye GAZE using a WORLD-FRAME model. The eye offset is
 * measured relative to the head, so a pitched head with eyes centred in their
 * sockets means the gaze follows the head (looking down/up) — the gaze only
 * returns to the lens if the eyes roll the opposite way. Hence a head pitched
 * beyond level FAILs unless the eyes clearly compensate; a level head is judged by
 * the eyes' own direction. This is why a "looking down" photo now fails even
 * though the irises appear centred. The engine folds a vertical FAIL into BOTH
 * eyeAlignment (it is the gaze) and headPosition; horizontal (eyes to the side)
 * stays owned by eyeAlignment. It never contradicts or emits opposite instructions.
 */
export function evaluateVisualAttention(
  gaze: { direction: string; calibratedVertical?: number } | undefined,
  pitchDeg: number,
  cfg: BiometricConfig,
): AxisResult {
  const warnTol = cfg.pitchTol * cfg.poseWarnMultiplier;
  const pitchAbs = Math.abs(pitchDeg);

  // Head vertical state from pitch (+ = down).
  let headDir: 'LEVEL' | 'DOWN' | 'UP' = 'LEVEL';
  let headStrong = false;
  if (pitchAbs > warnTol) {
    headDir = pitchDeg > 0 ? 'DOWN' : 'UP';
    headStrong = pitchAbs > cfg.pitchTol;
  }

  // Eye state. The estimator measures gaze RELATIVE TO THE HEAD, so "eyes rolled
  // up in the socket" (calibratedVertical sufficiently negative) is what it looks
  // like when someone with a down-tilted head looks back at the lens — that is the
  // only reliable "compensation" signal. `eyeDown`/`eyeUp` are the estimator's own
  // classified directions (used when the head is level).
  const dir = gaze?.direction;
  const cv = gaze?.calibratedVertical ?? 0;
  const eyeDown = dir === 'LOOKING_DOWN';
  const eyeUp = dir === 'LOOKING_UP';
  const eyeSide = dir === 'LOOKING_LEFT' || dir === 'LOOKING_RIGHT';
  const eyesCompensateUp = eyeUp || cv < -EYE_GAZE_CORROBORATION; // rolled up toward the lens
  const eyesCompensateDown = eyeDown || cv > EYE_GAZE_CORROBORATION; // rolled down toward the lens

  // Combined vertical direction — head is the gross indicator; otherwise the eyes.
  let vDir: 'NONE' | 'DOWN' | 'UP' = 'NONE';
  if (headDir !== 'LEVEL') vDir = headDir;
  else if (eyeDown) vDir = 'DOWN';
  else if (eyeUp) vDir = 'UP';

  // WORLD-FRAME GAZE MODEL. Because the eye offset is head-relative, a head pitched
  // beyond level means the gaze FOLLOWS the head (looking down/up) UNLESS the eyes
  // roll the opposite way to meet the lens. So:
  //   • head pitched down  → FAIL unless the eyes clearly roll UP (else WARNING only
  //     when they partially compensate);
  //   • head pitched up    → FAIL unless the eyes clearly roll DOWN;
  //   • strong head pitch  → FAIL regardless;
  //   • level head         → judged by the eyes' own classified direction.
  // This is what makes a "looking down" photo fail even though the irises look
  // centred in their (downward-pointing) sockets.
  let vStatus: AxisStatus = 'PASS';
  if (headDir === 'DOWN') {
    vStatus = headStrong || !eyesCompensateUp ? 'FAIL' : 'WARNING';
  } else if (headDir === 'UP') {
    vStatus = headStrong || !eyesCompensateDown ? 'FAIL' : 'WARNING';
  } else if (eyeDown || eyeUp) {
    vStatus = 'FAIL';
  }

  let status: AxisStatus = 'PASS';
  let code = 'ATTENTION_OK';
  let message = 'Looking directly at the camera with a level head.';

  if (vStatus !== 'PASS') {
    status = vStatus;
    if (vDir === 'DOWN') {
      code = 'ATTENTION_HEAD_DOWN';
      message = vStatus === 'FAIL' ? 'Raise your head and look directly at the camera.' : 'Raise your chin slightly.';
    } else {
      code = 'ATTENTION_HEAD_UP';
      message = vStatus === 'FAIL' ? 'Lower your chin and look directly at the camera.' : 'Lower your chin slightly.';
    }
  }

  // Eyes to the side: only takes over when there is no (stronger) vertical FAIL —
  // a vertical FAIL message already tells the user to look directly at the camera.
  if (eyeSide && status !== 'FAIL') {
    status = 'FAIL';
    code = 'ATTENTION_EYES_SIDE';
    message = 'Look directly at the camera.';
  }

  // Infants (relaxedEyes) never hard-FAIL on attention — downgrade to a nudge.
  if (cfg.relaxedEyes && status === 'FAIL') status = 'WARNING';

  return { status, code, message, value: round(pitchDeg, 1) };
}

const pct = (n: number) => `${Math.round(n * 100)}%`;
const countryLabel = (c: DocumentSpec['country']) => (c === 'Canada' ? 'CANADA' : 'US');

/**
 * Build the per-axis compliance report.
 * `achievedRatio` is the *actual* chin→crown ratio of the produced photo; the
 * server passes this (measured from the true crown). When omitted the target is
 * assumed (the auto-scaler aims exactly at it).
 */
export function evaluate(
  bio: BiometricData,
  spec: DocumentSpec,
  cfg: BiometricConfig = getBiometricConfig(spec),
  achievedRatio?: number,
  gaze: EyeGazeResult | undefined = bio.gaze,
  visibility: EyeVisibilityResult | undefined = bio.eyeVisibility,
  occlusion: EyeOcclusionResult | undefined = bio.eyeOcclusion,
  pixelVisibility: EyePixelVisibilityResult | undefined = bio.eyePixelVisibility,
): ComplianceReport {
  const warnings: string[] = [];
  const target = targetFaceRatio(cfg);
  const optimalRange = `${pct(cfg.optimalMin)}-${pct(cfg.optimalMax)}`;
  const country = countryLabel(spec.country);

  if (!bio.faceDetected) {
    const fail: AxisResult = { status: 'FAIL', message: 'No face detected.' };
    return {
      faceDetected: false,
      faceCount: 0,
      faceRatio: fail,
      eyeAlignment: fail,
      mouth: fail,
      headPosition: fail,
      overall: 'NON_COMPLIANT',
      warnings,
      source: 'mediapipe',
      country,
      faceRatioValue: 0,
      targetRatio: target,
      difference: 0,
      optimalRange,
    };
  }

  // ── Face ratio — validated against the FINAL generated image ──
  // `achieved` is the post-scale ratio of the GENERATED photo (the server passes
  // the measured value; without it the scaler's exact target is assumed). The
  // raw uploaded ratio is NEVER judged here — that recoverable check lives in the
  // pre-scale gate. But the FINAL ratio MUST obey the document spec: outside the
  // official range → hard FAIL, so a generated image can never be marked
  // COMPLIANT while violating the document sizing (e.g. a 65% Canadian face).
  const achieved = achievedRatio ?? target;
  const inOptimal = achieved >= cfg.optimalMin && achieved <= cfg.optimalMax;
  const inOfficial = achieved >= cfg.faceRatioMin && achieved <= cfg.faceRatioMax;
  const faceRatio: AxisResult = {
    status: inOfficial ? 'PASS' : 'FAIL',
    value: round(achieved, 3),
    message: inOptimal
      ? `Optimal face size — ${pct(achieved)} of frame.`
      : inOfficial
        ? `Compliant face size (${pct(achieved)}); optimal is ${optimalRange}.`
        : `Generated face size ${pct(achieved)} is outside the allowed ${pct(cfg.faceRatioMin)}–${pct(cfg.faceRatioMax)}.`,
  };
  const crop = computeCrop(bio, spec, cfg);
  if (crop.upscale > 2.2) {
    warnings.push('Photo is being enlarged a lot — use a higher-resolution photo for the sharpest print.');
  }

  // ── Eyes: must be OPEN, LEVEL, and looking at the camera. Infants get a
  //    relaxed rule (closed eyes / gaze miss → WARNING, not a hard FAIL).
  //    Pipeline: Eyes Open → Head Roll → Eye Gaze → worst result wins.
  //    Only this block gates on the EyeGazeEstimator; the estimator measures,
  //    the document gaze rule (gaze-rules.ts) decides, this engine folds it in. ──
  let eyeAlignment: AxisResult = ((): AxisResult => {
    // ── Stage 0 — Eye VISIBILITY = geometry gate + occlusion gate (adult only).
    //    (a) OCCLUSION: an external object covers the eye region → FAIL. This is the
    //        signal MediaPipe geometry can't see (it fits landmarks under a cover).
    //    (b) GEOMETRY: eyes genuinely unavailable (NOT_VISIBLE) → FAIL.
    //    Either failing blocks openness/level/gaze — Eye Position never runs.
    if (occlusion && occlusion.status === 'FAIL') {
      return { status: 'FAIL', code: occlusion.reason, message: 'Both eyes must be clearly visible.' };
    }
    if (visibility && visibility.status === 'NOT_VISIBLE') {
      return { status: 'FAIL', code: visibility.reason, message: 'Both eyes must be open and clearly visible.' };
    }
    // (c) PIXEL visibility: the eye crop lacks real eye texture/contrast → covered.
    //     This is the signal estimated landmarks cannot provide.
    if (pixelVisibility && pixelVisibility.status === 'FAIL') {
      return {
        status: 'FAIL',
        code: pixelVisibility.reason,
        message: 'Both eyes must be fully visible and unobstructed. Estimated landmarks alone are not sufficient.',
      };
    }
    if (!bio.eyesOpen) {
      return cfg.relaxedEyes
        ? { status: 'WARNING', code: 'EYE_CLOSED', message: 'Eyes look closed — for infants this is allowed, but open eyes are preferred.' }
        : { status: 'FAIL', code: 'EYE_CLOSED', message: 'Both eyes must be open and clearly visible.' };
    }
    // Head roll (eyes level) — unchanged rule, now tagged with a reason code.
    const level = poseAxis(bio.roll, cfg.rollTol, cfg.rollTol * cfg.poseWarnMultiplier, {
      ok: 'Eyes open and level.',
      nudge: 'Straighten your head so your eyes are level.',
    });
    if (level.status !== 'PASS') level.code = 'EYE_NOT_LEVEL';

    // Eye gaze — document-specific rule applied to the measured iris offsets.
    const gazeAxis = evaluateEyeGaze(gaze, spec, cfg);

    // Worst result wins; on a tie keep the level result (preserves its wording).
    let base = rank(gazeAxis.status) > rank(level.status) ? gazeAxis : level;
    // Narrow pixel-visibility review band (0.85–0.90) → a soft WARNING to review,
    // never above the acceptance threshold. Worst-wins so a real FAIL is unaffected.
    if (pixelVisibility && pixelVisibility.status === 'WARNING') {
      const warn: AxisResult = {
        status: 'WARNING',
        code: pixelVisibility.reason,
        message: 'Please double-check your eyes are fully visible and unobstructed.',
      };
      if (rank(warn.status) > rank(base.status)) base = warn;
    }
    return base;
  })();

  // ── Mouth / expression (strict closed-mouth, no visible teeth) ──
  const teeth = bio.teethVisibilityScore ?? 0;
  let mouth: AxisResult;
  if (!cfg.allowOpenMouth && bio.mouthOpen) {
    mouth = { status: 'FAIL', value: round(teeth), message: 'Close your mouth — an open mouth is not allowed.' };
  } else if (cfg.strictTeethDetection && !cfg.allowVisibleTeeth && teeth > cfg.teethThreshold) {
    mouth = {
      status: 'FAIL',
      value: round(teeth),
      message: 'Visible teeth detected. Please close your mouth completely and maintain a neutral expression.',
    };
  } else if (!cfg.allowBroadSmile && bio.mouthState === 'BROAD_SMILE') {
    mouth = { status: 'FAIL', value: round(bio.smileScore), message: 'Please use a neutral expression with your lips closed (no broad smile).' };
  } else if (bio.mouthState === 'SLIGHT_SMILE') {
    mouth = { status: 'PASS', value: round(teeth), message: 'Slight smile, lips closed — OK.' };
  } else {
    mouth = { status: 'PASS', value: round(teeth), message: 'Neutral expression, lips closed — OK.' };
  }

  // ── Head position (yaw + pitch + roll → worst axis). Pitch messages are now
  //    direction-correct (see pitchAxis): chin DOWN → "raise", chin UP → "lower". ──
  const yawMsg = bio.yaw > 0 ? 'Turn your head slightly to the left.' : 'Turn your head slightly to the right.';
  const axes = [
    poseAxis(bio.yaw, cfg.yawTol, cfg.yawTol * cfg.poseWarnMultiplier, { ok: '', nudge: yawMsg }),
    pitchAxis(bio.pitch, cfg),
    poseAxis(bio.roll, cfg.rollTol, cfg.rollTol * cfg.poseWarnMultiplier, { ok: '', nudge: 'Straighten your head.' }),
  ];
  const worst = axes.reduce((w, a) => (rank(a.status) > rank(w.status) ? a : w), axes[0]);
  let headPosition: AxisResult =
    worst.status === 'PASS'
      ? { status: 'PASS', message: 'Facing the camera directly.' }
      : { status: worst.status, message: worst.message, code: worst.code };

  // ── Combined consistency layer: reconcile eye gaze + head pitch so the two can
  //    never contradict, using the world-frame gaze model (head pitch + head-
  //    relative eye offset). A vertical (up/down) attention issue is the GAZE, so a
  //    FAIL is folded into eyeAlignment — this makes the Eye Position check fail for
  //    a downcast/looking-down photo even though the irises look centred in their
  //    (down-pointing) sockets. It is also folded into headPosition so the two axes
  //    stay consistent. Horizontal (eyes to the side) stays owned by eyeAlignment. ──
  const visualAttention = evaluateVisualAttention(gaze, bio.pitch, cfg);
  const isVerticalAttention =
    visualAttention.code === 'ATTENTION_HEAD_DOWN' || visualAttention.code === 'ATTENTION_HEAD_UP';
  if (isVerticalAttention) {
    // The gaze is off-axis vertically → the Eye Position check must reflect it.
    if (visualAttention.status === 'FAIL' && rank(visualAttention.status) > rank(eyeAlignment.status)) {
      eyeAlignment = visualAttention;
    }
    if (rank(visualAttention.status) > rank(headPosition.status)) {
      headPosition = visualAttention;
    }
  }

  if (DEBUG_VISUAL_ATTENTION) {
    const finalUserMessage =
      rank(eyeAlignment.status) >= rank(headPosition.status) && eyeAlignment.status !== 'PASS'
        ? eyeAlignment.message
        : headPosition.message;
    console.log(
      [
        '================================',
        'Visual Attention (Compliance Engine)',
        `Head Pitch:               ${round(bio.pitch, 1)}`,
        `Head Position Result:     ${headPosition.status} (${headPosition.code ?? '—'})`,
        `Eye Gaze Direction:       ${gaze?.direction ?? 'n/a'}`,
        `Eye Position Result:      ${eyeAlignment.status} (${eyeAlignment.code ?? '—'})`,
        `Combined Visual Attention:${visualAttention.status} (${visualAttention.code})`,
        `Final User Message:       ${finalUserMessage || '(compliant)'}`,
        '================================',
      ].join('\n'),
    );
  }

  if (bio.faceCount > 1) warnings.push('Multiple faces detected — only one person allowed.');

  const statuses = [faceRatio.status, eyeAlignment.status, mouth.status, headPosition.status];
  const hasFail = statuses.includes('FAIL') || bio.faceCount > 1;
  const hasWarn = statuses.includes('WARNING') || warnings.length > 0;
  const overall: ComplianceReport['overall'] = hasFail
    ? 'NON_COMPLIANT'
    : inOptimal && !hasWarn
      ? 'OPTIMAL'
      : 'COMPLIANT';

  return {
    faceDetected: true,
    faceCount: bio.faceCount,
    faceRatio,
    eyeAlignment,
    mouth,
    headPosition,
    visualAttention,
    overall,
    warnings,
    source: 'mediapipe',
    country,
    faceRatioValue: round(achieved, 3),
    targetRatio: target,
    difference: round(achieved - target, 3),
    optimalRange,
  };
}

function rank(s: AxisResult['status']): number {
  return s === 'FAIL' ? 2 : s === 'WARNING' ? 1 : 0;
}


/**
 * Adult compliance engine (alias of `evaluate`) — named for symmetry with
 * `evaluateBabyCompliance` in baby-compliance.ts. Babies do NOT use this; the
 * gate routes infant documents to the dedicated baby evaluators instead.
 */
export const evaluateAdultCompliance = evaluate;

/**
 * Map the rich report back onto the existing `ComplianceResult` shape so the DB
 * column, Stripe webhook, order-confirmation, and legacy UI keep working
 * unchanged. The full report is attached under `report`.
 */
export function toComplianceResult(
  report: ComplianceReport,
  bio: BiometricData,
  cfg: BiometricConfig,
): ComplianceResult {
  const issues: string[] = [];
  const warnings = [...report.warnings];
  for (const [, axis] of Object.entries({
    faceRatio: report.faceRatio,
    eyeAlignment: report.eyeAlignment,
    mouth: report.mouth,
    headPosition: report.headPosition,
  })) {
    if (axis.status === 'FAIL') issues.push(axis.message);
    else if (axis.status === 'WARNING') warnings.push(axis.message);
  }

  // De-duplicate: the eye + head axes can carry the SAME combined attention
  // message (looking down/up), so collapse identical strings to one instruction.
  const dedupe = (xs: string[]) => [...new Set(xs)];

  return {
    passed: report.overall !== 'NON_COMPLIANT',
    faceDetected: report.faceDetected,
    faceCount: report.faceCount,
    headHeightPercent: report.faceRatioValue * 100,
    eyesOpen: bio.eyesOpen,
    mouthClosed: bio.mouthState !== 'OPEN_MOUTH',
    facingForward: report.headPosition.status !== 'FAIL',
    issues: dedupe(issues),
    warnings: dedupe(warnings),
    report,
    source: 'mediapipe',
  };
}
