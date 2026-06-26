import type { DocumentTypeId } from './document';
import type { ComplianceReport, BiometricData } from './biometric';

export type ProductSku = 'digital_download' | 'printed_ready';

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'fulfilled'
  | 'failed';

/**
 * Which path the customer chose:
 *  - 'ai'    → instant automated compliance gate (the original flow)
 *  - 'human' → a team member manually reviews the photo after payment
 */
export type ReviewType = 'ai' | 'human';

/** Delivery-email lifecycle (see migration 20240101000006). */
export type EmailStatus = 'PENDING' | 'SENDING' | 'SENT' | 'FAILED';

/**
 * Manual-review lifecycle. Only set when review_type = 'human'; null otherwise.
 *  - 'awaiting_review'   → paid, sitting in the reviewer queue
 *  - 'in_review'         → a reviewer has claimed it
 *  - 'approved'          → passed; processed photo + print files generated
 *  - 'rejected'          → failed; reasons sent by the expert via email
 *  - 'reupload_approved' → expert approved a photo the customer emailed after a
 *                          rejection; the status page re-opens an upload box so
 *                          the customer can submit it and generate the files
 */
export type ReviewStatus =
  | 'awaiting_review'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'reupload_approved';

export interface Order {
  id: string;
  document_type: DocumentTypeId;
  product_sku: ProductSku;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  status: OrderStatus;
  email: string | null;
  photo_original_url: string | null;
  photo_processed_url: string | null;
  photo_composite_url: string | null;
  download_url: string | null;   // PDF sent to digital customers
  pdf_url: string | null;        // tiled 4×6 PDF (admin use for printed orders)
  store_name: string | null;
  store_address: string | null;
  store_place_id: string | null;
  store_maps_url: string | null;
  pickup_time: string | null;
  compliance_data: ComplianceResult | null;
  // ── Human-review path ──────────────────────────────────────────────
  review_type: ReviewType;
  review_status: ReviewStatus | null;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  // ── Delivery-email reliability ─────────────────────────────────────
  email_status: EmailStatus;
  email_retry_count: number;
  last_email_attempt_at: string | null;
  email_sent_at: string | null;
  last_email_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplianceResult {
  passed: boolean;
  faceDetected: boolean;
  faceCount: number;
  headHeightPercent: number | null;
  eyesOpen: boolean | null;
  mouthClosed: boolean | null;
  facingForward: boolean | null;
  issues: string[];
  warnings: string[];
  /** Rich per-axis biometric report (present when measured by MediaPipe). */
  report?: ComplianceReport;
  /** Which engine produced this result. */
  source?: 'mediapipe' | 'rekognition';
  /** Read-only exposure analysis (face region only) — compliance check, does not modify the image. */
  exposure?: ExposureAnalysis;
  /** Read-only blur analysis (face region only) — compliance check, does not modify the image. */
  blur?: BlurAnalysis;
  /** MediaPipe biometric measured at upload — reused by the human-review approval
   *  so it scales the face with the SAME computeCrop()/DOCUMENT_RULES as the AI path. */
  biometric?: BiometricData;
}

export type QualityStatus = 'PASS' | 'WARNING' | 'FAIL';

/** Face-region exposure analysis (read-only compliance check on the uploaded image). */
export interface ExposureAnalysis {
  /** Mean face luminance, 0–255. */
  brightnessScore: number | null;
  /** Fraction of face pixels in deep shadow (0–1). */
  shadowScore: number | null;
  /** Fraction of very-dark face pixels (0–1). */
  underExposureScore: number | null;
  /** Fraction of blown-highlight face pixels (0–1). */
  overExposureScore: number | null;
  /** Left↔right face luminance imbalance, 0–255. */
  lightingBalanceScore: number | null;
  status: QualityStatus;
  reason: string;
}

/** Face-region blur analysis (variance of Laplacian on the uploaded image). */
export interface BlurAnalysis {
  /** Variance of the Laplacian over the face ROI. Higher = sharper. */
  blurScore: number | null;
  status: QualityStatus;
  reason: string;
}

export interface ProductOption {
  sku: ProductSku;
  name: string;
  price: number;
  description: string;
  features: string[];
  turnaround: string;
}
