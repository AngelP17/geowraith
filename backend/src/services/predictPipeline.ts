import crypto from 'node:crypto';
import {
  config,
  CONFIDENCE_THRESHOLDS,
  MINIMUM_CONFIDENCE,
} from '../config.js';
import { ApiError } from '../errors.js';
import type { ConfidenceTier, PredictRequest, PredictResponse, VectorMatch } from '../types.js';
import { clamp } from '../utils/math.js';
import { getReferenceImageAnchorCount, getReferenceIndexSource } from './geoclipIndex.js';
import { extractImageSignals } from './imageSignals.js';
import { parsePredictRequest } from './requestParser.js';
import { aggregateMatches, searchNearestNeighborsWithFallback } from './vectorSearch.js';
import { preventCrossContinentErrors } from './geoConstraints.js';
import {
  classifySceneFromMatches,
  inferCohortHint,
  getConfidenceCalibration,
} from './sceneClassifier.js';
import { decideLocationVisibility } from './confidenceGate.js';

const WITHHELD_LOCATION_MIN_RADIUS_M = 1_000_000;

/**
 * Rescale CLIP text-image similarities to the range expected by the aggregation
 * confidence formula. CLIP cross-modal similarities are inherently lower (0.20-0.35)
 * than within-modality similarities. This uses a linear mapping that preserves
 * relative differences between candidates.
 *
 * Mapping: 0.15 → 0.20, 0.25 → 0.50, 0.30 → 0.65, 0.35 → 0.80
 */
function rescaleClipSimilarities(matches: VectorMatch[]): VectorMatch[] {
  return matches.map(m => ({
    ...m,
    similarity: clamp((m.similarity - 0.10) * 3.0, 0.05, 0.95),
  }));
}

/**
 * Merge flat and hierarchical search results, keeping the best similarity
 * for each unique city and re-sorting by combined score.
 */
function mergeAndDedupeMatches(flat: VectorMatch[], hier: VectorMatch[], k: number): VectorMatch[] {
  const byLabel = new Map<string, VectorMatch>();

  for (const m of [...flat, ...hier]) {
    const existing = byLabel.get(m.label);
    if (!existing || m.similarity > existing.similarity) {
      byLabel.set(m.label, m);
    }
  }

  return Array.from(byLabel.values())
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
}

/** Determine confidence tier based on empirical thresholds. */
function getConfidenceTier(confidence: number): ConfidenceTier {
  if (confidence >= CONFIDENCE_THRESHOLDS.high.min) return 'high';
  if (confidence >= CONFIDENCE_THRESHOLDS.medium.min) return 'medium';
  return 'low';
}

