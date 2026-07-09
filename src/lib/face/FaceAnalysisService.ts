'use client';

import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { BiometricData, BiometricConfig, ImageQualityMetrics } from '@/types/biometric';
import { buildBiometrics, emptyBiometrics, INNER_MOUTH_IDX, IDX, type LM } from './landmarks';
import { estimateEyeGaze } from './EyeGazeEstimator';
import { evaluateEyeVisibility } from './EyeVisibilityEvaluator';
import { buildEyeRegions } from './EyeOcclusionEvaluator';
import { EYE_OCCLUSION_CONFIG } from './eye-occlusion-rules';
import { evaluateEyePixelVisibility, type EyeCropMetric } from './EyePixelVisibilityEvaluator';
import { computeFaceQualityScore } from './quality-config';
import { EXPOSURE } from './image-quality';
import { suppressMediapipeConsoleNoise } from './suppress-mediapipe-logs';

/**
 * FaceAnalysisService — browser-only wrapper around MediaPipe Tasks Vision
 * Face Landmarker. Lazily loads the self-hosted model + wasm from /public, runs
 * detection on an uploaded image, and returns structured `BiometricData`.
 *
 * Designed to be called behind a try/catch: any failure (unsupported browser,
 * HEIC decode failure, model load error) should let the caller fall back to the
 * server pipeline (PhotoRoom + Rekognition) with no crop.
 */

const WASM_PATH = '/models/wasm';
const MODEL_PATH = '/models/face_landmarker.task';

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

async function getLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    // Downgrade MediaPipe/TFLite benign INFO logs before the runtime loads, so
    // they don't trip Next.js's dev error overlay. Real errors still surface.
    suppressMediapipeConsoleNoise();
    landmarkerPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
      return FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_PATH },
        runningMode: 'IMAGE',
        numFaces: 2,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      });
    })().catch((err) => {
      // Allow a later retry if the first load failed (e.g. transient network).
      landmarkerPromise = null;
      throw err;
    });
  }
  return landmarkerPromise;
}

/** Warm the model/wasm cache ahead of time (optional). */
export function preloadFaceLandmarker(): void {
  getLandmarker().catch(() => {});
}

function makeCanvas(w: number, h: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/**
 * Teeth-detection stage. Builds a mouth ROI from the inner-lip landmarks and
 * measures the fraction of pixels that look like teeth/enamel — bright, low
 * saturation, and not lip-red. Returns 0..1; the engine fails the mouth axis
 * above the country's teethThreshold. Conservative: returns 0 only if it truly
 * cannot sample (so it never fabricates teeth, and open-mouth geometry still
 * catches gaps independently).
 */
function teethVisibility(lm: LM[], bitmap: ImageBitmap): number {
  try {
    let minX = 1, minY = 1, maxX = 0, maxY = 0;
    for (const i of INNER_MOUTH_IDX) {
      const p = lm[i];
      if (!p) continue;
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }
    const W = bitmap.width, H = bitmap.height;
    const x = Math.max(0, Math.floor(minX * W));
    const y = Math.max(0, Math.floor(minY * H));
    const w = Math.min(W - x, Math.ceil((maxX - minX) * W));
    const h = Math.min(H - y, Math.ceil((maxY - minY) * H));
    if (w < 3 || h < 3) return 0;

    const canvas = makeCanvas(W, H);
    const ctx = canvas.getContext('2d', { willReadFrequently: true }) as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null;
    if (!ctx) return 0;
    ctx.drawImage(bitmap as CanvasImageSource, 0, 0);
    const { data } = ctx.getImageData(x, y, w, h);

    let tooth = 0;
    let total = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      total++;
      const bright = (r + g + b) / 3;
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      const lipRed = r > g + 22 && r > b + 22;
      if (bright > 150 && sat < 55 && !lipRed) tooth++;
    }
    return total ? tooth / total : 0;
  } catch {
    return 0;
  }
}

// ── Image-quality (sharpness / contrast / edge) measured from PIXELS ─────────
// These run on the actual image, NOT on landmarks, so a blurry/low-quality photo
// fails even though MediaPipe still estimates a face.

