import type { ImageQualityMetrics } from '@/types/biometric';
import type { DetectedObjectInfo } from './object-compliance';
import { QUALITY } from './quality-config';

/**
 * STRICT baby-passport quality gate — applies ONLY to US Baby Passport.
 *
 * A baby photo passes only if ALL seven layers pass. Unlike the adult gate
 * (overlap-driven), the baby gate rejects ANY object or hand anywhere in frame,
 * any extra person, blurry face/eyes, and "object sharper than face" depth-of-
 * field cases — because a passport infant must be the sole, unassisted, sharply-
 * focused subject.
 *
 * Pure evaluator (no DOM/detector): unit-testable with synthetic inputs. Each
 * layer fail-opens when its detector signal is unavailable (so a transient model
 * failure can't reject every baby photo) — those cases are reported, not faked.
 */

export const BABY_GATE = {
  /** Face-ROI variance-of-Laplacian below this → out of focus. */
  faceSharpnessFail: QUALITY.sharpnessFail, // 80
  /** Eye-ROI variance-of-Laplacian below this → eyes not clearly visible. */
  eyeSharpnessFail: QUALITY.eyeSharpnessFail, // 40
  /** Composite face-quality below this → insufficient. */
  faceQualityFail: QUALITY.faceQualityFail, // 0.32
  /** Object sharper than face × this → face is not the sharpest subject. */
  dofRatio: 1.5,
} as const;

export type BabyLayerKey =
  | 'quality'
  | 'eyeVisibility'
  | 'objects'
  | 'hands'
  | 'extraPerson'
  | 'obstruction'
  | 'dof';

export interface BabyLayer {
  key: BabyLayerKey;
  label: string;
  status: 'PASS' | 'FAIL';
  message: string;
}

export interface BabyGateInput {
  /** Face/eye sharpness + composite quality (face ROI only). */
  quality?: ImageQualityMetrics;
  /** YOLO + hand detections (already mapped). Undefined = detector unavailable. */
  detectedObjects?: DetectedObjectInfo[];
  /** Sharpness of the sharpest detected object ROI (for depth-of-field). */
  objectSharpness?: number | null;
  /** Face count from the biometric (extra-person backstop). */
  faceCount: number;
}

const pass = (key: BabyLayerKey, label: string, message: string): BabyLayer => ({ key, label, status: 'PASS', message });
const fail = (key: BabyLayerKey, label: string, message: string): BabyLayer => ({ key, label, status: 'FAIL', message });

/** Evaluate the 7 strict baby-passport layers in display order. */
export function evaluateBabyGate(input: BabyGateInput): BabyLayer[] {
  const q = input.quality;
  const qMeasured = !!q && q.measured;
  const objs = input.detectedObjects; // undefined = unavailable
  const list = objs ?? [];

  // ── Layer 1 — Face Quality (face/feature sharpness) ──
  const quality: BabyLayer = !qMeasured
    ? pass('quality', 'Face Quality', 'Face quality not measured.')
    : q!.sharpnessScore < BABY_GATE.faceSharpnessFail || q!.faceQualityScore < BABY_GATE.faceQualityFail
      ? fail('quality', 'Face Quality', 'Baby face is out of focus.')
      : pass('quality', 'Face Quality', 'Baby face is sharp.');

  // ── Layer 2 — Eye Visibility (eye ROI sharpness) ──
  const eyeVisibility: BabyLayer = !qMeasured
    ? pass('eyeVisibility', 'Eye Visibility', 'Eye visibility not measured.')
    : q!.eyeSharpness < BABY_GATE.eyeSharpnessFail
      ? fail('eyeVisibility', 'Eye Visibility', 'Eyes are not clearly visible.')
      : pass('eyeVisibility', 'Eye Visibility', 'Eyes are clearly visible.');

  // ── Layer 3 — Object Detection (ANY object → fail; presence alone) ──
  const physical = list.filter((d) => d.kind !== 'person' && d.kind !== 'hand');
  const objectsLayer: BabyLayer = !objs
    ? pass('objects', 'Object Detection', 'Object detection unavailable.')
    : physical.length > 0
      ? fail('objects', 'Object Detection', `Please remove the ${physical.map((d) => d.label.toLowerCase()).join(', ')} (e.g. pacifier, bottle, toy) before taking your baby's photo.`)
      : pass('objects', 'Object Detection', 'No objects detected.');

  // ── Layer 4 — Hands / fingers (handCount > 0 → fail) ──
  const hands = list.filter((d) => d.kind === 'hand');
  const handsLayer: BabyLayer = !objs
    ? pass('hands', 'Hands Detection', 'Hand detection unavailable.')
    : hands.length > 0
      ? fail('hands', 'Hands Detection', "Please remove any finger or hand from your baby's face (and out of the mouth).")
      : pass('hands', 'Hands Detection', 'No hands detected.');

  // ── Layer 5 — Extra Person (faceCount > 1 OR extra person box) ──
  const extraPeople = list.filter((d) => d.kind === 'person');
  const extraPerson: BabyLayer =
    input.faceCount > 1 || extraPeople.length > 0
      ? fail('extraPerson', 'Extra Person Check', 'Additional person detected.')
      : pass('extraPerson', 'Extra Person Check', 'Baby is the only person.');

  // ── Layer 6 — Face Occlusion (any object overlapping the face) ──
  const occluding = list.filter((d) => d.overlapsFace);
  const obstruction: BabyLayer = !objs
    ? pass('obstruction', 'Face Occlusion', 'Occlusion not measured.')
    : occluding.length > 0
      ? fail('obstruction', 'Face Occlusion', "Make sure your baby's face is fully visible — nothing covering the mouth, nose, or eyes.")
      : pass('obstruction', 'Face Occlusion', 'Face is fully visible.');

  // ── Layer 7 — Depth of Field (object sharper than the face) ──
  const fs = q?.sharpnessScore ?? null;
  const os = input.objectSharpness ?? null;
  const dof: BabyLayer =
    fs != null && os != null && fs > 0 && os > fs * BABY_GATE.dofRatio
      ? fail('dof', 'Depth of Field', 'Face is not the sharpest subject in the image.')
      : pass('dof', 'Depth of Field', 'Face is the sharpest subject.');

  return [quality, eyeVisibility, objectsLayer, handsLayer, extraPerson, obstruction, dof];
}
