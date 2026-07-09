/**
 * Eye-occlusion RULES + config — the decision table for the EyeOcclusionEvaluator.
 * Pure data + tiny predicates; no geometry, no detector, no gaze. Tune thresholds
 * and the occluding-class vocabulary HERE so future object classes (goggles, VR
 * headset, helmet visor, …) activate by config alone.
 */

/** Normalized (0..1) bounding box in the ORIGINAL image space. */
export interface OcclusionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A generic object detection the occlusion evaluator consumes. This is the shape a
 * Compliance Object Detector (or the existing YOLO/hand detector, via the adapter)
 * emits. Kept minimal + self-contained so the evaluator has no hard dependency on
 * any specific detector module.
 */
export interface ComplianceDetection {
  class: string;
  confidence: number;
  bbox: OcclusionBox;
}

/** Explicit reason codes — never generic strings. */
export type EyeOcclusionReason =
  | 'EYES_VISIBLE'
  | 'LEFT_EYE_OCCLUDED'
  | 'RIGHT_EYE_OCCLUDED'
  | 'BOTH_EYES_OCCLUDED'
  | 'BLINDFOLD'
  | 'HAND_OVER_EYES'
  | 'HAIR_OVER_EYES'
  | 'MASK_OVER_EYES'
  | 'OBJECT_OVER_EYES'
  | 'LOW_VISIBILITY_CONFIDENCE';

export interface EyeOcclusionConfig {
  /** Fraction of an eye region a detection must cover to count as occluding it. */
  OCCLUSION_IOU_THRESHOLD: number;
  /** Detections below this confidence are ignored. */
  MIN_OBJECT_CONFIDENCE: number;
  /** Eye landmark box is expanded by this fraction on each side to form the region. */
  EYE_REGION_PADDING: number;
  /** Verbose logging. */
  DEBUG_EYE_OCCLUSION: boolean;
}

export const EYE_OCCLUSION_CONFIG: EyeOcclusionConfig = {
  OCCLUSION_IOU_THRESHOLD: 0.15,
  MIN_OBJECT_CONFIDENCE: 0.4,
  EYE_REGION_PADDING: 0.6,
  DEBUG_EYE_OCCLUSION: false,
};

/**
 * Class-name substrings that genuinely COVER the eyes. Matching is case-insensitive
 * substring. NOTE: eyebrows/eyelashes/glasses/head coverings/person are deliberately
 * ABSENT — they must never fail here (glasses are handled by the glasses detector;
 * a head covering that leaves the eyes visible won't overlap the eye region anyway).
 * `sunglasses` IS included (opaque) while plain `glasses` is not.
 */
export const OCCLUDING_CLASS_INDICATORS: readonly string[] = [
  'blindfold', 'cloth', 'fabric', 'veil', 'scarf', 'tape', 'bandage',
  'hair', 'bang',
  'hand', 'finger', 'palm',
  'mask',
  'patch',
  'sunglass', 'goggle', 'visor',
];

/** True when a detection's class is one that can occlude the eye region. */
export function isOccludingClass(className: string): boolean {
  const lc = className.toLowerCase();
  return OCCLUDING_CLASS_INDICATORS.some((k) => lc.includes(k));
}

/** Map an occluding class to its specific reason code. */
export function classToOcclusionReason(className: string): EyeOcclusionReason {
  const lc = className.toLowerCase();
  if (lc.includes('blindfold')) return 'BLINDFOLD';
  if (lc.includes('hand') || lc.includes('finger') || lc.includes('palm')) return 'HAND_OVER_EYES';
  if (lc.includes('hair') || lc.includes('bang')) return 'HAIR_OVER_EYES';
  if (lc.includes('mask')) return 'MASK_OVER_EYES';
  return 'OBJECT_OVER_EYES';
}
