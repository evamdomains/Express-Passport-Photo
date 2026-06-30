import type { BiometricData, BiometricConfig, MouthState } from '@/types/biometric';

/**
 * Geometry helpers that turn raw MediaPipe Face Landmarker output (478
 * landmarks + blendshapes + a 4×4 facial-transformation matrix) into the
 * structured `BiometricData` the engine consumes. No MediaPipe import here so
 * it stays unit-testable with plain landmark arrays.
 */

// MediaPipe Face Mesh landmark indices (478-point model with iris).
export const IDX = {
  chin: 152,
  foreheadTop: 10,
  leftIris: 468,
  rightIris: 473,
  cheekRight: 234,
  cheekLeft: 454,
  noseTip: 1,
  lipInnerTop: 13,
  lipInnerBottom: 14,
  mouthCornerL: 61,
  mouthCornerR: 291,
  // Eyelid landmarks for the eye-aspect-ratio (openness) measurement.
  rEyeUp: 159, rEyeLow: 145, rEyeIn: 133, rEyeOut: 33,
  lEyeUp: 386, lEyeLow: 374, lEyeIn: 362, lEyeOut: 263,
} as const;

/** Inner-lip ring landmarks — bounding box = the mouth opening (teeth ROI). */
export const INNER_MOUTH_IDX = [78, 308, 13, 14, 82, 312, 87, 317, 81, 311, 178, 402] as const;

// Crown sits roughly this fraction of the (chin→forehead) span above the
// forehead-top landmark — used to estimate the top of the head/hair, which the
// face mesh does not provide directly.
const CROWN_EXTRA = 0.3;

// Geometric thresholds (deterministic — independent of blendshape quirks).
const EYE_OPEN_EAR = 0.15;     // eye-aspect-ratio below this → eyes closed
const MOUTH_OPEN_RATIO = 0.15; // inner-lip gap ÷ mouth width above this → open/teeth
// Teeth can only be visible if the lips are actually parted. Below this inner-lip
// gap the mouth is closed, so we ignore the pixel teeth score (prevents bright
// skin / lip-line pixels on a closed mouth from reading as "visible teeth").
const TEETH_MIN_GAP = 0.06;

/** Eye Aspect Ratio: vertical lid opening ÷ horizontal eye width, in pixels. */
function eyeAspect(up: LM, low: LM, inn: LM, out: LM, W: number, H: number): number {
  if (!up || !low || !inn || !out) return 0.3; // assume open if unavailable
  const v = Math.abs(up.y - low.y) * H;
  const h = Math.abs(out.x - inn.x) * W || 1e-6;
  return v / h;
}

export interface LM {
  x: number;
  y: number;
  z?: number;
}
interface Category {
  categoryName?: string;
  displayName?: string;
  score: number;
}

const DEG = 180 / Math.PI;
const r = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const mid = (a: LM, b: LM): LM => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const blend = (cats: Category[] | undefined, name: string) =>
  cats?.find((c) => (c.categoryName ?? c.displayName) === name)?.score ?? 0;

/** Yaw/pitch from the 4×4 facial-transformation matrix (column-major data[16]). */
function eulerFromMatrix(d: number[]): { yaw: number; pitch: number } {
  const R20 = d[2], R21 = d[6], R22 = d[10];
  const pitch = Math.atan2(R21, R22) * DEG;
  const yaw = Math.atan2(-R20, Math.hypot(R21, R22)) * DEG;
  return { yaw, pitch };
}

/** Crude geometric pose fallback when no transformation matrix is available. */
function geometricPose(eyeMid: LM, nose: LM, chin: LM, faceWidthNorm: number): { yaw: number; pitch: number } {
  const yaw = faceWidthNorm > 0 ? ((nose.x - eyeMid.x) / (faceWidthNorm / 2)) * 45 : 0;
  const eyeToChin = chin.y - eyeMid.y;
  const noseFrac = eyeToChin > 0 ? (nose.y - eyeMid.y) / eyeToChin : 0.5;
  const pitch = (noseFrac - 0.5) * 90; // ~0 when nose sits midway eye→chin
  return { yaw, pitch };
}

export function emptyBiometrics(imageWidth: number, imageHeight: number): BiometricData {
  return {
    faceDetected: false,
    faceCount: 0,
    imageWidth,
    imageHeight,
    crownY: 0, chinY: 0, faceHeight: 0, faceWidth: 0, faceRatio: 0,
    faceCenterXNorm: 0.5, eyeCenterYNorm: 0.4, faceHeightNorm: 0,
    leftEyeY: 0, rightEyeY: 0, eyesOpen: false,
    yaw: 0, pitch: 0, roll: 0, headTilt: 0,
    mouthOpen: false, mouthGap: 0, smileScore: 0, mouthState: 'NEUTRAL',
    teethVisibilityScore: 0,
  };
}

