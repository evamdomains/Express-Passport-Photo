'use client';

import * as ort from 'onnxruntime-web';

/**
 * Lazy, cached loader for the glasses ONNX model. Self-hosted (no runtime
 * download): expects the file at /public/models/glasses.onnx and the ORT wasm
 * at /public/models/ort/ (already shipped for YOLOv8n).
 *
 * Returns null — never throws — when the model is missing or fails to load, so
 * GlassesDetector cleanly falls back to the heuristic. A failed load is cached
 * (`unavailable`) so we don't re-attempt (and re-404) on every inference.
 */
export const GLASSES_MODEL_PATH = '/models/glasses.onnx';

let sessionPromise: Promise<ort.InferenceSession | null> | null = null;
let unavailable = false;

export async function loadGlassesSession(): Promise<ort.InferenceSession | null> {
  if (unavailable) return null;
  if (!sessionPromise) {
    // Self-hosted wasm, single-threaded — same setup as the YOLOv8n detector.
    ort.env.wasm.wasmPaths = '/models/ort/';
    ort.env.wasm.numThreads = 1;
    sessionPromise = ort.InferenceSession.create(GLASSES_MODEL_PATH, { executionProviders: ['wasm'] }).catch(
      (err) => {
        console.warn(
          '[glasses] ONNX model unavailable — using heuristic fallback:',
          err instanceof Error ? err.message : err,
        );
        unavailable = true; // stop retrying (e.g. 404 when no model file is present)
        return null;
      },
    );
  }
  return sessionPromise;
}
