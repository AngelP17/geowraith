import { ApiError } from '../errors.js';
import type { AggregatedResult, VectorMatch } from '../types.js';
import { haversineMeters } from '../utils/geo.js';
import { clamp, cosineSimilarity, softmax } from '../utils/math.js';
import { getReferenceVectors } from './geoclipIndex.js';

/** Run local nearest-neighbor search over the embedded reference vector catalog. */
export async function searchNearestNeighbors(queryVector: number[], k: number): Promise<VectorMatch[]> {
  const referenceVectors = await getReferenceVectors();
  const matches = referenceVectors.map((record) => ({
    ...record,
    similarity: cosineSimilarity(queryVector, record.vector),
  }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, Math.max(1, k));

  if (matches.length === 0) {
    throw new ApiError(500, 'index_error', 'Reference index is empty');
  }
  return matches;
}

/** Aggregate top matches into a single location, confidence score, and radius. */
export function aggregateMatches(matches: VectorMatch[]): AggregatedResult {
  if (matches.length === 0) {
    throw new ApiError(500, 'index_error', 'No vector matches to aggregate');
  }

  const top = matches[0];
  const second = matches[1] ?? top;
  const topScore = clamp((top.similarity + 1) / 2, 0, 1);
  const secondScore = clamp((second.similarity + 1) / 2, 0, 1);
  const margin = clamp(topScore - secondScore, 0, 1);

  const decisiveTopMatch = margin >= 0.03;
  const candidates = decisiveTopMatch
    ? [top]
    : matches.filter((match) => top.similarity - match.similarity <= 0.015).slice(0, 3);

  if (candidates.length === 0) {
    throw new ApiError(500, 'index_error', 'No candidate matches available for aggregation');
  }

  for (const candidate of candidates) {
    if (!Number.isFinite(candidate.lat) || !Number.isFinite(candidate.lon)) {
      throw new ApiError(500, 'index_error', `Invalid candidate coordinates for ${candidate.id}`);
    }
  }

  const scores = candidates.map((match) => clamp((match.similarity + 1) / 2, 0, 1));
  const weights = softmax(scores, decisiveTopMatch ? 1 : 0.02);

  let lat = 0;
  let lon = 0;
  for (let i = 0; i < candidates.length; i += 1) {
    lat += candidates[i].lat * weights[i];
    lon += candidates[i].lon * weights[i];
  }

  const centroid = { lat, lon };
  let spreadMeters = 0;
  for (let i = 0; i < candidates.length; i += 1) {
    spreadMeters +=
      haversineMeters(centroid, { lat: candidates[i].lat, lon: candidates[i].lon }) * weights[i];
  }

  const confidence = clamp(0.25 + topScore * 0.55 + margin * 0.2, 0.05, 0.98);
  const baseRadius = decisiveTopMatch ? 180 : 450;
  const radius = Math.round(clamp(baseRadius + spreadMeters * (1.35 - confidence), 120, 3_000_000));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new ApiError(500, 'index_error', 'Aggregated coordinates are invalid');
  }

  return {
    location: {
      lat,
      lon,
      radius_m: radius,
    },
    confidence,
  };
}
