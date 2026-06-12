import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import type { DocumentSpec } from '@/types/document';
import type { CropRect } from '@/types/biometric';

const MM_PER_INCH = 25.4;

/**
 * Composites the background-removed PNG onto a white canvas at the document's
 * exact dimensions.
 *
 * When a `crop` is supplied (computed client-side by the
 * PassportComplianceEngine from MediaPipe measurements), the FACE is scaled to
 * the document's required ratio: we extract the crop region from the source
 * (padding with white where the crop extends past the image edge) and resize
 * that to the canvas — so the head fills the compliant 50–69% (US) / 44–51%
 * (Canada) of the frame. Without a crop it falls back to the original
 * cover/top resize so nothing breaks if the browser couldn't measure the face.
 */
export async function composePassportPhoto(
  transparentPng: Buffer,
  spec: DocumentSpec,
  crop?: CropRect
): Promise<Buffer> {
  let faceLayer: Buffer;

  if (crop) {
    const meta = await sharp(transparentPng).metadata();
    const W = meta.width ?? spec.widthPx;
    const H = meta.height ?? spec.heightPx;

    let left = Math.round(crop.left * W);
    let top = Math.round(crop.top * H);
    const width = Math.max(1, Math.round(crop.width * W));
    const height = Math.max(1, Math.round(crop.height * H));

    // Pad with transparent pixels wherever the crop extends past the image
    // (e.g. not enough headroom above the crown) so .extract() stays in bounds.
    const padLeft = Math.max(0, -left);
    const padTop = Math.max(0, -top);
    const padRight = Math.max(0, left + width - W);
    const padBottom = Math.max(0, top + height - H);

    let img = sharp(transparentPng).ensureAlpha();
    if (padLeft || padTop || padRight || padBottom) {
      const extended = await img
        .extend({
          top: padTop,
          bottom: padBottom,
          left: padLeft,
          right: padRight,
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        })
        .toBuffer();
      img = sharp(extended);
      left += padLeft;
      top += padTop;
    }

    faceLayer = await img
      .extract({ left, top, width, height })
      .resize(spec.widthPx, spec.heightPx, { fit: 'fill' })
      .toBuffer();
  } else {
    faceLayer = await sharp(transparentPng)
      .resize(spec.widthPx, spec.heightPx, { fit: 'cover', position: 'top' })
      .toBuffer();
  }

  return sharp({
    create: {
      width: spec.widthPx,
      height: spec.heightPx,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([{ input: faceLayer, top: 0, left: 0 }])
    .jpeg({ quality: 95 })
    .toBuffer();
}

/**
 * Creates a tiled print-ready image on a 4×6 inch canvas (1200×1800 px at 300 DPI).
 * Returns a JPEG buffer suitable for printing at any pharmacy.
 */
export async function createTiledComposite(
  photoBuffer: Buffer,
  spec: DocumentSpec
): Promise<Buffer> {
  const CANVAS_W = 1200; // 4 inches at 300 DPI
  const CANVAS_H = 1800; // 6 inches at 300 DPI
  const [cols, rows] = spec.tilesOn4x6;

  const marginH = Math.floor((CANVAS_W - cols * spec.widthPx) / (cols + 1));
  const marginV = Math.floor((CANVAS_H - rows * spec.heightPx) / (rows + 1));

  const composites: sharp.OverlayOptions[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      composites.push({
        input: photoBuffer,
        left: marginH + col * (spec.widthPx + marginH),
        top: marginV + row * (spec.heightPx + marginV),
      });
    }
  }

  return sharp({
    create: {
      width: CANVAS_W,
      height: CANVAS_H,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite(composites)
    .jpeg({ quality: 95 })
    .toBuffer();
}

/**
 * Wraps the tiled JPEG inside a single-page PDF sized to 4×6 inches.
 * Uses pdf-lib so no native dependencies are added beyond sharp.
 */
export async function createPrintPdf(tiledJpeg: Buffer): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const POINTS_PER_INCH = 72;
  const page = pdf.addPage([4 * POINTS_PER_INCH, 6 * POINTS_PER_INCH]);

  const img = await pdf.embedJpg(tiledJpeg);
  page.drawImage(img, {
    x: 0,
    y: 0,
    width: page.getWidth(),
    height: page.getHeight(),
  });

  const pdfBytes = await pdf.save();
  return Buffer.from(pdfBytes);
}

/**
 * Estimate the crown (top of the hair) from the PhotoRoom cut-out's alpha
 * silhouette — the topmost row that contains a meaningful run of opaque pixels.
 * Returns the crown position normalized 0..1 of image height, or null if the
 * scan is inconclusive (caller then falls back to the landmark-based estimate).
 *
 * This is the "hair segmentation boundary" the crop uses so that head height is
 * measured crown→chin (hair included), matching passport-photo.online.
 */
export async function measureCrownYNorm(transparentPng: Buffer): Promise<number | null> {
  try {
    // Alpha channel only, downscaled for speed (precision well under 1%).
    const { data, info } = await sharp(transparentPng)
      .ensureAlpha()
      .resize({ height: 400, withoutEnlargement: true })
      .extractChannel(3)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;
    const minOpaque = Math.max(3, Math.floor(width * 0.02)); // ignore stray AA specks
    const ALPHA = 40;

    for (let y = 0; y < height; y++) {
      let count = 0;
      const row = y * width;
      for (let x = 0; x < width; x++) {
        if (data[row + x] > ALPHA && ++count >= minOpaque) {
          return y / height;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** Returns image metadata (width, height) without decoding the full image. */
export async function getImageDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number }> {
  const meta = await sharp(buffer).metadata();
  return { width: meta.width ?? 0, height: meta.height ?? 0 };
}

/** Converts mm to pixels at the given DPI. */
export function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm / MM_PER_INCH) * dpi);
}
