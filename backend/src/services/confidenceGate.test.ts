import assert from 'node:assert/strict';
import test from 'node:test';
import type { VectorMatch } from '../types.js';
import { analyzeMatchConsensus, decideLocationVisibility } from './confidenceGate.js';

function createMatch(
  id: string,
  label: string,
  lat: number,
  lon: number,
  similarity: number
): VectorMatch {
  return {
    id,
    label,
    lat,
    lon,
    similarity,
    vector: [],
  };
}

test('analyzeMatchConsensus detects repeated landmark anchors', () => {
  const matches = [
    createMatch('a', 'Tower Bridge', 51.5055, -0.0754, 0.64),
    createMatch('b', 'Tower Bridge', 51.5055, -0.0754, 0.64),
    createMatch('c', 'Tower Bridge', 51.5055, -0.0754, 0.64),
    createMatch('d', 'Tower Bridge', 51.5055, -0.0754, 0.63),
    createMatch('e', 'Tower Bridge', 51.5055, -0.0754, 0.63),
  ];

  const consensus = analyzeMatchConsensus(matches);
  assert.equal(consensus.strongConsensus, true);
  assert.equal(consensus.actionableCoherence, true);
  assert.equal(consensus.sameSpotMatches, 5);
});

test('analyzeMatchConsensus allows same-city landmark clusters', () => {
  const matches = [
    createMatch('a', 'Sugarloaf Mountain', -22.9493, -43.1546, 1),
    createMatch('b', 'Copacabana Beach', -22.9719, -43.1823, 0.86),
    createMatch('c', 'Copacabana Beach', -22.9719, -43.1823, 0.82),
    createMatch('d', 'Copacabana Beach', -22.9719, -43.1823, 0.78),
    createMatch('e', 'Copacabana Beach', -22.9719, -43.1823, 0.77),
  ];

  const consensus = analyzeMatchConsensus(matches);
  assert.equal(consensus.strongConsensus, false);
  assert.equal(consensus.actionableCoherence, true);
  assert.ok(consensus.nearbyMatches >= 3);
});

test('analyzeMatchConsensus rejects scattered cross-continent confusers', () => {
  const matches = [
    createMatch('a', 'Park Guell', 41.4145, 2.1527, 0.75),
    createMatch('b', 'Salar de Uyuni', -20.1338, -67.4891, 0.68),
    createMatch('c', 'Sagrada Familia', 41.4036, 2.1744, 0.67),
    createMatch('d', 'Swiss Alps Jungfrau', 46.5369, 7.9626, 0.66),
    createMatch('e', 'Banff National Park', 51.4968, -115.9281, 0.64),
  ];

  const consensus = analyzeMatchConsensus(matches);
  assert.equal(consensus.strongConsensus, false);
  assert.equal(consensus.actionableCoherence, false);
});

test('decideLocationVisibility reveals strong consensus below threshold', () => {
  const matches = [
    createMatch('a', 'Golden Gate Bridge', 37.8199, -122.4783, 1),
    createMatch('b', 'Golden Gate Bridge', 37.8199, -122.4783, 1),
    createMatch('c', 'Golden Gate Bridge', 37.8199, -122.4783, 1),
  ];

  const decision = decideLocationVisibility({
    confidence: 0.601,
    matches,
    usesFallback: false,
    usesClip: false,
    isWideRadius: false,
    minimumConfidence: 0.605,
  });

  assert.equal(decision.shouldWithholdLocation, false);
  assert.equal(decision.lowConfidence, false);
});

test('decideLocationVisibility withholds incoherent high-score predictions', () => {
  const matches = [
    createMatch('a', 'Great Barrier Reef', -18.2871, 147.6992, 0.75),
    createMatch('b', 'Perito Moreno Glacier', -50.4957, -73.1376, 0.55),
    createMatch('c', 'Salar de Uyuni', -20.1338, -67.4891, 0.53),
    createMatch('d', 'Ngorongoro Crater', -3.1618, 35.5877, 0.52),
    createMatch('e', 'Salar de Uyuni', -20.1338, -67.4891, 0.49),
  ];

  const decision = decideLocationVisibility({
    confidence: 0.722,
    matches,
    usesFallback: false,
    usesClip: false,
    isWideRadius: false,
    minimumConfidence: 0.605,
  });

  assert.equal(decision.shouldWithholdLocation, true);
  assert.equal(decision.locationReason, 'match_consensus_weak');
});
