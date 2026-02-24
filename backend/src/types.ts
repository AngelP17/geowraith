export type PredictMode = 'fast' | 'accurate';

export interface PredictRequest {
  image_base64?: string;
  image_url?: string;
  options?: {
    mode?: PredictMode;
  };
}

export interface PredictLocation {
  lat: number;
  lon: number;
  radius_m: number;
}

export interface PredictTopMatch {
  id: string;
  label: string;
  lat: number;
  lon: number;
  similarity: number;
}

export interface PredictResponse {
  request_id: string;
  status: 'ok';
  mode: PredictMode;
  location: PredictLocation;
  confidence: number;
  elapsed_ms: number;
  notes: string;
  top_matches?: PredictTopMatch[];
}

export interface ErrorResponse {
  error: string;
  message: string;
}

export interface ParsedPredictInput {
  imageBuffer: Buffer;
  mode: PredictMode;
  source: 'base64' | 'data_url';
}

export interface ImageMeta {
  format: string;
  width: number;
  height: number;
}

export interface ImageGpsLocation {
  lat: number;
  lon: number;
}

export interface ImageSignals {
  meta: ImageMeta;
  vector: number[];
  exifLocation: ImageGpsLocation | null;
}

export interface ReferenceVectorRecord {
  id: string;
  label: string;
  lat: number;
  lon: number;
  vector: number[];
}

export interface VectorMatch extends ReferenceVectorRecord {
  similarity: number;
}

export interface AggregatedResult {
  location: PredictLocation;
  confidence: number;
}
