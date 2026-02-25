/**
 * Validation benchmark for GeoWraith using real-world geotagged images.
 *
 * Runs inference on the validation gallery and calculates accuracy metrics.
 *
 * Usage:
 *   npx tsx src/benchmarks/validationBenchmark.ts
 */

import { readFile, access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import fetch from 'node-fetch';
import { runPredictPipeline } from '../services/predictPipeline.js';
import { haversineMeters } from '../utils/geo.js';
import type { PredictResponse } from '../types.js';

const USER_AGENT = 'GeoWraith/0.2.0 (validation benchmark)';
const MANIFEST_PATH = path.resolve(process.cwd(), '.cache/validation_gallery/manifest.json');

// Types
interface GalleryImage {
  id: string;
  source: string;
  filename: string;
  url: string;
  local_path: string;
  coordinates: { lat: number; lon: number };
  accuracy_radius: number;
  image_info: {
    width: number;
    height: number;
    size_bytes: number;
    mime_type: string;
  };
  metadata: {
    title: string;
    description?: string;
    artist?: string;
    capture_date?: string;
    categories: string[];
  };
}

interface GalleryManifest {
  images: GalleryImage[];
  stats: {
    total: number;
    by_continent: Record<string, number>;
    by_country_estimate: Record<string, number>;
    by_scene_type: {
      urban: number;
      rural: number;
      landmark: number;
      nature: number;
      unknown: number;
    };
  };
  created_at: string;
}

interface BenchmarkResult {
  imageId: string;
  filename: string;
  expected: { lat: number; lon: number };
  predicted: { lat: number; lon: number };
  errorMeters: number;
  confidence: number;
  elapsedMs: number;
  status: string;
  continent: string;
  sceneType: string;
}

interface AccuracyReport {
  summary: {
    totalImages: number;
    successful: number;
    failed: number;
    medianErrorM: number;
    meanErrorM: number;
    p95ErrorM: number;
    p99ErrorM: number;
    minErrorM: number;
    maxErrorM: number;
  };
  thresholds: {
    within100m: number;
    within1km: number;
    within10km: number;
    within100km: number;
    within1000km: number;
  };
  byContinent: Record<string, {
    count: number;
    medianErrorM: number;
    meanErrorM: number;
    within10km: number;
  }>;
  bySceneType: Record<string, {
    count: number;
    medianErrorM: number;
    within10km: number;
  }>;
  confidenceCorrelation: {
    highConfidence: { count: number; medianErrorM: number };
    mediumConfidence: { count: number; medianErrorM: number };
    lowConfidence: { count: number; medianErrorM: number };
  };
  results: BenchmarkResult[];
}

// Helper functions
function getContinentFromCoordinates(lat: number, lon: number): string {
  if (lat > 35 && lon > -10 && lon < 40) return 'Europe';
  if (lat > 10 && lon > 25 && lon < 140) return 'Asia';
  if (lat > -35 && lon > -20 && lon < 55) return 'Africa';
  if (lat > 15 && lon > -170 && lon < -50) return 'North America';
  if (lat < 15 && lat > -60 && lon > -90 && lon < -30) return 'South America';
  if (lat < -10 && lon > 110 && lon < 180) return 'Oceania';
  if (lat < -60) return 'Antarctica';
  return 'Unknown';
}

function classifySceneType(title: string, categories: string[] = []): string {
  const text = `${title} ${categories.join(' ')}`.toLowerCase();

  if (/landmark|monument|church|temple|castle|palace|museum|tower|bridge|statue/.test(text)) {
    return 'landmark';
  }
  if (/nature|forest|mountain|lake|river|ocean|beach|park|wildlife|national park/.test(text)) {
    return 'nature';
  }
  if (/city|urban|street|building|downtown|skyline|architecture/.test(text)) {
    return 'urban';
  }
  if (/countryside|village|rural|farm|field|country/.test(text)) {
    return 'rural';
  }
  return 'unknown';
}

function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const idx = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.floor((p / 100) * sortedValues.length))
  );
  return sortedValues[idx] ?? 0;
}

