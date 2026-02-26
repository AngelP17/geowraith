const DEFAULT_API_PORT = 8080;
const DEFAULT_MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function parseInteger(value: string | undefined, fallback: number, min = 0, max = Infinity): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < min) return fallback;
  return Math.min(parsed, max);
}

function parseFloat(value: string | undefined, fallback: number, min = -Infinity, max = Infinity): number {
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(parsed, max));
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  if (value === '1' || value.toLowerCase() === 'true') return true;
  if (value === '0' || value.toLowerCase() === 'false') return false;
  return fallback;
}

/**
 * Confidence tier thresholds
 *
 * These tiers are calibrated for operator decisions, not cosmetic scoring:
 * - High (>= 0.75): strong, actionable landmark agreement
 * - Medium (0.60-0.74): plausible but still approximate
 * - Low (< 0.60): weak or ambiguous; treat as uncertain
 *
 * MINIMUM_CONFIDENCE:
 * Coordinates are withheld when confidence is below this threshold to reduce
 * false continent/country outputs on ambiguous imagery.
 */
export const CONFIDENCE_THRESHOLDS = {
  high: { min: 0.75, label: 'high' as const },
  medium: { min: 0.6, label: 'medium' as const },
  low: { min: 0, label: 'low' as const },
};

/**
 * Minimum confidence required before coordinates are shown to operators.
 * Below this, API returns low_confidence and marks location as withheld.
 */
export const MINIMUM_CONFIDENCE = 0.65;

/**
 * Ultra-high accuracy mode settings
 */
export const ULTRA_ACCURACY_CONFIG = {
  enabled: parseBoolean(process.env.GEOWRAITH_ULTRA_ACCURACY, false),
  clusterRadiusM: parseInteger(process.env.GEOWRAITH_ULTRA_CLUSTER_RADIUS_M, 30000, 10000, 50000),
  minClusterCandidates: parseInteger(process.env.GEOWRAITH_ULTRA_MIN_CLUSTER, 4, 2, 10),
  outlierRejection: parseBoolean(process.env.GEOWRAITH_OUTLIER_REJECTION, true),
  iqrMultiplier: parseFloat(process.env.GEOWRAITH_OUTLIER_IQR, 1.5, 0.5, 3.0),
};

/**
 * Coordinate reference index settings
 */
export const COORDINATE_CONFIG = {
  targetCount: parseInteger(process.env.GEOWRAITH_COORDINATE_COUNT, 300000, 10000, 2000000),
  chunkSize: parseInteger(process.env.GEOWRAITH_COORDINATE_CHUNK_SIZE, 256, 64, 1024),
};

/**
 * ANN search configuration for multi-scale matching
 */
export const ANN_CONFIG = {
  tier1Candidates: parseInteger(process.env.GEOWRAITH_ANN_TIER1_CANDIDATES, 500, 100, 2000),
  tier2Candidates: parseInteger(process.env.GEOWRAITH_ANN_TIER2_CANDIDATES, 200, 50, 1000),
  tier3Candidates: parseInteger(process.env.GEOWRAITH_ANN_TIER3_CANDIDATES, 50, 10, 500),
  tier1RadiusKm: parseInteger(process.env.GEOWRAITH_ANN_TIER1_RADIUS_KM, 200, 50, 1000),
  tier2RadiusKm: parseInteger(process.env.GEOWRAITH_ANN_TIER2_RADIUS_KM, 50, 10, 500),
  tier3RadiusKm: parseInteger(process.env.GEOWRAITH_ANN_TIER3_RADIUS_KM, 10, 1, 100),
};

/**
 * DBSCAN clustering configuration
 */
export const DBSCAN_CONFIG = {
  epsilon: parseInteger(process.env.GEOWRAITH_DBSCAN_EPSILON, 30000, 10000, 100000),
  minPoints: parseInteger(process.env.GEOWRAITH_DBSCAN_MIN_POINTS, 3, 2, 10),
  maxClusters: parseInteger(process.env.GEOWRAITH_DBSCAN_MAX_CLUSTERS, 10, 3, 50),
};

/**
 * Cluster aggregation settings
 */
export const CLUSTER_CONFIG = {
  radiusM: parseInteger(process.env.GEOWRAITH_CLUSTER_RADIUS_M, 30000, 10000, 100000),
  maxCandidates: parseInteger(process.env.GEOWRAITH_MAX_CLUSTER_CANDIDATES, 6, 3, 20),
  searchDepth: parseInteger(process.env.GEOWRAITH_CLUSTER_SEARCH_DEPTH, 24, 8, 100),
  minCandidates: parseInteger(process.env.GEOWRAITH_ANN_MIN_CANDIDATES, 64, 16, 500),
  enableOutlierRejection: parseBoolean(process.env.GEOWRAITH_OUTLIER_REJECTION, true),
};

/**
 * Ensemble confidence weights
 */
export const ENSEMBLE_CONFIG = {
  anchorWeight: parseFloat(process.env.GEOWRAITH_ENSEMBLE_ANCHOR_WEIGHT, 0.35, 0, 1),
  clusterWeight: parseFloat(process.env.GEOWRAITH_ENSEMBLE_CLUSTER_WEIGHT, 0.30, 0, 1),
  geographicWeight: parseFloat(process.env.GEOWRAITH_ENSEMBLE_GEOGRAPHIC_WEIGHT, 0.20, 0, 1),
  multiSourceWeight: parseFloat(process.env.GEOWRAITH_ENSEMBLE_MULTISOURCE_WEIGHT, 0.15, 0, 1),
};

/**
 * Data source flags
 */
export const SOURCE_CONFIG = {
  enableOSV5M: parseBoolean(process.env.GEOWRAITH_ENABLE_OSV5M, true),
  enableUnsplash: parseBoolean(process.env.GEOWRAITH_ENABLE_UNSPLASH, true),
  enableGeograph: parseBoolean(process.env.GEOWRAITH_ENABLE_GEOGRAPH, true),
  enableKartaView: parseBoolean(process.env.GEOWRAITH_ENABLE_KARTAVIEW, true),
  enablePexels: parseBoolean(process.env.GEOWRAITH_ENABLE_PEXELS, true),
  enablePixabay: parseBoolean(process.env.GEOWRAITH_ENABLE_PIXABAY, true),
};

/**
 * Anchor penalty settings
 */
export const ANCHOR_PENALTY = {
  imagePenalty: parseFloat(process.env.GEOWRAITH_IMAGE_ANCHOR_PENALTY, 0.05, 0, 0.35),
  cityPenalty: parseFloat(process.env.GEOWRAITH_CITY_ANCHOR_PENALTY, 0.12, 0, 0.5),
  strongAnchorSimilarity: parseFloat(process.env.GEOWRAITH_STRONG_ANCHOR_SIMILARITY, 0.9, 0.8, 0.99),
  strongAnchorMargin: parseFloat(process.env.GEOWRAITH_STRONG_ANCHOR_MARGIN, 0.18, 0.05, 0.5),
};

export const config = {
  apiPort: parseInteger(process.env.GEOWRAITH_API_PORT, DEFAULT_API_PORT),
  maxImageBytes: parseInteger(process.env.GEOWRAITH_MAX_IMAGE_BYTES, DEFAULT_MAX_IMAGE_BYTES),
  offlineMode: parseBoolean(process.env.GEOWRAITH_OFFLINE, true),
  sfmEnabled: parseBoolean(process.env.GEOWRAITH_ENABLE_SFM, false),
};
