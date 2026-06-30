import { describe, it, expect } from 'vitest';
import {
  evaluateBabyEyes,
  evaluateBabyMouth,
  evaluateBabyExpression,
  evaluateBabyHeadTilt,
  evaluateBabyHeadRotation,
} from '@/lib/face/baby-compliance';
import { evaluateBabyGate } from '@/lib/face/baby-gate';
import { buildGateChecks } from '@/lib/face/compliance-gate';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import type { BiometricData, MouthState } from '@/types/biometric';
import type { DetectedObjectInfo } from '@/lib/face/object-compliance';

const BABY = DOCUMENT_SPECS.baby_passport;

/** A calm, compliant baby by default; override per test. */
function makeBabyBio(over: Partial<BiometricData> = {}): BiometricData {
  return {
    faceDetected: true,
    faceCount: 1,
    imageWidth: 1000,
    imageHeight: 1200,
    crownY: 120,
    chinY: 660,
    faceHeight: 540,
    faceWidth: 300,
    faceRatio: 0.45,
    faceCenterXNorm: 0.5,
    eyeCenterYNorm: 0.4,
    faceHeightNorm: 0.45,
    leftEyeY: 480,
    rightEyeY: 480,
    eyesOpen: true,
    eyeOpenness: 0.2,
    yaw: 0,
    pitch: 0,
    roll: 0,
    headTilt: 0,
    mouthOpen: false,
    mouthGap: 0.03,
    smileScore: 0.05,
    mouthState: 'NEUTRAL' as MouthState,
    teethVisibilityScore: 0,
    ...over,
  };
}

const obj = (label: string, kind: DetectedObjectInfo['kind'], overlapsFace = false): DetectedObjectInfo => ({
  label,
  kind,
  confidence: 0.9,
  overlapsFace,
});

describe('baby eyes', () => {
  it('fully open → PASS', () => expect(evaluateBabyEyes(makeBabyBio({ eyeOpenness: 0.22 })).status).toBe('PASS'));
  it('slightly sleepy → PASS', () => expect(evaluateBabyEyes(makeBabyBio({ eyeOpenness: 0.1 })).status).toBe('PASS'));
  it('fully closed → FAIL', () => expect(evaluateBabyEyes(makeBabyBio({ eyeOpenness: 0.03 })).status).toBe('FAIL'));
});

describe('baby mouth', () => {
  it('closed → PASS', () => expect(evaluateBabyMouth(makeBabyBio({ mouthGap: 0.02 })).status).toBe('PASS'));
  it('slightly open / small O → PASS', () => expect(evaluateBabyMouth(makeBabyBio({ mouthGap: 0.2 })).status).toBe('PASS'));
  it('very wide open (yawn/cry) → FAIL', () => expect(evaluateBabyMouth(makeBabyBio({ mouthGap: 0.5 })).status).toBe('FAIL'));
  it('teeth clearly exposed → FAIL', () => expect(evaluateBabyMouth(makeBabyBio({ teethVisibilityScore: 0.4 })).status).toBe('FAIL'));
});

describe('baby expression', () => {
  it('neutral/calm → PASS', () => expect(evaluateBabyExpression(makeBabyBio({ smileScore: 0.05 })).status).toBe('PASS'));
  it('slight smile → PASS', () =>
    expect(evaluateBabyExpression(makeBabyBio({ smileScore: 0.3, mouthState: 'SLIGHT_SMILE' })).status).toBe('PASS'));
  it('broad smile / grin (lips closed) → FAIL', () =>
    expect(evaluateBabyExpression(makeBabyBio({ smileScore: 0.7, mouthState: 'BROAD_SMILE' })).status).toBe('FAIL'));
  it('laughing (broad smile + open) → FAIL', () =>
    expect(evaluateBabyExpression(makeBabyBio({ smileScore: 0.75, mouthState: 'BROAD_SMILE', mouthGap: 0.3 })).status).toBe('FAIL'));
  it('crying (squeezed eyes + open mouth) → FAIL', () =>
    expect(evaluateBabyExpression(makeBabyBio({ eyeOpenness: 0.04, mouthGap: 0.4 })).status).toBe('FAIL'));
});

describe('baby head', () => {
  it('small tilt → PASS', () => expect(evaluateBabyHeadTilt(makeBabyBio({ roll: 10 })).status).toBe('PASS'));
  it('extreme tilt → FAIL', () => expect(evaluateBabyHeadTilt(makeBabyBio({ roll: 35 })).status).toBe('FAIL'));
  it('small rotation → PASS', () => expect(evaluateBabyHeadRotation(makeBabyBio({ yaw: 15 })).status).toBe('PASS'));
  it('extreme rotation → FAIL', () => expect(evaluateBabyHeadRotation(makeBabyBio({ yaw: 40 })).status).toBe('FAIL'));
});

describe('baby object/finger/hand gate', () => {
  it('clean frame → all layers PASS', () => {
    const layers = evaluateBabyGate({ detectedObjects: [], faceCount: 1 });
    expect(layers.every((l) => l.status === 'PASS')).toBe(true);
  });
  it('finger / hand near face → hands FAIL', () => {
    const layers = evaluateBabyGate({ detectedObjects: [obj('hand', 'hand', true)], faceCount: 1 });
    expect(layers.find((l) => l.key === 'hands')?.status).toBe('FAIL');
  });
  it('pacifier/bottle (physical object) → objects FAIL', () => {
    const layers = evaluateBabyGate({ detectedObjects: [obj('bottle', 'bottle', true)], faceCount: 1 });
    expect(layers.find((l) => l.key === 'objects')?.status).toBe('FAIL');
  });
  it('object covering the face → occlusion FAIL', () => {
    const layers = evaluateBabyGate({ detectedObjects: [obj('cell phone', 'phone', true)], faceCount: 1 });
    expect(layers.find((l) => l.key === 'obstruction')?.status).toBe('FAIL');
  });
});

describe('baby gate integration (buildGateChecks, infant document)', () => {
  const last = (checks: ReturnType<typeof buildGateChecks>['checks']) => checks[checks.length - 1];

  it('calm baby passes the behavioral checks', () => {
    const r = buildGateChecks(makeBabyBio(), BABY);
    expect(r.passed).toBe(true);
    expect(r.checks.some((c) => c.key === 'expression')).toBe(true);
  });
  it('broad smile fails at Expression (no PhotoRoom)', () => {
    const r = buildGateChecks(makeBabyBio({ smileScore: 0.75, mouthState: 'BROAD_SMILE' }), BABY);
    expect(r.passed).toBe(false);
    expect(last(r.checks).key).toBe('expression');
  });
  it('eyes fully closed fails at Eye Openness', () => {
    const r = buildGateChecks(makeBabyBio({ eyeOpenness: 0.03 }), BABY);
    expect(r.passed).toBe(false);
    expect(last(r.checks).key).toBe('eyes');
  });
  it('finger/hand near face fails before the behavioral checks', () => {
    const r = buildGateChecks(makeBabyBio(), BABY, {
      objects: {
        objects: { status: 'FAIL', reason: '', items: [] },
        obstruction: { status: 'FAIL', reason: '' },
        detectedObjects: [obj('hand', 'hand', true)],
      },
    });
    expect(r.passed).toBe(false);
    expect(r.checks.some((c) => c.key === 'hands' && c.status === 'FAIL')).toBe(true);
  });
});
