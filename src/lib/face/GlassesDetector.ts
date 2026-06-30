'use client';

import { loadGlassesSession } from './loadGlassesModel';
import { runGlassesInference } from './glassesInference';
import { detectGlassesScoreFromBitmap } from './FaceAnalysisService';
import { GLASSES } from './image-quality';

/**
 * Single entry point for eyeglasses detection. Prefers a real AI model
 * (YOLO/classifier ONNX at /public/models/glasses.onnx, run via the existing
 * onnxruntime-web); if the model is missing or fails, it falls back to the
 * variance-of-Laplacian heuristic. The result is the same shape either way, so
 * every caller (upload gate, live camera, human-review submit) is model-agnostic.
 *
 * The app NEVER crashes on a model problem — load/inference errors are caught
 * and logged, and the heuristic takes over.
 */
export interface GlassesResult {
  detected: boolean;
  confidence: number;
}

/** Model "glasses present" probability ≥ this ⇒ detected. */
export const GLASSES_MODEL_THRESHOLD = 0.5;

const NONE: GlassesResult = { detected: false, confidence: 0 };

export async function detectGlasses(bitmap: ImageBitmap): Promise<GlassesResult> {
  // 1 — AI model (preferred).
  try {
    const session = await loadGlassesSession();
    if (session) {
      const conf = await runGlassesInference(session, bitmap);
      if (conf != null) {
        return { detected: conf >= GLASSES_MODEL_THRESHOLD, confidence: Math.round(conf * 100) / 100 };
      }
    }
  } catch (err) {
    console.warn('[GlassesDetector] model inference failed — using heuristic:', err instanceof Error ? err.message : err);
  }

  // 2 — Heuristic fallback (variance-of-Laplacian nose-bridge ratio).
  try {
    const score = await detectGlassesScoreFromBitmap(bitmap);
    if (score == null) return NONE; // no face / not sampleable → don't fabricate
    const detected = score >= GLASSES.failRatio;
    // Map the ratio to a rough 0..1 confidence for display/storage parity.
    const confidence = Math.max(0, Math.min(1, (score - 1) / (GLASSES.failRatio * 2 - 1)));
    return { detected, confidence: Math.round(confidence * 100) / 100 };
  } catch {
    return NONE;
  }
}

/** Convenience wrapper for a File (upload / human-review submit paths). */
export async function detectGlassesFromFile(file: File): Promise<GlassesResult> {
  const bitmap = await createImageBitmap(file);
  try {
    return await detectGlasses(bitmap);
  } finally {
    bitmap.close?.();
  }
}
