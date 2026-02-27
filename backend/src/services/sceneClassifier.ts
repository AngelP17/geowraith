/**
 * Scene classification for live predictions based on top matches.
 *
 * Unlike validation benchmark classification (which uses image metadata),
 * this infers scene type from the reference anchor labels.
 */

import type { VectorMatch } from '../types.js';
import type { SceneType, CohortHint } from '../types.js';

// Landmark pattern hints (from reference labels)
const LANDMARK_HINTS = /(tower|bridge|cathedral|temple|castle|palace|mosque|pyramids|colosseum|acropolis|opera|statue|capitol|white house|forbidden city|stonehenge|museum|taj mahal|eiffel|sagrada)/i;

// Nature/generic scene hints
const NATURE_HINTS = /(beach|coast|reef|mountain|point|crater|sound|glacier|falls|park|bay|alps|canyon|cliff|valley|island)/i;

// Urban hints
const URBAN_HINTS = /(city|downtown|skyline|district|street|avenue|square|plaza|market)/i;

// Rural hints
const RURAL_HINTS = /(village|countryside|rural|farm|field|country)/i;

/**
 * Classify scene type from top reference matches.
 */
export function classifySceneFromMatches(topMatches: VectorMatch[]): SceneType {
  if (topMatches.length === 0) return 'unknown';

  // Combine top 3 labels for classification
  const topLabels = topMatches
    .slice(0, 3)
    .map(m => m.label)
    .join(' ');

  if (LANDMARK_HINTS.test(topLabels)) return 'landmark';
  if (NATURE_HINTS.test(topLabels)) return 'nature';
  if (URBAN_HINTS.test(topLabels)) return 'urban';
  if (RURAL_HINTS.test(topLabels)) return 'rural';

  return 'unknown';
}

/**
 * Infer cohort hint from scene type.
 */
export function inferCohortHint(sceneType: SceneType): CohortHint {
  if (sceneType === 'landmark') return 'iconic_landmark';
  if (sceneType === 'nature') return 'generic_scene';

  // Urban/rural/unknown default to generic
  return 'generic_scene';
}

/**
 * Get confidence calibration message for scene context.
 */
export function getConfidenceCalibration(
  sceneType: SceneType,
  cohortHint: CohortHint
): string {
  if (cohortHint === 'iconic_landmark') {
    return 'High precision expected for distinctive landmarks';
  }

  if (sceneType === 'nature') {
    return 'Wider uncertainty typical for natural scenes';
  }

  if (sceneType === 'urban') {
    return 'Moderate precision for urban areas';
  }

  if (sceneType === 'rural') {
    return 'Regional-level accuracy for rural scenes';
  }

  return 'Confidence varies by scene distinctiveness';
}
