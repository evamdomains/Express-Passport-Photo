import { describe, it, expect } from 'vitest';
import { evaluateBabyGate, BABY_GATE, type BabyGateInput, type BabyLayerKey } from '@/lib/face/baby-gate';
import type { ImageQualityMetrics } from '@/types/biometric';
import type { DetectedObjectInfo } from '@/lib/face/object-compliance';
import type { ObjectKind } from '@/lib/face/object-detection-config';

const goodQuality = (over: Partial<ImageQualityMetrics> = {}): ImageQualityMetrics => ({
  sharpnessScore: 150, eyeSharpness: 60, contrast: 0.2, edgeDensity: 0.08, faceQualityScore: 0.8, measured: true, ...over,
});
const det = (label: string, kind: ObjectKind, overlapsFace = false, confidence = 0.9): DetectedObjectInfo => ({ label, kind, confidence, overlapsFace });

function run(over: Partial<BabyGateInput> = {}) {
  return evaluateBabyGate({ quality: goodQuality(), detectedObjects: [], objectSharpness: null, faceCount: 1, ...over });
}
const statusOf = (layers: ReturnType<typeof evaluateBabyGate>, key: BabyLayerKey) => layers.find((l) => l.key === key)?.status;
const passed = (layers: ReturnType<typeof evaluateBabyGate>) => layers.every((l) => l.status !== 'FAIL');

describe('STRICT baby passport gate — MUST FAIL', () => {
  it('1. baby holding a passport → objects FAIL', () => {
    const r = run({ detectedObjects: [det('Passport', 'passport')] });
    expect(statusOf(r, 'objects')).toBe('FAIL');
    expect(passed(r)).toBe(false);
  });

  it('2. baby holding a toy → objects FAIL', () => {
    expect(statusOf(run({ detectedObjects: [det('Toy', 'toy')] }), 'objects')).toBe('FAIL');
  });

  it('3. baby holding a bottle → objects FAIL', () => {
    expect(statusOf(run({ detectedObjects: [det('Bottle', 'bottle')] }), 'objects')).toBe('FAIL');
  });

  it('4. adult hand supporting the baby → hands FAIL', () => {
    const r = run({ detectedObjects: [det('Hand', 'hand')] });
    expect(statusOf(r, 'hands')).toBe('FAIL');
    expect(passed(r)).toBe(false);
  });

  it('5. baby face blurry → face quality FAIL', () => {
    const r = run({ quality: goodQuality({ sharpnessScore: BABY_GATE.faceSharpnessFail - 1 }) });
    expect(statusOf(r, 'quality')).toBe('FAIL');
    expect(r.find((l) => l.key === 'quality')?.message).toMatch(/out of focus/i);
  });

  it('6. passport sharp but face blurry → depth-of-field FAIL', () => {
    // Face sharp enough to pass quality, but an object far sharper → DoF fails.
    const r = run({ quality: goodQuality({ sharpnessScore: 100 }), objectSharpness: 200 });
    expect(statusOf(r, 'dof')).toBe('FAIL');
    expect(r.find((l) => l.key === 'dof')?.message).toMatch(/sharpest subject/i);
  });

  it('7. eyes not visible → eye visibility FAIL', () => {
    const r = run({ quality: goodQuality({ eyeSharpness: BABY_GATE.eyeSharpnessFail - 1 }) });
    expect(statusOf(r, 'eyeVisibility')).toBe('FAIL');
  });

  it('8. object covering the face → occlusion FAIL', () => {
    const r = run({ detectedObjects: [det('Phone', 'phone', true)] });
    expect(statusOf(r, 'obstruction')).toBe('FAIL');
  });

  it('9. second person visible → extra person FAIL (by face count or person box)', () => {
    expect(statusOf(run({ faceCount: 2 }), 'extraPerson')).toBe('FAIL');
    expect(statusOf(run({ detectedObjects: [det('Another person', 'person')] }), 'extraPerson')).toBe('FAIL');
  });
});

describe('STRICT baby passport gate — MUST PASS', () => {
  it('baby alone, sharp face, eyes visible, no objects/hands → all layers PASS', () => {
    const r = run();
    expect(passed(r)).toBe(true);
    expect(r.map((l) => l.status)).toEqual(Array(7).fill('PASS'));
  });

  it('emits all 7 layers in order', () => {
    const keys = run().map((l) => l.key);
    expect(keys).toEqual(['quality', 'eyeVisibility', 'objects', 'hands', 'extraPerson', 'obstruction', 'dof']);
  });

  it('detector unavailable → object/hand/occlusion layers fail-open (PASS), never fabricated', () => {
    const r = evaluateBabyGate({ quality: goodQuality(), detectedObjects: undefined, objectSharpness: null, faceCount: 1 });
    expect(statusOf(r, 'objects')).toBe('PASS');
    expect(statusOf(r, 'hands')).toBe('PASS');
    expect(statusOf(r, 'obstruction')).toBe('PASS');
    expect(passed(r)).toBe(true);
  });

  it('a face sharper than any object passes depth-of-field', () => {
    expect(statusOf(run({ quality: goodQuality({ sharpnessScore: 300 }), objectSharpness: 120 }), 'dof')).toBe('PASS');
  });
});
