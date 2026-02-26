/**
 * Validation benchmark types.
 */

import type { PredictResponse } from '../../types.js';

export interface GalleryImage {
  id: string;
  source: string;
  filename: string;
  url: string;
  local_path: string;
  coordinates: { lat: number; lon: number };
  accuracy_radius: number;
  image_info: {
    width: number;
    height: number;
    size_bytes: number;
    mime_type: string;
  };
  metadata: {
    title: string;
    description?: string;
    artist?: string;
    capture_date?: string;
    categories: string[];
  };
}

export interface GalleryManifest {
  images: GalleryImage[];
  stats: {
    total: number;
    by_continent: Record<string, number>;
    by_country_estimate: Record<string, number>;
    by_scene_type: {
      urban: number;
      rural: number;
      landmark: number;
      nature: number;
      unknown: number;
    };
  };
  created_at: string;
}

export interface BenchmarkResult {
  imageId: string;
  filename: string;
  expected: { lat: number; lon: number };
  predicted: { lat: number; lon: number };
  errorMeters: number;
  confidence: number;
  confidenceTier: PredictResponse['confidence_tier'];
  elapsedMs: number;
  status: string;
  continent: string;
  sceneType: string;
}

export interface AccuracyReport {
  summary: {
    totalImages: number;
    successful: number;
    failed: number;
    medianErrorM: number;
    meanErrorM: number;
    p95ErrorM: number;
    p99ErrorM: number;
    minErrorM: number;
    maxErrorM: number;
  };
  thresholds: {
    within100m: number;
    within1km: number;
    within10km: number;
    within100km: number;
    within1000km: number;
  };
  byContinent: Record<string, {
    count: number;
    medianErrorM: number;
    meanErrorM: number;
    within10km: number;
  }>;
  bySceneType: Record<string, {
    count: number;
    medianErrorM: number;
    within10km: number;
  }>;
  confidenceCorrelation: {
    highConfidence: { count: number; medianErrorM: number };
    mediumConfidence: { count: number; medianErrorM: number };
    lowConfidence: { count: number; medianErrorM: number };
  };
  results: BenchmarkResult[];
}
