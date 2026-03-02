/**
 * AI Intelligence Brief Generation Service
 * Generates 3-sentence intelligence briefs for predicted locations.
 */

import { ollamaClient } from './ollamaClient.js';
import { config } from '../config.js';

export interface Location {
  lat: number;
  lon: number;
}

export interface IntelligenceBrief {
  brief: string;
  generatedAt: string;
  model: string;
}

/**
 * Generate an intelligence brief for a predicted location.
 * Brief includes nearby infrastructure, recent events, and strategic significance.
 *
 * @param location - Predicted lat/lon
 * @param imageBuffer - Source image buffer (for visual context)
 * @param confidence - Prediction confidence (briefs only generated for > 0.70)
 * @returns Intelligence brief or null if not generated
 */
export async function generateIntelligenceBrief(
  location: Location,
  imageBuffer: Buffer,
  confidence: number
): Promise<IntelligenceBrief | null> {
  // Only generate briefs for high-confidence predictions
  if (!config.enableIntelligenceBrief || confidence < 0.70) {
    return null;
  }

  // Check if Ollama is available
  const health = await ollamaClient.healthCheck();
  if (!health.available) {
    console.warn('[IntelligenceBrief] Ollama unavailable:', health.error);
    return null;
  }

  try {
    const imageBase64 = imageBuffer.toString('base64');
    const brief = await ollamaClient.generateIntelligenceBrief(
      location.lat,
      location.lon,
      imageBase64
    );

    return {
      brief,
      generatedAt: new Date().toISOString(),
      model: config.verifierModel,
    };
  } catch (error) {
    console.error('[IntelligenceBrief] Generation failed:', error);
    return null;
  }
}

/**
 * Generate a fallback brief using rule-based approach when LLM is unavailable.
 * Uses geographic databases to provide basic context.
 */
export async function generateFallbackBrief(location: Location): Promise<IntelligenceBrief> {
  // Simple continent/ocean detection
  const { lat, lon } = location;
  let region = 'Unknown region';

  if (lat > 60) region = 'Arctic region';
  else if (lat < -60) region = 'Antarctic region';
  else if (lon > -30 && lon < 60 && lat > 0) region = 'Europe/Africa';
  else if (lon > 60 && lon < 150 && lat > 0) region = 'Asia';
  else if (lon > -170 && lon < -30 && lat > 0) region = 'North America';
  else if (lon > -90 && lon < -30 && lat < 0) region = 'South America';
  else if (lon > 110 && lat < 0) region = 'Oceania';
  else region = 'Maritime/Coastal region';

  const brief = `Location in ${region} at coordinates ${lat.toFixed(4)}, ${lon.toFixed(4)}. ` +
    `Terrain and infrastructure vary by specific locale. ` +
    `Detailed intelligence requires LLM analysis (currently unavailable).`;

  return {
    brief,
    generatedAt: new Date().toISOString(),
    model: 'fallback-rule-based',
  };
}
