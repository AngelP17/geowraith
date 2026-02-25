/**
 * Search Performance Benchmark
 * Compares brute-force vs HNSW ANN search latency and throughput.
 */
import { searchNearestNeighbors, searchNearestNeighborsANN } from '../services/vectorSearch.js';
import { getReferenceVectors, warmupReferenceIndex } from '../services/geoclipIndex.js';
import { FEATURE_VECTOR_SIZE } from '../data/referenceVectors.js';

/** Benchmark configuration. */
const CONFIG = {
  warmUpRuns: 10,
  benchmarkRuns: 100,
  kValues: [5, 20, 100],
};

/** Benchmark result type. */
interface BenchmarkResult {
  name: string;
  k: number;
  totalMs: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  qps: number;
  totalQueries: number;
}

/** Generate a random normalized query vector. */
function generateRandomVector(dim: number): number[] {
  const vec = Array.from({ length: dim }, () => Math.random() * 2 - 1);
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  return vec.map((v) => v / norm);
}

/** Measure execution time of a function. */
async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; elapsedMs: number }> {
  const start = performance.now();
  const result = await fn();
  const elapsedMs = performance.now() - start;
  return { result, elapsedMs };
}

/** Run benchmark for a specific search function and k value. */
async function runBenchmark(
  name: string,
  searchFn: (query: number[], k: number) => Promise<unknown[]>,
  queryVectors: number[][],
  k: number
): Promise<BenchmarkResult> {
  const times: number[] = [];

  for (const query of queryVectors) {
    const { elapsedMs } = await measureTime(() => searchFn(query, k));
    times.push(elapsedMs);
  }

  const totalMs = times.reduce((sum, t) => sum + t, 0);
  const avgMs = totalMs / times.length;
  const minMs = Math.min(...times);
  const maxMs = Math.max(...times);
  const qps = (times.length / totalMs) * 1000;

  return {
    name,
    k,
    totalMs,
    avgMs,
    minMs,
    maxMs,
    qps,
    totalQueries: times.length,
  };
}

/** Format milliseconds with appropriate precision. */
function formatMs(ms: number): string {
  if (ms < 0.1) return `${(ms * 1000).toFixed(2)}μs`;
  if (ms < 1) return `${ms.toFixed(3)}ms`;
  return `${ms.toFixed(2)}ms`;
}

/** Print benchmark results in a formatted table. */
function printResults(results: BenchmarkResult[]): void {
  // eslint-disable-next-line no-console
  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  // eslint-disable-next-line no-console
  console.log('║                    Search Performance Benchmark Results                    ║');
  // eslint-disable-next-line no-console
  console.log('╠════════════════════════════════════════════════════════════════════════════╣');

  for (const r of results) {
    // eslint-disable-next-line no-console
    console.log(`║  ${r.name.padEnd(20)} (k=${r.k.toString().padStart(3)})                                     ║`);
    // eslint-disable-next-line no-console
    console.log('║                                                                            ║');
    // eslint-disable-next-line no-console
    console.log(`║    Average latency:  ${formatMs(r.avgMs).padStart(12)}                                          ║`);
    // eslint-disable-next-line no-console
    console.log(`║    Min latency:      ${formatMs(r.minMs).padStart(12)}                                          ║`);
    // eslint-disable-next-line no-console
    console.log(`║    Max latency:      ${formatMs(r.maxMs).padStart(12)}                                          ║`);
    // eslint-disable-next-line no-console
    console.log(`║    Queries/sec:      ${r.qps.toFixed(1).padStart(12)}                                          ║`);
    // eslint-disable-next-line no-console
    console.log(`║    Total queries:    ${r.totalQueries.toString().padStart(12)}                                          ║`);
    // eslint-disable-next-line no-console
    console.log('╠════════════════════════════════════════════════════════════════════════════╣');
  }

  // Print comparison
  const bruteResults = results.filter((r) => r.name.includes('Brute'));
  const hnswResults = results.filter((r) => r.name.includes('HNSW'));

  // eslint-disable-next-line no-console
  console.log('║                           Performance Comparison                             ║');
  // eslint-disable-next-line no-console
  console.log('╠════════════════════════════════════════════════════════════════════════════╣');

  for (const k of CONFIG.kValues) {
    const brute = bruteResults.find((r) => r.k === k);
    const hnsw = hnswResults.find((r) => r.k === k);

    if (brute && hnsw) {
      const speedup = brute.avgMs / hnsw.avgMs;
      // eslint-disable-next-line no-console
      console.log(`║  k=${k.toString().padStart(3)}: HNSW is ${speedup.toFixed(1)}x faster (${formatMs(brute.avgMs)} → ${formatMs(hnsw.avgMs)})${''.padEnd(12)}║`);
    }
  }

  // eslint-disable-next-line no-console
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');
}

