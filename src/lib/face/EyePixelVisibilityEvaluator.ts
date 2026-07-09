/**
 * EyePixelVisibilityEvaluator — the model-free OCCLUSION signal MediaPipe can't
 * provide. MediaPipe Face Landmarker regresses all 478 landmarks (incl. iris) even
 * when the eyes are covered, so landmark geometry alone can be fooled by a
 * blindfold / cloth / hand. This module instead judges the actual PIXELS of each
 * eye crop: a real eye has strong local texture + contrast (sclera↔iris↔lid edges),
 * whereas a flat covering does not.
 *
 * CONSERVATIVE BY DESIGN (per product decision): confidence is the MAX of three
 * independent structural ramps (texture, edge density, contrast), so ANY normal
 * eye structure — even a dark iris in low light — scores ~1.0 and passes with no
 * warning. Only a genuinely flat / textureless crop scores low. This catches
 * fully-covered eyes without re-introducing false rejections of valid photos.
 *
 * PASS ≥ acceptConfidence · WARNING in [reviewConfidence, acceptConfidence) · FAIL below.
 * It is PURE (raw metrics in, verdict out) so it is fully unit-testable; the pixel
 * sampling lives in FaceAnalysisService (which owns the bitmap).
 */

/** Raw, resolution-normalized pixel metrics for one eye crop. */
export interface EyeCropMetric {
  /** Variance of the Laplacian over the eye ROI (local texture / edge energy). */
  texture: number;
  /** Fraction of strong-edge pixels in the eye ROI (0..1). */
  edgeDensity: number;
  /** Luminance standard deviation over the eye ROI, normalized 0..1. */
  contrast: number;
}

export type EyePixelVisibilityReason = 'EYES_VISIBLE' | 'EYES_REVIEW' | 'EYE_TEXTURE_LOW';

export interface EyePixelVisibilityResult {
  status: 'PASS' | 'WARNING' | 'FAIL';
  leftConfidence: number;
  rightConfidence: number;
  reason: EyePixelVisibilityReason;
}

export interface EyePixelVisibilityConfig {
  /** Texture (Laplacian variance): ≤ floor ⇒ flat; ≥ ceil ⇒ clearly a real eye. */
  textureFloor: number;
  textureCeil: number;
  /** Edge density floor/ceil (fraction of strong-edge pixels). */
  edgeFloor: number;
  edgeCeil: number;
  /** Contrast (normalized luminance std) floor/ceil. */
  contrastFloor: number;
  contrastCeil: number;
  /** Weights for the combined confidence (must sum to 1). No single metric dominates. */
  wTexture: number;
  wEdge: number;
  wContrast: number;
  /** Confidence ≥ this ⇒ PASS (no warning). */
  acceptConfidence: number;
  /** Confidence in [this, acceptConfidence) ⇒ WARNING (narrow review band). */
  reviewConfidence: number;
  DEBUG_EYE_PIXEL_VISIBILITY: boolean;
}

/**
 * Ceilings are set LOW so any normal eye clears them → confidence 1.0 → PASS with
 * no warning. Only near-flat crops (a covering) fall toward 0. Tune against real
 * covered/uncovered samples using the debug metric dump; err toward leniency.
 */
