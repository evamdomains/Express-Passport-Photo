import { describe, it, expect } from 'vitest';
import {
  estimateEyeGaze,
  GAZE_LANDMARKS,
  GAZE_THRESHOLDS,
  IRIS_RING,
  isLookingStraight,
  VERTICAL_CENTER_OFFSET,
  type GazeLandmark,
} from '@/lib/face/EyeGazeEstimator';

/**
 * Synthetic-landmark tests. We build a minimal 478-point array and place only
 * the eye landmarks the estimator reads. Both eyes are given identical geometry
 * so the averaged offset equals a single eye's offset — this makes the expected
 * classification trivial to reason about.
 *
 * Baseline (straight) layout, no head roll:
 *   left  eye  (image-left):  corners x∈[0.30,0.40] @ y=0.50, lids y∈[0.47,0.53] @ x=0.35
 *   right eye  (image-right): corners x∈[0.60,0.70] @ y=0.50, lids y∈[0.57? ] ...
 * eyeWidth = 0.10, eyeHeight = 0.06 for both.
 */

interface EyeLayout {
  /** iris horizontal shift from corner-center, in normalized image units (+right). */
  irisDX: number;
  /** iris vertical shift from lid-center, in normalized image units (+down). */
  irisDY: number;
  /** Lid gap multiplier (1 = fully open, <1 = squint/blink). Changes EAR only. */
  openness?: number;
  /** Uniform eye size multiplier (scales width, height, iris radius together). EAR-invariant. */
  scale?: number;
}

const EYE_WIDTH = 0.1;
const EYE_HEIGHT = 0.06;

/** Centers of each eye in the baseline (level) face. */
const CENTERS = {
  left: { x: 0.35, y: 0.5 },
  right: { x: 0.65, y: 0.5 },
} as const;

function rotate(p: GazeLandmark, about: GazeLandmark, deg: number): GazeLandmark {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = p.x - about.x;
  const dy = p.y - about.y;
  return { x: about.x + dx * cos - dy * sin, y: about.y + dx * sin + dy * cos };
}

/**
 * Build a full landmark array. `left`/`right` set each iris's displacement from
 * its eye center. `rollDeg` rotates the ENTIRE face about the image center to
 * simulate a tilted head (gaze offsets should be unchanged after rotation).
 */
// Iris radius used to place realistic ring landmarks (MediaPipe puts them hugging
// the iris center; the default (0.5,0.5) fill would give a bogus huge radius).
const EYE_IRIS_RADIUS = EYE_WIDTH * 0.2;

function makeFace(left: EyeLayout, right: EyeLayout, rollDeg = 0): GazeLandmark[] {
  const lm: GazeLandmark[] = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
  const halfW = EYE_WIDTH / 2;
  const halfH = EYE_HEIGHT / 2;

  type EyeIndices = { iris: number; outer: number; inner: number; upper: number; lower: number };
  const place = (spec: EyeIndices, ring: readonly number[], center: { x: number; y: number }, eye: EyeLayout) => {
    const scale = eye.scale ?? 1;
    const hW = halfW * scale;
    const hH = halfH * scale * (eye.openness ?? 1);
    // outer on the temporal side: left eye's outer is to the image-left; right eye's outer to image-right.
    const isLeftEye = spec === GAZE_LANDMARKS.leftEye;
    const outerX = isLeftEye ? center.x - hW : center.x + hW;
    const innerX = isLeftEye ? center.x + hW : center.x - hW;
    lm[spec.outer] = { x: outerX, y: center.y };
    lm[spec.inner] = { x: innerX, y: center.y };
    lm[spec.upper] = { x: center.x, y: center.y - hH };
    lm[spec.lower] = { x: center.x, y: center.y + hH };
    const ix = center.x + eye.irisDX;
    const iy = center.y + eye.irisDY;
    lm[spec.iris] = { x: ix, y: iy };
    // 4 ring points hugging the iris center (top, right, bottom, left) → radius.
    const r = EYE_IRIS_RADIUS * scale;
    lm[ring[0]] = { x: ix, y: iy - r };
    lm[ring[1]] = { x: ix + r, y: iy };
    lm[ring[2]] = { x: ix, y: iy + r };
    lm[ring[3]] = { x: ix - r, y: iy };
  };

  place(GAZE_LANDMARKS.leftEye, IRIS_RING.leftEye, CENTERS.left, left);
  place(GAZE_LANDMARKS.rightEye, IRIS_RING.rightEye, CENTERS.right, right);

  if (rollDeg !== 0) {
    const about = { x: 0.5, y: 0.5 };
    for (const [spec, ring] of [
      [GAZE_LANDMARKS.leftEye, IRIS_RING.leftEye],
      [GAZE_LANDMARKS.rightEye, IRIS_RING.rightEye],
    ] as const) {
      for (const idx of [spec.outer, spec.inner, spec.upper, spec.lower, spec.iris, ...ring]) {
        lm[idx] = rotate(lm[idx], about, rollDeg);
      }
    }
  }
  return lm;
}

