import { OBJECT_CATEGORY_MAP, OBJECT_DETECTION, type ObjectKind } from './object-detection-config';

/**
 * Pure evaluator (no detector / DOM) that turns YOLOv8 + hand detections into
 * compliance verdicts for ALL document types. Unit-testable with synthetic
 * detections.
 *
 * Overlap-driven rules (object presence alone does not auto-fail):
 *   • Any prohibited object OVERLAPPING the face (≥ faceCoverOverlap) → FAIL
 *     (hand on cheek, passport over mouth, toy over eyes, …).
 *   • An EXTRA person (second face / parent) → FAIL regardless of overlap.
 *   • Infant docs additionally FAIL on pacifier/bottle even when not covering;
 *     a toy that's visible but NOT covering the face → WARNING.
 *   • Otherwise (object beside the body, not covering the face) → PASS.
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

/** Shape returned in the API response / shown in the panel. */
export interface DetectedObjectInfo {
  label: string;
  kind: ObjectKind;
  confidence: number;
  overlapsFace: boolean;
}

export interface ObjectItem extends DetectedObjectInfo {
  status: 'WARNING' | 'FAIL';
}

export type ComplianceStatus = 'PASS' | 'WARNING' | 'FAIL';

export interface ObjectComplianceResult {
  status: ComplianceStatus;
  reason: string;
  items: ObjectItem[];
}

export interface ObstructionResult {
  status: ComplianceStatus;
  reason: string;
}

/** Combined result the client passes to the gate (and serializes to the server). */
export interface ObjectsAndObstruction {
  objects: ObjectComplianceResult;
  obstruction: ObstructionResult;
  /** Every mapped detection, for the API response + compliance panel. */
  detectedObjects: DetectedObjectInfo[];
}

/** Fraction of the FACE box that the object box covers (0..1). */
function faceCoverage(obj: Box, face: Box): number {
  const ix = Math.max(0, Math.min(obj.x + obj.width, face.x + face.width) - Math.max(obj.x, face.x));
  const iy = Math.max(0, Math.min(obj.y + obj.height, face.y + face.height) - Math.max(obj.y, face.y));
  const inter = ix * iy;
  const faceArea = face.width * face.height;
  return faceArea > 0 ? inter / faceArea : 0;
}

export function evaluateObjects(
  detections: DetectedObject[],
  faceBox: Box | null,
  opts?: { infant?: boolean },
): ObjectsAndObstruction {
  const items: ObjectItem[] = [];
  const detectedObjects: DetectedObjectInfo[] = [];
  let anyObstruction = false;
  let coveringLabel: string | null = null;

  for (const d of detections) {
    if (d.score < OBJECT_DETECTION.scoreFloor) continue;
    const mapped = OBJECT_CATEGORY_MAP[d.category?.toLowerCase?.() ?? ''];
    if (!mapped) continue;

    const cover = faceBox ? faceCoverage(d.box, faceBox) : 0;
    const overlapsFace = cover >= OBJECT_DETECTION.faceCoverOverlap;

    // The subject themself registers as a `person` heavily overlapping the face — skip.
    if (mapped.kind === 'person' && cover > 0.5) continue;

    const info: DetectedObjectInfo = {
      label: mapped.label,
      kind: mapped.kind,
      confidence: Math.round(d.score * 100) / 100,
      overlapsFace,
    };
    detectedObjects.push(info);

    // ── Decide this detection's contribution ──
    let status: 'WARNING' | 'FAIL' | null = null;

    if (overlapsFace && d.score >= OBJECT_DETECTION.obstruction) {
      // Anything covering the face fails (hand/passport/toy/phone over the face).
      status = 'FAIL';
      anyObstruction = true;
      coveringLabel = coveringLabel ?? mapped.label;
    } else if (mapped.kind === 'person' && d.score >= OBJECT_DETECTION.presence) {
      // An extra (non-subject) person / parent → never allowed.
      status = 'FAIL';
    } else if (opts?.infant && (mapped.kind === 'pacifier' || mapped.kind === 'bottle') && d.score >= OBJECT_DETECTION.presence) {
      // Disqualifying for infants even when not covering the face.
      status = 'FAIL';
    } else if (opts?.infant && mapped.kind === 'toy' && d.score >= OBJECT_DETECTION.presence) {
      // Baby + visible toy not covering the face → advisory only.
      status = 'WARNING';
    }
    // Otherwise (object beside the body, not covering the face) → PASS (no item).

    if (status) items.push({ ...info, status });
  }

  const fail = items.find((i) => i.status === 'FAIL');
  const warn = items.find((i) => i.status === 'WARNING');
  const objects: ObjectComplianceResult = fail
    ? { status: 'FAIL', reason: 'Prohibited object detected. Remove it and keep only the face clearly visible.', items }
    : warn
      ? { status: 'WARNING', reason: `Possible ${warn.label.toLowerCase()} detected. Please review the image.`, items }
      : { status: 'PASS', reason: 'No prohibited objects detected.', items: [] };

  const obstruction: ObstructionResult =
    anyObstruction
      ? { status: 'FAIL', reason: `The face is partially covered (${(coveringLabel ?? 'object').toLowerCase()}). Keep the whole face clearly visible.` }
      : facePartiallyOutOfFrame(faceBox)
        ? { status: 'FAIL', reason: 'The face is partially out of frame. Center the head with margin on all sides.' }
        : { status: 'PASS', reason: 'Face is fully visible and unobstructed.' };

  return { objects, obstruction, detectedObjects };
}

/** True when the face box extends meaningfully past the image edges (cut off). */
function facePartiallyOutOfFrame(face: Box | null): boolean {
  if (!face) return false;
  const m = 0.02; // tolerance for hair/crown extrapolation
  return face.x < -m || face.y < -m || face.x + face.width > 1 + m || face.y + face.height > 1 + m;
}