function calculateStats(errors: number[]): {
  median: number;
  mean: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
} {
  if (errors.length === 0) {
    return { median: 0, mean: 0, p95: 0, p99: 0, min: 0, max: 0 };
  }

  const sorted = [...errors].sort((a, b) => a - b);
  const sum = errors.reduce((acc, value) => acc + value, 0);

  return {
    median: percentile(sorted, 50),
    mean: sum / errors.length,
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
  };
}

function withinThreshold(errors: number[], thresholdMeters: number): number {
  if (errors.length === 0) return 0;
  return errors.filter((e) => e <= thresholdMeters).length / errors.length;
}

async function ensureImageAvailable(image: GalleryImage): Promise<Buffer | null> {
  try {
    // Check if image exists locally
    try {
      await access(image.local_path);
      return readFile(image.local_path);
    } catch {
      // Image not found locally, try to download
      console.log(`  📥 Downloading ${image.filename}...`);
    }

    // Download the image
    const response = await fetch(image.url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      console.error(`  ✗ Download failed: HTTP ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure directory exists
    const dir = path.dirname(image.local_path);
    await mkdir(dir, { recursive: true });

    // Save for future use
    const { writeFile } = await import('node:fs/promises');
    await writeFile(image.local_path, buffer);

    return buffer;
  } catch (error) {
    console.error(`  ✗ Error: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

async function runBenchmark(manifest: GalleryManifest): Promise<AccuracyReport> {
  const results: BenchmarkResult[] = [];
  let successful = 0;
  let failed = 0;

  console.log(`[ValidationBenchmark] Running benchmark on ${manifest.images.length} images...\n`);

  for (let i = 0; i < manifest.images.length; i++) {
    const image = manifest.images[i]!;
    console.log(`[${i + 1}/${manifest.images.length}] ${image.metadata.title}`);

    try {
      // Ensure image is available (download if needed)
      const imageBuffer = await ensureImageAvailable(image);
      if (!imageBuffer) {
        failed++;
        results.push({
          imageId: image.id,
          filename: image.filename,
          expected: image.coordinates,
          predicted: { lat: 0, lon: 0 },
          errorMeters: Infinity,
          confidence: 0,
          elapsedMs: 0,
          status: 'download_failed',
          continent: getContinentFromCoordinates(image.coordinates.lat, image.coordinates.lon),
          sceneType: classifySceneType(image.metadata.title, image.metadata.categories),
        });
        console.log(`  ✗ Download failed\n`);
        continue;
      }

      // Run prediction
      const base64Image = imageBuffer.toString('base64');
      const startedAt = Date.now();
      const prediction: PredictResponse = await runPredictPipeline({
        image_base64: base64Image,
        options: { mode: 'accurate' },
      });
      const elapsedMs = Date.now() - startedAt;

      // Calculate error
      const errorMeters = haversineMeters(
        { lat: image.coordinates.lat, lon: image.coordinates.lon },
        { lat: prediction.location.lat, lon: prediction.location.lon }
      );

      const continent = getContinentFromCoordinates(image.coordinates.lat, image.coordinates.lon);
      const sceneType = classifySceneType(image.metadata.title, image.metadata.categories);

      results.push({
        imageId: image.id,
        filename: image.filename,
        expected: image.coordinates,
        predicted: { lat: prediction.location.lat, lon: prediction.location.lon },
        errorMeters,
        confidence: prediction.confidence,
        elapsedMs,
        status: prediction.status,
        continent,
        sceneType,
      });

      successful++;
      console.log(`  ✓ Error: ${(errorMeters / 1000).toFixed(1)}km | Confidence: ${(prediction.confidence * 100).toFixed(0)}% | ${elapsedMs}ms\n`);
    } catch (error) {
      failed++;
      console.error(`  ✗ Inference failed: ${error instanceof Error ? error.message : String(error)}\n`);

      results.push({
        imageId: image.id,
        filename: image.filename,
        expected: image.coordinates,
        predicted: { lat: 0, lon: 0 },
        errorMeters: Infinity,
        confidence: 0,
        elapsedMs: 0,
        status: 'inference_failed',
        continent: getContinentFromCoordinates(image.coordinates.lat, image.coordinates.lon),
        sceneType: classifySceneType(image.metadata.title, image.metadata.categories),
      });
    }
  }

  // Calculate overall statistics
  const successfulResults = results.filter((r) => r.status !== 'download_failed' && r.status !== 'inference_failed');
  const errors = successfulResults.map((r) => r.errorMeters);
  const stats = calculateStats(errors);

  const thresholds = {
    within100m: withinThreshold(errors, 100),
    within1km: withinThreshold(errors, 1000),
    within10km: withinThreshold(errors, 10000),
    within100km: withinThreshold(errors, 100000),
    within1000km: withinThreshold(errors, 1000000),
  };

  // Calculate by continent
  const byContinent: AccuracyReport['byContinent'] = {};
  const continentGroups = new Map<string, number[]>();
  for (const r of successfulResults) {
    const list = continentGroups.get(r.continent) ?? [];
    list.push(r.errorMeters);
    continentGroups.set(r.continent, list);
  }
  for (const [continent, errs] of continentGroups) {
    const cStats = calculateStats(errs);
    byContinent[continent] = {
      count: errs.length,
      medianErrorM: cStats.median,
      meanErrorM: cStats.mean,
      within10km: withinThreshold(errs, 10000),
    };
  }

  // Calculate by scene type
  const bySceneType: AccuracyReport['bySceneType'] = {};
  const sceneGroups = new Map<string, number[]>();
  for (const r of successfulResults) {
    const list = sceneGroups.get(r.sceneType) ?? [];
    list.push(r.errorMeters);
    sceneGroups.set(r.sceneType, list);
  }
  for (const [scene, errs] of sceneGroups) {
    const sStats = calculateStats(errs);
    bySceneType[scene] = {
      count: errs.length,
      medianErrorM: sStats.median,
      within10km: withinThreshold(errs, 10000),
    };
  }

  // Calculate confidence correlation
  const highConf = successfulResults.filter((r) => r.confidence >= 0.7);
  const medConf = successfulResults.filter((r) => r.confidence >= 0.4 && r.confidence < 0.7);
  const lowConf = successfulResults.filter((r) => r.confidence < 0.4);

  const confidenceCorrelation = {
    highConfidence: {
      count: highConf.length,
      medianErrorM: calculateStats(highConf.map((r) => r.errorMeters)).median,
    },
    mediumConfidence: {
      count: medConf.length,
      medianErrorM: calculateStats(medConf.map((r) => r.errorMeters)).median,
    },
    lowConfidence: {
      count: lowConf.length,
      medianErrorM: calculateStats(lowConf.map((r) => r.errorMeters)).median,
    },
  };

  return {
    summary: {
      totalImages: manifest.images.length,
      successful,
      failed,
      medianErrorM: stats.median,
      meanErrorM: stats.mean,
      p95ErrorM: stats.p95,
      p99ErrorM: stats.p99,
      minErrorM: stats.min,
      maxErrorM: stats.max,
    },
    thresholds,
    byContinent,
    bySceneType,
    confidenceCorrelation,
    results,
  };
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters.toFixed(0)}m`;
  if (meters < 100000) return `${(meters / 1000).toFixed(1)}km`;
  return `${(meters / 1000).toFixed(0)}km`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

async function main() {
  console.log('[ValidationBenchmark] Starting validation benchmark\n');

  // Load manifest
  let manifest: GalleryManifest;
  try {
    const manifestRaw = await readFile(MANIFEST_PATH, 'utf8');
    manifest = JSON.parse(manifestRaw) as GalleryManifest;
  } catch (error) {
    console.error(`[ValidationBenchmark] Failed to load manifest from ${MANIFEST_PATH}`);
    console.error('Please run "npm run build:gallery" first to create the validation gallery.');
    console.error('');
    console.error('Quick start:');
    console.error('  npm run build:gallery -- --demo    # Create demo gallery with landmarks');
    console.error('  npm run build:gallery              # Scrape from Wikimedia Commons');
    process.exit(1);
  }

  if (manifest.images.length === 0) {
    console.error('[ValidationBenchmark] No images in gallery.');
    process.exit(1);
  }

  console.log(`[ValidationBenchmark] Loaded gallery with ${manifest.images.length} images`);
  console.log(`[ValidationBenchmark] Gallery created: ${manifest.created_at}\n`);

  // Run benchmark
  const startedAt = Date.now();
  const report = await runBenchmark(manifest);
  const elapsedSec = (Date.now() - startedAt) / 1000;

  // Print results
  console.log('\n========================================');
  console.log('  GeoWraith Validation Benchmark Report');
  console.log('========================================\n');

  console.log('SUMMARY');
  console.log('-------');
  console.log(`Total images:      ${report.summary.totalImages}`);
  console.log(`Successful:        ${report.summary.successful}`);
  console.log(`Failed:            ${report.summary.failed}`);
  console.log(`Total time:        ${elapsedSec.toFixed(1)}s`);
  console.log();

  console.log('ERROR DISTANCE');
  console.log('--------------');
  console.log(`Median error:      ${formatDistance(report.summary.medianErrorM)}`);
  console.log(`Mean error:        ${formatDistance(report.summary.meanErrorM)}`);
  console.log(`P95 error:         ${formatDistance(report.summary.p95ErrorM)}`);
  console.log(`P99 error:         ${formatDistance(report.summary.p99ErrorM)}`);
  console.log(`Min error:         ${formatDistance(report.summary.minErrorM)}`);
  console.log(`Max error:         ${formatDistance(report.summary.maxErrorM)}`);
  console.log();

  console.log('ACCURACY THRESHOLDS');
  console.log('-------------------');
  console.log(`Within 100m:       ${formatPercent(report.thresholds.within100m)}`);
  console.log(`Within 1km:        ${formatPercent(report.thresholds.within1km)}`);
  console.log(`Within 10km:       ${formatPercent(report.thresholds.within10km)}`);
  console.log(`Within 100km:      ${formatPercent(report.thresholds.within100km)}`);
  console.log(`Within 1000km:     ${formatPercent(report.thresholds.within1000km)}`);
  console.log();

  if (Object.keys(report.byContinent).length > 0) {
    console.log('BY CONTINENT');
    console.log('------------');
    for (const [continent, stats] of Object.entries(report.byContinent).sort((a, b) => b[1].count - a[1].count)) {
      console.log(`${continent.padEnd(15)} Count: ${String(stats.count).padStart(3)} | Median: ${formatDistance(stats.medianErrorM).padStart(8)} | Within 10km: ${formatPercent(stats.within10km)}`);
    }
    console.log();
  }

  if (Object.keys(report.bySceneType).length > 0) {
    console.log('BY SCENE TYPE');
    console.log('-------------');
    for (const [scene, stats] of Object.entries(report.bySceneType).sort((a, b) => b[1].count - a[1].count)) {
      console.log(`${scene.padEnd(15)} Count: ${String(stats.count).padStart(3)} | Median: ${formatDistance(stats.medianErrorM).padStart(8)} | Within 10km: ${formatPercent(stats.within10km)}`);
    }
    console.log();
  }

  console.log('CONFIDENCE CORRELATION');
  console.log('----------------------');
  console.log(`High (≥70%):       Count: ${String(report.confidenceCorrelation.highConfidence.count).padStart(3)} | Median error: ${formatDistance(report.confidenceCorrelation.highConfidence.medianErrorM)}`);
  console.log(`Medium (40-70%):   Count: ${String(report.confidenceCorrelation.mediumConfidence.count).padStart(3)} | Median error: ${formatDistance(report.confidenceCorrelation.mediumConfidence.medianErrorM)}`);
  console.log(`Low (<40%):        Count: ${String(report.confidenceCorrelation.lowConfidence.count).padStart(3)} | Median error: ${formatDistance(report.confidenceCorrelation.lowConfidence.medianErrorM)}`);
  console.log();

  console.log('========================================');
  console.log('[ValidationBenchmark] Complete!');

  // Write detailed report to file
  const reportPath = path.resolve(process.cwd(), '.cache/validation_gallery/benchmark_report.json');
  await import('node:fs/promises').then((fs) =>
    fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  );
  console.log(`[ValidationBenchmark] Detailed report saved to: ${reportPath}`);
}

main().catch((error) => {
  console.error('[ValidationBenchmark] Fatal error:', error);
  process.exit(1);
});
