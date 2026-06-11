import type { BiometricData } from '@/types/biometric';
import type { DocumentSpec } from '@/types/document';
import { getBiometricConfig } from './biometric-config';
import { computeCrop, evaluate } from './PassportComplianceEngine';
import type { BabyObjectsResult } from './baby-objects';

/**
 * Pre-PhotoRoom compliance gate.
 *
 * Runs the 6 passport-photo.online-style checks (in order) against the
 * MediaPipe biometric, reusing the existing PassportComplianceEngine. Returns
 * the evaluated prefix of checks — it STOPS at the first failure (so the UI
 * shows the passed steps + the one that failed, and nothing after it).
 *
 * Nothing here calls PhotoRoom or the server; the caller only proceeds to
 * /api/process-photo when `passed` is true.
 */

export type GateStatus = 'PASS' | 'WARNING' | 'FAIL';

export interface GateCheck {
  key: 'face' | 'single' | 'size' | 'eyes' | 'mouth' | 'head' | 'objects';
  label: string;
  status: GateStatus;
  message: string;
}

export interface GateResult {
  checks: GateCheck[];
  passed: boolean;
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

export function buildGateChecks(
  bio: BiometricData,
  spec: DocumentSpec,
  babyObjects?: BabyObjectsResult,
): GateResult {
  const cfg = getBiometricConfig(spec);
  const checks: GateCheck[] = [];

  // 1 — Face detected
  if (!bio.faceDetected) {
    checks.push({ key: 'face', label: 'Face Detected', status: 'FAIL', message: 'No face detected. Please upload a clear photo showing your face.' });
    return finalize(checks);
  }
  checks.push({ key: 'face', label: 'Face Detected', status: 'PASS', message: 'Face detected.' });

  // 2 — Single face
  if (bio.faceCount > 1) {
    checks.push({ key: 'single', label: 'Single Face', status: 'FAIL', message: 'Multiple faces detected. Only one person is allowed in the photo.' });
    return finalize(checks);
  }
  checks.push({ key: 'single', label: 'Single Face', status: 'PASS', message: 'One person detected.' });

  const report = evaluate(bio, spec, cfg);

  // 3 — Face size. The scaler auto-corrects toward the target ratio, so we only
  // reject the unrecoverable extremes (see MAX_UPSCALE / MAX_FACE_FILL above) —
  // never the raw uploaded ratio being outside the document range.
  const crop = computeCrop(bio, spec, cfg);
  const tooSmall = crop.upscale > MAX_UPSCALE;
  const tooLarge = bio.faceHeightNorm >= MAX_FACE_FILL;
  if (tooSmall || tooLarge) {
    const measured = Math.round(bio.faceHeightNorm * 100);
    // `upscale > MAX_UPSCALE` has two distinct causes. When the face already
    // fills a healthy part of the frame, the ratio is fine and the real problem
    // is that the SOURCE IMAGE is too low-resolution to enlarge to a sharp
    // print — not that the subject is too far away.
    let message: string;
    if (tooLarge) {
      message = `Face is too large / cut off (about ${measured}% of the frame). Move farther from the camera so the whole head and some margin are visible.`;
    } else if (bio.faceHeightNorm < 0.35) {
      message = `Face is too small in the photo (about ${measured}% of the frame). Move closer to the camera or upload a higher-resolution photo.`;
    } else {
      message = `This photo's resolution is too low to make a sharp print. The face size is fine (${measured}% of the frame) — please upload a larger, higher-resolution version of the same photo.`;
    }
    checks.push({ key: 'size', label: 'Face Size', status: 'FAIL', message });
    return finalize(checks);
  }
  checks.push({ key: 'size', label: 'Face Size', status: 'PASS', message: `Face size OK (auto-scaled to ${Math.round(cfg.targetRatio * 100)}%).` });

  // 4 — Eye position (open + level)
  if (report.eyeAlignment.status === 'FAIL') {
    checks.push({ key: 'eyes', label: 'Eye Position', status: 'FAIL', message: report.eyeAlignment.message });
    return finalize(checks);
  }
  checks.push({ key: 'eyes', label: 'Eye Position', status: 'PASS', message: report.eyeAlignment.message });

  // 5 — Mouth (strict: no visible teeth / open mouth)
  if (report.mouth.status === 'FAIL') {
    checks.push({ key: 'mouth', label: 'Mouth Position', status: 'FAIL', message: report.mouth.message });
    return finalize(checks);
  }
  checks.push({ key: 'mouth', label: 'Mouth Position', status: 'PASS', message: report.mouth.message });

  // 6 — Head position (yaw / pitch / roll)
  if (report.headPosition.status === 'FAIL') {
    checks.push({ key: 'head', label: 'Head Position', status: 'FAIL', message: report.headPosition.message });
    return finalize(checks);
  }
  checks.push({ key: 'head', label: 'Head Position', status: 'PASS', message: report.headPosition.message });

  // 7 — Baby objects (infant docs only): hand / pacifier / toy / bottle / face cover.
  if (cfg.infant && babyObjects) {
    checks.push({
      key: 'objects',
      label: 'Baby Object Check',
      status: babyObjects.status,
      message: babyObjects.reason,
    });
  }

  return finalize(checks);
}

/** Canonical ordered labels (so the UI can show pending rows for unreached steps). */
export const GATE_STEP_LABELS: { key: GateCheck['key']; label: string }[] = [
  { key: 'face', label: 'Face Detected' },
  { key: 'single', label: 'Single Face' },
  { key: 'size', label: 'Face Size' },
  { key: 'eyes', label: 'Eye Position' },
  { key: 'mouth', label: 'Mouth Position' },
  { key: 'head', label: 'Head Position' },
];

/** Step labels for a document — adds "Baby Object Check" for infant docs. */
export function gateStepLabels(spec: DocumentSpec): { key: GateCheck['key']; label: string }[] {
  return getBiometricConfig(spec).infant
    ? [...GATE_STEP_LABELS, { key: 'objects', label: 'Baby Object Check' }]
    : GATE_STEP_LABELS;
}