interface Box { x: number; y: number; width: number; height: number }

/** Draw a normalized ROI of the bitmap, downscaled to ~targetW, as a grayscale buffer. */
function roiGray(bitmap: ImageBitmap, box: Box, targetW: number): { gray: Float64Array; w: number; h: number } | null {
  const W = bitmap.width, H = bitmap.height;
  let sx = Math.floor(Math.max(0, box.x) * W);
  let sy = Math.floor(Math.max(0, box.y) * H);
  let sw = Math.ceil(box.width * W);
  let sh = Math.ceil(box.height * H);
  sx = Math.min(sx, W - 1); sy = Math.min(sy, H - 1);
  sw = Math.max(1, Math.min(sw, W - sx)); sh = Math.max(1, Math.min(sh, H - sy));
  if (sw < 8 || sh < 8) return null;

  const dw = Math.max(8, Math.min(targetW, sw));
  const dh = Math.max(8, Math.round(dw * (sh / sw)));
  const canvas = makeCanvas(dw, dh);
  const ctx = canvas.getContext('2d', { willReadFrequently: true }) as
    | CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!ctx) return null;
  ctx.drawImage(bitmap as CanvasImageSource, sx, sy, sw, sh, 0, 0, dw, dh);
  const { data } = ctx.getImageData(0, 0, dw, dh);
  const gray = new Float64Array(dw * dh);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return { gray, w: dw, h: dh };
}

const EDGE_MAG = 12; // |Laplacian| above this counts as a strong edge

/** Variance of the Laplacian (sharpness) + strong-edge density over a gray buffer. */
function laplacianStats(gray: Float64Array, w: number, h: number): { variance: number; edgeDensity: number } {
  let n = 0, sum = 0, sumSq = 0, strong = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const lap = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w];
      sum += lap; sumSq += lap * lap; n++;
      if (Math.abs(lap) > EDGE_MAG) strong++;
    }
  }
  if (!n) return { variance: 0, edgeDensity: 0 };
  const mean = sum / n;
  return { variance: Math.max(0, sumSq / n - mean * mean), edgeDensity: strong / n };
}

/** Luminance std-dev (0..1) — contrast. */
function contrastOf(gray: Float64Array): number {
  let s = 0, sq = 0;
  for (const v of gray) { s += v; sq += v * v; }
  const n = gray.length || 1;
  const m = s / n;
  return Math.sqrt(Math.max(0, sq / n - m * m)) / 255;
}

/** Face-region exposure metrics (mean brightness, under/over, shadows, left↔right
 *  balance) over the gray ROI. Mirrors the server analyzer so the gate agrees. */
function exposureOf(gray: Float64Array, w: number, h: number): {
  meanBrightness: number;
  underExposureScore: number;
  overExposureScore: number;
  shadowScore: number;
  lightingBalanceScore: number;
} {
  const n = gray.length || 1;
  let sum = 0, dark = 0, bright = 0;
  for (const v of gray) {
    sum += v;
    if (v < EXPOSURE.darkPx) dark++;
    if (v > EXPOSURE.brightPx) bright++;
  }
  const meanBrightness = sum / n;
  const shadowThresh = Math.max(0, meanBrightness - EXPOSURE.shadowDelta);
  let shadow = 0;
  for (const v of gray) if (v < shadowThresh) shadow++;

  // Left ↔ right balance over the two half-width columns of the ROI.
  const half = Math.floor(w / 2);
  let lSum = 0, lN = 0, rSum = 0, rN = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = gray[y * w + x];
      if (x < half) { lSum += v; lN++; } else { rSum += v; rN++; }
    }
  }
  const lightingBalanceScore = lN && rN ? Math.abs(lSum / lN - rSum / rN) : 0;

  return {
    meanBrightness: round(meanBrightness, 1),
    underExposureScore: round(dark / n, 3),
    overExposureScore: round(bright / n, 3),
    shadowScore: round(shadow / n, 3),
    lightingBalanceScore: round(lightingBalanceScore, 1),
  };
}

