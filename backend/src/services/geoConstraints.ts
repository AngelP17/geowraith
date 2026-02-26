/**
 * Geographic constraint system to prevent continent-level errors
 * Ensures predictions stay within reasonable geographic bounds
 */

import type { VectorMatch } from '../types.js';
import { haversineMeters } from '../utils/geo.js';

export interface GeographicBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface ContinentZone {
  name: string;
  bounds: GeographicBounds;
  center: { lat: number; lon: number };
  maxRadiusKm: number;
}

// Define continent zones with their geographic bounds
export const CONTINENT_ZONES: Record<string, ContinentZone> = {
  Europe: {
    name: 'Europe',
    bounds: { minLat: 34, maxLat: 71, minLon: -10, maxLon: 60 },
    center: { lat: 54.5260, lon: 15.2551 },
    maxRadiusKm: 4000,
  },
  Asia: {
    name: 'Asia',
    bounds: { minLat: -10, maxLat: 77, minLon: 40, maxLon: 180 },
    center: { lat: 34.0479, lon: 100.6197 },
    maxRadiusKm: 8000,
  },
  NorthAmerica: {
    name: 'North America',
    bounds: { minLat: 15, maxLat: 72, minLon: -170, maxLon: -50 },
    center: { lat: 54.5260, lon: -105.2551 },
    maxRadiusKm: 7000,
  },
  SouthAmerica: {
    name: 'South America',
    bounds: { minLat: -56, maxLat: 13, minLon: -85, maxLon: -34 },
    center: { lat: -8.7832, lon: -55.4915 },
    maxRadiusKm: 6000,
  },
  Africa: {
    name: 'Africa',
    bounds: { minLat: -35, maxLat: 37, minLon: -17, maxLon: 52 },
    center: { lat: -8.7832, lon: 34.5085 },
    maxRadiusKm: 7000,
  },
  Oceania: {
    name: 'Oceania',
    bounds: { minLat: -50, maxLat: 0, minLon: 110, maxLon: 180 },
    center: { lat: -25.2744, lon: 133.7751 },
    maxRadiusKm: 6000,
  },
};

/**
 * Detect which continent a coordinate belongs to
 */
export function detectContinent(lat: number, lon: number): string | null {
  for (const [name, zone] of Object.entries(CONTINENT_ZONES)) {
    if (
      lat >= zone.bounds.minLat &&
      lat <= zone.bounds.maxLat &&
      lon >= zone.bounds.minLon &&
      lon <= zone.bounds.maxLon
    ) {
      return name;
    }
  }
  return null;
}

/**
 * Check if coordinates are within reasonable bounds for a continent
 */
export function isWithinContinentBounds(lat: number, lon: number, continent: string): boolean {
  const zone = CONTINENT_ZONES[continent];
  if (!zone) return true; // Unknown continent, allow
  
  const distance = haversineMeters(zone.center, { lat, lon }) / 1000;
  return distance <= zone.maxRadiusKm;
}

/**
 * Get the dominant continent from a set of matches
 */
export function getDominantContinent(matches: VectorMatch[]): string | null {
  const continentCounts: Record<string, number> = {};
  
  for (const match of matches) {
    const continent = detectContinent(match.lat, match.lon);
    if (continent) {
      continentCounts[continent] = (continentCounts[continent] || 0) + match.similarity;
    }
  }
  
  let dominantContinent: string | null = null;
  let maxScore = 0;
  
  for (const [continent, score] of Object.entries(continentCounts)) {
    if (score > maxScore) {
      maxScore = score;
      dominantContinent = continent;
    }
  }
  
  return dominantContinent;
}

/**
 * Filter matches to only those within the dominant continent
 */
export function filterToDominantContinent(matches: VectorMatch[]): VectorMatch[] {
  if (matches.length === 0) return matches;
  
  const dominantContinent = getDominantContinent(matches);
  if (!dominantContinent) return matches;
  
  const filtered = matches.filter(match => {
    const matchContinent = detectContinent(match.lat, match.lon);
    return matchContinent === dominantContinent;
  });
  
  // If filtering removes too many, keep at least the top matches
  if (filtered.length < 3 && matches.length >= 3) {
    return matches.slice(0, Math.min(10, matches.length));
  }
  
  return filtered;
}

/**
 * Calculate confidence penalty for geographic spread
 */
export function calculateGeographicSpreadPenalty(matches: VectorMatch[]): number {
  if (matches.length < 2) return 0;
  
  const continents = new Set<string>();
  for (const match of matches) {
    const continent = detectContinent(match.lat, match.lon);
    if (continent) {
      continents.add(continent);
    }
  }
  
  // Penalty increases with number of continents
  if (continents.size === 1) return 0;
  if (continents.size === 2) return 0.1;
  if (continents.size === 3) return 0.25;
  return 0.4; // 4+ continents is very suspicious
}

/**
 * Validate that prediction doesn't jump continents from query clues
 */
export function validateContinentConsistency(
  predictedLat: number,
  predictedLon: number,
  referenceMatches: VectorMatch[]
): { valid: boolean; confidence: number; reason?: string } {
  const predictedContinent = detectContinent(predictedLat, predictedLon);
  
  if (!predictedContinent) {
    return { valid: true, confidence: 0.5 }; // Can't determine, be cautious
  }
  
  const dominantContinent = getDominantContinent(referenceMatches);
  
  if (!dominantContinent) {
    return { valid: true, confidence: 0.5 };
  }
  
  if (predictedContinent !== dominantContinent) {
    // Check if at least some top matches agree
    const topMatches = referenceMatches.slice(0, 5);
    const topContinents = new Set(topMatches.map(m => detectContinent(m.lat, m.lon)).filter(Boolean));
    
    if (!topContinents.has(predictedContinent)) {
      return {
        valid: false,
        confidence: 0.2,
        reason: `Predicted ${predictedContinent} but evidence points to ${dominantContinent}`,
      };
    }
  }
  
  return { valid: true, confidence: 0.85 };
}
