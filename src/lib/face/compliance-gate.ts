import type { BiometricData, ImageQualityMetrics } from '@/types/biometric';
import type { DocumentSpec } from '@/types/document';
import { getBiometricConfig } from './biometric-config';
import { computeCrop, evaluate } from './PassportComplianceEngine';
import { evaluateImageQuality, evaluateExposure } from './image-quality';
import { evaluateBabyGate } from './baby-gate';
import type { ObjectsAndObstruction } from './object-compliance';

/**
 * Pre-PhotoRoom compliance gate — STRICT.
 *
 * A photo must NEVER pass on landmark geometry alone. The gate validates BOTH
 * geometric correctness AND visual image quality + object cleanliness, in this
 * order (stops at the first FAIL):
 *
 *   Face Detected → Single Face → Sharpness → Face Quality → Eye Visibility →
 *   Object Detection → Face Obstruction → Face Size → Eye Position →
 *   Mouth Position → Head Position
 *
 * All ratios/rules come from DOCUMENT_RULES via getBiometricConfig, identically
 * for every document type. Nothing here calls PhotoRoom; the caller only
 * proceeds to /api/process-photo when `passed` is true.
 */

export type GateStatus = 'PASS' | 'WARNING' | 'FAIL';

export interface GateCheck {
  key:
    | 'face'
    | 'single'
    | 'exposure'
    | 'sharpness'
    | 'quality'
    | 'eyeVisibility'
    | 'objects'
    | 'hands'
    | 'extraPerson'
    | 'obstruction'
    | 'dof'
    | 'size'
    | 'eyes'
    | 'mouth'
    | 'head';
  label: string;
  status: GateStatus;
  message: string;
}

export interface GateResult {
  checks: GateCheck[];
  passed: boolean;
}

/** Extra signals measured from the actual pixels / object detector (browser). */
export interface GateExtras {
  quality?: ImageQualityMetrics;
  objects?: ObjectsAndObstruction;
  /** Sharpest detected-object ROI variance-of-Laplacian (baby depth-of-field check). */
  objectSharpness?: number | null;
}

// Face size is AUTO-CORRECTED by the target-ratio scaler, so we never reject a
// photo just because its uploaded ratio is outside the document range. The
// only size rejections are GENUINELY UNRECOVERABLE cases:
//   • too small  — would have to be enlarged past acceptable quality.
//   • too large / cut off — the face fills the frame, leaving no head-room or
//     margin for the scaler to seat the head against.
const MAX_UPSCALE = 3.0;
const MAX_FACE_FILL = 0.95;

// WARNING does not block checkout — only a FAIL does.
const finalize = (checks: GateCheck[]): GateResult => ({
  checks,
  passed: checks.every((c) => c.status !== 'FAIL'),
});

