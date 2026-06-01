import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import type { DocumentSpec } from '@/types/document';

const MM_PER_INCH = 25.4;

/** Composites a transparent-background PNG onto a white canvas and resizes to spec. */
export async function composePassportPhoto(
  transparentPng: Buffer,
  spec: DocumentSpec
): Promise<Buffer> {
  return sharp({
    create: {
      width: spec.widthPx,
      height: spec.heightPx,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([
      {
        input: await sharp(transparentPng)
          .resize(spec.widthPx, spec.heightPx, { fit: 'cover', position: 'top' })
          .toBuffer(),
        top: 0,
        left: 0,
      },
    ])
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