/** Symmetric face: both eyes share the same displacement. */
const symmetric = (dx: number, dy: number, roll = 0) =>
  makeFace({ irisDX: dx, irisDY: dy }, { irisDX: dx, irisDY: dy }, roll);

/** Symmetric face with extra per-eye layout fields (openness/scale), irises centered. */
const symmetric2 = (extra: Partial<EyeLayout>) =>
  makeFace({ irisDX: 0, irisDY: 0, ...extra }, { irisDX: 0, irisDY: 0, ...extra });

// Convert a desired normalized offset (fraction of eye size) into a pixel shift.
const dxFor = (offset: number) => offset * EYE_WIDTH;
const dyFor = (offset: number) => offset * EYE_HEIGHT;

describe('estimateEyeGaze — direction classification', () => {
  it('LOOKING_STRAIGHT when irises are centered', () => {
    const r = estimateEyeGaze(symmetric(0, 0));
    expect(r.direction).toBe('LOOKING_STRAIGHT');
    expect(isLookingStraight(r)).toBe(true);
    // Clean, open, symmetric eyes with a fully-visible iris ⇒ high reliability.
    expect(r.confidence).toBeGreaterThan(0.8);
    expect(r.averageHorizontal).toBeCloseTo(0, 5);
    expect(r.averageVertical).toBeCloseTo(0, 5); // RAW average is still 0
  });

  it('LOOKING_RIGHT when irises shift toward image-right', () => {
    const r = estimateEyeGaze(symmetric(dxFor(0.25), 0)); // 0.25 ≫ 0.06 band
    expect(r.direction).toBe('LOOKING_RIGHT');
    expect(r.averageHorizontal).toBeGreaterThan(GAZE_THRESHOLDS.horizontal.straightMax);
    expect(r.confidence).toBeGreaterThan(0);
  });

  it('LOOKING_LEFT when irises shift toward image-left', () => {
    const r = estimateEyeGaze(symmetric(dxFor(-0.25), 0));
    expect(r.direction).toBe('LOOKING_LEFT');
    expect(r.averageHorizontal).toBeLessThan(GAZE_THRESHOLDS.horizontal.straightMin);
  });

  it('LOOKING_UP when irises shift toward the top of the image', () => {
    const r = estimateEyeGaze(symmetric(0, dyFor(-0.4))); // negative vertical = up
    expect(r.direction).toBe('LOOKING_UP');
    expect(r.averageVertical).toBeLessThan(GAZE_THRESHOLDS.vertical.straightMin);
  });

  it('LOOKING_DOWN when irises shift toward the bottom of the image', () => {
    const r = estimateEyeGaze(symmetric(0, dyFor(0.4)));
    expect(r.direction).toBe('LOOKING_DOWN');
    expect(r.averageVertical).toBeGreaterThan(GAZE_THRESHOLDS.vertical.straightMax);
  });

  it('accepts a SLIGHT LEFT glance within the passport dead-band as STRAIGHT', () => {
    // 0.05 < 0.06 straightMax ⇒ still acceptable.
    const r = estimateEyeGaze(symmetric(dxFor(-0.05), 0));
    expect(r.direction).toBe('LOOKING_STRAIGHT');
  });

  it('accepts a SLIGHT RIGHT glance within the passport dead-band as STRAIGHT', () => {
    const r = estimateEyeGaze(symmetric(dxFor(0.05), 0));
    expect(r.direction).toBe('LOOKING_STRAIGHT');
  });
});

describe('estimateEyeGaze — head-roll compensation', () => {
  it('still reports STRAIGHT for a forward gaze on a tilted (rolled) head', () => {
    const level = estimateEyeGaze(symmetric(0, 0, 0));
    const tilted = estimateEyeGaze(symmetric(0, 0, 15)); // 15° head tilt
    expect(tilted.direction).toBe('LOOKING_STRAIGHT');
    // Offsets should stay ≈ 0 despite the tilt (head-aligned frame).
    expect(tilted.averageHorizontal).toBeCloseTo(level.averageHorizontal, 3);
    expect(tilted.averageVertical).toBeCloseTo(level.averageVertical, 3);
  });

  it('detects a real left glance even when the head is tilted', () => {
    const r = estimateEyeGaze(symmetric(dxFor(-0.25), 0, 12));
    expect(r.direction).toBe('LOOKING_LEFT');
  });
});

