import type { DocumentTypeId } from '@/types/document';

/**
 * Object-detection config — now applied to ALL document types (not just babies).
 * A passport, phone, toy, bottle, document, etc. in frame fails compliance for
 * any document.
 *
 * The map is config-driven. EfficientDet-Lite0 (COCO-80) genuinely detects:
 *   cell phone, book, laptop, bottle, cup, wine glass, teddy bear, sports ball,
 *   frisbee, kite, person.
 * COCO does NOT have: passport, pacifier, loose paper document, sunglasses,
 * mask, or hands. Those entries below are DROP-INS that activate automatically
 * the moment a custom model (or a HandLandmarker stage) emits them — no code
 * change required. Until then they simply never match.
 */

// Object detection runs for every document type.
export function objectDetectionEnabled(_docType: DocumentTypeId): boolean {
  return true;
}

export type ObjectKind =
  | 'hand'
  | 'pacifier'
  | 'toy'
  | 'bottle'
  | 'person'
  | 'phone'
  | 'document'
  | 'device'
  | 'sunglasses'
  | 'mask'
  | 'passport';

/** Kept for backward compatibility with existing imports. */
export type BabyObjectKind = ObjectKind;

/** Detector category (lowercased) → friendly label + rule kind. */
export const OBJECT_CATEGORY_MAP: Record<string, { label: string; kind: ObjectKind }> = {
  // ── COCO classes (EfficientDet-Lite0) — detectable today ──
  'cell phone': { label: 'Phone', kind: 'phone' },
  book: { label: 'Book / document', kind: 'document' },
  laptop: { label: 'Laptop / tablet', kind: 'device' },
  bottle: { label: 'Bottle', kind: 'bottle' },
  cup: { label: 'Bottle / cup', kind: 'bottle' },
  'wine glass': { label: 'Bottle / cup', kind: 'bottle' },
  'teddy bear': { label: 'Toy', kind: 'toy' },
  'sports ball': { label: 'Toy', kind: 'toy' },
  frisbee: { label: 'Toy', kind: 'toy' },
  kite: { label: 'Toy', kind: 'toy' },
  person: { label: 'Another person', kind: 'person' },

  // ── Custom-model / HandLandmarker drop-ins (inert until a model emits them) ──
  hand: { label: 'Hand', kind: 'hand' },
  finger: { label: 'Finger / hand', kind: 'hand' },
  pacifier: { label: 'Pacifier', kind: 'pacifier' },
  passport: { label: 'Passport', kind: 'passport' },
  document: { label: 'Document', kind: 'document' },
  tablet: { label: 'Tablet', kind: 'device' },
  sunglasses: { label: 'Sunglasses', kind: 'sunglasses' },
  mask: { label: 'Mask', kind: 'mask' },
} as const;

export const OBJECT_DETECTION = {
  /** Default confidence for treating a detection as a real object presence. */
  presence: 0.4,
  /** Lower confidence used for FACE-OBSTRUCTING objects (we care more there). */
  obstruction: 0.3,
  /** object bbox covering ≥ this fraction of the face box → face covered (FAIL). */
  faceCoverOverlap: 0.1,
  /** detector candidates below this are ignored entirely (NMS confidence floor). */
  scoreFloor: 0.3,
} as const;
