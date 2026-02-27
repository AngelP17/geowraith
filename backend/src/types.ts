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

export type ConfidenceTier = 'high' | 'medium' | 'low';
export type SceneType = 'landmark' | 'nature' | 'urban' | 'rural' | 'unknown';
export type CohortHint = 'iconic_landmark' | 'generic_scene';

export interface PredictResponse {
  request_id: string;
  status: 'ok' | 'low_confidence';
  mode: PredictMode;
  location: PredictLocation;
  location_visibility: 'visible' | 'withheld';
  location_reason?: string;
  confidence: number;
  confidence_tier: ConfidenceTier;
  scene_context?: {
    scene_type: SceneType;
    cohort_hint: CohortHint;
    confidence_calibration: string;
  };
  elapsed_ms: number;
  notes: string;
  top_matches?: PredictTopMatch[];
  diagnostics?: {
    embedding_source: 'geoclip' | 'clip' | 'fallback';
    reference_index_source: 'model' | 'cache' | 'clip' | 'fallback' | 'unknown';
    reference_image_anchors?: number;
  };
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
  embeddingSource: 'geoclip' | 'clip' | 'fallback';
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
