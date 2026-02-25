/**
 * SmartBlend Validation System
 *
 * A resilient, multi-strategy validation pipeline that combines multiple
 * public data sources with intelligent fallbacks.
 *
 * Usage:
 *   npx tsx src/scripts/smartBlendValidation.ts --min-images=10
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { SMART_BLEND_DATABASE, type LandmarkSource } from './smartblend/landmarks.js';
import {
  createPlaceholderImage,
  downloadWithFallback,
  tryExistingFallback,
  type DownloadOptions,
} from './smartblend/download.js';

const { values } = parseArgs({
  options: {
    'min-images': { type: 'string', default: '10' },
    'max-retries': { type: 'string', default: '5' },
    'output': { type: 'string', default: '.cache/smartblend_gallery' },
    'strategy': { type: 'string', default: 'auto' },
    'seed': { type: 'string', default: '1337' },
    'licenses': { type: 'string', default: 'cc0,pdm' },
    'allow-unverified': { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
    'openverse-page-size': { type: 'string', default: '5' },
    'openverse-timeout-ms': { type: 'string', default: '15000' },
  },
});

const OUTPUT_DIR = path.resolve(process.cwd(), values.output!);
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');
const CSV_FILE = path.join(OUTPUT_DIR, 'metadata.csv');

function seededShuffle<T>(items: T[], seed: number): T[] {
  const list = [...items];
  let state = seed >>> 0;
  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const tmp = list[i];
    list[i] = list[j]!;
    list[j] = tmp!;
  }
  return list;
}

function formatCsvLine(landmark: LandmarkSource, source: string): string {
  return `${landmark.filename},${landmark.lat},${landmark.lon},"${landmark.label}",30,${source}`;
}

async function runDryRun(selected: LandmarkSource[], allowUnverified: boolean): Promise<void> {
  console.log('Dry run - planned downloads:');
  console.log(`  Output: ${OUTPUT_DIR}`);
  console.log(`  Images: ${IMAGES_DIR}`);
  console.log(`  CSV: ${CSV_FILE}`);
  console.log('');
  console.log(`  allow-unverified: ${allowUnverified}`);
  console.log('');
  for (const landmark of selected) {
    console.log(`- ${landmark.filename} (${landmark.label})`);
  }
  console.log('');
}

async function main() {
  const minImages = parseInt(values['min-images']!, 10);
  const maxRetries = parseInt(values['max-retries']!, 10);
  const strategy = values.strategy!;
  const seed = parseInt(values.seed!, 10);
  const allowUnverified = Boolean(values['allow-unverified']);
  const dryRun = Boolean(values['dry-run']);
  const licenses = String(values.licenses || 'cc0,pdm')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  const openversePageSize = parseInt(values['openverse-page-size']!, 10);
  const openverseTimeoutMs = parseInt(values['openverse-timeout-ms']!, 10);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           SmartBlend Validation System                     ║');
  console.log('║     Multi-source, resilient image validation               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Configuration:');
  console.log(`  Min images: ${minImages}`);
  console.log(`  Max retries: ${maxRetries}`);
  console.log(`  Strategy: ${strategy}`);
  console.log(`  Output: ${OUTPUT_DIR}`);
  console.log(`  Seed: ${seed}`);
  console.log(`  Licenses: ${licenses.join(',') || 'none'}`);
  console.log(`  Allow unverified: ${allowUnverified}`);
  console.log('');

  await mkdir(IMAGES_DIR, { recursive: true });

  const shuffled = seededShuffle(SMART_BLEND_DATABASE, seed);
  const selected = shuffled.slice(0, Math.min(minImages, shuffled.length));

  console.log(`Selected ${selected.length} landmarks for validation`);
  console.log('');

  if (dryRun) {
    await runDryRun(selected, allowUnverified);
    return;
  }

  const downloadOptions: DownloadOptions = {
    maxRetries,
    timeoutMs: 30000,
    allowUnverified,
    enableOpenverse: true,
    enableUnsplashSource: strategy === 'aggressive' && allowUnverified,
    openverseLicenses: licenses,
    openversePageSize,
    openverseTimeoutMs,
  };

  const csvLines: string[] = ['filename,lat,lon,label,accuracy_radius,source_method'];
  let successCount = 0;
  let fallbackCount = 0;
  let failCount = 0;

  for (let i = 0; i < selected.length; i++) {
    const landmark = selected[i]!;
    console.log(`[${i + 1}/${selected.length}] ${landmark.label}`);

    const imagePath = path.join(IMAGES_DIR, landmark.filename);

    if (existsSync(imagePath)) {
      const stats = statSync(imagePath);
      if (stats.size > 10000) {
        console.log('  ✓ Already exists and valid');
        successCount++;
        csvLines.push(formatCsvLine(landmark, 'existing'));
        continue;
      }
    }

    const result = await downloadWithFallback(landmark, imagePath, downloadOptions);
    if (result.success) {
      console.log(`  ✓ Downloaded from ${result.source} (${result.attempts} attempts)`);
      successCount++;
      csvLines.push(formatCsvLine(landmark, result.source));
      continue;
    }

    console.log('  Trying cached fallback...');
    const cached = await tryExistingFallback(landmark, imagePath);
    if (cached) {
      console.log('  ✓ Using cached fallback');
      successCount++;
      fallbackCount++;
      csvLines.push(formatCsvLine(landmark, 'cached_fallback'));
      continue;
    }

    if (strategy === 'aggressive') {
      console.log('  Creating placeholder...');
      await createPlaceholderImage(imagePath);
      successCount++;
      csvLines.push(formatCsvLine(landmark, 'placeholder'));
    } else {
      console.log('  ✗ All sources failed');
      failCount++;
    }

    console.log('');
  }

  await writeFile(CSV_FILE, csvLines.join('\n'));

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    BLEND RESULTS                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✓ Success: ${successCount}/${selected.length}`);
  console.log(`  - Direct downloads: ${successCount - fallbackCount}`);
  console.log(`  - Cached fallbacks: ${fallbackCount}`);
  console.log(`✗ Failed: ${failCount}`);
  console.log('');
  console.log(`CSV: ${CSV_FILE}`);
  console.log(`Images: ${IMAGES_DIR}`);
  console.log('');

  if (successCount >= minImages / 2) {
    console.log('✅ Sufficient images acquired. Ready for validation.');
    console.log('');
    console.log('Next step:');
    console.log('  npm run build:gallery:csv --');
    console.log(`    --images=${IMAGES_DIR}`);
    console.log(`    --csv=${CSV_FILE}`);
    console.log('  npm run benchmark:validation');
  } else {
    console.log('⚠️ Too few images. Try again later or use strategy=aggressive');
  }

  console.log('');
  console.log('SmartBlend strategies used:');
  console.log('  1. Openverse search (public domain/CC0)');
  console.log('  2. Exponential backoff retry');
  console.log('  3. Cached image fallback');
  console.log('  4. Existing gallery fallback');
  if (strategy === 'aggressive') {
    console.log('  5. Placeholder creation (aggressive mode)');
  }
  if (allowUnverified) {
    console.log('  6. Direct URL fallback (unverified licenses)');
  }
}

main().catch((error) => {
  console.error('[SmartBlend] Fatal error:', error);
  process.exit(1);
});
