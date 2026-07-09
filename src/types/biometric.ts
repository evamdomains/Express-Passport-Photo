/**
 * Biometric + compliance types shared between the browser (MediaPipe measurement)
 * and the server (Sharp cropping). Kept free of any MediaPipe/DOM imports so the
 * server can use the same types and the PassportComplianceEngine stays isomorphic.
 */

// Type-only import (erased at compile time — no runtime/DOM coupling). Lets the
// gaze measurement ride along inside BiometricData across the client→server boundary.
import type { EyeGazeResult } from '@/lib/face/EyeGazeEstimator';
import type { EyeVisibilityResult } from '@/lib/face/EyeVisibilityEvaluator';
import type { EyeRegions, EyeOcclusionResult } from '@/lib/face/EyeOcclusionEvaluator';
import type { EyePixelVisibilityResult } from '@/lib/face/EyePixelVisibilityEvaluator';

export type AxisStatus = 'PASS' | 'WARNING' | 'FAIL';
export type MouthState = 'NEUTRAL' | 'SLIGHT_SMILE' | 'BROAD_SMILE' | 'OPEN_MOUTH';

/**
 * Raw biometric measurements extracted from MediaPipe Face Landmarker.
 * All `*Norm` values are normalized 0..1 relative to the analysed image
 * (resolution-independent, so they apply equally to the PhotoRoom output).
 * Pixel values are relative to the analysed image's pixel dimensions.
 */
export interface BiometricData {
  faceDetected: boolean;
  faceCount: number;

  imageWidth: number;
  imageHeight: number;

  // Vertical anatomy (px) — crown is an estimate derived from the forehead landmark.
  crownY: number;
  chinY: number;
  faceHeight: number; // chin → estimated crown, px
  faceWidth: number;  // cheek-to-cheek, px
  faceRatio: number;  // faceHeight / imageHeight (the *uncorrected* ratio)

  // Normalized anatomy (0..1) — used for crop math.
  faceCenterXNorm: number;
  eyeCenterYNorm: number;
  faceHeightNorm: number;

  // Eyes
  leftEyeY: number;
  rightEyeY: number;
  eyesOpen: boolean;
  /** Average eye-aspect-ratio (0..~0.4). Lets the baby engine tell a sleepy,
   *  partly-open infant from fully-closed eyes. Optional (older payloads omit it). */
  eyeOpenness?: number;

  // Head pose (degrees)
  yaw: number;   // turn left/right
  pitch: number; // nod up/down
  roll: number;  // tilt (a.k.a. headTilt)
  headTilt: number; // alias of roll, kept for the spec's output shape

  // Mouth
  mouthOpen: boolean;
  mouthGap: number;    // inner-lip gap ÷ mouth width
  smileScore: number;  // 0..1 (avg of mouthSmileLeft/Right blendshapes)
  mouthState: MouthState;
  /** Fraction of the inner-mouth ROI that looks like teeth/enamel (0..1). */
  teethVisibilityScore: number;

  /**
   * Eye-gaze measurement from the EyeGazeEstimator (pure geometry, no PASS/FAIL).
   * Measured in the browser where the raw MediaPipe landmarks are available, then
   * carried here so the PassportComplianceEngine can apply document-specific gaze
   * rules on BOTH the browser gate and the server. Optional — older payloads / the
   * baby engine omit it, in which case the engine simply does not gate on gaze.
   */
  gaze?: EyeGazeResult;

  /**
   * Eye-visibility verdict (adult pipeline only) — whether the eyes were usable
   * for gaze estimation. Measured before the gaze estimator and carried here so
   * the compliance engine can FAIL early without evaluating Eye Position. Optional
   * (undefined for infants / older payloads).
   */
  eyeVisibility?: EyeVisibilityResult;

  /** Padded eye-region boxes (from MediaPipe eye landmarks) for the occlusion check. */
  eyeRegions?: EyeRegions;
  /**
   * Eye-occlusion verdict (adult pipeline only) — whether an external object covers
   * the eye region. Second half of Eye Visibility (with `eyeVisibility` geometry).
   * Optional; set only when object detections are available.
   */
  eyeOcclusion?: EyeOcclusionResult;
  /**
   * PIXEL-based eye-visibility verdict (adult only) — texture/contrast of each eye
   * crop, catching a covered eye that estimated landmarks can't reveal. Third part
   * of Eye Visibility (geometry + object-occlusion + pixel). Optional.
   */
  eyePixelVisibility?: EyePixelVisibilityResult;
}

/**
 * Image-quality metrics measured from the actual pixels (NOT from landmarks),
 * so a blurry/low-quality photo fails even when MediaPipe estimates landmarks.
 * All sharpness values are variance-of-Laplacian over a face/eye ROI normalized
 * to a fixed-width crop, so they're resolution-independent.
 */
export interface ImageQualityMetrics {
  /** Variance of Laplacian over the face ROI. Higher = sharper. */
  sharpnessScore: number;
  /** Variance of Laplacian over the eye ROIs (min of both eyes). */
  eyeSharpness: number;
  /** Luminance std-dev over the face ROI (0..1) — contrast. */
  contrast: number;
  /** Fraction of strong-edge pixels in the face ROI (0..1). */
  edgeDensity: number;
  /** Composite 0..1 face-quality score (sharpness + contrast + edge blend). */
  faceQualityScore: number;
  /** Mean face-ROI luminance, 0..255. (exposure) */
  meanBrightness?: number;
  /** Fraction of very-dark face pixels, 0..1. (exposure) */
  underExposureScore?: number;
  /** Fraction of blown-highlight face pixels, 0..1. (exposure) */
  overExposureScore?: number;
  /** |left−right| mean face luminance, 0..255 — lighting balance. (exposure) */
  lightingBalanceScore?: number;
  /** Fraction of deep-shadow face pixels, 0..1. (exposure) */
  shadowScore?: number;
  /** Nose-bridge ÷ cheek strong-edge ratio — high ⇒ eyeglasses frame present. */
  glassesScore?: number;
  /** True when pixel sampling succeeded; false → metrics unknown (skip, don't fail). */
  measured: boolean;
}

