import crypto from 'node:crypto';
import { config } from '../config.js';
import { ApiError } from '../errors.js';
import type { PredictRequest, PredictResponse } from '../types.js';
import { extractImageSignals } from './imageSignals.js';
import { parsePredictRequest } from './requestParser.js';
import { aggregateMatches, searchNearestNeighbors } from './vectorSearch.js';
import { clamp } from '../utils/math.js';

/** Run GeoWraith local inference pipeline and return API response payload. */
export async function runPredictPipeline(body: PredictRequest): Promise<PredictResponse> {
  const startedAt = Date.now();
  const parsed = parsePredictRequest(body);

  if (parsed.imageBuffer.length > config.maxImageBytes) {
    throw new ApiError(
      400,
      'invalid_input',
      `Image exceeds max size (${config.maxImageBytes} bytes)`
    );
  }

  const signals = await extractImageSignals(parsed.imageBuffer);
  const requestId = crypto.randomUUID();

  if (signals.exifLocation) {
    return {
      request_id: requestId,
      status: 'ok',
      mode: parsed.mode,
      location: {
        lat: signals.exifLocation.lat,
        lon: signals.exifLocation.lon,
        radius_m: 25,
      },
      confidence: 0.99,
      elapsed_ms: Date.now() - startedAt,
      notes:
        'Exact EXIF GPS metadata detected. Returning embedded coordinates from uploaded image.',
      top_matches: [],
    };
  }

  const k = parsed.mode === 'fast' ? 3 : 5;
  const matches = await searchNearestNeighbors(signals.vector, k);
  const aggregated = aggregateMatches(matches);

  return {
    request_id: requestId,
    status: 'ok',
    mode: parsed.mode,
    location: aggregated.location,
    confidence: clamp(aggregated.confidence, 0, 1),
    elapsed_ms: Date.now() - startedAt,
    notes:
      'Approximate location from local visual-signal nearest-neighbor search. Accuracy depends on reference coverage.',
    top_matches: matches.map((match) => ({
      id: match.id,
      label: match.label,
      lat: match.lat,
      lon: match.lon,
      similarity: Number(match.similarity.toFixed(4)),
    })),
  };
}
