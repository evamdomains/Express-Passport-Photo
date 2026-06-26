import type {
  BiometricData,
  BiometricConfig,
  CropRect,
  ComplianceReport,
  AxisResult,
} from '@/types/biometric';
import type { DocumentSpec } from '@/types/document';
import type { ComplianceResult } from '@/types/order';
import { getBiometricConfig, targetFaceRatio, targetEyeLineFromTop } from './biometric-config';

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

  // ── Eyes: must be OPEN and level. Infants get a relaxed rule (partially-open
  //    / closed eyes → WARNING, not a hard FAIL). ──
  const eyeAlignment: AxisResult = !bio.eyesOpen
    ? cfg.relaxedEyes
      ? { status: 'WARNING', message: 'Eyes look closed — for infants this is allowed, but open eyes are preferred.' }
      : { status: 'FAIL', message: 'Both eyes must be open and clearly visible.' }
    : poseAxis(bio.roll, cfg.rollTol, cfg.rollTol * cfg.poseWarnMultiplier, {
        ok: 'Eyes open and level.',
        nudge: 'Straighten your head so your eyes are level.',
      });

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

  // ── Head position (yaw + pitch + roll → worst axis) ──
  const yawMsg = bio.yaw > 0 ? 'Turn your head slightly to the left.' : 'Turn your head slightly to the right.';
  const pitchMsg = bio.pitch > 0 ? 'Lower your chin slightly.' : 'Lift your chin slightly.';
  const axes = [
    poseAxis(bio.yaw, cfg.yawTol, cfg.yawTol * cfg.poseWarnMultiplier, { ok: '', nudge: yawMsg }),
    poseAxis(bio.pitch, cfg.pitchTol, cfg.pitchTol * cfg.poseWarnMultiplier, { ok: '', nudge: pitchMsg }),
    poseAxis(bio.roll, cfg.rollTol, cfg.rollTol * cfg.poseWarnMultiplier, { ok: '', nudge: 'Straighten your head.' }),
  ];
  const worst = axes.reduce((w, a) => (rank(a.status) > rank(w.status) ? a : w), axes[0]);
  const headPosition: AxisResult =
    worst.status === 'PASS'
      ? { status: 'PASS', message: 'Facing the camera directly.' }
      : { status: worst.status, message: worst.message };

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

  return {
    passed: report.overall !== 'NON_COMPLIANT',
    faceDetected: report.faceDetected,
    faceCount: report.faceCount,
    headHeightPercent: report.faceRatioValue * 100,
    eyesOpen: bio.eyesOpen,
    mouthClosed: bio.mouthState !== 'OPEN_MOUTH',
    facingForward: report.headPosition.status !== 'FAIL',
    issues,
    warnings,
    report,
    source: 'mediapipe',
  };
}
