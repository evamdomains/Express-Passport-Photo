import {
  EYE_OCCLUSION_CONFIG,
  classToOcclusionReason,
  isOccludingClass,
  type ComplianceDetection,
  type EyeOcclusionConfig,
  type EyeOcclusionReason,
  type OcclusionBox,
} from './eye-occlusion-rules';

/**
 * EyeOcclusionEvaluator — the SECOND half of Eye Visibility (the first being the
 * geometry gate in EyeVisibilityEvaluator). It answers ONLY:
 *
 *     "Is the eye region visually OBSTRUCTED by an external object?"
 *
 * It does NOT look at gaze, openness, or passport rules. It does NOT trust
 * MediaPipe to know about occlusion (MediaPipe happily fits landmarks under a
 * blindfold). Instead it consumes an object detector's `ComplianceDetection[]`
 * and checks whether any OCCLUDING-class box overlaps an eye region built from the
 * MediaPipe eye landmarks. Fully independent + deterministic + unit-testable.
 *
 * Availability today: the running app only detects `hand` (and person/COCO). So
 * hand-over-eyes is caught now; blindfold / cloth / hair / mask / sunglasses become
 * catchable the moment a detector emits those classes — no code change, only the
 * OCCLUDING_CLASS_INDICATORS config. That is the whole point of the split.
 */

export interface Landmark {
  x: number;
  y: number;
  z?: number;
}

/** Eye landmark indices used to construct each eye region (per the spec). */
export const EYE_REGION_LANDMARKS = {
  left: [33, 133, 159, 145],
  right: [362, 263, 386, 374],
} as const;

export interface EyeRegions {
  left: OcclusionBox;
  right: OcclusionBox;
}

export interface EyeOcclusionResult {
  status: 'PASS' | 'FAIL';
  leftEyeOccluded: boolean;
  rightEyeOccluded: boolean;
  confidence: number;
  reason: EyeOcclusionReason;
  /** Diagnostics (optional). */
  regions?: EyeRegions;
  overlaps?: { class: string; confidence: number; eye: 'left' | 'right'; coverage: number }[];
}