describe('estimateEyeGaze — averaging & robustness', () => {
  it('averages the two eyes rather than trusting one', () => {
    const r = estimateEyeGaze(
      makeFace({ irisDX: dxFor(0.2), irisDY: 0 }, { irisDX: dxFor(0.0), irisDY: 0 }),
    );
    expect(r.averageHorizontal).toBeCloseTo((r.leftEyeHorizontal + r.rightEyeHorizontal) / 2, 6);
  });

  it('returns UNKNOWN when a required landmark is missing (never single-eye)', () => {
    const lm = symmetric(0, 0);
    // Drop the right iris → right eye invalid.
    // @ts-expect-error deliberately create a hole to simulate missing landmark
    lm[GAZE_LANDMARKS.rightEye.iris] = undefined;
    const r = estimateEyeGaze(lm);
    expect(r.direction).toBe('UNKNOWN');
    expect(r.confidence).toBe(0);
  });

  it('returns UNKNOWN for empty / nullish input', () => {
    expect(estimateEyeGaze([]).direction).toBe('UNKNOWN');
    expect(estimateEyeGaze(null).direction).toBe('UNKNOWN');
    expect(estimateEyeGaze(undefined).direction).toBe('UNKNOWN');
  });

  it('honors per-call threshold overrides', () => {
    const offset = symmetric(dxFor(0.05), 0); // within default band
    expect(estimateEyeGaze(offset).direction).toBe('LOOKING_STRAIGHT');
    // Tighten the band so the same glance now fails.
    const strict = estimateEyeGaze(offset, {
      thresholds: { ...GAZE_THRESHOLDS, horizontal: { straightMin: -0.02, straightMax: 0.02 } },
    });
    expect(strict.direction).toBe('LOOKING_RIGHT');
  });
});

describe('estimateEyeGaze — vertical calibration (false LOOKING_UP fix)', () => {
  // dyFor(X) places the iris so the RAW vertical offset equals X (negative = up).

  it('classifies a straight gaze with natural upward bias as STRAIGHT, not LOOKING_UP', () => {
    // Iris sits well above the lid midpoint (camera above eye level / deep-set eyes),
    // head level (pitch ≈ 0). Should PASS as straight after calibration.
    const r = estimateEyeGaze(symmetric(0, dyFor(-0.18)), { headPitchDeg: 0 });
    expect(r.direction).toBe('LOOKING_STRAIGHT');
  });

  it('DEMONSTRATES the fix: the same bias with calibration disabled reads LOOKING_UP', () => {
    const uncalibrated = estimateEyeGaze(symmetric(0, dyFor(-0.18)), {
      headPitchDeg: 0,
      vertical: { centerOffset: 0, pitchNeutralGain: 1 }, // turn the fix off
    });
    expect(uncalibrated.direction).toBe('LOOKING_UP');
  });

  it('PASSES a phone/DSLR slightly above the eyes (level head attenuates residual offset)', () => {
    const r = estimateEyeGaze(symmetric(0, dyFor(-0.22)), { headPitchDeg: 2 });
    expect(r.direction).toBe('LOOKING_STRAIGHT');
  });

  it('still FAILS a clear upward gaze even with a level head', () => {
    const r = estimateEyeGaze(symmetric(0, dyFor(-0.45)), { headPitchDeg: 0 });
    expect(r.direction).toBe('LOOKING_UP');
  });

  it('still FAILS a clear downward gaze', () => {
    const r = estimateEyeGaze(symmetric(0, dyFor(0.45)), { headPitchDeg: 0 });
    expect(r.direction).toBe('LOOKING_DOWN');
  });

  it('REGRESSION: a level head with eyes cast DOWN is NOT attenuated away → LOOKING_DOWN', () => {
    // Level head (pitch 0) + a modest downward gaze. The up-only attenuation must
    // NOT shrink this (it used to, letting eyes-down PASS).
    const r = estimateEyeGaze(symmetric(0, dyFor(0.2)), { headPitchDeg: 0 });
    expect(r.direction).toBe('LOOKING_DOWN');
  });

  it('up-side attenuation still works: level head + slight UP residual stays STRAIGHT', () => {
    const r = estimateEyeGaze(symmetric(0, dyFor(-0.22)), { headPitchDeg: 2 });
    expect(r.direction).toBe('LOOKING_STRAIGHT');
  });

  it('pitch compensation: a level head forgives a borderline offset a pitched head does not', () => {
    const level = estimateEyeGaze(symmetric(0, dyFor(-0.3)), { headPitchDeg: 2 });
    const pitched = estimateEyeGaze(symmetric(0, dyFor(-0.3)), { headPitchDeg: 20 });
    expect(level.direction).toBe('LOOKING_STRAIGHT');
    expect(pitched.direction).toBe('LOOKING_UP');
  });

  it('confidence gate: a borderline vertical offset prefers STRAIGHT over LOOKING_UP', () => {
    // Beyond the dead-zone but low confidence (no pitch attenuation) → STRAIGHT.
    const r = estimateEyeGaze(symmetric(0, dyFor(-0.2)), { headPitchDeg: 30 });
    expect(r.direction).toBe('LOOKING_STRAIGHT');
  });

  it('exposes RAW averageVertical and a calibrated value', () => {
    const r = estimateEyeGaze(symmetric(0, dyFor(-0.1))); // no pitch → no attenuation
    expect(r.averageVertical).toBeCloseTo(-0.1, 4); // raw, unchanged
    expect(r.calibratedVertical).toBeCloseTo(-0.1 + VERTICAL_CENTER_OFFSET, 4);
  });

  it('does NOT alter horizontal detection when a vertical offset is present', () => {
    const r = estimateEyeGaze(symmetric(dxFor(0.25), dyFor(-0.3)), { headPitchDeg: 0 });
    expect(r.averageHorizontal).toBeCloseTo(0.25, 4); // horizontal unchanged
    expect(r.direction).toBe('LOOKING_RIGHT'); // horizontal dominates
  });
});

