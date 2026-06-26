import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { analyzeBlur } from '@/lib/blur-analysis';
import type { BiometricData } from '@/types/biometric';

const W = 240, H = 240;

async function flat(v: number): Promise<Buffer> {
  return sharp(Buffer.alloc(W * H * 3, v), { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();
}
async function checker(): Promise<Buffer> {
  const b = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = (x + y) & 1 ? 255 : 0; const i = (y * W + x) * 3; b[i] = b[i + 1] = b[i + 2] = v; }
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

describe('blur analysis (face region only)', () => {
  it('sharp, high-frequency face → PASS', async () => {
    const r = await analyzeBlur(await checker(), bio(), W, H);
    expect(r.status).toBe('PASS');
    expect(r.blurScore!).toBeGreaterThan(120);
  });

  it('flat / detail-less (out of focus) → FAIL', async () => {
    const r = await analyzeBlur(await flat(128), bio(), W, H);
    expect(r.status).toBe('FAIL');
    expect(r.blurScore!).toBeLessThan(80);
  });

  it('no face → not analyzed (PASS, null score)', async () => {
    const r = await analyzeBlur(await flat(128), bio({ faceDetected: false }), W, H);
    expect(r.status).toBe('PASS');
    expect(r.blurScore).toBeNull();
  });
});
