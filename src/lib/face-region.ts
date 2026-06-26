import sharp from 'sharp';
import type { BiometricData } from '@/types/biometric';

/**
 * Shared helpers to isolate the FACE region (using the MediaPipe biometric) and
 * read its raw grayscale pixels. Used by the exposure + blur analyzers so they
 * ignore the background entirely.
 *
 * Reads RAW pixels of the extracted region — Sharp's `.stats()` ignores a prior
 * `.extract()` and would report whole-image statistics.
 */

export interface PxBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface GrayRoi {
  data: Buffer; // single-channel, length = w*h
  w: number;
  h: number;
}

const clampInt = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(v)));

/** Face bounding box (crown→chin) in pixels, clamped to the image, or null. */
export function faceBoxPx(bio: BiometricData | undefined, W: number, H: number): PxBox | null {
  if (!bio?.faceDetected || W < 1 || H < 1) return null;
  const fw = Math.max(8, bio.faceWidth);
  const left = clampInt(bio.faceCenterXNorm * W - fw / 2, 0, W - 1);
  const top = clampInt(bio.crownY, 0, H - 1);
  const width = Math.min(W - left, Math.max(8, Math.round(fw)));
  const height = Math.min(H - top, Math.max(8, Math.round(bio.chinY - bio.crownY)));
  if (width < 8 || height < 8) return null;
  return { left, top, width, height };
}

/** Extract a box and return its raw grayscale pixels (optionally downscaled to fit `maxW`). */
export async function grayRoi(buffer: Buffer, box: PxBox, maxW?: number): Promise<GrayRoi | null> {
  try {
    let pipeline = sharp(buffer).extract(box).greyscale();
    if (maxW && box.width > maxW) pipeline = pipeline.resize(maxW, maxW, { fit: 'inside' });
    const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
    if (!data.length) return null;
    return { data, w: info.width, h: info.height };
  } catch {
    return null;
  }
}

/** Mean of a single-channel buffer (0–255). */
export function meanOf(data: Buffer): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i];
  return data.length ? sum / data.length : 0;
}
