/**
 * Vector search service with ANN support and image anchor priority
 * Searches reference vectors to find geographic matches
 */

import type { ReferenceVectorRecord, VectorMatch } from '../types.js';
import { config } from '../config.js';
import { cosineSimilarity } from '../utils/math.js';
import { ApiError } from '../errors.js';
import {
  getActiveReferenceCatalog,
  getReferenceIndexSource,
  getReferenceVectors,
  getHNSWIndex,
} from './geoclipIndex.js';
import { getReferenceImageVectors } from './referenceImageIndex.js';
export { aggregateMatches } from './aggregation.js';

/** Flag to control which search method is used. */
export const USE_ANN_SEARCH = true;

const ANCHOR_BOOST_FACTOR = 0.15; // Boost image anchors by this amount in similarity
const UNIFIED_EXACT_SEARCH_MAX_VECTORS = 5_000;
const DEBUG_BENCHMARK_CANDIDATES = process.env.GEOWRAITH_DEBUG_BENCHMARK_CANDIDATES === 'true';
const UNIFIED_SUPPLEMENTAL_CLUSTER_BONUS = 0.4;

function serializeMatches(matches: VectorMatch[], limit = 5): Array<{
  id: string;
  label: string;
  lat: number;
  lon: number;
  similarity: number;
}> {
  return matches.slice(0, limit).map((match) => ({
    id: match.id,
    label: match.label,
    lat: match.lat,
    lon: match.lon,
    similarity: Number(match.similarity.toFixed(4)),
  }));
}

function logCandidateDebug(payload: {
  strategy: 'unified-exact' | 'ann';
  catalog: string;
  boostedAnchors: VectorMatch[];
  supplementalMatches: VectorMatch[];
  selectedMatches: VectorMatch[];
  promotedLabel?: string;
}): void {
  if (!DEBUG_BENCHMARK_CANDIDATES) {
    return;
  }

  console.log(
    '[VectorSearchDebug]',
    JSON.stringify({
      strategy: payload.strategy,
      catalog: payload.catalog,
      promotedLabel: payload.promotedLabel ?? null,
      boostedAnchors: serializeMatches(payload.boostedAnchors),
      supplementalMatches: serializeMatches(payload.supplementalMatches),
      selectedMatches: serializeMatches(payload.selectedMatches, 8),
    })
  );
}