/**
 * Eyeglasses signal: strong-edge density on the NOSE BRIDGE (between the eyes) ÷
 * smooth cheek skin. A glasses bridge/frame is a hard edge bare skin lacks, so
 * the ratio spikes. The cheek baseline normalizes for image sharpness, and the
 * ROI sits between the eyes (below the brows) — so thick eyebrows, eye shadows,
 * and natural shadows don't trip it. Returns undefined when not sampleable.
 */
function detectGlassesScore(lm: LM[], bitmap: ImageBitmap): number | undefined {
  try {
    const rIn = lm[IDX.rEyeIn], lIn = lm[IDX.lEyeIn];
    const rUp = lm[IDX.rEyeUp], lUp = lm[IDX.lEyeUp], rLow = lm[IDX.rEyeLow];
    const nose = lm[IDX.noseTip], chin = lm[IDX.chin];
    if (!rIn || !lIn || !rUp || !lUp) return undefined;

    const cx = (rIn.x + lIn.x) / 2;
    const gap = Math.abs(lIn.x - rIn.x) || 0.04;
    const eyeTopY = (rUp.y + lUp.y) / 2;
    const innerY = (rIn.y + lIn.y) / 2;
    const noseY = nose ? nose.y : innerY + gap * 1.6;

    // Tall, narrow strip down the nose midline between the eyes: it contains the
    // glasses frame-top + bridge wherever they sit, and is bare smooth skin
    // otherwise. Eyebrows sit ABOVE/LATERAL to this strip, so they don't count.
    // Sampled at higher res so thin wire frames still register as edges.
    const top = eyeTopY - gap * 0.45;
    const bottom = innerY + (noseY - innerY) * 0.55;
    const bridgeBox: Box = { x: cx - gap * 0.5, y: top, width: gap, height: Math.max(bottom - top, gap * 0.8) };

    // Smooth-skin reference under the right eye (mid-cheek) for sharpness baseline.
    const cheekTop = rLow ? rLow.y + (chin ? (chin.y - rLow.y) * 0.22 : 0.04) : innerY + 0.07;
    const cheekBox: Box = { x: rIn.x - gap * 0.2, y: cheekTop, width: gap, height: gap * 0.9 };

    const bridge = roiGray(bitmap, bridgeBox, 128);
    if (!bridge) return undefined;
    const cheek = roiGray(bitmap, cheekBox, 128);
    const bridgeStats = laplacianStats(bridge.gray, bridge.w, bridge.h);
    const cheekStats = cheek ? laplacianStats(cheek.gray, cheek.w, cheek.h) : { variance: 1, edgeDensity: 0.02 };
    // Variance-of-Laplacian ratio: a hard frame line spikes the bridge variance
    // far more than grainy skin noise does. This is the HEURISTIC FALLBACK only —
    // GlassesDetector prefers the ONNX model when present.
    return round(bridgeStats.variance / Math.max(cheekStats.variance, 1), 3);
  } catch {
    return undefined;
  }
}

/**
 * Pixel texture/contrast metric for one eye crop — the model-free occlusion signal.
 * Reuses the same ROI sampling as the sharpness check. Returns undefined when the
 * eye can't be sampled (never fabricates a failure).
 */
function eyeCropMetric(bitmap: ImageBitmap, box: Box | null): EyeCropMetric | undefined {
  if (!box) return undefined;
  const e = roiGray(bitmap, box, 96);
  if (!e) return undefined;
  const s = laplacianStats(e.gray, e.w, e.h);
  return { texture: round(s.variance, 1), edgeDensity: round(s.edgeDensity, 4), contrast: round(contrastOf(e.gray), 4) };
}

/**
 * TIGHT eye crop — just the palpebral fissure (lids + iris + sclera + corners), with
 * minimal padding so the pixel analysis sees the EYE, not the eyebrow/forehead/cheek.
 */
