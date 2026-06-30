import type { AxisResult, BiometricData } from '@/types/biometric';

/**
 * Baby / infant compliance engine — a DEDICATED set of evaluators for the Baby
 * Passport path, separate from the adult `evaluate()` in PassportComplianceEngine.
 *
 * Babies behave differently from adults: they breathe through slightly-parted
 * lips, can't hold a perfectly neutral face, tilt their heads, and don't open
 * both eyes equally. These evaluators relax exactly those rules (eyes, mouth,
 * expression, head pose) while still rejecting genuinely non-compliant photos
 * (crying, laughing, yawning, screaming, mouth open very wide, eyes fully closed,
 * extreme head pose). Face size / background / blur / exposure / image quality /
 * multiple faces are NOT relaxed — those keep their existing rules elsewhere.
 *
 * MediaPipe landmarks used (via BiometricData):
 *   • eyes        → eyeOpenness (avg eye-aspect-ratio of upper/lower lids: 159/145/133/33 + 386/374/362/263)
 *   • mouth       → mouthGap (inner-lip gap 13/14 ÷ mouth width 61/291), teethVisibilityScore (inner-lip ROI)
 *   • expression  → eyeOpenness + mouthGap + mouthState/smileScore (mouthSmileLeft/Right blendshapes)
 *   • head tilt   → roll (outer-eye-corner slope 33↔263)
 *   • head rotate → yaw + pitch (transformation matrix / nose-vs-eye geometry)
 */

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const rank = (s: AxisResult['status']) => (s === 'FAIL' ? 2 : s === 'WARNING' ? 1 : 0);

/** Baby-specific thresholds (do NOT reuse adult cfg thresholds). */
export const BABY_THRESHOLDS = {
  // Eyes — accept sleepy / partly-open; reject only (near-)fully-closed.
  eyesClosedEAR: 0.06,
  eyesSleepyEAR: 0.13,
  // Mouth — accept closed → small relaxed "O"; reject wide-open (cry/yawn/scream).
  mouthGapWideFail: 0.45, // inner-lip gap ÷ mouth width
  mouthGapOpenNote: 0.12, // above this (but below wide) = slightly open / acceptable
  teethWideFail: 0.3, // lots of teeth ⇒ mouth forced wide open
  // Expression — crying/screaming (squeezed eyes + open mouth), broad smile/grin,
  // and laughing. A mild/slight infant smile is still accepted.
  cryEyeEAR: 0.09,
  cryMouthGap: 0.3,
  broadSmileMax: 0.5, // smileScore at/above this ⇒ broad smile / big grin → reject
  laughMouthGap: 0.22, // broad smile + a mouth opening this wide ⇒ laughing
  // Head — generous infant tolerances; FAIL only on extreme pose.
  rotationWarnDeg: 22,
  rotationFailDeg: 32,
  tiltWarnDeg: 18,
  tiltFailDeg: 28,
} as const;

/** Eyes: accept naturally-open or slightly-sleepy; reject only fully closed. */
export function evaluateBabyEyes(bio: BiometricData): AxisResult {
  const ear = bio.eyeOpenness;
  if (ear == null) {
    return bio.eyesOpen
      ? { status: 'PASS', message: 'Both eyes open and visible.' }
      : { status: 'WARNING', message: 'Eyes look partly closed — open eyes are preferred for infants.' };
  }
  if (ear < BABY_THRESHOLDS.eyesClosedEAR) {
    return { status: 'FAIL', value: round(ear, 3), message: "Please ensure both your baby's eyes are open and visible." };
  }
  if (ear < BABY_THRESHOLDS.eyesSleepyEAR) {
    return { status: 'PASS', value: round(ear, 3), message: 'Eyes open (natural infant / slightly sleepy) — acceptable.' };
  }
  return { status: 'PASS', value: round(ear, 3), message: 'Both eyes naturally open — OK.' };
}

/** Mouth: accept closed → small relaxed opening / "O"; reject very wide open. */
export function evaluateBabyMouth(bio: BiometricData): AxisResult {
  const gap = bio.mouthGap ?? 0;
  const teeth = bio.teethVisibilityScore ?? 0;
  if (gap >= BABY_THRESHOLDS.mouthGapWideFail) {
    return { status: 'FAIL', value: round(gap, 3), message: "Your baby's mouth is opened too wide. Wait for a calmer moment, then retake." };
  }
  if (teeth >= BABY_THRESHOLDS.teethWideFail) {
    return { status: 'FAIL', value: round(teeth, 3), message: "Your baby's mouth is open too wide (teeth showing). Wait for a relaxed expression." };
  }
  if (gap >= BABY_THRESHOLDS.mouthGapOpenNote) {
    return { status: 'PASS', value: round(gap, 3), message: 'Slightly open / small relaxed mouth — acceptable.' };
  }
  return { status: 'PASS', value: round(gap, 3), message: 'Mouth closed / lips gently touching — OK.' };
}

