import { OBJECT_CATEGORY_MAP, OBJECT_DETECTION, type BabyObjectKind } from './object-detection-config';

/**
 * Pure evaluator (no MediaPipe / DOM) that turns object detections into a
 * baby-object compliance verdict. Unit-testable with synthetic detections.
 */

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
} // normalized 0..1

export interface DetectedObject {
  category: string;
  score: number;
  box: Box;
}

export interface BabyObjectItem {
  label: string;
  kind: BabyObjectKind;
  score: number;
  status: 'WARNING' | 'FAIL';
  coversFace: boolean;
}

export interface BabyObjectsResult {
  status: 'PASS' | 'WARNING' | 'FAIL';
  reason: string;
  items: BabyObjectItem[];
}

/** Fraction of the FACE box that the object box covers (0..1). */
function faceCoverage(obj: Box, face: Box): number {
  const ix = Math.max(0, Math.min(obj.x + obj.width, face.x + face.width) - Math.max(obj.x, face.x));
  const iy = Math.max(0, Math.min(obj.y + obj.height, face.y + face.height) - Math.max(obj.y, face.y));
  const inter = ix * iy;
  const faceArea = face.width * face.height;
  return faceArea > 0 ? inter / faceArea : 0;
}

export function evaluateBabyObjects(detections: DetectedObject[], faceBox: Box | null): BabyObjectsResult {
  const items: BabyObjectItem[] = [];

  for (const d of detections) {
    if (d.score < OBJECT_DETECTION.scoreFloor) continue;
    const mapped = OBJECT_CATEGORY_MAP[d.category?.toLowerCase?.() ?? ''];
    if (!mapped) continue;

    const cover = faceBox ? faceCoverage(d.box, faceBox) : 0;

    // The baby itself registers as a `person` that overlaps the face — skip it;
    // only an EXTRA person (parent beside/behind) should count.
    if (mapped.kind === 'person' && cover > 0.5) continue;

    const failThr = OBJECT_DETECTION.fail[mapped.kind] ?? 0.6;
    const coversFace = cover >= OBJECT_DETECTION.faceCoverOverlap;

    let status: 'WARNING' | 'FAIL' | null = null;
    if (coversFace || d.score >= failThr) status = 'FAIL';
    else if (d.score >= OBJECT_DETECTION.warnLow) status = 'WARNING';

    if (status) {
      items.push({ label: mapped.label, kind: mapped.kind, score: Math.round(d.score * 100) / 100, status, coversFace });
    }
  }

  const fail = items.find((i) => i.status === 'FAIL');
  if (fail) {
    return {
      status: 'FAIL',
      reason: fail.coversFace
        ? `Baby's face is partially covered (${fail.label.toLowerCase()}). Keep the face fully visible.`
        : `${fail.label} detected. Remove it and keep the baby alone in the frame.`,
      items,
    };
  }
  const warn = items.find((i) => i.status === 'WARNING');
  if (warn) {
    return { status: 'WARNING', reason: `Possible ${warn.label.toLowerCase()} detected. Please review the image.`, items };
  }
  return { status: 'PASS', reason: 'No hand, pacifier, toy, or bottle detected.', items: [] };
}
