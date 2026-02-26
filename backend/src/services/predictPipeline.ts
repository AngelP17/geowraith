import crypto from 'node:crypto';
import { config, CONFIDENCE_THRESHOLDS, MINIMUM_CONFIDENCE } from '../config.js';
import { ApiError } from '../errors.js';
import type { ConfidenceTier, PredictRequest, PredictResponse } from '../types.js';
import { clamp } from '../utils/math.js';
import { getReferenceImageAnchorCount, getReferenceIndexSource } from './geoclipIndex.js';
import { extractImageSignals } from './imageSignals.js';
import { parsePredictRequest } from './requestParser.js';
import { aggregateMatches, searchNearestNeighborsWithFallback } from './vectorSearch.js';

const WITHHELD_LOCATION_MIN_RADIUS_M = 1_000_000;

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
  const matches = await searchNearestNeighborsWithFallback(signals.vector, k, true);
  const referenceIndexSource = getReferenceIndexSource();
  const referenceImageAnchors = getReferenceImageAnchorCount();
  const aggregated = aggregateMatches(matches);

  const usesFallback = signals.embeddingSource === 'fallback' || referenceIndexSource === 'fallback';
  const fallbackPenalty = usesFallback ? 0.55 : 1;
  const confidence = clamp(aggregated.confidence * fallbackPenalty, 0, 1);
  const lowConfidence = confidence < MINIMUM_CONFIDENCE;
  const isWideRadius = aggregated.location.radius_m > 300_000;
  const shouldWithholdLocation = lowConfidence || isWideRadius || usesFallback;
  const status: PredictResponse['status'] = shouldWithholdLocation ? 'low_confidence' : 'ok';
  const locationVisibility: PredictResponse['location_visibility'] = shouldWithholdLocation
    ? 'withheld'
    : 'visible';
  const locationReason = usesFallback
    ? 'model_fallback_active'
    : isWideRadius
      ? 'candidate_spread_too_wide'
      : lowConfidence
        ? 'confidence_below_actionable_threshold'
        : undefined;
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
  if (signals.embeddingSource === 'fallback') {
    notes.push('Warning: GeoCLIP image embedding unavailable; deterministic fallback embedding used.');
  }
  if (referenceIndexSource === 'fallback') {
    notes.push('Warning: GeoCLIP reference index unavailable; fallback coordinate vectors used.');
  }
  if (usesFallback) {
    notes.push('Location withheld because fallback mode cannot guarantee continent-level reliability.');
  }
  if (isWideRadius) {
    notes.push('Warning: Candidate spread is very large; result is low confidence.');
  }
  if (lowConfidence && !isWideRadius && !usesFallback) {
    notes.push('Warning: Similarity margin is weak; coordinate may be far from true location.');
  }
  if (shouldWithholdLocation) {
    notes.push(
      `Location coordinates are withheld for this result (required confidence: ${(MINIMUM_CONFIDENCE * 100).toFixed(0)}%+).`
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
