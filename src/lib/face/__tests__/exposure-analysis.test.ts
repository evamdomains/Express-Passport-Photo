import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { analyzeExposure } from '@/lib/exposure-analysis';
import type { BiometricData } from '@/types/biometric';

const W = 240, H = 240;

async function flat(v: number): Promise<Buffer> {
  return sharp(Buffer.alloc(W * H * 3, v), { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();
}
async function split(l: number, r: number): Promise<Buffer> {
  const b = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = x < W / 2 ? l : r; const i = (y * W + x) * 3; b[i] = b[i + 1] = b[i + 2] = v; }
  return sharp(b, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();
}
function bio(over: Partial<BiometricData> = {}): BiometricData {
  return {
    faceDetected: true, faceCount: 1, imageWidth: W, imageHeight: H,
    crownY: 10, chinY: 230, faceHeight: 220, faceWidth: 220, faceRatio: 0.9,
    faceCenterXNorm: 0.5, eyeCenterYNorm: 0.4, faceHeightNorm: 0.9,
    leftEyeY: 96, rightEyeY: 96, eyesOpen: true, yaw: 0, pitch: 0, roll: 0, headTilt: 0,
    mouthOpen: false, mouthGap: 0.01, smileScore: 0.05, mouthState: 'NEUTRAL', teethVisibilityScore: 0, ...over,
  };
}

describe('exposure analysis (face region only)', () => {
  it('well-lit face → PASS', async () => {
    const r = await analyzeExposure(await flat(140), bio(), W, H);
    expect(r.status).toBe('PASS');
    expect(r.brightnessScore!).toBeGreaterThan(120);
  });

  it('very dark face → FAIL (underexposed)', async () => {
    const r = await analyzeExposure(await flat(30), bio(), W, H);
    expect(r.status).toBe('FAIL');
    expect(r.reason).toMatch(/underexposed|dark/i);
  });

  it('blown-out face → FAIL (overexposed)', async () => {
    const r = await analyzeExposure(await flat(245), bio(), W, H);
    expect(r.status).toBe('FAIL');
    expect(r.reason).toMatch(/overexposed|bright/i);
  });

  it('uneven left/right lighting → FAIL, balance score high', async () => {
    const r = await analyzeExposure(await split(80, 170), bio(), W, H);
    expect(r.status).toBe('FAIL');
    expect(r.lightingBalanceScore!).toBeGreaterThan(60);
  });

  it('no face → not analyzed (PASS, null scores — never a false alarm)', async () => {
    const r = await analyzeExposure(await flat(140), bio({ faceDetected: false }), W, H);
    expect(r.status).toBe('PASS');
    expect(r.brightnessScore).toBeNull();
  });
});
