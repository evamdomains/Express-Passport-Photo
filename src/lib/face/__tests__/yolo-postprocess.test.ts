import { describe, it, expect } from 'vitest';
import { COCO_CLASSES, decodeYoloOutput, nms, toDetectedObjects } from '@/lib/face/yolo-postprocess';

// Build a synthetic YOLOv8 output [1, 84, numBoxes] (layout: 4 box + 80 classes,
// each attribute is a contiguous row of `numBoxes` values).
function makeOutput(numBoxes: number, boxes: { cx: number; cy: number; w: number; h: number; classId: number; score: number }[]) {
  const data = new Float32Array(84 * numBoxes);
  boxes.forEach((b, i) => {
    data[0 * numBoxes + i] = b.cx;
    data[1 * numBoxes + i] = b.cy;
    data[2 * numBoxes + i] = b.w;
    data[3 * numBoxes + i] = b.h;
    data[(4 + b.classId) * numBoxes + i] = b.score;
  });
  return data;
}

const phone = COCO_CLASSES.indexOf('cell phone');

describe('YOLOv8 post-processing', () => {
  it('decodes the best class + box per anchor above the confidence floor', () => {
    const data = makeOutput(2, [
      { cx: 320, cy: 320, w: 100, h: 200, classId: phone, score: 0.9 },
      { cx: 10, cy: 10, w: 5, h: 5, classId: phone, score: 0.1 }, // below floor
    ]);
    const dets = decodeYoloOutput(data, { numBoxes: 2, confThreshold: 0.3 });
    expect(dets).toHaveLength(1);
    expect(dets[0].classId).toBe(phone);
    expect(dets[0].score).toBeCloseTo(0.9, 5);
    // cxcywh → xyxy
    expect(dets[0].x1).toBeCloseTo(270, 5);
    expect(dets[0].y1).toBeCloseTo(220, 5);
    expect(dets[0].x2).toBeCloseTo(370, 5);
    expect(dets[0].y2).toBeCloseTo(420, 5);
  });

  it('NMS suppresses overlapping duplicates, keeping the highest score', () => {
    const data = makeOutput(2, [
      { cx: 320, cy: 320, w: 100, h: 200, classId: phone, score: 0.9 },
      { cx: 322, cy: 318, w: 100, h: 200, classId: phone, score: 0.6 }, // heavy overlap
    ]);
    const kept = nms(decodeYoloOutput(data, { numBoxes: 2, confThreshold: 0.3 }), 0.45);
    expect(kept).toHaveLength(1);
    expect(kept[0].score).toBeCloseTo(0.9, 5);
  });

  it('maps 640-space boxes back through the letterbox to normalized source coords', () => {
    // 1280×720 source → scale 0.5, newW 640, newH 360, padY (640-360)/2 = 140.
    const lb = { scale: 0.5, padX: 0, padY: 140 };
    const det = [{ x1: 0, y1: 140, x2: 640, y2: 500, score: 0.9, classId: phone }];
    const [obj] = toDetectedObjects(det, lb, 1280, 720);
    expect(obj.category).toBe('cell phone');
    expect(obj.box.x).toBeCloseTo(0, 3);
    expect(obj.box.y).toBeCloseTo(0, 3);
    expect(obj.box.width).toBeCloseTo(1, 3);
    expect(obj.box.height).toBeCloseTo(1, 3);
  });
});
