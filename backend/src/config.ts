const DEFAULT_API_PORT = 8080;
const DEFAULT_MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function parseInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  if (value === '1' || value.toLowerCase() === 'true') return true;
  if (value === '0' || value.toLowerCase() === 'false') return false;
  return fallback;
}

/**
 * Confidence tier thresholds
 * Based on empirical analysis of validation benchmark (46 images, 2026-02-26):
 * - High: top 30% of confidence scores (≥0.51) - mostly moderate errors
 * - Medium: middle 40% (0.47-0.50) - mixed results  
 * - Low: bottom 30% (≤0.46) - mostly high errors
 * 
 * MINIMUM_CONFIDENCE: Below this threshold, coordinates are withheld to avoid
 * continent-level false positives on weak matches.
 * 
 * Note: Current confidence formula has weak correlation with actual error.
 * These thresholds are percentile-based, not error-based.
 */
export const CONFIDENCE_THRESHOLDS = {
  high: { min: 0.51, label: 'high' as const },
  medium: { min: 0.47, label: 'medium' as const },
  low: { min: 0, label: 'low' as const },
};

/**
 * Minimum confidence required before coordinates are shown to operators.
 * Below this, API returns low_confidence and marks location as withheld.
 */
export const MINIMUM_CONFIDENCE = 0.5;

export const config = {
  apiPort: parseInteger(process.env.GEOWRAITH_API_PORT, DEFAULT_API_PORT),
  maxImageBytes: parseInteger(process.env.GEOWRAITH_MAX_IMAGE_BYTES, DEFAULT_MAX_IMAGE_BYTES),
  offlineMode: parseBoolean(process.env.GEOWRAITH_OFFLINE, true),
  sfmEnabled: parseBoolean(process.env.GEOWRAITH_ENABLE_SFM, false),
};