/** Normalized crop rectangle. Values may fall outside [0,1] → server pads with white. */
export interface CropRect {
  left: number;
  top: number;
  width: number;
  height: number;
  /** Upscale factor the server will apply (final px / crop px). >1 means enlarging. */
  upscale: number;
}

export interface AxisResult {
  status: AxisStatus;
  /** Numeric value where meaningful (e.g. face ratio 0.57). */
  value?: number;
  message: string;
  /**
   * Stable machine-readable reason code (e.g. 'EYE_LOOKING_LEFT'). Locale- and
   * copy-independent, so the frontend can localize / route UX off the code while
   * `message` stays a sensible English default. Optional — populated where useful.
   */
  code?: string;
  /** Eye-gaze diagnostics — populated only on the eyeAlignment axis when a gaze estimate exists. */
  gaze?: EyeGazeAxisDetail;
}

/** Diagnostics attached to the eyeAlignment axis: what was measured vs. what the document allows. */
export interface EyeGazeAxisDetail {
  /** Normalized horizontal iris position, 0..1 (0.5 = centered / looking straight). */
  averageHorizontal: number;
  /** Normalized vertical iris position, 0..1 (0.5 = centered / looking straight). */
  averageVertical: number;
  /** Allowed horizontal range [min, max] for the selected document. */
  allowedHorizontal: [number, number];
  /** Allowed vertical range [min, max] for the selected document. */
  allowedVertical: [number, number];
}

export interface ComplianceReport {
  faceDetected: boolean;
  faceCount: number;
  faceRatio: AxisResult;
  eyeAlignment: AxisResult;
  mouth: AxisResult;
  headPosition: AxisResult;
  /**
   * Combined eye-gaze + head-pitch consistency verdict (evaluateVisualAttention).
   * Diagnostic/transparency field — it reconciles eyeAlignment and headPosition so
   * they can never give contradictory up/down guidance. Optional (older payloads omit it).
   */
  visualAttention?: AxisResult;
  /** OPTIMAL = within the tight optimal range; COMPLIANT = within the official
   *  range but not optimal; NON_COMPLIANT = a hard failure. */
  overall: 'OPTIMAL' | 'COMPLIANT' | 'NON_COMPLIANT';
  warnings: string[];
  /** Which engine produced this report. */
  source: 'mediapipe' | 'rekognition';

  // ── Diagnostics (passport-photo.online-style) ──
  country: string;          // 'US' | 'CANADA'
  faceRatioValue: number;   // achieved chin→crown / photo height
  targetRatio: number;      // ideal ratio for this document
  difference: number;       // achieved − target
  optimalRange: string;     // e.g. "55%-58%"

  /** Crown/chin position in the FINAL composed image, for the review overlay.
   *  Single source of truth — same crop the engine used to scale the face. */
  measurements?: {
    faceRatio: number;        // achieved head height ÷ photo height
    headTopFraction: number;  // crown Y as a fraction of photo height (0..1)
    headBottomFraction: number; // chin Y as a fraction of photo height (0..1)
  };
}

/**
 * Per-document biometric tuning. Dimensions live in document-specs.ts; this layer
 * only holds the biometric thresholds so new countries can be added by adding a
 * config entry — no changes to the cropping or evaluation code.
 */
export interface BiometricConfig {
  /** Compliant chin→crown height as a fraction of photo height (official range). */
  faceRatioMin: number;
  faceRatioMax: number;
  /** Ideal ratio the auto-scaler actively targets. */
  targetRatio: number;
  /** Tight "optimal" band → reported as OPTIMAL when achieved ratio lands here. */
  optimalMin: number;
  optimalMax: number;
  /** Where to put the eye line, as a fraction from the TOP of the photo. */
  eyeLineFromTopMin: number;
  eyeLineFromTopMax: number;
  /** Head-pose tolerances (deg). |angle| ≤ tol → PASS; ≤ warnTol → WARNING; else FAIL. */
  yawTol: number;
  pitchTol: number;
  rollTol: number;
  poseWarnMultiplier: number; // warnTol = tol * this
  /** Mouth / expression rules (MOUTH_RULES). */
  allowBroadSmile: boolean;
  allowOpenMouth: boolean;
  allowVisibleTeeth: boolean;
  strictTeethDetection: boolean;
  /** teethVisibilityScore above this → visible teeth → FAIL. */
  teethThreshold: number;
  smileSlightMax: number; // smileScore below this is "slight smile"
  smileBroadMax: number;  // between slight and this is "broad smile"
  mouthOpenJaw: number;   // jawOpen blendshape above this → OPEN_MOUTH
  /** Infant document (baby passport) — enables relaxed rules. */
  infant?: boolean;
  /** Allow partially-open / closed eyes (newborns) → WARNING instead of FAIL. */
  relaxedEyes?: boolean;
}