/** Run GeoWraith local inference pipeline and return API response payload. */
export async function runPredictPipeline(body: PredictRequest): Promise<PredictResponse> {
  const startedAt = Date.now();
  const parsed = parsePredictRequest(body);

  if (parsed.imageBuffer.length > config.maxImageBytes) {
    throw new ApiError(400, 'invalid_input', `Image exceeds max size (${config.maxImageBytes} bytes)`);
  }

  const signals = await extractImageSignals(parsed.imageBuffer);
  const requestId = crypto.randomUUID();
  if (signals.exifLocation) {
    const referenceIndexSource = getReferenceIndexSource();
    return {
      request_id: requestId,
      status: 'ok',
      mode: parsed.mode,
      location: {
        lat: signals.exifLocation.lat,
        lon: signals.exifLocation.lon,
        radius_m: 25,
      },
      location_visibility: 'visible',
      confidence: 0.99,
      confidence_tier: 'high',
      scene_context: {
        scene_type: 'unknown',
        cohort_hint: 'generic_scene',
        confidence_calibration: 'Exact GPS coordinates from image metadata',
      },
      elapsed_ms: Date.now() - startedAt,
      notes: 'Exact EXIF GPS metadata detected. Returning embedded coordinates from uploaded image.',
      top_matches: [],
      diagnostics: {
        embedding_source: signals.embeddingSource,
        reference_index_source: referenceIndexSource,
      },
    };
  }

  const k = parsed.mode === 'fast' ? 8 : 20;
  const referenceIndexSource = getReferenceIndexSource();
  const referenceImageAnchors = getReferenceImageAnchorCount();

  let matches = await searchNearestNeighborsWithFallback(signals.vector, k, true);
  if (referenceIndexSource === 'clip') {
    matches = rescaleClipSimilarities(matches);
  }

  // Prevent cross-continent prediction errors
  matches = preventCrossContinentErrors(matches);

  const aggregated = aggregateMatches(matches);
  const sceneType = classifySceneFromMatches(matches);
  const cohortHint = inferCohortHint(sceneType);
  const confidenceCalibration = getConfidenceCalibration(sceneType, cohortHint);

  const usesFallback = signals.embeddingSource === 'fallback' || referenceIndexSource === 'fallback';
  const usesClip = signals.embeddingSource === 'clip' || referenceIndexSource === 'clip';
  const fallbackPenalty = usesFallback ? 0.55 : 1;
  const clipBoost = usesClip ? 1.15 : 1;
  const confidence = clamp(aggregated.confidence * fallbackPenalty * clipBoost, 0, 0.97);
  const isWideRadius = aggregated.location.radius_m > 300_000;
  const visibilityDecision = decideLocationVisibility({
    confidence,
    matches,
    usesFallback,
    usesClip,
    isWideRadius,
    minimumConfidence: MINIMUM_CONFIDENCE,
  });
  const shouldWithholdLocation = visibilityDecision.shouldWithholdLocation;
  const status: PredictResponse['status'] = shouldWithholdLocation ? 'low_confidence' : 'ok';
  const locationVisibility: PredictResponse['location_visibility'] = shouldWithholdLocation
    ? 'withheld'
    : 'visible';
  const locationReason = visibilityDecision.locationReason;
  const location =
    shouldWithholdLocation
      ? {
          ...aggregated.location,
          radius_m: Math.max(aggregated.location.radius_m, WITHHELD_LOCATION_MIN_RADIUS_M),
        }
      : aggregated.location;

  const notes = [
    'Approximate location from local visual-signal nearest-neighbor search.',
    'Accuracy depends on reference coverage and landmark visibility.',
  ];
  if (signals.embeddingSource === 'clip') {
    notes.push('Using CLIP vision encoder for image embedding.');
  } else if (signals.embeddingSource === 'fallback') {
    notes.push('Warning: GeoCLIP image embedding unavailable; deterministic fallback embedding used.');
  }
  if (referenceIndexSource === 'clip') {
    notes.push('Using CLIP text-based city reference index for geolocation.');
  } else if (referenceIndexSource === 'fallback') {
    notes.push('Warning: GeoCLIP reference index unavailable; fallback coordinate vectors used.');
  }
  if (usesFallback && !usesClip) {
    notes.push('Location withheld because fallback mode cannot guarantee continent-level reliability.');
  }
  if (isWideRadius) {
    notes.push('Warning: Candidate spread is very large; result is low confidence.');
  }
  if (visibilityDecision.weakConsensus && !isWideRadius && !usesFallback) {
    notes.push('Warning: Top matches disagree geographically; coordinates are not reliable enough to show.');
  }
  if (visibilityDecision.lowConfidence && !isWideRadius && !usesFallback) {
    notes.push('Warning: Similarity margin is weak; coordinate may be far from true location.');
  }
  if (shouldWithholdLocation) {
    notes.push(
      `Location coordinates are withheld for this result (required confidence: ${(MINIMUM_CONFIDENCE * 100).toFixed(1)}%+ or a strong local match consensus).`
    );
  }
  if (referenceImageAnchors > 0) {
    notes.push(`Multi-source landmark anchors active (${referenceImageAnchors} image vectors).`);
  }

  return {
    request_id: requestId,
    status,
    mode: parsed.mode,
    location,
    location_visibility: locationVisibility,
    location_reason: locationReason,
    confidence,
    confidence_tier: getConfidenceTier(confidence),
    scene_context: {
      scene_type: sceneType,
      cohort_hint: cohortHint,
      confidence_calibration: confidenceCalibration,
    },
    elapsed_ms: Date.now() - startedAt,
    notes: notes.join(' '),
    top_matches: matches.slice(0, 8).map((match) => ({
      id: match.id,
      label: match.label,
      lat: match.lat,
      lon: match.lon,
      similarity: Number(match.similarity.toFixed(4)),
    })),
    diagnostics: {
      embedding_source: signals.embeddingSource,
      reference_index_source: referenceIndexSource,
      reference_image_anchors: referenceImageAnchors,
    },
  };
}
