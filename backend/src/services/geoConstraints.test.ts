/**
 * Tests for geographic constraint system
 * Ensures continent detection and filtering work correctly
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  detectContinent,
  filterToDominantContinent,
  validateContinentConsistency,
  calculateGeographicSpreadPenalty,
  CONTINENT_ZONES,
} from './geoConstraints.js';
import type { VectorMatch } from '../types.js';

// Helper to create test matches with required fields
function createMatch(id: string, lat: number, lon: number, similarity: number): VectorMatch {
  return { id, label: `test-${id}`, lat, lon, vector: [], similarity };
}

describe('Continent Detection', () => {
  it('should detect Europe for London coordinates', () => {
    const continent = detectContinent(51.5074, -0.1278);
    assert.strictEqual(continent, 'Europe');
  });

  it('should detect Europe for Paris coordinates', () => {
    const continent = detectContinent(48.8584, 2.2945);
    assert.strictEqual(continent, 'Europe');
  });

  it('should detect Asia for Beijing coordinates', () => {
    const continent = detectContinent(39.9042, 116.4074);
    assert.strictEqual(continent, 'Asia');
  });

  it('should detect NorthAmerica for New York coordinates', () => {
    const continent = detectContinent(40.7128, -74.006);
    assert.strictEqual(continent, 'NorthAmerica');
  });

  it('should detect SouthAmerica for Rio coordinates', () => {
    const continent = detectContinent(-22.9068, -43.1729);
    assert.strictEqual(continent, 'SouthAmerica');
  });

  it('should detect Africa for Cairo coordinates', () => {
    const continent = detectContinent(30.0444, 31.2357);
    assert.strictEqual(continent, 'Africa');
  });

  it('should detect Oceania for Sydney coordinates', () => {
    const continent = detectContinent(-33.8688, 151.2093);
    assert.strictEqual(continent, 'Oceania');
  });

  it('should return null for ocean coordinates', () => {
    const continent = detectContinent(0, -150); // Pacific Ocean
    assert.strictEqual(continent, null);
  });
});

describe('Dominant Continent Filtering', () => {
  it('should keep matches in dominant continent', () => {
    const matches: VectorMatch[] = [
      createMatch('1', 51.5, -0.1, 0.9), // London
      createMatch('2', 48.8, 2.3, 0.8), // Paris
      createMatch('3', 52.5, 13.4, 0.7), // Berlin
      createMatch('4', 39.9, 116.4, 0.6), // Beijing (outlier)
    ];

    const filtered = filterToDominantContinent(matches);
    assert.strictEqual(filtered.length, 3);
    assert.strictEqual(filtered.some((m) => m.id === '4'), false); // Beijing removed
  });

  it('should fallback to original matches if filtering removes too many', () => {
    const matches: VectorMatch[] = [
      createMatch('1', 51.5, -0.1, 0.9), // Europe
      createMatch('2', 39.9, 116.4, 0.5), // Asia
      createMatch('3', 40.7, -74.0, 0.4), // North America
    ];

    const filtered = filterToDominantContinent(matches);
    // Should return top matches since filtering would leave < 3
    assert.ok(filtered.length >= 2);
  });

  it('should handle empty matches', () => {
    const filtered = filterToDominantContinent([]);
    assert.strictEqual(filtered.length, 0);
  });
});

describe('Continent Consistency Validation', () => {
  it('should validate consistent prediction', () => {
    const matches: VectorMatch[] = [
      createMatch('1', 51.5, -0.1, 0.9),
      createMatch('2', 48.8, 2.3, 0.8),
    ];

    const result = validateContinentConsistency(51.5, -0.1, matches);
    assert.strictEqual(result.valid, true);
    assert.ok(result.confidence > 0.5);
  });

  it('should flag inconsistent prediction (Sheffield→China case)', () => {
    const matches: VectorMatch[] = [
      createMatch('1', 53.38, -1.47, 0.9), // Sheffield
      createMatch('2', 52.5, -1.9, 0.8), // Birmingham
    ];

    // Predicting Beijing when evidence points to UK
    const result = validateContinentConsistency(39.9, 116.4, matches);
    assert.strictEqual(result.valid, false);
    assert.ok(result.reason?.includes('Asia'));
  });
});

describe('Geographic Spread Penalty', () => {
  it('should return 0 for single continent', () => {
    const matches: VectorMatch[] = [
      createMatch('1', 51.5, -0.1, 0.9),
      createMatch('2', 48.8, 2.3, 0.8),
    ];

    const penalty = calculateGeographicSpreadPenalty(matches);
    assert.strictEqual(penalty, 0);
  });

  it('should return penalty for multiple continents', () => {
    const matches: VectorMatch[] = [
      createMatch('1', 51.5, -0.1, 0.9), // Europe
      createMatch('2', 39.9, 116.4, 0.8), // Asia
      createMatch('3', 40.7, -74.0, 0.7), // North America
    ];

    const penalty = calculateGeographicSpreadPenalty(matches);
    assert.strictEqual(penalty, 0.25); // 3 continents
  });
});

describe('Continent Zone Definitions', () => {
  it('should have all 6 continent zones defined', () => {
    const expectedZones = ['Europe', 'Asia', 'NorthAmerica', 'SouthAmerica', 'Africa', 'Oceania'];
    for (const zone of expectedZones) {
      assert.ok(CONTINENT_ZONES[zone], `Zone ${zone} should be defined`);
      assert.ok(CONTINENT_ZONES[zone].bounds, `Zone ${zone} should have bounds`);
      assert.ok(CONTINENT_ZONES[zone].center, `Zone ${zone} should have center`);
    }
  });
});
