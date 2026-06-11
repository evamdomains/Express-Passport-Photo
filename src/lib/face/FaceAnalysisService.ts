'use client';

import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { BiometricData, BiometricConfig } from '@/types/biometric';
import { buildBiometrics, emptyBiometrics, INNER_MOUTH_IDX, type LM } from './landmarks';
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

/**
 * Analyse an uploaded image file and return biometric measurements.
 * Throws if the image cannot be decoded; returns `faceDetected:false` if the
 * model runs but finds no face.
 */
export async function analyzeImageFile(file: File, cfg: BiometricConfig): Promise<BiometricData> {
  const bitmap = await createImageBitmap(file);
  try {
    const landmarker = await getLandmarker();
    const result = landmarker.detect(bitmap);
    const faces = result.faceLandmarks ?? [];
    if (faces.length === 0) {
      return emptyBiometrics(bitmap.width, bitmap.height);
    }
    const categories = result.faceBlendshapes?.[0]?.categories;
    const matrixData = result.facialTransformationMatrixes?.[0]?.data;
    const teeth = teethVisibility(faces[0], bitmap);
    return buildBiometrics(
      faces[0],
      categories,
      matrixData ? Array.from(matrixData) : undefined,
      bitmap.width,
      bitmap.height,
      faces.length,
      cfg,
      teeth,
    );
  } finally {
    bitmap.close?.();
  }
}
