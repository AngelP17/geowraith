/**
 * Aggregation logic for vector search results
 * Handles clustering, outlier rejection, and centroid calculation
 */

import { ApiError } from '../errors.js';
import type { AggregatedResult, VectorMatch } from '../types.js';
import { haversineMeters } from '../utils/geo.js';
import { clamp, softmax } from '../utils/math.js';
import {
  filterToDominantContinent,
  calculateGeographicSpreadPenalty,
  validateContinentConsistency,
} from './geoConstraints.js';

// Configurable via environment variables
export const ULTRA_MODE = process.env.GEOWRAITH_ULTRA_ACCURACY === 'true';

export const CLUSTER_RADIUS_M = (() => {
  const raw = process.env.GEOWRAITH_CLUSTER_RADIUS_M;
  if (raw) {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) return Math.max(10_000, Math.min(100_000, parsed));
  }
  return ULTRA_MODE ? 30_000 : 30_000;
})();

export const MAX_CLUSTER_CANDIDATES = (() => {
  const raw = process.env.GEOWRAITH_MAX_CLUSTER_CANDIDATES;
  if (raw) {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) return Math.max(3, Math.min(20, parsed));
  }
  return ULTRA_MODE ? 8 : 6;
})();

export const MIN_CLUSTER_CANDIDATES = (() => {
  const raw = process.env.GEOWRAITH_MIN_CLUSTER_CANDIDATES;
  if (raw) {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) return Math.max(2, Math.min(10, parsed));
  }
  return ULTRA_MODE ? 4 : 3;
})();

export const CLUSTER_SEARCH_DEPTH = (() => {
  const raw = process.env.GEOWRAITH_CLUSTER_SEARCH_DEPTH;
  if (raw) {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) return Math.max(8, Math.min(100, parsed));
  }
  return ULTRA_MODE ? 32 : 24;
})();

export const ENABLE_OUTLIER_REJECTION = (() => {
  const raw = process.env.GEOWRAITH_OUTLIER_REJECTION;
  if (raw !== undefined) {
    return raw === '1' || raw.toLowerCase() === 'true';
  }
  return true;
})();

function toScore(similarity: number): number {
  return clamp((similarity + 1) / 2, 0, 1);
}

/**
 * Remove outliers using IQR method - critical for P95 improvement
 */
export function removeOutliers(matches: VectorMatch[]): VectorMatch[] {
  if (matches.length < 4) return matches;

  const centroidLat = matches.reduce((sum, m) => sum + m.lat, 0) / matches.length;
  const centroidLon = matches.reduce((sum, m) => sum + m.lon, 0) / matches.length;

  const distances = matches.map((m) =>
    haversineMeters({ lat: centroidLat, lon: centroidLon }, { lat: m.lat, lon: m.lon })
  );

  const sorted = [...distances].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  const upperBound = q3 + 1.5 * iqr;

  return matches.filter((_, i) => distances[i] <= upperBound);
}

/**
 * Calculate weighted median for more robust centroid (less sensitive to outliers than mean)
 */
export function calculateWeightedMedianLatLon(
  items: VectorMatch[],
  weights: number[]
): { lat: number; lon: number } {
  if (items.length === 0) return { lat: 0, lon: 0 };

  // Sort by latitude for median calculation
  const latPairs = items.map((item, i) => ({ value: item.lat, weight: weights[i] }));
  const sortedLat = [...latPairs].sort((a, b) => a.value - b.value);
  let cumWeight = 0;
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let lat = sortedLat[0]!.value;

  for (const pair of sortedLat) {
    cumWeight += pair.weight;
    if (cumWeight >= totalWeight / 2) {
      lat = pair.value;
      break;
    }
  }

  // Sort by longitude for median calculation
  const lonPairs = items.map((item, i) => ({ value: item.lon, weight: weights[i] }));
  const sortedLon = [...lonPairs].sort((a, b) => a.value - b.value);
  cumWeight = 0;
  let lon = sortedLon[0]!.value;

  for (const pair of sortedLon) {
    cumWeight += pair.weight;
    if (cumWeight >= totalWeight / 2) {
      lon = pair.value;
      break;
    }
  }

  return { lat, lon };
}

/**
 * Pick best consensus cluster with outlier rejection
 */