describe('estimateEyeGaze — multi-feature quality signals + confidence', () => {
  it('reports EAR / symmetry / iris-visibility for a clean open-eyed face', () => {
    const r = estimateEyeGaze(symmetric(0, 0));
    expect(r.leftEAR).toBeGreaterThan(0);
    expect(r.rightEAR).toBeGreaterThan(0);
    expect(r.averageEAR).toBeCloseTo(((r.leftEAR ?? 0) + (r.rightEAR ?? 0)) / 2, 6);
    expect(r.eyelidSymmetry).toBeGreaterThan(0.95);
    expect(r.leftIrisVisibility).toBeGreaterThan(0.9);
    expect(r.rightIrisVisibility).toBeGreaterThan(0.9);
    expect(r.confidence).toBeGreaterThan(0.8);
  });

  it('a BLINK (both eyes nearly closed) collapses confidence but is not a hard error', () => {
    const blink = makeFace({ irisDX: 0, irisDY: 0, openness: 0.12 }, { irisDX: 0, irisDY: 0, openness: 0.12 });
    const r = estimateEyeGaze(blink);
    expect(r.averageEAR!).toBeLessThan(0.1);
    expect(r.confidence).toBeLessThan(0.3);
    expect(r.direction).not.toBe('UNKNOWN'); // still a measurement, not a throw
  });

  it('ONE eye partially closed lowers eyelid symmetry and confidence', () => {
    const open = estimateEyeGaze(symmetric(0, 0));
    const wink = estimateEyeGaze(makeFace({ irisDX: 0, irisDY: 0 }, { irisDX: 0, irisDY: 0, openness: 0.15 }));
    expect(wink.eyelidSymmetry!).toBeLessThan(0.4);
    expect(wink.confidence).toBeLessThan(open.confidence);
  });

  it('small vs large eyes give the SAME confidence (EAR is scale-invariant)', () => {
    const small = estimateEyeGaze(symmetric2({ scale: 0.5 }));
    const large = estimateEyeGaze(symmetric2({ scale: 1.6 }));
    expect(small.averageEAR).toBeCloseTo(large.averageEAR!, 4);
    expect(small.confidence).toBeGreaterThan(0.8);
    expect(large.confidence).toBeGreaterThan(0.8);
  });

  it('strong head YAW reduces confidence (iris gaze degrades off-axis)', () => {
    const straightOn = estimateEyeGaze(symmetric(0, 0), { headYawDeg: 0 });
    const turned = estimateEyeGaze(symmetric(0, 0), { headYawDeg: 35 });
    expect(turned.confidence).toBeLessThan(straightOn.confidence);
  });

  it('lighting/appearance invariance: identical landmarks → identical result', () => {
    // The estimator is landmark-based, so brightness/darkness/glasses (pixel-domain)
    // cannot change its output — only the geometry does. Same input ⇒ same output.
    const lm = symmetric(dxFor(0.05), 0);
    expect(estimateEyeGaze(lm)).toEqual(estimateEyeGaze(lm));
  });

  it('quality never changes DIRECTION: a clear glance with low EAR still classifies', () => {
    const squintRight = makeFace(
      { irisDX: dxFor(0.25), irisDY: 0, openness: 0.4 },
      { irisDX: dxFor(0.25), irisDY: 0, openness: 0.4 },
    );
    const r = estimateEyeGaze(squintRight);
    expect(r.direction).toBe('LOOKING_RIGHT'); // direction unaffected by openness
    expect(r.confidence).toBeLessThan(1); // but confidence is tempered
  });
});
