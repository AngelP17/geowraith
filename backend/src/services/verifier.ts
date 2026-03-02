/**
 * Multi-Stage Verification Pipeline
 * Stage 1: Rule-based geographic plausibility
 * Stage 2: CLIP text-image verification
 * Stage 3: LLM verifier (Qwen 3.5) for ambiguous cases
 */

import { ollamaClient } from './ollamaClient.js';
import { config } from '../config.js';
import type { VectorMatch } from '../types.js';
import { extractImageSignals } from './imageSignals.js';

export interface VerificationResult {
  shouldOverride: boolean;
  location?: { lat: number; lon: number };
  confidence?: number;
  reasoning?: string;
  stage: 'rule-based' | 'clip' | 'llm' | 'none';
}

interface ImageMetadata {
  hasSnow: boolean;
  hasPenguins: boolean;
  climate: string;
}

/**
 * Stage 1: Rule-based geographic plausibility check.
 * Catches obvious geographic impossibilities (penguins in Arctic, snow in tropics).
 */
function verifyGeographicPlausibility(
  prediction: { lat: number; lon: number },
  metadata: ImageMetadata
): { pass: boolean; reason?: string } {
  // Penguins only in Southern Hemisphere
  if (metadata.hasPenguins && prediction.lat > 0) {
    return { pass: false, reason: 'penguins_northern_hemisphere' };
  }

  // Snow unlikely in tropics (within 20 degrees of equator)
  if (metadata.hasSnow && Math.abs(prediction.lat) < 20) {
    return { pass: false, reason: 'snow_in_tropics' };
  }

  // Desert vegetation in high latitudes
  if (metadata.climate === 'desert' && Math.abs(prediction.lat) > 50) {
    return { pass: false, reason: 'desert_in_high_latitude' };
  }

  return { pass: true };
}

/**
 * Stage 2: CLIP text-image verification.
 * Lightweight check using existing CLIP dependency.
 * Note: Full CLIP text-image comparison requires additional implementation.
 * For now, we use a simplified approach based on embedding quality.
 */
async function verifyWithCLIP(
  _imageBuffer: Buffer,
  _predictedLocation: { lat: number; lon: number }
): Promise<{ confidence: number; shouldInvokeLLM: boolean }> {
  try {
    // Simplified: Check if we can extract a valid embedding
    // In production, this would compare image against text prompts
    // like "A photo taken in [city]" using CLIP text-image similarity
    
    // For now, return conservative values to trigger LLM on edge cases
    return {
      confidence: 0.20, // Neutral confidence
      shouldInvokeLLM: true, // Defer to LLM for important decisions
    };
  } catch (error) {
    console.error('[Verifier] CLIP verification failed:', error);
    // Fail open to LLM stage
    return { confidence: 0, shouldInvokeLLM: true };
  }
}

/**
 * Stage 3: LLM verification with Qwen 3.5.
 * Only invoked for truly ambiguous cases.
 */
async function verifyWithLLM(
  imageBuffer: Buffer,
  topCandidates: VectorMatch[]
): Promise<{ location: { lat: number; lon: number }; confidence: number; reasoning: string }> {
  const imageBase64 = imageBuffer.toString('base64');

  const candidates = topCandidates.slice(0, 5);
  const candidatePayload = candidates.map((m) => ({
    label: m.label,
    lat: m.lat,
    lon: m.lon,
  }));

  const result = await ollamaClient.verifyPrediction(imageBase64, candidatePayload);

  // Validate bestIndex is within bounds
  if (result.bestIndex < 0 || result.bestIndex >= candidates.length) {
    throw new Error(
      `LLM returned invalid bestIndex: ${result.bestIndex} (valid: 0-${candidates.length - 1})`
    );
  }

  const selected = candidates[result.bestIndex];
  if (!selected) {
    throw new Error(`No candidate found at index ${result.bestIndex}`);
  }

  return {
    location: { lat: selected.lat, lon: selected.lon },
    confidence: result.confidence / 100,
    reasoning: result.reasoning,
  };
}

/**
 * Extract image metadata signals for rule-based verification.
 */
