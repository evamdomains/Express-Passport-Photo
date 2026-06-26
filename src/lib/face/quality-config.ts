/**
 * Image-quality thresholds for the strict compliance gate.
 *
 * All sharpness numbers are variance-of-Laplacian computed over a face/eye ROI
 * that is first resized to a fixed-width grayscale crop (see ImageQualityAnalyzer),
 * which makes them resolution-independent.
 *
 * DEFAULTS ARE DELIBERATELY CONSERVATIVE — they reject only clearly bad photos
 * (motion blur, heavy softness, near-flat low-contrast images) so genuine
 * passport photos are not false-rejected. Tune against real uploads if needed.
 */
export const QUALITY = {
  /** Variance-of-Laplacian below this → too blurry → FAIL. */
  sharpnessFail: 80,
  /** [sharpnessFail, sharpnessWarn) → soft → WARNING; ≥ sharpnessWarn → PASS. */
  sharpnessWarn: 120,
  /** Eye-ROI variance-of-Laplacian below this → eyes not clearly visible → FAIL. */
  eyeSharpnessFail: 40,
  /** Composite faceQualityScore below this → insufficient quality → FAIL. */
  faceQualityFail: 0.32,

  // Reference "good" values used to compose faceQualityScore (0..1 each).
  sharpnessRef: 200,
  contrastRef: 0.16,
  edgeDensityRef: 0.06,
} as const;

/** Blend the raw metrics into a single 0..1 face-quality score. */
export function computeFaceQualityScore(m: {
  sharpnessScore: number;
  contrast: number;
  edgeDensity: number;
}): number {
  const c01 = (v: number, ref: number) => Math.max(0, Math.min(1, v / ref));
  const score =
    0.6 * c01(m.sharpnessScore, QUALITY.sharpnessRef) +
    0.25 * c01(m.contrast, QUALITY.contrastRef) +
    0.15 * c01(m.edgeDensity, QUALITY.edgeDensityRef);
  return Math.round(score * 1000) / 1000;
}
