import type { BiometricData } from '@/types/biometric';
import type { BlurAnalysis, QualityStatus } from '@/types/order';
import { faceBoxPx, grayRoi } from './face-region';
import { QUALITY } from './face/quality-config';

/**
 * Blur analysis — FACE REGION ONLY. Variance of the Laplacian over the face
 * ROI (downscaled to a fixed width so it's resolution-independent), on the
 * uploaded image, before enhancement and before PhotoRoom.
 *
 * Reuses the same thresholds as the browser sharpness check
 * (QUALITY.sharpnessFail / sharpnessWarn) so blur is judged on one consistent
 * scale across client and server:
 *   ≥ sharpnessWarn → PASS (sharp)
 *   ≥ sharpnessFail → WARNING (slightly soft)
 *   < sharpnessFail → FAIL (blurry / out of focus)
 *
 * Analysis only — it does NOT gate PhotoRoom (the compliance gate already does).
 */

const ROI_W = 256;

/** 4-neighbour variance of the Laplacian over a single-channel buffer. */
function varianceOfLaplacian(data: Buffer, w: number, h: number): number {
  let n = 0, sum = 0, sumSq = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const lap = 4 * data[i] - data[i - 1] - data[i + 1] - data[i - w] - data[i + w];
      sum += lap;
      sumSq += lap * lap;
      n++;
    }
  }
  if (!n) return 0;
  const mean = sum / n;
  return Math.max(0, sumSq / n - mean * mean);
}

export async function analyzeBlur(buffer: Buffer, bio: BiometricData | undefined, W: number, H: number): Promise<BlurAnalysis> {
  const box = faceBoxPx(bio, W, H);
  if (!box) return { blurScore: null, status: 'PASS', reason: 'No face — blur not analyzed.' };
  const roi = await grayRoi(buffer, box, ROI_W);
  if (!roi || roi.w < 8 || roi.h < 8) return { blurScore: null, status: 'PASS', reason: 'Face region could not be sampled — blur not analyzed.' };

  const blurScore = Math.round(varianceOfLaplacian(roi.data, roi.w, roi.h) * 10) / 10;
  const status: QualityStatus =
    blurScore >= QUALITY.sharpnessWarn ? 'PASS' : blurScore >= QUALITY.sharpnessFail ? 'WARNING' : 'FAIL';
  const reason =
    status === 'PASS'
      ? 'Face is sharp.'
      : status === 'WARNING'
        ? 'Face looks slightly soft — a sharper image is recommended.'
        : 'Face is blurry or out of focus.';

  return { blurScore, status, reason };
}
