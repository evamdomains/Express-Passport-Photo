import type { DocumentSpec, DocumentTypeId } from '@/types/document';

// 4×6 print at 300 DPI = 1200×1800 px
// US 2×2 in = 600×600 px → 2 cols × 3 rows = 6 photos
// Canadian 50×70 mm ≈ 591×827 px → 2 cols × 2 rows = 4 photos

export const DOCUMENT_SPECS: Record<DocumentTypeId, DocumentSpec> = {
  us_passport: {
    id: 'us_passport',
    name: 'US Passport',
    country: 'US',
    widthPx: 600,
    heightPx: 600,
    widthMm: 50.8,
    heightMm: 50.8,
    dpi: 300,
    backgroundHex: '#FFFFFF',
    // Head (top of hair to bottom of chin) must be 1"–1⅜" in a 2" photo = 50–69%
    headHeightMin: 0.50,
    headHeightMax: 0.69,
    faceHeightMinMm: null,
    faceHeightMaxMm: null,
    requirements: [
      'White or off-white background',
      'Both eyes open and clearly visible',
      'Neutral expression or natural smile',
      'No glasses',
      'Head centered, facing forward',
      'No hats or head coverings (unless for religious reasons)',
      'Taken within the last 6 months',
    ],
    tilesOn4x6: [2, 3],
  },

  us_visa: {
    id: 'us_visa',
    name: 'US Visa',
    country: 'US',
    widthPx: 600,
    heightPx: 600,
    widthMm: 50.8,
    heightMm: 50.8,
    dpi: 300,
    backgroundHex: '#FFFFFF',
    headHeightMin: 0.50,
    headHeightMax: 0.69,
    faceHeightMinMm: null,
    faceHeightMaxMm: null,
    requirements: [
      'White or off-white background',
      'Both eyes open and clearly visible',
      'Neutral expression',
      'No glasses',
      'Head centered, facing directly at camera',
      'No hats or head coverings',
      'Taken within the last 6 months',
    ],
    tilesOn4x6: [2, 3],
  },

  canadian_passport: {
    id: 'canadian_passport',
    name: 'Canadian Passport',
    country: 'Canada',
    widthPx: 591,  // 50mm at 300 DPI
    heightPx: 827, // 70mm at 300 DPI
    widthMm: 50,
    heightMm: 70,
    dpi: 300,
    backgroundHex: '#FFFFFF',
    // Face height (chin to crown) must be 31–36 mm in a 70mm photo = 44–51%
    headHeightMin: 0.44,
    headHeightMax: 0.51,
    faceHeightMinMm: 31,
    faceHeightMaxMm: 36,
    requirements: [
      'Plain white background',
      'Both eyes open, clearly visible, and looking directly at the camera',
      'Neutral expression with mouth closed',
      'No glasses',
      'No hats or head coverings',
      'Face must be centered and squared with the photo',
      'Taken within the last 6 months',
    ],
    tilesOn4x6: [2, 2],
  },

  canadian_pr_card: {
    id: 'canadian_pr_card',
    name: 'Canadian PR Card',
    country: 'Canada',
    widthPx: 591,
    heightPx: 827,
    widthMm: 50,
    heightMm: 70,
    dpi: 300,
    backgroundHex: '#FFFFFF',
    headHeightMin: 0.44,
    headHeightMax: 0.51,
    faceHeightMinMm: 31,
    faceHeightMaxMm: 36,
    requirements: [
      'Plain white background',
      'Both eyes open and clearly visible',
      'Neutral expression with mouth closed',
      'No glasses, hats, or head coverings',
      'Face centered and squared',
      'Taken within the last 6 months',
    ],
    tilesOn4x6: [2, 2],
  },
};

export const DOCUMENT_SPEC_LIST = Object.values(DOCUMENT_SPECS);