export function buildGateChecks(bio: BiometricData, spec: DocumentSpec, extras?: GateExtras): GateResult {
  const cfg = getBiometricConfig(spec);
  const checks: GateCheck[] = [];

  // Push a check; if it FAILs, stop the whole gate (return the prefix).
  let stopped = false;
  const push = (c: GateCheck): boolean => {
    checks.push(c);
    if (c.status === 'FAIL') stopped = true;
    return stopped;
  };

  // 1 — Face detected
  if (!bio.faceDetected) {
    push({ key: 'face', label: 'Face Detected', status: 'FAIL', message: 'No face detected. Please upload a clear photo showing your face.' });
    return finalize(checks);
  }
  push({ key: 'face', label: 'Face Detected', status: 'PASS', message: 'Face detected.' });

  // 2 — Single face
  if (bio.faceCount > 1) {
    push({ key: 'single', label: 'Single Face', status: 'FAIL', message: 'Multiple faces detected. Only one person is allowed in the photo.' });
    return finalize(checks);
  }
  push({ key: 'single', label: 'Single Face', status: 'PASS', message: 'One person detected.' });

  // 3 — Exposure (face-region lighting). Universal for EVERY document type; a
  // FAIL stops the gate so PhotoRoom is never called on a badly-lit photo.
  const exposure = evaluateExposure(extras?.quality);
  if (push({ key: 'exposure', label: 'Exposure', status: exposure.status, message: exposure.message })) return finalize(checks);

  if (cfg.infant) {
    // ── STRICT US Baby Passport gate (baby docs ONLY) ──
    // Replaces the generic quality/object checks with 7 strict layers: any
    // object/hand/extra person/occlusion, a blurry face or eyes, or an
    // object sharper than the face all FAIL.
    const layers = evaluateBabyGate({
      quality: extras?.quality,
      detectedObjects: extras?.objects?.detectedObjects,
      objectSharpness: extras?.objectSharpness ?? null,
      faceCount: bio.faceCount,
    });
    for (const layer of layers) {
      if (push({ key: layer.key, label: layer.label, status: layer.status, message: layer.message })) return finalize(checks);
    }
  } else {
    // 3 — Sharpness (variance of Laplacian; pixel-based, NOT landmarks)
    const q = evaluateImageQuality(extras?.quality, { infant: cfg.infant });
    if (push({ key: 'sharpness', label: 'Sharpness', status: q.sharpness.status, message: q.sharpness.message })) return finalize(checks);

    // 4 — Face quality (sharpness + contrast + edge density)
    if (push({ key: 'quality', label: 'Face Quality', status: q.faceQuality.status, message: q.faceQuality.message })) return finalize(checks);

    // 5 — Eye visibility (eye-ROI sharpness)
    if (push({ key: 'eyeVisibility', label: 'Eye Visibility', status: q.eyeVisibility.status, message: q.eyeVisibility.message })) return finalize(checks);

    // 6 — Object detection (YOLOv8 Nano + Hands) — overlap-driven for adults
    const obj = extras?.objects;
    if (obj) {
      const detail =
        obj.detectedObjects && obj.detectedObjects.length > 0
          ? ` Detected: ${obj.detectedObjects.map((d) => `${d.label} ${d.confidence.toFixed(2)}${d.overlapsFace ? ' (over face)' : ''}`).join(', ')}.`
          : '';
      if (push({ key: 'objects', label: 'Object Detection', status: obj.objects.status, message: obj.objects.reason + detail }))
        return finalize(checks);
      // 7 — Face obstruction (object covering the face / face out of frame)
      if (push({ key: 'obstruction', label: 'Face Obstruction', status: obj.obstruction.status, message: obj.obstruction.reason })) return finalize(checks);
    } else {
      push({ key: 'objects', label: 'Object Detection', status: 'PASS', message: 'No prohibited objects detected.' });
      push({ key: 'obstruction', label: 'Face Obstruction', status: 'PASS', message: 'Face is fully visible.' });
    }
  }

  const report = evaluate(bio, spec, cfg);

  // 8 — Face size (auto-scaled; fail only when genuinely unrecoverable)
  const crop = computeCrop(bio, spec, cfg);
  const tooSmall = crop.upscale > MAX_UPSCALE;
  const tooLarge = bio.faceHeightNorm >= MAX_FACE_FILL;
  if (tooSmall || tooLarge) {
    const measured = Math.round(bio.faceHeightNorm * 100);
    let message: string;
    if (tooLarge) {
      message = `Face is too large / cut off (about ${measured}% of the frame). Move farther from the camera so the whole head and some margin are visible.`;
    } else if (bio.faceHeightNorm < 0.35) {
      message = `Face is too small in the photo (about ${measured}% of the frame). Move closer to the camera or upload a higher-resolution photo.`;
    } else {
      message = `This photo's resolution is too low to make a sharp print. The face size is fine (${measured}% of the frame) — please upload a larger, higher-resolution version of the same photo.`;
    }
    push({ key: 'size', label: 'Face Size', status: 'FAIL', message });
    return finalize(checks);
  }
  push({ key: 'size', label: 'Face Size', status: 'PASS', message: `Face size OK (auto-scaled to ${Math.round(cfg.targetRatio * 100)}%).` });

  // 9 — Eye position (open + level)
  if (push({ key: 'eyes', label: 'Eye Position', status: report.eyeAlignment.status, message: report.eyeAlignment.message })) return finalize(checks);

  // 10 — Mouth (strict: no visible teeth / open mouth)
  if (push({ key: 'mouth', label: 'Mouth Position', status: report.mouth.status, message: report.mouth.message })) return finalize(checks);

  // 11 — Head position (yaw / pitch / roll)
  if (push({ key: 'head', label: 'Head Position', status: report.headPosition.status, message: report.headPosition.message })) return finalize(checks);

  return finalize(checks);
}

/** Canonical ordered labels (so the UI can show pending rows for unreached steps). */
export const GATE_STEP_LABELS: { key: GateCheck['key']; label: string }[] = [
  { key: 'face', label: 'Face Detected' },
  { key: 'single', label: 'Single Face' },
  { key: 'exposure', label: 'Exposure' },
  { key: 'sharpness', label: 'Sharpness' },
  { key: 'quality', label: 'Face Quality' },
  { key: 'eyeVisibility', label: 'Eye Visibility' },
  { key: 'objects', label: 'Object Detection' },
  { key: 'obstruction', label: 'Face Obstruction' },
  { key: 'size', label: 'Face Size' },
  { key: 'eyes', label: 'Eye Position' },
  { key: 'mouth', label: 'Mouth Position' },
  { key: 'head', label: 'Head Position' },
];

/** Ordered labels for the STRICT US Baby Passport gate (baby docs only). */
export const BABY_STEP_LABELS: { key: GateCheck['key']; label: string }[] = [
  { key: 'face', label: 'Face Detected' },
  { key: 'single', label: 'Single Face' },
  { key: 'exposure', label: 'Exposure' },
  { key: 'quality', label: 'Face Quality' },
  { key: 'eyeVisibility', label: 'Eye Visibility' },
  { key: 'objects', label: 'Object Detection' },
  { key: 'hands', label: 'Hands Detection' },
  { key: 'extraPerson', label: 'Extra Person Check' },
  { key: 'obstruction', label: 'Face Occlusion' },
  { key: 'dof', label: 'Depth of Field' },
  { key: 'size', label: 'Face Size' },
  { key: 'eyes', label: 'Eye Position' },
  { key: 'mouth', label: 'Mouth Position' },
  { key: 'head', label: 'Head Position' },
];

/** Step labels for a document — the strict baby set for infant docs, else the standard set. */
export function gateStepLabels(spec: DocumentSpec): { key: GateCheck['key']; label: string }[] {
  return getBiometricConfig(spec).infant ? BABY_STEP_LABELS : GATE_STEP_LABELS;
}
