import type { BiometricData } from '@/types/biometric';
import type { ExposureAnalysis, QualityStatus } from '@/types/order';
import { faceBoxPx, grayRoi, meanOf, type PxBox } from './face-region';
import { EXPOSURE } from './face/image-quality';

/**
 * Exposure analysis — FACE REGION ONLY (background ignored). Detects
 * under/over-exposure, uneven left↔right lighting, and deep facial shadows on
 * the uploaded image, before PhotoRoom. Now ENFORCED: /api/process-photo
 * rejects (no PhotoRoom) when this returns FAIL. Thresholds live in
 * ./face/image-quality (shared with the browser gate) so both agree.
 */

const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d;

function skip(reason: string): ExposureAnalysis {
  return {
    brightnessScore: null, shadowScore: null, underExposureScore: null,
    overExposureScore: null, lightingBalanceScore: null, status: 'PASS', reason,
  };
}

export async function analyzeExposure(buffer: Buffer, bio: BiometricData | undefined, W: number, H: number): Promise<ExposureAnalysis> {
  const box = faceBoxPx(bio, W, H);
  if (!box) return skip('No face — exposure not analyzed.');
  const roi = await grayRoi(buffer, box);
  if (!roi) return skip('Face region could not be sampled — exposure not analyzed.');

  const n = roi.data.length;
  let dark = 0, bright = 0;
  for (let i = 0; i < n; i++) {
    const v = roi.data[i];
    if (v < EXPOSURE.darkPx) dark++;
    if (v > EXPOSURE.brightPx) bright++;
  }
  const mean = meanOf(roi.data);
  const underExposureScore = dark / n;
  const overExposureScore = bright / n;

  // Deep facial shadows: fraction notably darker than the face mean.
  const shadowThresh = Math.max(0, mean - EXPOSURE.shadowDelta);
  let shadow = 0;
  for (let i = 0; i < n; i++) if (roi.data[i] < shadowThresh) shadow++;
  const shadowScore = shadow / n;

  // Left ↔ right balance — two half-width face boxes.
  const halfW = Math.floor(box.width / 2);
  const leftBox: PxBox = { left: box.left, top: box.top, width: halfW, height: box.height };
  const rightBox: PxBox = { left: box.left + box.width - halfW, top: box.top, width: halfW, height: box.height };
  const [lRoi, rRoi] = await Promise.all([grayRoi(buffer, leftBox), grayRoi(buffer, rightBox)]);
  const lightingBalanceScore = lRoi && rRoi ? Math.abs(meanOf(lRoi.data) - meanOf(rRoi.data)) : 0;

  // ── Status (worst of the sub-checks) ──
  const fail =
    mean < EXPOSURE.underFailMean ||
    mean > EXPOSURE.overFailMean ||
    overExposureScore > EXPOSURE.overBlownFail ||
    lightingBalanceScore > EXPOSURE.balanceFail ||
    shadowScore > EXPOSURE.shadowFail;
  const warn =
    mean < EXPOSURE.underWarnMean ||
    mean > EXPOSURE.overWarnMean ||
    overExposureScore > EXPOSURE.overBlownWarn ||
    lightingBalanceScore > EXPOSURE.balanceWarn ||
    shadowScore > EXPOSURE.shadowWarn;
  const status: QualityStatus = fail ? 'FAIL' : warn ? 'WARNING' : 'PASS';

  const reason =
    status === 'PASS'
      ? 'Face exposure looks good.'
      : mean < EXPOSURE.underWarnMean
        ? 'Face looks underexposed (too dark).'
        : mean > EXPOSURE.overWarnMean || overExposureScore > EXPOSURE.overBlownWarn
          ? 'Face looks overexposed (too bright / blown highlights).'
          : lightingBalanceScore > EXPOSURE.balanceWarn
            ? 'Uneven lighting across the face.'
            : 'Deep facial shadows detected.';

  return {
    brightnessScore: round(mean, 1),
    shadowScore: round(shadowScore),
    underExposureScore: round(underExposureScore),
    overExposureScore: round(overExposureScore),
    lightingBalanceScore: round(lightingBalanceScore, 1),
    status,
    reason,
  };
}
