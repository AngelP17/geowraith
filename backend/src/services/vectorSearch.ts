/**
 * Vector search service with ANN support and image anchor priority
 * Searches reference vectors to find geographic matches
 */

import type { VectorMatch } from '../types.js';
import { cosineSimilarity } from '../utils/math.js';
import { ApiError } from '../errors.js';
import { getReferenceVectors, getHNSWIndex } from './geoclipIndex.js';
import { getReferenceImageVectors } from './referenceImageIndex.js';
export { aggregateMatches } from './aggregation.js';

/** Flag to control which search method is used. */
export const USE_ANN_SEARCH = true;

const ANCHOR_BOOST_FACTOR = 0.15; // Boost image anchors by this amount in similarity

/**
 * Get image anchor vectors separately
 */
async function getImageAnchors(): Promise<VectorMatch[]> {
  try {
    const anchors = await getReferenceImageVectors();
    return anchors.map(a => ({
      ...a,
      similarity: 0, // Will be computed
    }));
  } catch {
    return [];
  }
}

/**
 * Search for nearest neighbors using brute-force cosine similarity.
 * O(N) complexity - accurate but slow for large datasets.
 * @deprecated Use searchNearestNeighborsANN for production workloads
 */
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

/**
 * Run approximate nearest-neighbor search using HNSW index.
 * O(log N) complexity - fast with minimal accuracy tradeoff.
 * Also checks image anchors separately to ensure they're prioritized.
 */
export async function searchNearestNeighborsANN(queryVector: number[], k: number): Promise<VectorMatch[]> {
  // First, get image anchors with brute-force (fast since only ~200)
  const imageAnchors = await getImageAnchors();
  const anchorMatches = imageAnchors
    .map(record => ({
      ...record,
      similarity: cosineSimilarity(queryVector, record.vector),
    }))
    .sort((a, b) => b.similarity - a.similarity);

  // Get more candidates from ANN to fill the rest
  const index = await getHNSWIndex();
  const annMatches = index.search(queryVector, k * 3); // Get more from ANN

  // Combine: image anchors first, then ANN results
  const combined: VectorMatch[] = [];
  
  // Add all image anchors that meet a threshold
  for (const anchor of anchorMatches) {
    if (anchor.similarity > 0.2 || combined.length < 3) {
      // Boost anchor similarity for ranking purposes
      const boostedAnchor: VectorMatch = {
        ...anchor,
        similarity: Math.min(anchor.similarity + ANCHOR_BOOST_FACTOR, 1.0),
      };
      combined.push(boostedAnchor);
    }
  }
  
  // Add ANN matches that aren't already in the list
  const seenIds = new Set(combined.map(m => m.id));
  for (const match of annMatches) {
    if (!seenIds.has(match.id)) {
      combined.push(match);
      seenIds.add(match.id);
    }
  }

  // Sort by boosted similarity
  combined.sort((a, b) => b.similarity - a.similarity);

  if (combined.length === 0) {
    throw new ApiError(500, 'index_error', 'HNSW index returned no matches');
  }

  return combined.slice(0, k);
}

/**
 * Search using the configured method (ANN by default, brute-force if disabled).
 */
export async function searchNearestNeighborsWithFallback(
  queryVector: number[],
  k: number,
  useAnn = USE_ANN_SEARCH
): Promise<VectorMatch[]> {
  if (useAnn) {
    return searchNearestNeighborsANN(queryVector, k);
  }
  return searchNearestNeighbors(queryVector, k);
}
