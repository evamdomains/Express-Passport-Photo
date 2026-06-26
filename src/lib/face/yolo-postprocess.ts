import type { DetectedObject } from './object-compliance';

/**
 * Pure YOLOv8 post-processing (no DOM / no onnxruntime) so it is unit-testable.
 * Decodes the standard ultralytics export output `output0` of shape
 * [1, 84, 8400] — 84 = 4 box (cx,cy,w,h in the 640 letterboxed space) + 80 COCO
 * class scores (already probabilities; no objectness, no sigmoid) — applies a
 * confidence floor + class-agnostic NMS, then maps boxes back through the
 * letterbox to NORMALIZED (0..1) coordinates of the ORIGINAL image.
 */

/** COCO-80 class names in ultralytics index order. */
export const COCO_CLASSES = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat', 'traffic light',
  'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
  'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
  'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard',
  'tennis racket', 'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
  'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
  'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard',
  'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors',
  'teddy bear', 'hair drier', 'toothbrush',
] as const;

export interface RawDetection {
  x1: number; y1: number; x2: number; y2: number; // xyxy in the 640 letterboxed space
  score: number;
  classId: number;
}

/** Letterbox parameters used to map 640-space boxes back to the source image. */
export interface Letterbox {
  scale: number; // source px → 640 px
  padX: number;  // left/right pad added in 640 space
  padY: number;  // top/bottom pad added in 640 space
}

/** Decode raw YOLOv8 output [1, numClasses+4, numBoxes] → candidate detections. */
export function decodeYoloOutput(
  data: Float32Array | number[],
  opts: { numClasses?: number; numBoxes?: number; confThreshold: number },
): RawDetection[] {
  const numClasses = opts.numClasses ?? 80;
  const numBoxes = opts.numBoxes ?? 8400;
  const out: RawDetection[] = [];

  for (let i = 0; i < numBoxes; i++) {
    // Find the best class for this anchor.
    let best = -1;
    let bestScore = 0;
    for (let c = 0; c < numClasses; c++) {
      const s = data[(4 + c) * numBoxes + i];
      if (s > bestScore) {
        bestScore = s;
        best = c;
      }
    }
    if (best < 0 || bestScore < opts.confThreshold) continue;

    const cx = data[0 * numBoxes + i];
    const cy = data[1 * numBoxes + i];
    const w = data[2 * numBoxes + i];
    const h = data[3 * numBoxes + i];
    out.push({ x1: cx - w / 2, y1: cy - h / 2, x2: cx + w / 2, y2: cy + h / 2, score: bestScore, classId: best });
  }
  return out;
}

function iou(a: RawDetection, b: RawDetection): number {
  const ix = Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1));
  const iy = Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));
  const inter = ix * iy;
  const areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
  const areaB = (b.x2 - b.x1) * (b.y2 - b.y1);
  const union = areaA + areaB - inter;
  return union > 0 ? inter / union : 0;
}

/** Class-agnostic Non-Maximum Suppression. */
export function nms(dets: RawDetection[], iouThreshold = 0.45): RawDetection[] {
  const sorted = [...dets].sort((a, b) => b.score - a.score);
  const kept: RawDetection[] = [];
  for (const d of sorted) {
    if (kept.every((k) => iou(k, d) < iouThreshold)) kept.push(d);
  }
  return kept;
}

/** Map 640-space NMS detections back to NORMALIZED (0..1) boxes of the source image. */
export function toDetectedObjects(
  dets: RawDetection[],
  lb: Letterbox,
  origW: number,
  origH: number,
): DetectedObject[] {
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  return dets.map((d) => {
    // Undo letterbox: subtract pad, divide by scale → source px → normalize.
    const sx1 = (d.x1 - lb.padX) / lb.scale;
    const sy1 = (d.y1 - lb.padY) / lb.scale;
    const sx2 = (d.x2 - lb.padX) / lb.scale;
    const sy2 = (d.y2 - lb.padY) / lb.scale;
    const x = clamp01(sx1 / origW);
    const y = clamp01(sy1 / origH);
    return {
      category: COCO_CLASSES[d.classId] ?? '',
      score: Math.round(d.score * 1000) / 1000,
      box: {
        x,
        y,
        width: clamp01(sx2 / origW) - x,
        height: clamp01(sy2 / origH) - y,
      },
    };
  });
}