export interface EyeOcclusionOptions {
  config?: Partial<EyeOcclusionConfig>;
  debug?: boolean;
  logger?: Pick<Console, 'log'>;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d;

/**
 * Build a padded bounding box around each eye from its 4 landmarks. Returns null
 * when the landmarks are missing (occlusion then can't be judged → treated as PASS
 * so the geometry gate remains the authority for "no landmarks").
 */
export function buildEyeRegions(landmarks: Landmark[] | null | undefined, padding: number): EyeRegions | null {
  if (!landmarks || landmarks.length === 0) return null;
  const box = (idxs: readonly number[]): OcclusionBox | null => {
    let minX = 1, minY = 1, maxX = 0, maxY = 0, ok = false;
    for (const i of idxs) {
      const p = landmarks[i];
      if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
      ok = true;
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }
    if (!ok) return null;
    const w = maxX - minX;
    const h = maxY - minY;
    const x = clamp01(minX - w * padding);
    const y = clamp01(minY - h * padding);
    return { x, y, width: clamp01(maxX + w * padding) - x, height: clamp01(maxY + h * padding) - y };
  };
  const left = box(EYE_REGION_LANDMARKS.left);
  const right = box(EYE_REGION_LANDMARKS.right);
  return left && right ? { left, right } : null;
}

/** Fraction of the eye region covered by the detection box (intersection ÷ eye area). */
function coverageOfRegion(det: OcclusionBox, eye: OcclusionBox): number {
  const ix = Math.max(0, Math.min(det.x + det.width, eye.x + eye.width) - Math.max(det.x, eye.x));
  const iy = Math.max(0, Math.min(det.y + det.height, eye.y + eye.height) - Math.max(det.y, eye.y));
  const inter = ix * iy;
  const eyeArea = eye.width * eye.height;
  return eyeArea > 0 ? inter / eyeArea : 0;
}

/** Core: judge occlusion from precomputed eye regions + detections. */
export function evaluateEyeOcclusionFromRegions(
  regions: EyeRegions | null,
  detections: ComplianceDetection[] | null | undefined,
  options: EyeOcclusionOptions = {},
): EyeOcclusionResult {
  const cfg: EyeOcclusionConfig = { ...EYE_OCCLUSION_CONFIG, ...options.config };
  const debug = options.debug ?? cfg.DEBUG_EYE_OCCLUSION;
  const logger = options.logger ?? console;

  // No regions (missing landmarks) → defer to the geometry gate; do not fail here.
  if (!regions) {
    const r: EyeOcclusionResult = { status: 'PASS', leftEyeOccluded: false, rightEyeOccluded: false, confidence: 0, reason: 'LOW_VISIBILITY_CONFIDENCE' };
    if (debug) log(r, [], logger);
    return r;
  }

  const candidates = (detections ?? []).filter(
    (d) => d && d.bbox && d.confidence >= cfg.MIN_OBJECT_CONFIDENCE && isOccludingClass(d.class),
  );

  const overlaps: NonNullable<EyeOcclusionResult['overlaps']> = [];
  let leftClass: ComplianceDetection | null = null;
  let rightClass: ComplianceDetection | null = null;

  for (const d of candidates) {
    const lc = coverageOfRegion(d.bbox, regions.left);
    const rc = coverageOfRegion(d.bbox, regions.right);
    if (lc >= cfg.OCCLUSION_IOU_THRESHOLD) {
      overlaps.push({ class: d.class, confidence: d.confidence, eye: 'left', coverage: round(lc) });
      if (!leftClass || d.confidence > leftClass.confidence) leftClass = d;
    }
    if (rc >= cfg.OCCLUSION_IOU_THRESHOLD) {
      overlaps.push({ class: d.class, confidence: d.confidence, eye: 'right', coverage: round(rc) });
      if (!rightClass || d.confidence > rightClass.confidence) rightClass = d;
    }
  }

  const leftEyeOccluded = !!leftClass;
  const rightEyeOccluded = !!rightClass;

  let result: EyeOcclusionResult;
  if (!leftEyeOccluded && !rightEyeOccluded) {
    result = { status: 'PASS', leftEyeOccluded: false, rightEyeOccluded: false, confidence: 1, reason: 'EYES_VISIBLE', regions, overlaps };
  } else {
    // Reason from the highest-confidence occluding detection over either eye.
    const dominant = [leftClass, rightClass].filter(Boolean).sort((a, b) => b!.confidence - a!.confidence)[0]!;
    result = {
      status: 'FAIL',
      leftEyeOccluded,
      rightEyeOccluded,
      confidence: round(dominant.confidence),
      reason: classToOcclusionReason(dominant.class),
      regions,
      overlaps,
    };
  }

  if (debug) log(result, detections ?? [], logger);
  return result;
}

/** Convenience: build eye regions from landmarks then judge occlusion. */
export function evaluateEyeOcclusion(
  landmarks: Landmark[] | null | undefined,
  detections: ComplianceDetection[] | null | undefined,
  options: EyeOcclusionOptions = {},
): EyeOcclusionResult {
  const cfg: EyeOcclusionConfig = { ...EYE_OCCLUSION_CONFIG, ...options.config };
  return evaluateEyeOcclusionFromRegions(buildEyeRegions(landmarks, cfg.EYE_REGION_PADDING), detections, options);
}

/** Adapter: map an object detector's `{category,score,box}` list to ComplianceDetection[]. */
export function toComplianceDetections(
  objects: { category: string; score: number; box: OcclusionBox }[] | null | undefined,
): ComplianceDetection[] {
  return (objects ?? []).map((o) => ({ class: o.category, confidence: o.score, bbox: o.box }));
}

function log(r: EyeOcclusionResult, detections: ComplianceDetection[], logger: Pick<Console, 'log'>): void {
  const fmt = (b?: OcclusionBox) => (b ? `[${b.x.toFixed(2)},${b.y.toFixed(2)},${b.width.toFixed(2)},${b.height.toFixed(2)}]` : 'n/a');
  logger.log(
    [
      '==============================',
      'EYE OCCLUSION',
      `Detected Objects     ${detections.map((d) => `${d.class}(${d.confidence.toFixed(2)})`).join(', ') || 'none'}`,
      `Left Eye Polygon     ${fmt(r.regions?.left)}`,
      `Right Eye Polygon    ${fmt(r.regions?.right)}`,
      `Overlapping Objects  ${(r.overlaps ?? []).map((o) => `${o.class}@${o.eye}(${o.coverage})`).join(', ') || 'none'}`,
      `Occluded Eye         ${r.leftEyeOccluded && r.rightEyeOccluded ? 'BOTH' : r.leftEyeOccluded ? 'LEFT' : r.rightEyeOccluded ? 'RIGHT' : 'NONE'}`,
      `Confidence           ${r.confidence.toFixed(2)}`,
      `Reason               ${r.reason}`,
      `Will Run Eye Gaze    ${r.status === 'PASS' ? 'YES' : 'NO'}`,
      '==============================',
    ].join('\n'),
  );
}