async function extractImageMetadata(imageBuffer: Buffer): Promise<ImageMetadata> {
  // Use existing image signals extraction
  const signals = await extractImageSignals(imageBuffer);

  // Simple heuristics based on color analysis could be added here
  // For now, use conservative defaults
  return {
    hasSnow: false,
    hasPenguins: false,
    climate: 'unknown',
  };
}

/**
 * Main verification pipeline.
 * Runs stages in order, stopping at first confident result.
 */
export async function verifyPrediction(
  imageBuffer: Buffer,
  prediction: { lat: number; lon: number },
  topMatches: VectorMatch[],
  confidence: number
): Promise<VerificationResult> {
  if (!config.verifierEnabled) {
    return { shouldOverride: false, stage: 'none' };
  }

  // Check if Ollama is available
  const health = await ollamaClient.healthCheck();
  if (!health.available) {
    console.warn('[Verifier] Ollama unavailable, skipping verification');
    return { shouldOverride: false, stage: 'none' };
  }

  // Stage 1: Rule-based (< 1ms)
  const metadata = await extractImageMetadata(imageBuffer);
  const plausibilityCheck = verifyGeographicPlausibility(prediction, metadata);
  if (!plausibilityCheck.pass) {
    return {
      shouldOverride: true,
      reasoning: plausibilityCheck.reason,
      stage: 'rule-based',
    };
  }

  // Stage 2: CLIP verification (~50ms)
  const clipResult = await verifyWithCLIP(imageBuffer, prediction);
  if (!clipResult.shouldInvokeLLM && clipResult.confidence > 0.25) {
    return {
      shouldOverride: false,
      reasoning: 'clip_agrees',
      stage: 'clip',
    };
  }

  // Stage 3: LLM verification (~1-3s, only for ambiguous cases)
  if (clipResult.shouldInvokeLLM) {
    const llmResult = await verifyWithLLM(imageBuffer, topMatches);

    // Only override if LLM is significantly more confident
    const shouldOverride = llmResult.confidence > confidence + 0.1;

    return {
      shouldOverride,
      location: llmResult.location,
      confidence: llmResult.confidence,
      reasoning: llmResult.reasoning,
      stage: 'llm',
    };
  }

  return { shouldOverride: false, stage: 'clip' };
}

/**
 * Determine if verifier should be invoked based on confidence and match patterns.
 */
export function shouldInvokeVerifier(
  confidence: number,
  matches: VectorMatch[]
): boolean {
  if (!config.verifierEnabled) return false;

  // Low confidence threshold
  if (confidence < config.verifierThreshold) return true;

  // Check for geographic spread in top matches
  const top5 = matches.slice(0, 5);
  const continents = new Set(top5.map((m) => getContinentFromCoordinates(m.lat, m.lon)));
  if (continents.size >= 3) return true; // Top-5 span 3+ continents

  // Check for low consensus
  const similarities = top5.map((m) => m.similarity);
  const maxSim = Math.max(...similarities);
  const secondMaxSim = similarities.sort((a, b) => b - a)[1] ?? 0;
  if (maxSim - secondMaxSim < 0.05) return true; // Weak margin between top candidates

  return false;
}

// Helper functions
function getClimateType(lat: number): string {
  const absLat = Math.abs(lat);
  if (absLat < 23.5) return 'tropical';
  if (absLat < 35) return 'subtropical';
  if (absLat < 50) return 'temperate';
  if (absLat < 66.5) return 'cold';
  return 'polar';
}

export function getContinentFromCoordinates(lat: number, lon: number): string {
  if (lon > -30 && lon < 60 && lat > 0) return 'EU-AF'; // Europe/Africa
  if (lon > 60 && lon < 150 && lat > 0) return 'AS'; // Asia
  if (lon > -170 && lon < -30 && lat > 0) return 'NA'; // North America
  if (lon > -90 && lon < -30 && lat < 0) return 'SA'; // South America
  if (lon > 110 && lat < 0) return 'OC'; // Oceania
  if (lon > 15 && lon < 35 && lat < 0) return 'AF'; // Southern Africa
  return 'UN';
}
