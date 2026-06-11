import { describe, it, expect } from 'vitest';
// Real production geometry under test.
import { buildBiometrics, IDX, type LM } from '@/lib/face/landmarks';
import { getBiometricConfig } from '@/lib/face/biometric-config';
import { DOCUMENT_SPECS } from '@/constants/document-specs';

const cfg = getBiometricConfig(DOCUMENT_SPECS.us_passport);
const W = 1000;
const H = 1000;

/** 478 neutral landmarks; override the indices a test cares about. */
function landmarks(overrides: Record<number, LM>): LM[] {
  const lm: LM[] = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
  // A plausible neutral face so face-height/pose stay sane.
  lm[IDX.foreheadTop] = { x: 0.5, y: 0.25 };
  lm[IDX.chin] = { x: 0.5, y: 0.70 };
  lm[IDX.leftIris] = { x: 0.55, y: 0.40 };
  lm[IDX.rightIris] = { x: 0.45, y: 0.40 };
  lm[IDX.cheekRight] = { x: 0.35, y: 0.45 };
  lm[IDX.cheekLeft] = { x: 0.65, y: 0.45 };
  lm[IDX.noseTip] = { x: 0.5, y: 0.5 };
  lm[IDX.mouthCornerL] = { x: 0.45, y: 0.6 };
  lm[IDX.mouthCornerR] = { x: 0.55, y: 0.6 };
  // Default: eyes open, mouth closed.
  lm[IDX.rEyeIn] = { x: 0.42, y: 0.4 }; lm[IDX.rEyeOut] = { x: 0.48, y: 0.4 };
  lm[IDX.rEyeUp] = { x: 0.45, y: 0.385 }; lm[IDX.rEyeLow] = { x: 0.45, y: 0.415 };
  lm[IDX.lEyeIn] = { x: 0.52, y: 0.4 }; lm[IDX.lEyeOut] = { x: 0.58, y: 0.4 };
  lm[IDX.lEyeUp] = { x: 0.55, y: 0.385 }; lm[IDX.lEyeLow] = { x: 0.55, y: 0.415 };
  lm[IDX.lipInnerTop] = { x: 0.5, y: 0.6 }; lm[IDX.lipInnerBottom] = { x: 0.5, y: 0.605 };
  return Object.assign(lm, overrides);
}

describe('buildBiometrics — geometric eye openness', () => {
  it('reports eyes OPEN for a normal eye-aspect-ratio', () => {
    const bio = buildBiometrics(landmarks({}), undefined, undefined, W, H, 1, cfg);
    expect(bio.eyesOpen).toBe(true);
  });

  it('reports eyes CLOSED when the eyelids are nearly touching', () => {
    const closed = landmarks({
      [IDX.rEyeUp]: { x: 0.45, y: 0.399 }, [IDX.rEyeLow]: { x: 0.45, y: 0.401 },
      [IDX.lEyeUp]: { x: 0.55, y: 0.399 }, [IDX.lEyeLow]: { x: 0.55, y: 0.401 },
    });
    const bio = buildBiometrics(closed, undefined, undefined, W, H, 1, cfg);
    expect(bio.eyesOpen).toBe(false);
  });
});

describe('buildBiometrics — geometric mouth openness', () => {
  it('reports a closed mouth as NEUTRAL', () => {
    const bio = buildBiometrics(landmarks({}), undefined, undefined, W, H, 1, cfg);
    expect(bio.mouthOpen).toBe(false);
    expect(bio.mouthState).toBe('NEUTRAL');
  });

  it('reports a wide-open mouth as OPEN_MOUTH', () => {
    const open = landmarks({
      [IDX.lipInnerTop]: { x: 0.5, y: 0.56 },
      [IDX.lipInnerBottom]: { x: 0.5, y: 0.66 }, // gap 0.10·H vs mouth width 0.10·W → ratio 1.0
    });
    const bio = buildBiometrics(open, undefined, undefined, W, H, 1, cfg);
    expect(bio.mouthOpen).toBe(true);
    expect(bio.mouthState).toBe('OPEN_MOUTH');
  });
});
