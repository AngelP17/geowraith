/**
 * Validation benchmark for GeoWraith using real-world geotagged images.
 *
 * Runs inference on the validation gallery and calculates accuracy metrics.
 *
 * Usage:
 *   npx tsx src/benchmarks/validationBenchmark/index.ts
 */

import { readFile } from 'node:fs/promises';
import { CONFIDENCE_THRESHOLDS } from '../../config.js';
import type { GalleryManifest, AccuracyReport } from './types.js';
import { runBenchmark } from './runner.js';
import { formatDistance, formatPercent } from './format.js';
import { getBenchmarkConfig } from './config.js';
import { assertNoBenchmarkLeakage } from './leakage.js';

async function loadManifest(manifestPath: string): Promise<GalleryManifest> {
  const manifestRaw = await readFile(manifestPath, 'utf8');
  return JSON.parse(manifestRaw) as GalleryManifest;
}

function printReport(
  report: AccuracyReport,
  elapsedSec: number,
  benchmarkName: string,
): void {
  console.log('\n========================================');
  console.log(`  GeoWraith ${benchmarkName} Benchmark Report`);
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

  console.log('BY BENCHMARK COHORT');
  console.log('-------------------');
  for (const [cohort, stats] of Object.entries(report.byCohort)) {
    const label = cohort === 'iconic_landmark' ? 'Iconic Landmark' : 'Generic Scene';
    console.log(
      `${label.padEnd(15)} Count: ${String(stats.count).padStart(3)} | Median: ${formatDistance(stats.medianErrorM).padStart(8)} | Within 10km: ${formatPercent(stats.within10km)} | Within 100km: ${formatPercent(stats.within100km)}`
    );
  }
  console.log();

  console.log('CONFIDENCE CORRELATION');
  console.log('----------------------');
  const highThreshold = Math.round(CONFIDENCE_THRESHOLDS.high.min * 100);
  const mediumThreshold = Math.round(CONFIDENCE_THRESHOLDS.medium.min * 100);
  console.log(`High (≥${highThreshold}%):      Count: ${String(report.confidenceCorrelation.highConfidence.count).padStart(3)} | Median error: ${formatDistance(report.confidenceCorrelation.highConfidence.medianErrorM)}`);
  console.log(`Medium (${mediumThreshold}-${highThreshold - 1}%): Count: ${String(report.confidenceCorrelation.mediumConfidence.count).padStart(3)} | Median error: ${formatDistance(report.confidenceCorrelation.mediumConfidence.medianErrorM)}`);
  console.log(`Low (<${mediumThreshold}%):       Count: ${String(report.confidenceCorrelation.lowConfidence.count).padStart(3)} | Median error: ${formatDistance(report.confidenceCorrelation.lowConfidence.medianErrorM)}`);
  console.log();

  console.log('========================================');
}

async function saveReport(report: AccuracyReport, reportPath: string, benchmarkName: string): Promise<void> {
  const { writeFile } = await import('node:fs/promises');
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`[${benchmarkName}Benchmark] Detailed report saved to: ${reportPath}`);
}

export async function main() {
  const benchmarkConfig = getBenchmarkConfig();
  console.log(
    `[${benchmarkConfig.name}Benchmark] Starting ${benchmarkConfig.name.toLowerCase()} benchmark\n`,
  );

  // Load manifest
  let manifest: GalleryManifest;
  try {
    await assertNoBenchmarkLeakage(benchmarkConfig);
    manifest = await loadManifest(benchmarkConfig.manifestPath);
  } catch (error) {
    console.error(
      `[${benchmarkConfig.name}Benchmark] Failed to initialize benchmark: ` +
        `${error instanceof Error ? error.message : String(error)}`,
    );
    console.error(
      `[${benchmarkConfig.name}Benchmark] Expected manifest at ${benchmarkConfig.manifestPath}`,
    );
    console.error('Please build the benchmark gallery first.');
    console.error('');
    console.error('Quick start:');
    console.error('  npm run build:gallery -- --demo    # Create demo gallery with landmarks');
    console.error('  npm run build:gallery              # Scrape from Wikimedia Commons');
    console.error('  npm run build:gallery:holdout      # Seed a separate holdout gallery');
    process.exit(1);
  }

  if (manifest.images.length === 0) {
    console.error(`[${benchmarkConfig.name}Benchmark] No images in gallery.`);
    process.exit(1);
  }

  console.log(
    `[${benchmarkConfig.name}Benchmark] Loaded gallery with ${manifest.images.length} images`,
  );
  console.log(`[${benchmarkConfig.name}Benchmark] Gallery created: ${manifest.created_at}\n`);

  // Run benchmark
  const startedAt = Date.now();
  const report = await runBenchmark(manifest);
  const elapsedSec = (Date.now() - startedAt) / 1000;

  // Print results
  printReport(report, elapsedSec, benchmarkConfig.name);
  console.log(`[${benchmarkConfig.name}Benchmark] Complete!`);

  // Write detailed report to file
  await saveReport(report, benchmarkConfig.reportPath, benchmarkConfig.name);
}

main().catch((error) => {
  const benchmarkConfig = getBenchmarkConfig();
  console.error(`[${benchmarkConfig.name}Benchmark] Fatal error:`, error);
  process.exit(1);
});