function tightEyeBox(inn: LM, out: LM, up: LM, low: LM): Box | null {
  if (!inn || !out || !up || !low) return null;
  const left = Math.min(inn.x, out.x), right = Math.max(inn.x, out.x);
  const top = Math.min(up.y, low.y), bottom = Math.max(up.y, low.y);
  const padX = (right - left) * 0.1, padY = (bottom - top) * 0.35;
  return { x: left - padX, y: top - padY, width: (right - left) + 2 * padX, height: (bottom - top) + 2 * padY };
}

function eyeBox(inn: LM, out: LM, up: LM, low: LM): Box | null {
  if (!inn || !out || !up || !low) return null;
  const left = Math.min(inn.x, out.x), right = Math.max(inn.x, out.x);
  const top = Math.min(up.y, low.y), bottom = Math.max(up.y, low.y);
  const padX = (right - left) * 0.25, padY = (bottom - top) * 1.4 + 0.01;
  return { x: left - padX, y: top - padY, width: (right - left) + 2 * padX, height: (bottom - top) + 2 * padY };
}

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

/** Measure sharpness/contrast/edge over the face + eye ROIs. */
function computeImageQuality(lm: LM[], bitmap: ImageBitmap): ImageQualityMetrics {
  const unknown: ImageQualityMetrics = {
    sharpnessScore: 0, eyeSharpness: 0, contrast: 0, edgeDensity: 0, faceQualityScore: 0, measured: false,
  };
  try {
    const cheekR = lm[IDX.cheekRight], cheekL = lm[IDX.cheekLeft], fore = lm[IDX.foreheadTop], chin = lm[IDX.chin];
    if (!cheekR || !cheekL || !fore || !chin) return unknown;
    const left = Math.min(cheekR.x, cheekL.x), right = Math.max(cheekR.x, cheekL.x);
    const faceBox: Box = { x: left, y: fore.y, width: right - left, height: chin.y - fore.y };

    const face = roiGray(bitmap, faceBox, 256);
    if (!face) return unknown;
    const fl = laplacianStats(face.gray, face.w, face.h);
    const contrast = contrastOf(face.gray);
    const sharpnessScore = round(fl.variance, 1);
    const edgeDensity = round(fl.edgeDensity, 4);

    const eyeVars: number[] = [];
    const rBox = eyeBox(lm[IDX.rEyeIn], lm[IDX.rEyeOut], lm[IDX.rEyeUp], lm[IDX.rEyeLow]);
    const lBox = eyeBox(lm[IDX.lEyeIn], lm[IDX.lEyeOut], lm[IDX.lEyeUp], lm[IDX.lEyeLow]);
    for (const b of [rBox, lBox]) {
      if (!b) continue;
      const e = roiGray(bitmap, b, 96);
      if (e) eyeVars.push(laplacianStats(e.gray, e.w, e.h).variance);
    }
    // No usable eye ROI → fall back to face sharpness (don't fabricate a failure).
    const eyeSharpness = eyeVars.length ? round(Math.min(...eyeVars), 1) : sharpnessScore;

    const faceQualityScore = computeFaceQualityScore({ sharpnessScore, contrast, edgeDensity });
    const exposure = exposureOf(face.gray, face.w, face.h);
    const glassesScore = detectGlassesScore(lm, bitmap);
    return {
      sharpnessScore,
      eyeSharpness,
      contrast: round(contrast, 4),
      edgeDensity,
      faceQualityScore,
      ...exposure,
      glassesScore,
      measured: true,
    };
  } catch {
    return unknown;
  }
}

/**
 * Analyse an uploaded image file: returns biometric measurements AND pixel-based
 * image-quality metrics from a single decode + detect pass. Throws if the image
 * cannot be decoded; returns `faceDetected:false` if the model finds no face.
 */
