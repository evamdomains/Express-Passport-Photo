'use client';

import * as ort from 'onnxruntime-web';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { suppressMediapipeConsoleNoise } from './suppress-mediapipe-logs';
import { OBJECT_DETECTION } from './object-detection-config';
import {
  decodeYoloOutput,
  nms,
  toDetectedObjects,
  type Letterbox,
} from './yolo-postprocess';
import type { DetectedObject } from './object-compliance';

/**
 * Primary object detector: YOLOv8 Nano (self-hosted ONNX, run in-browser via
 * onnxruntime-web wasm). Replaces the former MediaPipe ObjectDetector entirely.
 *
 * COCO-80 classes are detected by YOLO; COCO has no `hand` class, so hand
 * obstruction is covered by MediaPipe HandLandmarker, whose boxes are merged in
 * as `hand` detections. The combined list feeds the same evaluateObjects() rules.
 *
 * Self-hosted assets (no dynamic download):
 *   /models/yolov8n.onnx
 *   /models/ort/ort-wasm-simd-threaded.{wasm,mjs}
 *   /models/hand_landmarker.task
 */

const MODEL_PATH = '/models/yolov8n.onnx';
const INPUT = 640;

let sessionPromise: Promise<ort.InferenceSession> | null = null;
let handsPromise: Promise<HandLandmarker> | null = null;

function getSession(): Promise<ort.InferenceSession> {
  if (!sessionPromise) {
    // Self-hosted wasm, single-threaded (no SharedArrayBuffer / COOP-COEP needed).
    ort.env.wasm.wasmPaths = '/models/ort/';
    ort.env.wasm.numThreads = 1;
    sessionPromise = ort.InferenceSession.create(MODEL_PATH, { executionProviders: ['wasm'] }).catch((err) => {
      sessionPromise = null;
      throw err;
    });
  }
  return sessionPromise;
}

function getHands(): Promise<HandLandmarker> {
  if (!handsPromise) {
    suppressMediapipeConsoleNoise();
    handsPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks('/models/wasm');
      return HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: '/models/hand_landmarker.task' },
        runningMode: 'IMAGE',
        numHands: 2,
      });
    })().catch((err) => {
      handsPromise = null;
      throw err;
    });
  }
  return handsPromise;
}

/** Letterbox the bitmap into a 640×640 RGB NCHW tensor. */
function preprocess(bitmap: ImageBitmap): { tensor: ort.Tensor; lb: Letterbox } {
  const origW = bitmap.width;
  const origH = bitmap.height;
  const scale = Math.min(INPUT / origW, INPUT / origH);
  const newW = Math.round(origW * scale);
  const newH = Math.round(origH * scale);
  const padX = Math.floor((INPUT - newW) / 2);
  const padY = Math.floor((INPUT - newH) / 2);

  const canvas =
    typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(INPUT, INPUT) : document.createElement('canvas');
  canvas.width = INPUT;
  canvas.height = INPUT;
  const ctx = canvas.getContext('2d', { willReadFrequently: true }) as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D;
  ctx.fillStyle = '#727272'; // neutral grey pad (ultralytics uses 114,114,114)
  ctx.fillRect(0, 0, INPUT, INPUT);
  ctx.drawImage(bitmap as CanvasImageSource, padX, padY, newW, newH);
  const { data } = ctx.getImageData(0, 0, INPUT, INPUT);

  // HWC uint8 RGBA → CHW float32 RGB normalized 0..1.
  const chw = new Float32Array(3 * INPUT * INPUT);
  const area = INPUT * INPUT;
  for (let p = 0; p < area; p++) {
    chw[p] = data[p * 4] / 255; // R
    chw[area + p] = data[p * 4 + 1] / 255; // G
    chw[2 * area + p] = data[p * 4 + 2] / 255; // B
  }
  return { tensor: new ort.Tensor('float32', chw, [1, 3, INPUT, INPUT]), lb: { scale, padX, padY } };
}

