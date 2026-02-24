/**
 * Build a local GeoCLIP coordinate catalog from the GeoCLIP 100K gallery.
 *
 * Usage:
 *   npx tsx src/scripts/buildReferenceDataset.ts --target=50000
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

interface CoordinateRecord {
  id: string;
  label: string;
  lat: number;
  lon: number;
}

const SOURCE_FILE = path.resolve(process.cwd(), '.cache/geoclip/coordinates_100K.json');
const OUTPUT_FILE = path.resolve(process.cwd(), 'src/data/geoclipCoordinates.json');
const DEFAULT_TARGET = 50000;

function parseTarget(argv: string[]): number {
  const raw = argv.find((arg) => arg.startsWith('--target='))?.split('=')[1];
  const parsed = Number.parseInt(raw ?? `${DEFAULT_TARGET}`, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('invalid --target argument');
  }
  return parsed;
}

function normalizePair(input: unknown, index: number): [number, number] {
  if (!Array.isArray(input) || input.length < 2) {
    throw new Error(`invalid coordinate entry at index ${index}`);
  }
  const lat = Number(input[0]);
  const lon = Number(input[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error(`invalid lat/lon at index ${index}`);
  }
  return [lat, lon];
}

function sampleCoordinates(allPairs: unknown[], target: number): CoordinateRecord[] {
  if (allPairs.length === 0) {
    throw new Error('GeoCLIP coordinate source is empty');
  }

  const step = Math.max(1, Math.floor(allPairs.length / target));
  const sampled: CoordinateRecord[] = [];

  for (let i = 0; i < target; i += 1) {
    const sourceIndex = Math.min(allPairs.length - 1, i * step);
    const [lat, lon] = normalizePair(allPairs[sourceIndex], sourceIndex);
    sampled.push({
      id: `geoclip_${String(i + 1).padStart(4, '0')}`,
      label: `GeoCLIP Reference ${i + 1}`,
      lat,
      lon,
    });
  }

  return sampled;
}

async function main() {
  const target = parseTarget(process.argv.slice(2));
  const sourceRaw = await readFile(SOURCE_FILE, 'utf8');
  const source = JSON.parse(sourceRaw) as unknown[];
  if (!Array.isArray(source)) {
    throw new Error('invalid source format: expected an array');
  }

  const sampled = sampleCoordinates(source, target);
  await writeFile(OUTPUT_FILE, `${JSON.stringify(sampled, null, 2)}\n`, 'utf8');

  // eslint-disable-next-line no-console
  console.log(
    `[BuildDataset] Wrote ${sampled.length} coordinate references to ${path.relative(
      process.cwd(),
      OUTPUT_FILE
    )}`
  );
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[BuildDataset] Fatal error:', error);
  process.exit(1);
});