function scoreReferenceVectors(
  queryVector: number[],
  referenceVectors: ReferenceVectorRecord[],
  limit: number
): VectorMatch[] {
  return referenceVectors
    .map((record) => ({
      ...record,
      similarity: cosineSimilarity(queryVector, record.vector),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, Math.max(1, limit));
}

function selectUnifiedCandidates(
  combined: VectorMatch[],
  boostedAnchors: VectorMatch[],
  supplementalMatches: VectorMatch[],
  k: number
): VectorMatch[] {
  const selected: VectorMatch[] = [];
  const seenIds = new Set<string>();

  const anchorQuota = Math.min(Math.max(3, Math.ceil(k * 0.35)), boostedAnchors.length, k);
  const supplementalQuota = Math.min(
    Math.max(3, Math.ceil(k * 0.35)),
    supplementalMatches.length,
    Math.max(0, k - anchorQuota)
  );

  for (const match of boostedAnchors.slice(0, anchorQuota)) {
    if (!seenIds.has(match.id)) {
      selected.push(match);
      seenIds.add(match.id);
    }
  }

  for (const match of supplementalMatches.slice(0, supplementalQuota)) {
    if (!seenIds.has(match.id)) {
      selected.push(match);
      seenIds.add(match.id);
    }
  }

  for (const match of combined) {
    if (selected.length >= k) {
      break;
    }
    if (!seenIds.has(match.id)) {
      selected.push(match);
      seenIds.add(match.id);
    }
  }

  return selected.sort((a, b) => b.similarity - a.similarity).slice(0, k);
}

function findDominantLabel(matches: VectorMatch[], limit = 6): { label: string; count: number } | null {
  if (matches.length === 0) {
    return null;
  }

  const counts = new Map<string, number>();
  for (const match of matches.slice(0, limit)) {
    counts.set(match.label, (counts.get(match.label) ?? 0) + 1);
  }

  let dominantLabel: string | null = null;
  let dominantCount = 0;
  for (const [label, count] of counts.entries()) {
    if (count > dominantCount) {
      dominantLabel = label;
      dominantCount = count;
    }
  }

  if (!dominantLabel) {
    return null;
  }

  return {
    label: dominantLabel,
    count: dominantCount,
  };
}

function boostCoherentSupplementalCluster(
  boostedAnchors: VectorMatch[],
  supplementalMatches: VectorMatch[]
): { promotedLabel?: string; matches: VectorMatch[] } {
  const topBoostedAnchor = boostedAnchors[0];
  if (
    topBoostedAnchor &&
    topBoostedAnchor.id.startsWith('refined_') &&
    topBoostedAnchor.similarity >= 0.7
  ) {
    return { matches: supplementalMatches };
  }

  const dominantSupplemental = findDominantLabel(supplementalMatches);
  if (!dominantSupplemental || dominantSupplemental.count < 4) {
    return { matches: supplementalMatches };
  }

  const dominantAnchors = findDominantLabel(boostedAnchors);
  if (dominantAnchors && dominantAnchors.count >= 3) {
    return { matches: supplementalMatches };
  }

  const distinctAnchorLabels = new Set(boostedAnchors.slice(0, 6).map((match) => match.label)).size;
  if (distinctAnchorLabels < 4) {
    return { matches: supplementalMatches };
  }

  return {
    promotedLabel: dominantSupplemental.label,
    matches: supplementalMatches.map((match) => (
      match.label === dominantSupplemental.label
        ? {
            ...match,
            similarity: Math.min(match.similarity + UNIFIED_SUPPLEMENTAL_CLUSTER_BONUS, 0.95),
          }
        : match
    )),
  };
}

function buildBoostedAnchorMatches(anchorMatches: VectorMatch[]): VectorMatch[] {
  const boostedAnchors: VectorMatch[] = [];

  for (const anchor of anchorMatches) {
    if (anchor.similarity > 0.2 || boostedAnchors.length < 3) {
      boostedAnchors.push({
        ...anchor,
        similarity: Math.min(anchor.similarity + ANCHOR_BOOST_FACTOR, 1.0),
      });
    }
  }

  return boostedAnchors;
}

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
  const matches = scoreReferenceVectors(queryVector, referenceVectors, k);

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
  if (getReferenceIndexSource() === 'unknown') {
    await getReferenceVectors();
  }
  const referenceIndexSource = getReferenceIndexSource();
  const useImageAnchors = (
    referenceIndexSource === 'model' ||
    referenceIndexSource === 'cache'
  ) && config.referenceBackend !== 'clip' && config.referenceBackend !== 'fallback';

  // First, get image anchors with brute-force (fast since only ~200)
  const imageAnchors = useImageAnchors ? await getImageAnchors() : [];
  const anchorMatches = imageAnchors
    .map(record => ({
      ...record,
      similarity: cosineSimilarity(queryVector, record.vector),
    }))
    .sort((a, b) => b.similarity - a.similarity);
  const activeCatalog = getActiveReferenceCatalog();
  const anchorIds = new Set(imageAnchors.map((anchor) => anchor.id));

  if (activeCatalog === 'unified') {
    const referenceVectors = await getReferenceVectors();
    const exactSearchLimit = Math.min(
      referenceVectors.length,
      Math.max(k * 8, 120),
    );

    if (referenceVectors.length <= UNIFIED_EXACT_SEARCH_MAX_VECTORS) {
      const exactMatches = scoreReferenceVectors(queryVector, referenceVectors, exactSearchLimit);
      const boostedAnchorMatches = buildBoostedAnchorMatches(anchorMatches);
      const exactSupplementalMatches = exactMatches.filter((match) => !anchorIds.has(match.id));
      const promotedSupplemental = boostCoherentSupplementalCluster(
        boostedAnchorMatches,
        exactSupplementalMatches,
      );
      const supplementalMatches = promotedSupplemental.matches;

      const combined: VectorMatch[] = [...boostedAnchorMatches];

      const seenIds = new Set(combined.map((match) => match.id));
      for (const match of supplementalMatches) {
        if (!seenIds.has(match.id)) {
          combined.push(match);
          seenIds.add(match.id);
        }
      }

      if (combined.length === 0) {
        throw new ApiError(500, 'index_error', 'Unified exact search returned no matches');
      }

      const selected = selectUnifiedCandidates(combined, boostedAnchorMatches, supplementalMatches, k);
      logCandidateDebug({
        strategy: 'unified-exact',
        catalog: activeCatalog,
        boostedAnchors: boostedAnchorMatches,
        supplementalMatches,
        selectedMatches: selected,
        promotedLabel: promotedSupplemental.promotedLabel,
      });
      return selected;
    }
  }

  // Get more candidates from ANN to fill the rest
  const index = await getHNSWIndex();
  const annMatches = index.search(queryVector, k * 3); // Get more from ANN
  const filteredAnnMatches = activeCatalog === 'unified'
    ? annMatches.filter((match) => !anchorIds.has(match.id))
    : annMatches;

  // Combine: image anchors first, then ANN results
  const combined: VectorMatch[] = [];
  const boostedAnchorMatches = buildBoostedAnchorMatches(anchorMatches);
  
  // Add all image anchors that meet a threshold
  for (const anchor of boostedAnchorMatches) {
    if (anchor.similarity > 0.2 || combined.length < 3) {
      combined.push(anchor);
    }
  }
  
  // Add ANN matches that aren't already in the list
  const seenIds = new Set(combined.map(m => m.id));
  for (const match of filteredAnnMatches) {
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

  if (activeCatalog === 'unified') {
    const selected = selectUnifiedCandidates(combined, boostedAnchorMatches, filteredAnnMatches, k);
    logCandidateDebug({
      strategy: 'ann',
      catalog: activeCatalog,
      boostedAnchors: boostedAnchorMatches,
      supplementalMatches: filteredAnnMatches,
      selectedMatches: selected,
      promotedLabel: undefined,
    });
    return selected;
  }

  logCandidateDebug({
    strategy: 'ann',
    catalog: activeCatalog,
    boostedAnchors: boostedAnchorMatches,
    supplementalMatches: filteredAnnMatches,
    selectedMatches: combined,
    promotedLabel: undefined,
  });
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