/** Run YOLOv8n on the image; returns COCO detections as normalized boxes. */
async function detectYolo(bitmap: ImageBitmap): Promise<DetectedObject[]> {
  const session = await getSession();
  const { tensor, lb } = preprocess(bitmap);
  const feeds: Record<string, ort.Tensor> = { [session.inputNames[0]]: tensor };
  const result = await session.run(feeds);
  const output = result[session.outputNames[0]];
  const data = output.data as Float32Array;
  const [, ch, boxes] = output.dims as number[]; // [1, 84, 8400]
  const raw = decodeYoloOutput(data, { numClasses: ch - 4, numBoxes: boxes, confThreshold: OBJECT_DETECTION.scoreFloor });
  return toDetectedObjects(nms(raw), lb, bitmap.width, bitmap.height);
}

/** Hand bounding boxes (normalized) from MediaPipe HandLandmarker, as `hand` detections. */
async function detectHands(bitmap: ImageBitmap): Promise<DetectedObject[]> {
  try {
    const hands = await getHands();
    const res = hands.detect(bitmap);
    // HandLandmarker only returns hands it is confident about → fixed 0.9.
    return (res.landmarks ?? []).map((lmks) => {
      let minX = 1, minY = 1, maxX = 0, maxY = 0;
      for (const p of lmks) {
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      }
      return {
        category: 'hand',
        score: 0.9,
        box: { x: Math.max(0, minX), y: Math.max(0, minY), width: Math.min(1, maxX) - minX, height: Math.min(1, maxY) - minY },
      };
    });
  } catch {
    return []; // hands are best-effort; never block on their failure
  }
}

function makeCanvas(w: number, h: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

/**
 * Variance-of-Laplacian sharpness of an object ROI (same metric as the face
 * sharpness in FaceAnalysisService, so the two are comparable for the baby
 * depth-of-field check). Returns null if it can't be sampled.
 */
function roiSharpness(bitmap: ImageBitmap, box: DetectedObject['box']): number | null {
  try {
    const W = bitmap.width, H = bitmap.height;
    const sx = Math.max(0, Math.floor(box.x * W));
    const sy = Math.max(0, Math.floor(box.y * H));
    const sw = Math.min(W - sx, Math.ceil(box.width * W));
    const sh = Math.min(H - sy, Math.ceil(box.height * H));
    if (sw < 16 || sh < 16) return null;
    const dw = Math.max(16, Math.min(256, sw));
    const dh = Math.max(16, Math.round(dw * (sh / sw)));
    const canvas = makeCanvas(dw, dh);
    const ctx = canvas.getContext('2d', { willReadFrequently: true }) as
      | CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!ctx) return null;
    ctx.drawImage(bitmap as CanvasImageSource, sx, sy, sw, sh, 0, 0, dw, dh);
    const { data } = ctx.getImageData(0, 0, dw, dh);
    const g = new Float64Array(dw * dh);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) g[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    let n = 0, sum = 0, sq = 0;
    for (let y = 1; y < dh - 1; y++) for (let x = 1; x < dw - 1; x++) {
      const i = y * dw + x;
      const lap = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - dw] - g[i + dw];
      sum += lap; sq += lap * lap; n++;
    }
    if (!n) return null;
    const mean = sum / n;
    return Math.round(Math.max(0, sq / n - mean * mean) * 10) / 10;
  } catch {
    return null;
  }
}

/**
 * Detect all prohibited objects (YOLO COCO + MediaPipe hands) in an uploaded
 * image. Boxes are normalized 0..1. Also returns the sharpest physical-object
 * ROI sharpness (for the baby depth-of-field check). Best-effort: any failure
 * throws to the caller, which treats object detection as unavailable.
 */
export async function detectObjectsFromFile(
  file: File,
): Promise<{ detections: DetectedObject[]; objectSharpness: number | null }> {
  const bitmap = await createImageBitmap(file);
  try {
    const [objects, hands] = await Promise.all([detectYolo(bitmap), detectHands(bitmap)]);
    // Sharpest non-person object ROI — "passport sharp, face blurry" depth-of-field signal.
    let objectSharpness: number | null = null;
    for (const d of objects) {
      if (d.category === 'person') continue;
      const s = roiSharpness(bitmap, d.box);
      if (s != null && (objectSharpness == null || s > objectSharpness)) objectSharpness = s;
    }
    return { detections: [...objects, ...hands], objectSharpness };
  } finally {
    bitmap.close?.();
  }
}
