import { FEATURE_VECTOR_SIZE } from '../data/referenceVectors.js';
import { getReferenceVectors } from '../services/geoclipIndex.js';
import { aggregateMatches, searchNearestNeighbors } from '../services/vectorSearch.js';
import { haversineMeters } from '../utils/geo.js';

interface BenchmarkSample {
  expectedLat: number;
  expectedLon: number;
  queryVector: number[];
}

interface BenchmarkSummary {
  sampleCount: number;
  medianErrorM: number;
  p95ErrorM: number;
  meanErrorM: number;
  within100m: number;
  within1000m: number;
  within10000m: number;
}

const NOISE_AMPLITUDE = 0.03;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function randomSigned(): number {
  return Math.random() * 2 - 1;
}

function buildSyntheticDataset(
  references: Array<{ lat: number; lon: number; vector: number[] }>
): BenchmarkSample[] {
  const targetTotalSamples = 7_200;
  const samplesPerReference = Math.max(1, Math.floor(targetTotalSamples / references.length));
  const dataset: BenchmarkSample[] = [];

  for (const reference of references) {
    for (let i = 0; i < samplesPerReference; i += 1) {
      const queryVector = new Array<number>(FEATURE_VECTOR_SIZE);
      for (let j = 0; j < FEATURE_VECTOR_SIZE; j += 1) {
        const base = reference.vector[j] ?? 0;
        const noise = randomSigned() * NOISE_AMPLITUDE;
        queryVector[j] = clamp01(base + noise);
      }

      dataset.push({
        expectedLat: reference.lat,
        expectedLon: reference.lon,
        queryVector,
      });
    }
  }

  return dataset;
}

function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const idx = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.floor((p / 100) * sortedValues.length))
  );
  return sortedValues[idx] ?? 0;
}

function summarize(errors: number[]): BenchmarkSummary {
  const sorted = [...errors].sort((a, b) => a - b);
  const sum = errors.reduce((acc, value) => acc + value, 0);
  const mean = errors.length ? sum / errors.length : 0;

  const within = (threshold: number) =>
    errors.length ? errors.filter((error) => error <= threshold).length / errors.length : 0;

  return {
    sampleCount: errors.length,
    medianErrorM: percentile(sorted, 50),
    p95ErrorM: percentile(sorted, 95),
    meanErrorM: mean,
    within100m: within(100),
    within1000m: within(1000),
    within10000m: within(10000),
  };
}

async function main() {
  const startedAt = Date.now();
  const references = await getReferenceVectors();
  const dataset = buildSyntheticDataset(references);
  const errors: number[] = [];

  for (const sample of dataset) {
    const matches = await searchNearestNeighbors(sample.queryVector, 5);
    const aggregated = aggregateMatches(matches);

    const errorMeters = haversineMeters(
      { lat: sample.expectedLat, lon: sample.expectedLon },
      { lat: aggregated.location.lat, lon: aggregated.location.lon }
    );
    errors.push(errorMeters);
  }

  const summary = summarize(errors);
  const elapsedMs = Date.now() - startedAt;

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        benchmark: 'geowraith-local-synthetic-accuracy',
        references: references.length,
        samples: dataset.length,
        noiseAmplitude: NOISE_AMPLITUDE,
        elapsedMs,
        summary,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('accuracy benchmark failed', error);
  process.exit(1);
});
