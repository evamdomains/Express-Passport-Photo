export type DocumentTypeId =
  | 'us_passport'
  | 'us_visa'
  | 'baby_passport'
  | 'canadian_passport'
  | 'canadian_pr_card';

export interface DocumentSpec {
  id: DocumentTypeId;
  name: string;
  country: 'US' | 'Canada';
  /** Final output dimensions in pixels (at dpi) */
  widthPx: number;
  heightPx: number;
  /** Physical dimensions in mm */
  widthMm: number;
  heightMm: number;
  dpi: number;
  backgroundHex: '#FFFFFF';
  /** Head height as fraction of image height (min/max) */
  headHeightMin: number;
  headHeightMax: number;
  /** Face (chin-to-crown) height in mm (null = use headHeight fractions) */
  faceHeightMinMm: number | null;
  faceHeightMaxMm: number | null;
  requirements: string[];
  /** Photos per 4×6 print sheet: [cols, rows]. Square photos → landscape 6×4; tall photos → portrait 4×6. */
  tilesOn4x6: [number, number];
}
