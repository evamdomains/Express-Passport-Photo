'use client';

import * as ort from 'onnxruntime-web';

/**
 * Generic glasses-model inference. Kept model-agnostic so a different ONNX file
 * can be dropped in without code changes, as long as it follows this contract:
 *
 *   Input:  one float32 NCHW tensor [1, 3, H, W], RGB, normalized 0..1.
 *           Square H=W=GLASSES_INPUT (default 224 — set to your model's size).
 *   Output: EITHER
 *           • a classifier  [1, K] (or [K]) of logits/probabilities, OR
 *           • a YOLO detection tensor [1, C, N] / [1, N, C].
 *
 * Returns a single "glasses present" confidence in 0..1 (the max over detections
 * for YOLO, or the glasses-class probability for a classifier), or null if the
 * output shape isn't understood (caller then falls back to the heuristic).
 */
export const GLASSES_INPUT = 224;

/** Index of the "glasses" class for a multi-class classifier output (last by default). */
export const GLASSES_CLASS_INDEX = -1;

function makeCanvas(w: number, h: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function preprocess(bitmap: ImageBitmap, size: number): ort.Tensor {
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d', { willReadFrequently: true }) as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D;
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const area = size * size;
  const chw = new Float32Array(3 * area);
  for (let p = 0; p < area; p++) {
    chw[p] = data[p * 4] / 255; // R
    chw[area + p] = data[p * 4 + 1] / 255; // G
    chw[2 * area + p] = data[p * 4 + 2] / 255; // B
  }
  return new ort.Tensor('float32', chw, [1, 3, size, size]);
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

function softmax(arr: number[]): number[] {
  const max = Math.max(...arr);
  const exps = arr.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((v) => v / sum);
}

/** True if values look like probabilities already (0..1), else treat as logits. */
const looksLikeProbs = (arr: number[]) => arr.every((v) => v >= 0 && v <= 1.0001);

export async function runGlassesInference(
  session: ort.InferenceSession,
  bitmap: ImageBitmap,
): Promise<number | null> {
  const tensor = preprocess(bitmap, GLASSES_INPUT);
  const feeds: Record<string, ort.Tensor> = { [session.inputNames[0]]: tensor };
  const result = await session.run(feeds);
  const out = result[session.outputNames[0]];
  const data = Array.from(out.data as Float32Array);
  const dims = out.dims as number[];

  // ── Classifier: [1, K] or [K] ──
  if (dims.length <= 2) {
    const k = dims[dims.length - 1];
    const logits = data.slice(0, k);
    if (k === 1) return sigmoid(logits[0]); // single logit → P(glasses)
    const probs = looksLikeProbs(logits) ? logits : softmax(logits);
    const idx = GLASSES_CLASS_INDEX < 0 ? probs.length + GLASSES_CLASS_INDEX : GLASSES_CLASS_INDEX;
    return probs[Math.max(0, Math.min(probs.length - 1, idx))];
  }

  // ── YOLO detection: [1, C, N] or [1, N, C] → max class confidence ──
  if (dims.length === 3) {
    const [, d1, d2] = dims;
    // Ultralytics exports [1, 4+nc, N]; some export [1, N, 4+nc]. Detect orientation.
    const channelsFirst = d1 < d2; // (4+nc) is usually far smaller than N (e.g. 5 vs 8400)
    const C = channelsFirst ? d1 : d2;
    const N = channelsFirst ? d2 : d1;
    const nc = C - 4; // class scores after the 4 box coords
    if (nc < 1) return null;
    let best = 0;
    for (let i = 0; i < N; i++) {
      for (let c = 0; c < nc; c++) {
        const v = channelsFirst ? data[(4 + c) * N + i] : data[i * C + 4 + c];
        const score = v > 1 ? sigmoid(v) : v;
        if (score > best) best = score;
      }
    }
    return best;
  }

  return null;
}