/** Main benchmark runner. */
async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('\n🚀 Initializing search performance benchmark...\n');

  // Warm up reference index and HNSW
  // eslint-disable-next-line no-console
  console.log('Warming up reference index...');
  await warmupReferenceIndex();

  // eslint-disable-next-line no-console
  console.log('Building/loading HNSW index (first run may take a moment)...');
  const { getHNSWIndex } = await import('../services/geoclipIndex.js');
  const hnswIndex = await getHNSWIndex();
  // eslint-disable-next-line no-console
  console.log(`HNSW index ready with ${hnswIndex.size} vectors\n`);

  // Get reference vectors for validation
  const vectors = await getReferenceVectors();
  // eslint-disable-next-line no-console
  console.log(`Reference catalog: ${vectors.length} vectors @ ${FEATURE_VECTOR_SIZE} dimensions\n`);

  // Generate random query vectors
  // eslint-disable-next-line no-console
  console.log(`Generating ${CONFIG.warmUpRuns} warm-up + ${CONFIG.benchmarkRuns} benchmark query vectors...`);
  const warmUpQueries = Array.from({ length: CONFIG.warmUpRuns }, () => generateRandomVector(FEATURE_VECTOR_SIZE));
  const benchmarkQueries = Array.from({ length: CONFIG.benchmarkRuns }, () =>
    generateRandomVector(FEATURE_VECTOR_SIZE)
  );

  // Warm-up runs to ensure JIT compilation and cache warmup
  // eslint-disable-next-line no-console
  console.log('Running warm-up queries...');
  for (const query of warmUpQueries) {
    await searchNearestNeighbors(query, 10);
    await searchNearestNeighborsANN(query, 10);
  }

  // Run benchmarks
  // eslint-disable-next-line no-console
  console.log('\nRunning benchmarks...\n');
  const results: BenchmarkResult[] = [];

  for (const k of CONFIG.kValues) {
    // eslint-disable-next-line no-console
    console.log(`  Benchmarking k=${k}...`);

    // Brute-force
    results.push(await runBenchmark('Brute-force', searchNearestNeighbors, benchmarkQueries, k));

    // HNSW ANN
    results.push(await runBenchmark('HNSW ANN', searchNearestNeighborsANN, benchmarkQueries, k));
  }

  // Print results
  printResults(results);

  // Validate accuracy (check that HNSW returns similar results to brute-force)
  // eslint-disable-next-line no-console
  console.log('\n📊 Accuracy Validation (sample of 10 queries, k=20):\n');

  let totalOverlap = 0;
  const sampleSize = 10;
  const sampleK = 20;

  for (let i = 0; i < sampleSize; i += 1) {
    const query = generateRandomVector(FEATURE_VECTOR_SIZE);
    const bruteResults = await searchNearestNeighbors(query, sampleK);
    const hnswResults = await searchNearestNeighborsANN(query, sampleK);

    const bruteIds = new Set(bruteResults.map((r) => r.id));
    const hnswIds = new Set(hnswResults.map((r) => r.id));

    let overlap = 0;
    for (const id of bruteIds) {
      if (hnswIds.has(id)) {
        overlap += 1;
      }
    }
    totalOverlap += overlap / sampleK;
  }

  const avgRecall = (totalOverlap / sampleSize) * 100;
  // eslint-disable-next-line no-console
  console.log(`  Average Recall@20: ${avgRecall.toFixed(1)}% (overlap between brute-force and HNSW top-20)\n`);

  process.exitCode = 0;
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Benchmark failed:', error);
  process.exitCode = 1;
});
