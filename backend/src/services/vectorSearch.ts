import { ApiError } from '../errors.js';
import type { AggregatedResult, VectorMatch } from '../types.js';
import { haversineMeters } from '../utils/geo.js';
import { clamp, cosineSimilarity, softmax } from '../utils/math.js';
import { getReferenceVectors } from './geoclipIndex.js';

const CLUSTER_RADIUS_M = 90_000;
const MAX_CLUSTER_CANDIDATES = 6;
const CLUSTER_SEARCH_DEPTH = 24;

function toScore(similarity: number): number {
  return clamp((similarity + 1) / 2, 0, 1);
}

/** Run local nearest-neighbor search over the embedded reference vector catalog. */
export async function searchNearestNeighbors(queryVector: number[], k: number): Promise<VectorMatch[]> {
  const referenceVectors = await getReferenceVectors();
  const matches = referenceVectors
    .map((record) => ({
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

function pickConsensusCluster(matches: VectorMatch[]): VectorMatch[] {
  const shortlist = matches.slice(0, Math.min(CLUSTER_SEARCH_DEPTH, matches.length));
  let bestCluster: VectorMatch[] = [shortlist[0]];
  let bestClusterScore = toScore(shortlist[0].similarity);

  for (const seed of shortlist) {
    const cluster = shortlist.filter(
      (candidate) =>
        haversineMeters({ lat: seed.lat, lon: seed.lon }, { lat: candidate.lat, lon: candidate.lon }) <=
        CLUSTER_RADIUS_M
    );

    const clusterScore = cluster.reduce((sum, item) => {
      const score = toScore(item.similarity);
      return sum + score * score;
    }, 0);

    if (clusterScore > bestClusterScore) {
      bestCluster = cluster;
      bestClusterScore = clusterScore;
    }
  }

  return bestCluster.sort((a, b) => b.similarity - a.similarity).slice(0, MAX_CLUSTER_CANDIDATES);
}

/** Aggregate top matches into a single location, confidence score, and radius. */
export function aggregateMatches(matches: VectorMatch[]): AggregatedResult {
  if (matches.length === 0) {
    throw new ApiError(500, 'index_error', 'No vector matches to aggregate');
  }

  const candidates = pickConsensusCluster(matches);
  if (candidates.length === 0) {
    throw new ApiError(500, 'index_error', 'No candidate matches available for aggregation');
  }

  for (const candidate of candidates) {
    if (!Number.isFinite(candidate.lat) || !Number.isFinite(candidate.lon)) {
      throw new ApiError(500, 'index_error', `Invalid candidate coordinates for ${candidate.id}`);
    }
  }

  const top = matches[0];
  const second = matches[1] ?? top;
  const topScore = toScore(top.similarity);
  const secondScore = toScore(second.similarity);
  const margin = clamp(topScore - secondScore, 0, 1);

  const candidateScores = candidates.map((match) => toScore(match.similarity));
  const weights = softmax(candidateScores, 0.05);

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

  const consensusStrength = clamp(
    candidates.length / Math.max(1, Math.min(CLUSTER_SEARCH_DEPTH, matches.length)),
    0,
    1
  );
  const confidence = clamp(0.1 + topScore * 0.5 + margin * 0.25 + consensusStrength * 0.15, 0.05, 0.97);
  const radius = Math.round(
    clamp(140 + spreadMeters * (1.2 - confidence) + (1 - consensusStrength) * 50_000, 120, 2_000_000)
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new ApiError(500, 'index_error', 'Aggregated coordinates are invalid');
  }

  return {
    location: { lat, lon, radius_m: radius },
    confidence,
  };
}
