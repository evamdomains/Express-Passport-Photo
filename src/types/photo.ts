export interface ProcessPhotoRequest {
  sessionId: string;
  documentTypeId: string;
}

export interface ProcessPhotoResponse {
  success: boolean;
  sessionId: string;
  processedUrl: string;
  compositeUrl: string;
  compliance: import('./order').ComplianceResult;
  error?: string;
}

export interface StoreResult {
  placeId: string;
  name: string;
  address: string;
  distance: string;
  phone: string | null;
  openNow: boolean | null;
  lat: number;
  lng: number;
  mapsUrl: string;
}
