import type { PredictLocation, VectorMatch } from '../types.js';
import { clamp } from '../utils/math.js';
import { haversineMeters } from '../utils/geo.js';

function normalizeLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function isCuratedAnchor(match: VectorMatch): boolean {
  return (
    match.id.startsWith('images_') ||
    match.id.startsWith('api_images_') ||
    match.id.startsWith('boost_') ||
    match.id.startsWith('densified_') ||
    match.id.startsWith('ultra_densified_') ||
    match.id.startsWith('refined_')
  );
}

function countLabelMatches(matches: VectorMatch[], label: string): number {
  const normalized = normalizeLabel(label);
  return matches.filter((match) => normalizeLabel(match.label) === normalized).length;
}

function countNearbySameLabelMatches(matches: VectorMatch[], top: VectorMatch): number {
  const normalized = normalizeLabel(top.label);
  return matches.filter((match) => (
    normalizeLabel(match.label) === normalized &&
    haversineMeters(top, { lat: match.lat, lon: match.lon }) <= 1_500
  )).length;
}

function getLocalDominantLabel(
  location: PredictLocation,
  matches: VectorMatch[]
): { label: string; count: number } | null {
  const radius = Math.min(Math.max(location.radius_m * 2, 2_500), 25_000);
  const nearbyMatches = matches.filter((match) => (
    haversineMeters(location, { lat: match.lat, lon: match.lon }) <= radius
  ));

  if (nearbyMatches.length === 0) {
    return null;
  }

  const counts = new Map<string, number>();
  for (const match of nearbyMatches) {
    const label = normalizeLabel(match.label);
    counts.set(label, (counts.get(label) ?? 0) + 1);
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

  return { label: dominantLabel, count: dominantCount };
}

interface ConfidenceCalibrationInput {
  rawConfidence: number;
  location: PredictLocation;
  matches: VectorMatch[];
  usesFallback: boolean;
  usesClip: boolean;
}

/**
 * Lift confidence for repeatable, benchmark-proven high-precision match shapes.
 *
 * This is not a generic probability model. It is a conservative operator-facing
 * calibration layer that rewards:
 * - exact curated-anchor wins
 * - refined-anchor recoveries (e.g. Moai)
 * - coherent local-cluster overrides where the final location is supported by a
 *   dense nearby label cluster rather than the raw top global anchor
 *
 * It intentionally avoids boosting promoted same-label Mapillary clusters when
 * they also remain the top global label, which keeps known false positives such
 * as Copacabana -> Table Mountain from being marked "high confidence".
 */
export function calibrateConfidence({
  rawConfidence,
  location,
  matches,
  usesFallback,
  usesClip,
}: ConfidenceCalibrationInput): number {
  if (usesFallback || usesClip || matches.length === 0) {
    return rawConfidence;
  }

  const topWindow = matches.slice(0, 8);
  const top = topWindow[0]!;
  const topLabelCount = countLabelMatches(topWindow, top.label);
  const nearbyTopLabelCount = countNearbySameLabelMatches(topWindow, top);
  const topLabel = normalizeLabel(top.label);
  const localDominant = getLocalDominantLabel(location, topWindow);

  let calibrated = rawConfidence;

  // Exact or near-exact curated anchor wins should clearly read as high-confidence.
  if (isCuratedAnchor(top) && top.similarity >= 0.97 && topLabelCount >= 3) {
    calibrated = Math.max(calibrated, 0.9);
  } else if (isCuratedAnchor(top) && top.similarity >= 0.85 && topLabelCount >= 3) {
    calibrated = Math.max(calibrated, 0.84);
  }

  // Refined anchors are hand-curated for hard failures; reward them if they
  // still land in a tight local radius with at least some label support.
  if (
    top.id.startsWith('refined_') &&
    top.similarity >= 0.7 &&
    topLabelCount >= 2 &&
    nearbyTopLabelCount >= 2
  ) {
    calibrated = Math.max(calibrated, 0.76);
  }

  // If the final location is backed by a coherent local cluster with a dominant
  // label different from the raw top global anchor, this is usually a healthy
  // recovery from a misleading top anchor (e.g. Cape Point/Table Mountain).
  if (
    localDominant &&
    localDominant.count >= 4 &&
    localDominant.label !== topLabel &&
    location.radius_m <= 10_000
  ) {
    calibrated = Math.max(calibrated, 0.76);
  }

  return clamp(calibrated, 0, 0.95);
}
