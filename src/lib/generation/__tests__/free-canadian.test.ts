import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';

// Mock the shared PhotoRoom + sharp primitives so tests never hit the network or
// native sharp. Assertions below rely on these spies.
const { removeBackgroundMock, composeMock, crownMock } = vi.hoisted(() => ({
  removeBackgroundMock: vi.fn(),
  composeMock: vi.fn(),
  crownMock: vi.fn(),
}));
vi.mock('@/lib/photoroom', () => ({ removeBackground: removeBackgroundMock }));
vi.mock('@/lib/sharp-utils', () => ({
  composePassportPhoto: composeMock,
  measureCrownYNorm: crownMock,
}));

import { runFreeCanadianPipeline } from '@/lib/generation/free-canadian-generator';
import { shouldUseFreeCanadian, isFreeCanadianDocument, FEATURES } from '@/config/features';
import type { BiometricData } from '@/types/biometric';

beforeEach(() => {
  removeBackgroundMock.mockReset().mockResolvedValue(Buffer.from('transparent-png'));
  composeMock.mockReset().mockResolvedValue(Buffer.from('final-jpeg'));
  crownMock.mockReset().mockResolvedValue(null);
});

// A biometric that passes the compliance gate for a Canadian document.
function goodCanadianBio(over: Partial<BiometricData> = {}): BiometricData {
  return {
    faceDetected: true, faceCount: 1, imageWidth: 591, imageHeight: 827,
    crownY: 100, chinY: 579, faceHeight: 389, faceWidth: 260, faceRatio: 0.47,
    faceCenterXNorm: 0.5, eyeCenterYNorm: 0.4, faceHeightNorm: 0.47,
    leftEyeY: 330, rightEyeY: 330, eyesOpen: true, eyeOpenness: 0.3,
    yaw: 0, pitch: 0, roll: 0, headTilt: 0,
    mouthOpen: false, mouthGap: 0.02, smileScore: 0, mouthState: 'NEUTRAL',
    teethVisibilityScore: 0,
    ...over,
  };
}

describe('features — free Canadian routing predicate', () => {
  it('routes Canadian Passport + PR card to the free flow when enabled', () => {
    expect(shouldUseFreeCanadian('canadian_passport', true)).toBe(true);
    expect(shouldUseFreeCanadian('canadian_pr_card', true)).toBe(true);
  });

  it('routes all other documents to the premium flow', () => {
    for (const id of ['us_passport', 'us_visa', 'baby_passport']) {
      expect(shouldUseFreeCanadian(id, true)).toBe(false);
    }
  });

  it('flag OFF → Canadian documents fall back to premium (single-flag rollback)', () => {
    expect(shouldUseFreeCanadian('canadian_passport', false)).toBe(false);
    expect(shouldUseFreeCanadian('canadian_pr_card', false)).toBe(false);
  });

  it('live flag currently enables the free flow for Canadian docs', () => {
    expect(FEATURES.FREE_CANADIAN).toBe(true);
    expect(isFreeCanadianDocument('canadian_passport')).toBe(true);
  });
});

describe('runFreeCanadianPipeline', () => {
  it('Canadian + passing compliance → calls PhotoRoom + returns a JPEG', async () => {
    const r = await runFreeCanadianPipeline({
      imageBuffer: Buffer.from('img'),
      documentTypeId: 'canadian_passport',
      biometric: goodCanadianBio(),
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.jpeg.toString()).toBe('final-jpeg');
    expect(removeBackgroundMock).toHaveBeenCalledTimes(1);
    expect(composeMock).toHaveBeenCalledTimes(1);
  });

  it('FAILED compliance → NEVER calls PhotoRoom, returns errors', async () => {
    const r = await runFreeCanadianPipeline({
      imageBuffer: Buffer.from('img'),
      documentTypeId: 'canadian_passport',
      biometric: goodCanadianBio({ faceDetected: false }), // fails at the face check
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.length).toBeGreaterThan(0);
    expect(removeBackgroundMock).not.toHaveBeenCalled();
    expect(composeMock).not.toHaveBeenCalled();
  });

  it('non-Canadian document is rejected and NEVER calls PhotoRoom', async () => {
    const r = await runFreeCanadianPipeline({
      imageBuffer: Buffer.from('img'),
      documentTypeId: 'us_passport',
      biometric: goodCanadianBio(),
    });
    expect(r.ok).toBe(false);
    expect(removeBackgroundMock).not.toHaveBeenCalled();
  });

  it('PR card + passing compliance → JPEG', async () => {
    const r = await runFreeCanadianPipeline({
      imageBuffer: Buffer.from('img'),
      documentTypeId: 'canadian_pr_card',
      biometric: goodCanadianBio(),
    });
    expect(r.ok).toBe(true);
    expect(removeBackgroundMock).toHaveBeenCalledTimes(1);
  });
});

describe('free flow isolation — no premium side effects (Stripe / Supabase / email / orders)', () => {
  const files = [
    'src/lib/generation/free-canadian-generator.ts',
    'src/app/api/free-process-photo/route.ts',
    'src/hooks/useFreeCanadianFlow.ts',
  ];
  const forbidden = ['stripe', '@/lib/supabase', 'resend', 'nodemailer', 'sendEmail', "from('orders')", '/api/orders'];

  // Strip block + line comments so our own "this module avoids Stripe/Supabase…"
  // documentation doesn't trip the check — we only care about real code/imports.
  const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

  it('the free modules import none of the premium side-effect systems', () => {
    for (const f of files) {
      const src = stripComments(readFileSync(f, 'utf8')).toLowerCase();
      for (const token of forbidden) {
        expect(src.includes(token.toLowerCase()), `${f} must not reference "${token}"`).toBe(false);
      }
    }
  });
});
