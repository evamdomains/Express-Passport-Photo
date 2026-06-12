'use client';

import { ObjectDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import { suppressMediapipeConsoleNoise } from './suppress-mediapipe-logs';
import { OBJECT_DETECTION } from './object-detection-config';
import type { DetectedObject } from './baby-objects';

/**
 * Browser-only MediaPipe ObjectDetector (EfficientDet-Lite0, COCO) used ONLY
 * for US_BABY_PASSPORT. Self-hosted model in /public/models, lazy-loaded and
 * browser-cached. Does not touch the Face Landmarker.
 */

const WASM_PATH = '/models/wasm';
const MODEL_PATH = '/models/efficientdet_lite0.tflite';

let detectorPromise: Promise<ObjectDetector> | null = null;

async function getDetector(): Promise<ObjectDetector> {
  if (!detectorPromise) {
    suppressMediapipeConsoleNoise();
    detectorPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
      return ObjectDetector.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_PATH },
        runningMode: 'IMAGE',
        scoreThreshold: OBJECT_DETECTION.scoreFloor,
        maxResults: 12,
      });
    })().catch((err) => {
      detectorPromise = null;
      throw err;
    });
  }
  return detectorPromise;
}

/** Detect objects in an uploaded image; boxes normalized to 0..1. */
export async function detectBabyObjectsFromFile(file: File): Promise<DetectedObject[]> {
  const bitmap = await createImageBitmap(file);
  try {
    const detector = await getDetector();
    const result = detector.detect(bitmap);
    const W = bitmap.width || 1;
    const H = bitmap.height || 1;
    return (result.detections ?? []).map((d) => {
      const cat = d.categories?.[0];
      const bb = d.boundingBox;
      return {
        category: cat?.categoryName ?? '',
        score: cat?.score ?? 0,
        box: bb
          ? { x: bb.originX / W, y: bb.originY / H, width: bb.width / W, height: bb.height / H }
          : { x: 0, y: 0, width: 0, height: 0 },
      };
    });
  } finally {
    bitmap.close?.();
  }
}
