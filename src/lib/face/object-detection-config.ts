import type { DocumentTypeId } from '@/types/document';

/**
 * Baby object-detection config.
 *
 * Only US_BABY_PASSPORT runs the (heavier) ObjectDetector stage — the other
 * document types skip it entirely (performance requirement).
 *
 * The COCO map below is config-driven: COCO has bottle/cup/teddy-bear/sports-ball
 * /person but NOT pacifier/hand/finger. Dropping in a custom model that emits
 * `pacifier`/`hand` later requires ONLY adding entries here — no code change.
 */

const OBJECT_DETECTION_DOCS: DocumentTypeId[] = ['baby_passport'];

export function objectDetectionEnabled(docType: DocumentTypeId): boolean {
  return OBJECT_DETECTION_DOCS.includes(docType);
}

export type BabyObjectKind = 'hand' | 'pacifier' | 'toy' | 'bottle' | 'person';

/** Detector category (lowercased) → friendly label + rule kind. */
export const OBJECT_CATEGORY_MAP: Record<string, { label: string; kind: BabyObjectKind }> = {
  // COCO classes (EfficientDet-Lite0)
  bottle: { label: 'Bottle', kind: 'bottle' },
  cup: { label: 'Bottle / cup', kind: 'bottle' },
  'teddy bear': { label: 'Toy', kind: 'toy' },
  'sports ball': { label: 'Toy', kind: 'toy' },
  frisbee: { label: 'Toy', kind: 'toy' },
  person: { label: 'Another person', kind: 'person' },
  // Custom-model drop-ins (no code change needed once a model emits these):
  hand: { label: 'Hand', kind: 'hand' },
  finger: { label: 'Finger / hand', kind: 'hand' },
  pacifier: { label: 'Pacifier', kind: 'pacifier' },
};

export const OBJECT_DETECTION = {
  /** score ≥ fail → FAIL. */
  fail: { hand: 0.6, pacifier: 0.6, toy: 0.6, bottle: 0.6, person: 0.6 } as Record<BabyObjectKind, number>,
  /** [warnLow, fail) → WARNING (never auto-fail an uncertain detection). */
  warnLow: 0.4,
  /** object bbox covering ≥ this fraction of the face box → face covered (FAIL). */
  faceCoverOverlap: 0.25,
  /** detector candidates below this are ignored entirely. */
  scoreFloor: 0.3,
};
