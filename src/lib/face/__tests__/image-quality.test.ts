import { describe, it, expect } from 'vitest';
import { evaluateImageQuality } from '@/lib/face/image-quality';
import { QUALITY } from '@/lib/face/quality-config';
import type { ImageQualityMetrics } from '@/types/biometric';

const m = (over: Partial<ImageQualityMetrics> = {}): ImageQualityMetrics => ({
  sharpnessScore: 150,
  eyeSharpness: 60,
  contrast: 0.2,
  edgeDensity: 0.08,
  faceQualityScore: 0.8,
  measured: true,
  ...over,
});

describe('image-quality evaluator — quality must hold independently of landmarks', () => {
  it('a sharp, high-quality photo passes all three checks', () => {
    const r = evaluateImageQuality(m());
    expect(r.sharpness.status).toBe('PASS');
    expect(r.faceQuality.status).toBe('PASS');
    expect(r.eyeVisibility.status).toBe('PASS');
  });

  it('a blurry face FAILs sharpness (even though landmarks would exist)', () => {
    const r = evaluateImageQuality(m({ sharpnessScore: QUALITY.sharpnessFail - 1 }));
    expect(r.sharpness.status).toBe('FAIL');
    expect(r.sharpness.message).toMatch(/blurry/i);
  });

  it('a slightly soft photo is a WARNING, not a hard fail', () => {
    const r = evaluateImageQuality(m({ sharpnessScore: (QUALITY.sharpnessFail + QUALITY.sharpnessWarn) / 2 }));
    expect(r.sharpness.status).toBe('WARNING');
  });

  it('low composite face quality FAILs', () => {
    const r = evaluateImageQuality(m({ faceQualityScore: QUALITY.faceQualityFail - 0.01 }));
    expect(r.faceQuality.status).toBe('FAIL');
    expect(r.faceQuality.message).toMatch(/quality/i);
  });

  it('blurry eyes FAIL eye visibility for adults', () => {
    const r = evaluateImageQuality(m({ eyeSharpness: QUALITY.eyeSharpnessFail - 1 }));
    expect(r.eyeVisibility.status).toBe('FAIL');
    expect(r.eyeVisibility.message).toMatch(/eyes/i);
  });

  it('blurry eyes are only a WARNING for infants (baby passport)', () => {
    const r = evaluateImageQuality(m({ eyeSharpness: QUALITY.eyeSharpnessFail - 1 }), { infant: true });
    expect(r.eyeVisibility.status).toBe('WARNING');
  });

  it('unknown metrics (canvas could not sample) PASS — never fabricate a failure', () => {
    expect(evaluateImageQuality(undefined).sharpness.status).toBe('PASS');
    expect(evaluateImageQuality(m({ measured: false })).faceQuality.status).toBe('PASS');
  });
});