/**
 * Expression: reject crying / screaming / laughing / broad grin; accept calm,
 * curious, relaxed, and a MILD natural infant smile. A broad smile (big grin) is
 * rejected even with lips closed, because it's well beyond a relaxed expression.
 */
export function evaluateBabyExpression(bio: BiometricData): AxisResult {
  const gap = bio.mouthGap ?? 0;
  const ear = bio.eyeOpenness ?? 1;
  const smile = bio.smileScore ?? 0;

  // Crying / screaming — eyes squeezed + mouth open.
  if (ear < BABY_THRESHOLDS.cryEyeEAR && gap > BABY_THRESHOLDS.cryMouthGap) {
    return { status: 'FAIL', value: round(smile, 3), message: 'Please wait until your baby is calm — crying or screaming is not accepted.' };
  }
  // Laughing — broad smile with an open mouth.
  if (bio.mouthState === 'BROAD_SMILE' && gap > BABY_THRESHOLDS.laughMouthGap) {
    return { status: 'FAIL', value: round(smile, 3), message: 'Please upload a photo without laughter — a calm, relaxed expression is required.' };
  }
  // Broad smile / big grin (even lips-closed) — broader than a relaxed infant face.
  if (bio.mouthState === 'BROAD_SMILE' || smile >= BABY_THRESHOLDS.broadSmileMax) {
    return { status: 'FAIL', value: round(smile, 3), message: 'Please upload a photo with a relaxed, natural expression (no broad smile or grin).' };
  }
  return { status: 'PASS', value: round(smile, 3), message: 'Calm, relaxed expression — OK.' };
}

function babyPose(angle: number, warn: number, fail: number, msg: { ok: string; nudge: string }): AxisResult {
  const a = Math.abs(angle);
  if (a <= warn) return { status: 'PASS', value: round(angle, 1), message: msg.ok };
  if (a <= fail) return { status: 'WARNING', value: round(angle, 1), message: msg.nudge };
  return { status: 'FAIL', value: round(angle, 1), message: msg.nudge };
}

/** Head tilt (roll): generous infant range; FAIL only on extreme tilt. */
export function evaluateBabyHeadTilt(bio: BiometricData): AxisResult {
  return babyPose(bio.roll, BABY_THRESHOLDS.tiltWarnDeg, BABY_THRESHOLDS.tiltFailDeg, {
    ok: 'Head tilt within the infant range — OK.',
    nudge: 'Please reduce the head tilt — hold your baby a little more upright.',
  });
}

/** Head rotation (yaw + pitch, worst axis): FAIL only when looking far away. */
export function evaluateBabyHeadRotation(bio: BiometricData): AxisResult {
  const yaw = babyPose(bio.yaw, BABY_THRESHOLDS.rotationWarnDeg, BABY_THRESHOLDS.rotationFailDeg, {
    ok: '',
    nudge: 'Turn your baby to face the camera more directly.',
  });
  const pitch = babyPose(bio.pitch, BABY_THRESHOLDS.rotationWarnDeg, BABY_THRESHOLDS.rotationFailDeg, {
    ok: '',
    nudge: bio.pitch > 0 ? "Lower your baby's chin slightly." : "Lift your baby's chin slightly.",
  });
  const worst = rank(pitch.status) > rank(yaw.status) ? pitch : yaw;
  return worst.status === 'PASS'
    ? { status: 'PASS', message: 'Facing the camera (within the infant range) — OK.' }
    : worst;
}

/** Aggregated baby verdicts — used for the Human-Review reviewer summary. */
export interface BabyComplianceSummary {
  eyes: AxisResult;
  mouth: AxisResult;
  expression: AxisResult;
  headTilt: AxisResult;
  headRotation: AxisResult;
}

export function evaluateBabyCompliance(bio: BiometricData): BabyComplianceSummary {
  return {
    eyes: evaluateBabyEyes(bio),
    mouth: evaluateBabyMouth(bio),
    expression: evaluateBabyExpression(bio),
    headTilt: evaluateBabyHeadTilt(bio),
    headRotation: evaluateBabyHeadRotation(bio),
  };
}
