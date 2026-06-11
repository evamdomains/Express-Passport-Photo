import type { DocumentTypeId } from './document';
import type { ComplianceReport } from './biometric';

export type ProductSku = 'digital_download' | 'printed_ready';

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'fulfilled'
  | 'failed';

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
}

export interface ProductOption {
  sku: ProductSku;
  name: string;
  price: number;
  description: string;
  features: string[];
  turnaround: string;
}
