/**
 * Generator for expanded synthetic reference vector dataset.
 *
 * This script is for deterministic fallback data generation only.
 * Runtime inference uses GeoCLIP embeddings from geoclipIndex.ts.
 */

import { WORLD_CITIES, type City } from './worldCities.js';

const FEATURE_VECTOR_SIZE = 15;

const climateProfiles = {
  tropical: { r: 0.45, g: 0.58, b: 0.55, saturation: 0.38 },
  arid: { r: 0.75, g: 0.65, b: 0.45, saturation: 0.35 },
  temperate: { r: 0.48, g: 0.52, b: 0.54, saturation: 0.32 },
  cold: { r: 0.42, g: 0.48, b: 0.56, saturation: 0.3 },
  polar: { r: 0.85, g: 0.88, b: 0.92, saturation: 0.08 },
} as const;

const densityProfiles = {
  dense: { luma: 0.5, variance: 0.16 },
  moderate: { luma: 0.54, variance: 0.15 },
  sparse: { luma: 0.6, variance: 0.13 },
} as const;

function seededUnit(seed: string, salt: number): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= salt;
  hash = Math.imul(hash, 2246822519);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 3266489917);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 4294967295;
}

function jitter(seed: string, salt: number, scale: number): number {
  return (seededUnit(seed, salt) - 0.5) * scale;
}

function generateVector(city: City): number[] {
  const vec = new Array<number>(FEATURE_VECTOR_SIZE).fill(0);
  const climate = climateProfiles[city.climate];
  const density = densityProfiles[city.urbanDensity];

  const latFactor = Math.abs(city.lat) / 90;
  const lonFactor = (city.lon + 180) / 360;

  vec[0] = climate.r + jitter(city.id, 1, 0.08);
  vec[1] = climate.g + jitter(city.id, 2, 0.08);
  vec[2] = climate.b + jitter(city.id, 3, 0.08);

  vec[3] = density.variance + jitter(city.id, 4, 0.04);
  vec[4] = density.variance + jitter(city.id, 5, 0.04);
  vec[5] = density.variance + jitter(city.id, 6, 0.04);

  vec[6] = density.luma + latFactor * 0.15 + jitter(city.id, 7, 0.06);
  vec[7] = 0.12 + density.variance * 0.5 + jitter(city.id, 8, 0.03);
  vec[8] = climate.saturation + jitter(city.id, 9, 0.06);

  const hueBase = lonFactor * 0.3;
  for (let i = 9; i < FEATURE_VECTOR_SIZE; i += 1) {
    const bin = (i - 9) / 6;
    vec[i] = clamp01(hueBase + Math.abs(bin - 0.5) * 0.2 + jitter(city.id, i + 10, 0.05), 0.03, 0.35);
  }

  return vec.map((v) => clamp01(v));
}

function clamp01(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function formatVector(vec: number[]): string {
  return `[${vec.map((value) => value.toFixed(2)).join(', ')}]`;
}

function generateTypeScriptCode(): string {
  let code = `import type { ReferenceVectorRecord } from '../types.js';

export const FEATURE_VECTOR_SIZE = 15;

function record(
  id: string,
  label: string,
  lat: number,
  lon: number,
  vector: number[]
): ReferenceVectorRecord {
  if (vector.length !== FEATURE_VECTOR_SIZE) {
    throw new Error(\`invalid vector length for \${id}\`);
  }
  return { id, label, lat, lon, vector };
}

/**
 * Expanded reference vectors for geolocation baseline.
 *
 * IMPORTANT CAVEAT:
 * These are synthetic color-based feature vectors representing ~${WORLD_CITIES.length} global locations.
 * This is a proof-of-concept showing the inference pipeline architecture.
 */
export const REFERENCE_VECTORS: ReferenceVectorRecord[] = [\n`;

  for (const city of WORLD_CITIES) {
    const vec = generateVector(city);
    code += `  record('${city.id}', '${city.name}', ${city.lat}, ${city.lon},\n`;
    code += `    ${formatVector(vec)}),\n`;
  }

  code += `];\n`;
  return code;
}

console.log(generateTypeScriptCode());
