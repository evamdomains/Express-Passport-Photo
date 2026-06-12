import sharp from 'sharp';

/**
 * Generate the protected PREVIEW asset from the clean processed photo.
 *
 * Downscales to a screen-only resolution (≤ ~700px) and bakes a diagonal,
 * tiled "PREVIEW ONLY · ExpressPassportPhoto" watermark into the pixels — so a
 * copied/dragged/inspected preview is always the protected version. The clean
 * processed.jpg / print.pdf are never exposed before payment.
 *
 * The precise measurement guides (purple border, navy rulers, green crown→chin
 * line) are drawn as a CSS overlay on the review page on top of this asset.
 */
const PREVIEW_MAX = 700;

function watermarkSvg(width: number, height: number): string {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="wm" width="240" height="150" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)">
        <text x="0" y="42" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="700" fill="rgba(30,36,56,0.20)">PREVIEW ONLY</text>
        <text x="0" y="74" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="600" fill="rgba(30,36,56,0.18)">ExpressPassportPhoto</text>
      </pattern>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#wm)"/>
  </svg>`;
}

export async function generatePreview(processedJpeg: Buffer): Promise<Buffer> {
  // Downscale (screen-only; well below print quality).
  const resized = await sharp(processedJpeg)
    .resize(PREVIEW_MAX, PREVIEW_MAX, { fit: 'inside', withoutEnlargement: true })
    .toBuffer();

  const meta = await sharp(resized).metadata();
  const w = meta.width ?? PREVIEW_MAX;
  const h = meta.height ?? PREVIEW_MAX;

  return sharp(resized)
    .composite([{ input: Buffer.from(watermarkSvg(w, h)), top: 0, left: 0 }])
    .jpeg({ quality: 80 })
    .toBuffer();
}
