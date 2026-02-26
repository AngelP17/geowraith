/**
 * Core benchmark runner for validation benchmark.
 */

import { haversineMeters } from '../../utils/geo.js';
import { runPredictPipeline } from '../../services/predictPipeline.js';
import type { PredictResponse } from '../../types.js';
import type { GalleryManifest, GalleryImage, BenchmarkResult, AccuracyReport } from './types.js';
import { ensureImageAvailable } from './image.js';
import { extractLocationMetadata } from './geo.js';
import { calculateStats, withinThreshold } from './stats.js';

export async function runBenchmark(manifest: GalleryManifest): Promise<AccuracyReport> {
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
        const { continent, sceneType } = extractLocationMetadata(image);
        results.push({
          imageId: image.id,
          filename: image.filename,
          expected: image.coordinates,
          predicted: { lat: 0, lon: 0 },
          errorMeters: Infinity,
          confidence: 0,
          confidenceTier: 'low',
          elapsedMs: 0,
          status: 'download_failed',
          continent,
          sceneType,
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

      const { continent, sceneType } = extractLocationMetadata(image);

      results.push({
        imageId: image.id,
        filename: image.filename,
        expected: image.coordinates,
        predicted: { lat: prediction.location.lat, lon: prediction.location.lon },
        errorMeters,
        confidence: prediction.confidence,
        confidenceTier: prediction.confidence_tier,
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

      const { continent, sceneType } = extractLocationMetadata(image);
      results.push({
        imageId: image.id,
        filename: image.filename,
        expected: image.coordinates,
        predicted: { lat: 0, lon: 0 },
        errorMeters: Infinity,
        confidence: 0,
        confidenceTier: 'low',
        elapsedMs: 0,
        status: 'inference_failed',
        continent,
        sceneType,
      });
    }
  }

  return buildAccuracyReport(results, successful, failed);
}

function buildAccuracyReport(
  results: BenchmarkResult[],
  successful: number,
  failed: number
): AccuracyReport {
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
  const highConf = successfulResults.filter((r) => r.confidenceTier === 'high');
  const medConf = successfulResults.filter((r) => r.confidenceTier === 'medium');
  const lowConf = successfulResults.filter((r) => r.confidenceTier === 'low');

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
      totalImages: results.length,
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