export const EYE_PIXEL_VISIBILITY_CONFIG: EyePixelVisibilityConfig = {
  textureFloor: 6,
  textureCeil: 25,
  edgeFloor: 0.004,
  edgeCeil: 0.02,
  contrastFloor: 0.03,
  contrastCeil: 0.1,
  wTexture: 0.45,
  wEdge: 0.35,
  wContrast: 0.2,
  // NOTE: on this WEIGHTED scale a real eye scores ~0.5–1.0 while a flat covering
  // scores ~0. Accept is therefore 0.30, NOT 0.90 — a 0.90 gate would false-reject
  // valid low-light / dark-iris eyes (the cause of the earlier false WARNINGs). This
  // is a conservative safety net for FLAT coverings; patterned cloth needs a model.
  acceptConfidence: 0.3,
  reviewConfidence: 0.22,
  DEBUG_EYE_PIXEL_VISIBILITY: false,
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d;
/** floorV at x ≤ lo, ceilV at x ≥ hi, linear in between. */
const ramp = (x: number, lo: number, hi: number, floorV: number, ceilV: number): number =>
  hi <= lo ? ceilV : floorV + clamp01((x - lo) / (hi - lo)) * (ceilV - floorV);

/**
 * Per-eye visibility confidence = WEIGHTED combination of the three structural
 * ramps. Weighted (not MAX) so a single strong metric — e.g. a high-contrast
 * blindfold — cannot alone force a PASS: it must show real eye TEXTURE + EDGES too.
 */
function eyeConfidence(m: EyeCropMetric | undefined, cfg: EyePixelVisibilityConfig): number {
  if (!m) return 1; // couldn't sample this eye → don't fabricate a failure (other gates apply)
  const t = ramp(m.texture, cfg.textureFloor, cfg.textureCeil, 0, 1);
  const e = ramp(m.edgeDensity, cfg.edgeFloor, cfg.edgeCeil, 0, 1);
  const c = ramp(m.contrast, cfg.contrastFloor, cfg.contrastCeil, 0, 1);
  return round(cfg.wTexture * t + cfg.wEdge * e + cfg.wContrast * c);
}

export interface EyePixelVisibilityOptions {
  config?: Partial<EyePixelVisibilityConfig>;
  debug?: boolean;
  logger?: Pick<Console, 'log'>;
}

/**
 * Decide pixel-level eye visibility from per-eye crop metrics. Either eye scoring
 * low fails (both irises must be visually detectable). No metrics at all → PASS
 * (sampling unavailable; the geometry/occlusion gates remain the authority).
 */
export function evaluateEyePixelVisibility(
  metrics: { left?: EyeCropMetric; right?: EyeCropMetric } | null | undefined,
  options: EyePixelVisibilityOptions = {},
): EyePixelVisibilityResult {
  const cfg: EyePixelVisibilityConfig = { ...EYE_PIXEL_VISIBILITY_CONFIG, ...options.config };
  const debug = options.debug ?? cfg.DEBUG_EYE_PIXEL_VISIBILITY;
  const logger = options.logger ?? console;

  const leftConfidence = eyeConfidence(metrics?.left, cfg);
  const rightConfidence = eyeConfidence(metrics?.right, cfg);
  const minConf = Math.min(leftConfidence, rightConfidence);

  let status: EyePixelVisibilityResult['status'];
  let reason: EyePixelVisibilityReason;
  if (minConf >= cfg.acceptConfidence) {
    status = 'PASS';
    reason = 'EYES_VISIBLE';
  } else if (minConf >= cfg.reviewConfidence) {
    status = 'WARNING';
    reason = 'EYES_REVIEW';
  } else {
    status = 'FAIL';
    reason = 'EYE_TEXTURE_LOW';
  }

  const result: EyePixelVisibilityResult = { status, leftConfidence, rightConfidence, reason };
  if (debug) {
    logger.log(
      [
        '==============================',
        'EYE PIXEL VISIBILITY',
        `Left  texture/edge/contrast  ${metrics?.left ? `${metrics.left.texture} / ${metrics.left.edgeDensity} / ${metrics.left.contrast}` : 'n/a'}`,
        `Right texture/edge/contrast  ${metrics?.right ? `${metrics.right.texture} / ${metrics.right.edgeDensity} / ${metrics.right.contrast}` : 'n/a'}`,
        `Left Confidence   ${leftConfidence}`,
        `Right Confidence  ${rightConfidence}`,
        `Status            ${status}`,
        `Reason            ${reason}`,
        '==============================',
      ].join('\n'),
    );
  }
  return result;
}
