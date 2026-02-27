import { MINIMUM_CONFIDENCE } from '../config.js';
import type { VectorMatch } from '../types.js';
import { haversineMeters } from '../utils/geo.js';

const STRONG_CONSENSUS_RADIUS_M = 1_500;
const ACTIONABLE_COHERENCE_RADIUS_M = 25_000;
const MIN_CLUSTER_MATCHES = 3;
const MAX_MATCHES_TO_CHECK = 5;

export interface MatchConsensus {
  sameSpotMatches: number;
  nearbyMatches: number;
  sameLabelMatches: number;
  strongConsensus: boolean;
  actionableCoherence: boolean;
}

export interface LocationVisibilityDecision {
  shouldWithholdLocation: boolean;
  locationReason?:
    | 'model_fallback_active'
    | 'candidate_spread_too_wide'
    | 'match_consensus_weak'
    | 'confidence_below_actionable_threshold';
  lowConfidence: boolean;
  weakConsensus: boolean;
  matchConsensus: MatchConsensus;
}

interface VisibilityDecisionInput {
  confidence: number;
  matches: VectorMatch[];
  usesFallback: boolean;
  usesClip: boolean;
  isWideRadius: boolean;
  minimumConfidence?: number;
}

function normalizeLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Inspect the top match neighborhood to determine whether nearby candidates
 * agree on one local area. This is stronger evidence for actionable display
 * than the raw confidence scalar alone.
 */
export function analyzeMatchConsensus(matches: VectorMatch[]): MatchConsensus {
  if (matches.length === 0) {
    return {
      sameSpotMatches: 0,
      nearbyMatches: 0,
      sameLabelMatches: 0,
      strongConsensus: false,
      actionableCoherence: false,
    };
  }

  const topMatches = matches.slice(0, MAX_MATCHES_TO_CHECK);
  const top = topMatches[0]!;
  const topLabel = normalizeLabel(top.label);

  let sameSpotMatches = 0;
  let nearbyMatches = 0;
  let sameLabelMatches = 0;

  for (const match of topMatches) {
    const distance = haversineMeters(
      { lat: top.lat, lon: top.lon },
      { lat: match.lat, lon: match.lon }
    );

    if (distance <= STRONG_CONSENSUS_RADIUS_M) {
      sameSpotMatches += 1;
    }
    if (distance <= ACTIONABLE_COHERENCE_RADIUS_M) {
      nearbyMatches += 1;
    }
    if (normalizeLabel(match.label) === topLabel) {
      sameLabelMatches += 1;
    }
  }

  const strongConsensus =
    sameSpotMatches >= MIN_CLUSTER_MATCHES ||
    (sameLabelMatches >= MIN_CLUSTER_MATCHES && nearbyMatches >= MIN_CLUSTER_MATCHES);
  const actionableCoherence = strongConsensus || nearbyMatches >= MIN_CLUSTER_MATCHES;

  return {
    sameSpotMatches,
    nearbyMatches,
    sameLabelMatches,
    strongConsensus,
    actionableCoherence,
  };
}

/**
 * Decide whether coordinates should be shown to the operator.
 *
 * The decision uses a calibrated global confidence threshold plus top-match
 * coherence. This prevents confident-looking but geographically inconsistent
 * confusers from surfacing while still allowing obvious landmark clusters.
 */
export function decideLocationVisibility(
  input: VisibilityDecisionInput
): LocationVisibilityDecision {
  const {
    confidence,
    matches,
    usesFallback,
    usesClip,
    isWideRadius,
    minimumConfidence = MINIMUM_CONFIDENCE,
  } = input;
  const matchConsensus = analyzeMatchConsensus(matches);

  const lowConfidence = confidence < minimumConfidence && !matchConsensus.strongConsensus;
  const weakConsensus = !matchConsensus.actionableCoherence;
  const shouldWithholdLocation =
    !usesClip && (usesFallback || isWideRadius || weakConsensus || lowConfidence);

  let locationReason: LocationVisibilityDecision['locationReason'];
  if (usesFallback && !usesClip) {
    locationReason = 'model_fallback_active';
  } else if (isWideRadius) {
    locationReason = 'candidate_spread_too_wide';
  } else if (weakConsensus) {
    locationReason = 'match_consensus_weak';
  } else if (lowConfidence) {
    locationReason = 'confidence_below_actionable_threshold';
  }

  return {
    shouldWithholdLocation,
    locationReason,
    lowConfidence,
    weakConsensus,
    matchConsensus,
  };
}
