/**
 * Generate 100K geographically distributed coordinates for GeoCLIP reference dataset.
 *
 * Usage:
 *   npx tsx src/scripts/generateCoordinates100K.ts
 *   npx tsx src/scripts/generateCoordinates100K.ts --count=100000 --seed=1337
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

interface CitySeed {
  lat: number;
  lon: number;
  weight: number;
  spread: number;
}

interface GenerateOptions {
  targetCount?: number;
  seed?: number;
  outputFile?: string;
}

const OUTPUT_DIR = path.resolve(process.cwd(), '.cache/geoclip');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'coordinates_100K.json');
const SEEDS_FILE = path.resolve(process.cwd(), 'src/data/citySeeds.json');
const DEFAULT_TARGET = 100_000;
const DEFAULT_SEED = 1337;

function parseCount(argv: string[]): number {
  const raw =
    argv.find((arg) => arg.startsWith('--count='))?.split('=')[1] ??
    argv.find((arg) => arg.startsWith('--target='))?.split('=')[1];
  const parsed = Number.parseInt(raw ?? `${DEFAULT_TARGET}`, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('invalid --count/--target argument');
  }
  return parsed;
}

function parseSeed(argv: string[]): number {
  const raw = argv.find((arg) => arg.startsWith('--seed='))?.split('=')[1];
  const parsed = Number.parseInt(raw ?? `${DEFAULT_SEED}`, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error('invalid --seed argument');
  }
  return parsed;
}

function createRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function randomNormal(rng: () => number, mean: number, stdDev: number): number {
  const u1 = Math.max(rng(), 1e-12);
  const u2 = Math.max(rng(), 1e-12);
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * stdDev + mean;
}

function generateCityCluster(
  rng: () => number,
  city: CitySeed,
  count: number
): Array<[number, number]> {
  const coords: Array<[number, number]> = [];

  for (let i = 0; i < count; i += 1) {
    const latOffset = randomNormal(rng, 0, city.spread);
    const lonOffset = randomNormal(rng, 0, city.spread / Math.cos((city.lat * Math.PI) / 180));

    let lat = city.lat + latOffset;
    let lon = city.lon + lonOffset;

    lat = Math.max(-90, Math.min(90, lat));
    lon = Math.max(-180, Math.min(180, lon));

    coords.push([lat, lon]);
  }

  return coords;
}

function isLikelyLand(rng: () => number, lat: number, lon: number): boolean {
  const absLat = Math.abs(lat);

  if (lon > 150 || lon < -120) {
    if (absLat < 60) {
      if (lat > 30 && lat < 70 && lon > 140) return true;
      if (lat > -50 && lat < -30 && lon > 160) return true;
      if (lat > -20 && lat < 20 && lon > 140) return true;
      return rng() < 0.15;
    }
  }

  if (lon > -60 && lon < 20) {
    if (absLat < 40) {
      return rng() < 0.3;
    }
  }

  if (lon > 40 && lon < 110 && lat > -40 && lat < 20) {
    if (lat > -35 && lat < 35 && lon > 15 && lon < 55) return true;
    if (lat > 5 && lat < 35 && lon > 65 && lon < 95) return true;
    if (lat > -10 && lat < 20 && lon > 95 && lon < 145) return true;
    return rng() < 0.25;
  }

  if (lat < -60) {
    return rng() < 0.05;
  }

  if (lat > 75) {
    return rng() < 0.1;
  }

  return true;
}

function generateLandBiasedCoordinates(rng: () => number, count: number): Array<[number, number]> {
  const coords: Array<[number, number]> = [];

  while (coords.length < count) {
    const lat = (Math.acos(2 * rng() - 1) * 180) / Math.PI - 90;
    const lon = rng() * 360 - 180;

    if (isLikelyLand(rng, lat, lon) || rng() < 0.1) {
      coords.push([lat, lon]);
    }
  }

  return coords;
}

function shuffleCoordinates(rng: () => number, coords: Array<[number, number]>): void {
  for (let i = coords.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [coords[i], coords[j]] = [coords[j], coords[i]];
  }
}

async function loadSeeds(): Promise<CitySeed[]> {
  const raw = await readFile(SEEDS_FILE, 'utf8');
  const parsed = JSON.parse(raw) as CitySeed[];
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('seed catalog is empty');
  }
  return parsed.map((seed) => ({
    lat: Number(seed.lat),
    lon: Number(seed.lon),
    weight: Number(seed.weight),
    spread: Number(seed.spread),
  }));
}

export async function generateCoordinates100K(options: GenerateOptions = {}): Promise<string> {
  const target = options.targetCount ?? DEFAULT_TARGET;
  const seed = options.seed ?? DEFAULT_SEED;
  const outputFile = options.outputFile ?? OUTPUT_FILE;

  const rng = createRng(seed);
  const seeds = await loadSeeds();

  const totalWeight = seeds.reduce((sum, city) => sum + city.weight, 0);
  const cityPoints = Math.floor(target * 0.82);
  const landPoints = target - cityPoints;

  const allCoordinates: Array<[number, number]> = [];
  let generatedCityPoints = 0;

  for (const city of seeds) {
    const cityCount = Math.floor((city.weight / totalWeight) * cityPoints);
    if (cityCount > 0) {
      const cityCoords = generateCityCluster(rng, city, cityCount);
      allCoordinates.push(...cityCoords);
      generatedCityPoints += cityCount;
    }
  }

  const remainder = cityPoints - generatedCityPoints;
  if (remainder > 0) {
    const topCities = [...seeds].sort((a, b) => b.weight - a.weight).slice(0, 10);
    for (let i = 0; i < remainder; i += 1) {
      const city = topCities[i % topCities.length];
      allCoordinates.push(...generateCityCluster(rng, city, 1));
    }
  }

  const landCoords = generateLandBiasedCoordinates(rng, landPoints);
  allCoordinates.push(...landCoords);

  shuffleCoordinates(rng, allCoordinates);

  const finalCoordinates = allCoordinates.slice(0, target);
  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, JSON.stringify(finalCoordinates), 'utf8');

  return outputFile;
}

async function main() {
  const target = parseCount(process.argv.slice(2));
  const seed = parseSeed(process.argv.slice(2));

  // eslint-disable-next-line no-console
  console.log(`[GenerateCoordinates] Generating ${target} coordinates with seed ${seed}...`);

  const outputFile = await generateCoordinates100K({ targetCount: target, seed });

  // eslint-disable-next-line no-console
  console.log(`[GenerateCoordinates] Output: ${outputFile}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('[GenerateCoordinates] Fatal error:', error);
    process.exit(1);
  });
}