async function analyzeBitmap(
  bitmap: ImageBitmap,
  cfg: BiometricConfig,
): Promise<{ bio: BiometricData; quality?: ImageQualityMetrics }> {
  const landmarker = await getLandmarker();
  const result = landmarker.detect(bitmap);
  const faces = result.faceLandmarks ?? [];
  if (faces.length === 0) {
    return { bio: emptyBiometrics(bitmap.width, bitmap.height) };
  }
  const categories = result.faceBlendshapes?.[0]?.categories;
  const matrixData = result.facialTransformationMatrixes?.[0]?.data;
  const teeth = teethVisibility(faces[0], bitmap);
  const bio = buildBiometrics(
    faces[0],
    categories,
    matrixData ? Array.from(matrixData) : undefined,
    bitmap.width,
    bitmap.height,
    faces.length,
    cfg,
    teeth,
  );
  // Eye-gaze MEASUREMENT (pure geometry; no PASS/FAIL). Computed here where the
  // raw MediaPipe landmarks exist, then attached to `bio` so the compliance
  // engine can apply document-specific gaze rules on the gate AND the server.
  // `headPitchDeg` enables vertical perspective compensation (camera above eyes);
  // `headYawDeg` lets the estimator lower confidence when the head is turned far
  // off-axis (iris-based gaze degrades under strong yaw). Neither changes direction.
  //
  // ADULT PIPELINE ONLY: run the Eye VISIBILITY gate first. If the eyes aren't
  // usable (one closed, iris not found, covered/occluded), we do NOT estimate gaze
  // — the estimator early-exits to UNKNOWN. Infants keep their existing behaviour
  // (relaxed eye rules; gaze unused), so visibility is skipped for them entirely.
  const visibility = cfg.infant ? undefined : evaluateEyeVisibility(faces[0]);
  const gaze = estimateEyeGaze(faces[0], {
    headPitchDeg: bio.pitch,
    headYawDeg: bio.yaw,
    // Only a genuine NOT_VISIBLE blocks gaze; VISIBLE / PARTIAL / UNKNOWN all run it.
    eyesVisible: visibility ? visibility.status !== 'NOT_VISIBLE' : true,
  });
  // Eye REGION boxes (from the eye landmarks) — consumed by the occlusion check once
  // object detections are available (adult pipeline only; infants skip).
  const eyeRegions = cfg.infant ? undefined : buildEyeRegions(faces[0], EYE_OCCLUSION_CONFIG.EYE_REGION_PADDING) ?? undefined;

  // PIXEL eye-visibility (adult only): texture/contrast of each eye crop catches a
  // covered eye that MediaPipe's estimated landmarks can't reveal (blindfold / cloth
  // / hand). Uses the SAME eye ROIs as the sharpness check.
  const eyePixelVisibility = cfg.infant
    ? undefined
    : evaluateEyePixelVisibility({
        left: eyeCropMetric(bitmap, tightEyeBox(faces[0][IDX.lEyeIn], faces[0][IDX.lEyeOut], faces[0][IDX.lEyeUp], faces[0][IDX.lEyeLow])),
        right: eyeCropMetric(bitmap, tightEyeBox(faces[0][IDX.rEyeIn], faces[0][IDX.rEyeOut], faces[0][IDX.rEyeUp], faces[0][IDX.rEyeLow])),
      });

  const quality = computeImageQuality(faces[0], bitmap);
  return { bio: { ...bio, gaze, eyeVisibility: visibility, eyeRegions, eyePixelVisibility }, quality };
}

export async function analyzeImageFile(
  file: File,
  cfg: BiometricConfig,
): Promise<{ bio: BiometricData; quality?: ImageQualityMetrics }> {
  const bitmap = await createImageBitmap(file);
  try {
    return await analyzeBitmap(bitmap, cfg);
  } finally {
    bitmap.close?.();
  }
}

/**
 * Heuristic-fallback eyeglasses score (nose-bridge ÷ cheek variance ratio) for a
 * bitmap. Used by GlassesDetector ONLY when the ONNX model is unavailable.
 * Returns undefined when no face is visible / not sampleable.
 */
export async function detectGlassesScoreFromBitmap(bitmap: ImageBitmap): Promise<number | undefined> {
  try {
    const landmarker = await getLandmarker();
    const result = landmarker.detect(bitmap);
    const faces = result.faceLandmarks ?? [];
    if (faces.length === 0) return undefined;
    return detectGlassesScore(faces[0], bitmap);
  } catch {
    return undefined;
  }
}
