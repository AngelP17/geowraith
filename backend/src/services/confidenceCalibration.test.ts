import assert from 'node:assert/strict';
import test from 'node:test';
import type { PredictLocation, VectorMatch } from '../types.js';
import { calibrateConfidence } from './confidenceCalibration.js';

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

function createLocation(lat: number, lon: number, radius_m: number): PredictLocation {
  return { lat, lon, radius_m };
}

test('calibrateConfidence boosts exact curated-anchor wins into high confidence', () => {
  const matches = [
    createMatch('images_golden_gate_bridge', 'Golden Gate Bridge', 37.8199, -122.4783, 1),
    createMatch('api_images_golden_gate_1', 'Golden Gate Bridge', 37.8199, -122.4783, 0.96),
    createMatch('api_images_golden_gate_2', 'Golden Gate Bridge', 37.8199, -122.4783, 0.94),
  ];

  const calibrated = calibrateConfidence({
    rawConfidence: 0.608,
    location: createLocation(37.8199, -122.4783, 100),
    matches,
    usesFallback: false,
    usesClip: false,
  });

  assert.ok(calibrated >= 0.9);
});

test('calibrateConfidence boosts refined-anchor recoveries out of low confidence', () => {
  const matches = [
    createMatch('refined_moai_044', 'Moai Statues', -27.1258, -109.2774, 0.7338),
    createMatch('refined_moai_010', 'Moai Statues', -27.1258, -109.2774, 0.6967),
    createMatch('ultra_densified_final_salar_uyuni_pexels_587', 'Salar de Uyuni', -20.1338, -67.4891, 0.7257),
  ];

  const calibrated = calibrateConfidence({
    rawConfidence: 0.594,
    location: createLocation(-27.1258, -109.2774, 50_000),
    matches,
    usesFallback: false,
    usesClip: false,
  });

  assert.ok(calibrated >= 0.76);
});

test('calibrateConfidence does not overboost same-label wrong mapillary clusters', () => {
  const matches = [
    createMatch('mapillary_1', 'mapillary_TableMountain', -33.9971, 18.4528, 0.9095),
    createMatch('mapillary_2', 'mapillary_TableMountain', -33.9974, 18.4529, 0.9065),
    createMatch('mapillary_3', 'mapillary_TableMountain', -33.9968, 18.4527, 0.9028),
    createMatch('mapillary_4', 'mapillary_TableMountain', -33.9978, 18.4530, 0.9018),
    createMatch('mapillary_5', 'mapillary_TableMountain', -33.9976, 18.4530, 0.8964),
  ];

  const calibrated = calibrateConfidence({
    rawConfidence: 0.623,
    location: createLocation(-33.9971, 18.4528, 5_153),
    matches,
    usesFallback: false,
    usesClip: false,
  });

  assert.equal(calibrated, 0.623);
});