export function pickConsensusCluster(matches: VectorMatch[]): VectorMatch[] {
  const shortlist = matches.slice(0, Math.min(CLUSTER_SEARCH_DEPTH, matches.length));

  // If top match is nearly perfect (image anchor), use it directly
  if (shortlist[0] && shortlist[0].similarity > 0.99) {
    return [shortlist[0]];
  }

  let bestCluster: VectorMatch[] = [shortlist[0]!];
  let bestClusterScore = toScore(shortlist[0]!.similarity);

  // Try each top match as potential cluster seed
  for (const seed of shortlist.slice(0, 10)) {
    let cluster = shortlist.filter(
      (candidate) =>
        haversineMeters({ lat: seed.lat, lon: seed.lon }, { lat: candidate.lat, lon: candidate.lon }) <=
        CLUSTER_RADIUS_M
    );

    // Apply outlier rejection - critical for P95
    if (ENABLE_OUTLIER_REJECTION && cluster.length >= 4) {
      cluster = removeOutliers(cluster);
    }

    // Ensure minimum cluster size - but allow perfect single matches
    const isPerfectSeed = seed.similarity > 0.95;
    if (cluster.length < MIN_CLUSTER_CANDIDATES && !isPerfectSeed) {
      continue;
    }

    const similarityScore = cluster.reduce((sum, item) => {
      const score = toScore(item.similarity);
      return sum + score * score;
    }, 0);

    const densityScore = Math.min(cluster.length / MIN_CLUSTER_CANDIDATES, 1.5);
    const clusterScore = similarityScore * densityScore;

    if (clusterScore > bestClusterScore) {
      bestCluster = cluster;
      bestClusterScore = clusterScore;
    }
  }

  // Fallback: if no good cluster found, use top matches within tight radius
  if (bestCluster.length < MIN_CLUSTER_CANDIDATES) {
    const top = shortlist[0]!;
    bestCluster = shortlist.filter((m) =>
      haversineMeters({ lat: top.lat, lon: top.lon }, { lat: m.lat, lon: m.lon }) <= 10_000
    );
  }

  return bestCluster.sort((a, b) => b.similarity - a.similarity).slice(0, MAX_CLUSTER_CANDIDATES);
}

/** Aggregate top matches into a single location, confidence score, and radius. */
export function aggregateMatches(matches: VectorMatch[]): AggregatedResult {
  if (matches.length === 0) {
    throw new ApiError(500, 'index_error', 'No vector matches to aggregate');
  }

  // Filter to dominant continent to prevent continent-jumping errors
  const continentFilteredMatches = filterToDominantContinent(matches);
  const matchesToUse = continentFilteredMatches.length >= 3 ? continentFilteredMatches : matches;

  const candidates = pickConsensusCluster(matchesToUse);
  if (candidates.length === 0) {
    throw new ApiError(500, 'index_error', 'No candidate matches available for aggregation');
  }

  for (const candidate of candidates) {
    if (!Number.isFinite(candidate.lat) || !Number.isFinite(candidate.lon)) {
      throw new ApiError(500, 'index_error', `Invalid candidate coordinates for ${candidate.id}`);
    }
  }

  const top = matchesToUse[0]!;
  const second = matchesToUse[1] ?? top;
  const topScore = toScore(top.similarity);
  const secondScore = toScore(second.similarity);
  const margin = clamp(topScore - secondScore, 0, 1);

  const candidateScores = candidates.map((match) => toScore(match.similarity));
  const weights = softmax(candidateScores, 0.05);

  // Use weighted median instead of weighted mean for P95 robustness
  const { lat, lon } = calculateWeightedMedianLatLon(candidates, weights);

  const centroid = { lat, lon };
  let spreadMeters = 0;
  for (let i = 0; i < candidates.length; i += 1) {
    spreadMeters +=
      haversineMeters(centroid, { lat: candidates[i]!.lat, lon: candidates[i]!.lon }) * weights[i];
  }

  const consensusStrength = clamp(
    candidates.length / Math.max(1, Math.min(CLUSTER_SEARCH_DEPTH, matchesToUse.length)),
    0,
    1
  );

  // Penalize geographic spread across continents
  const spreadPenalty = calculateGeographicSpreadPenalty(candidates);

  // Validate continent consistency
  const { valid: continentValid } = validateContinentConsistency(lat, lon, matchesToUse);

  // More conservative confidence in ultra mode
  const confidenceFloor = ULTRA_MODE ? 0.15 : 0.05;
  const confidenceCeiling = ULTRA_MODE ? 0.95 : 0.97;

  let confidence = clamp(
    0.1 + topScore * 0.5 + margin * 0.25 + consensusStrength * 0.15 - spreadPenalty,
    confidenceFloor,
    confidenceCeiling
  );

  // Reduce confidence if continent validation fails
  if (!continentValid) {
    confidence *= 0.5;
  }

  // Tighter radius in ultra mode
  const radiusFloor = ULTRA_MODE ? 80 : 100;
  const radiusMultiplier = ULTRA_MODE ? 0.7 : 1.0;
  const radius = Math.round(
    clamp(
      radiusFloor +
        spreadMeters * (1.2 - confidence) * radiusMultiplier +
        (1 - consensusStrength) * 30_000 * radiusMultiplier,
      radiusFloor,
      ULTRA_MODE ? 500_000 : 2_000_000
    )
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new ApiError(500, 'index_error', 'Aggregated coordinates are invalid');
  }

  return {
    location: { lat, lon, radius_m: radius },
    confidence,
  };
}