export function buildBiometrics(
  lm: LM[],
  blendshapes: Category[] | undefined,
  matrix: number[] | undefined,
  imageWidth: number,
  imageHeight: number,
  faceCount: number,
  cfg: BiometricConfig,
  teethVisibilityScore = 0,
): BiometricData {
  const chin = lm[IDX.chin];
  const fore = lm[IDX.foreheadTop];
  const lEye = lm[IDX.leftIris] ?? mid(lm[IDX.lEyeIn], lm[IDX.lEyeOut]);
  const rEye = lm[IDX.rightIris] ?? mid(lm[IDX.rEyeIn], lm[IDX.rEyeOut]);
  const cheekR = lm[IDX.cheekRight];
  const cheekL = lm[IDX.cheekLeft];
  const nose = lm[IDX.noseTip];

  const faceSpanNorm = chin.y - fore.y; // chin below forehead → positive
  const crownYNorm = fore.y - faceSpanNorm * CROWN_EXTRA;
  const faceHeightNorm = chin.y - crownYNorm; // = faceSpan * (1 + CROWN_EXTRA)

  const eyeMid = mid(lEye, rEye);
  const eyeCenterYNorm = eyeMid.y;
  const faceCenterXNorm = eyeMid.x;
  const faceWidthNorm = Math.abs(cheekL.x - cheekR.x);

  // Pose: roll from the eye line (robust + intuitive); yaw/pitch from the matrix.
  const roll = Math.atan2(rEye.y - lEye.y, rEye.x - lEye.x) * DEG;
  const { yaw, pitch } = matrix ? eulerFromMatrix(matrix) : geometricPose(eyeMid, nose, chin, faceWidthNorm);

  // Eyes: geometric eye-aspect-ratio (robust); blink blendshape as a backstop.
  const avgEAR =
    (eyeAspect(lm[IDX.rEyeUp], lm[IDX.rEyeLow], lm[IDX.rEyeIn], lm[IDX.rEyeOut], imageWidth, imageHeight) +
      eyeAspect(lm[IDX.lEyeUp], lm[IDX.lEyeLow], lm[IDX.lEyeIn], lm[IDX.lEyeOut], imageWidth, imageHeight)) /
    2;
  const eyeBlink = Math.max(blend(blendshapes, 'eyeBlinkLeft'), blend(blendshapes, 'eyeBlinkRight'));
  const eyesOpen = avgEAR > EYE_OPEN_EAR && eyeBlink < 0.6;

  // Mouth: geometric inner-lip gap ÷ mouth width catches open mouth / visible
  // teeth (a closed-lip smile reads ~0); jawOpen blendshape is a secondary cue.
  const mouthWidthPx = (Math.abs(lm[IDX.mouthCornerR].x - lm[IDX.mouthCornerL].x) * imageWidth) || 1e-6;
  const innerGapPx = Math.abs(lm[IDX.lipInnerBottom].y - lm[IDX.lipInnerTop].y) * imageHeight;
  const mouthOpenRatio = innerGapPx / mouthWidthPx;
  const jawOpen = blend(blendshapes, 'jawOpen');
  const smile = (blend(blendshapes, 'mouthSmileLeft') + blend(blendshapes, 'mouthSmileRight')) / 2;
  const mouthOpen = mouthOpenRatio > MOUTH_OPEN_RATIO || jawOpen > cfg.mouthOpenJaw;

  let mouthState: MouthState;
  if (mouthOpen) mouthState = 'OPEN_MOUTH';
  else if (smile <= cfg.smileSlightMax) mouthState = smile < 0.12 ? 'NEUTRAL' : 'SLIGHT_SMILE';
  else mouthState = 'BROAD_SMILE';

  return {
    faceDetected: true,
    faceCount,
    imageWidth,
    imageHeight,
    crownY: r(crownYNorm * imageHeight, 1),
    chinY: r(chin.y * imageHeight, 1),
    faceHeight: r(faceHeightNorm * imageHeight, 1),
    faceWidth: r(faceWidthNorm * imageWidth, 1),
    faceRatio: r(faceHeightNorm, 3),
    faceCenterXNorm: r(faceCenterXNorm, 5),
    eyeCenterYNorm: r(eyeCenterYNorm, 5),
    faceHeightNorm: r(faceHeightNorm, 5),
    leftEyeY: r(lEye.y * imageHeight, 1),
    rightEyeY: r(rEye.y * imageHeight, 1),
    eyesOpen,
    eyeOpenness: r(avgEAR, 4),
    yaw: r(yaw, 1),
    pitch: r(pitch, 1),
    roll: r(roll, 1),
    headTilt: r(roll, 1),
    mouthOpen,
    mouthGap: r(mouthOpenRatio, 4),
    smileScore: r(smile, 3),
    mouthState,
    // Closed lips ⇒ no teeth possible, regardless of pixel sampling noise.
    teethVisibilityScore: r(mouthOpenRatio >= TEETH_MIN_GAP ? teethVisibilityScore : 0, 4),
  };
}
