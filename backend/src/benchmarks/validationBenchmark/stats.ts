/**
 * Statistical utilities for validation benchmark.
 */

export function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const idx = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.floor((p / 100) * sortedValues.length))
  );
  return sortedValues[idx] ?? 0;
}

export interface StatsResult {
  median: number;
  mean: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
}

export function calculateStats(errors: number[]): StatsResult {
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

export function withinThreshold(errors: number[], thresholdMeters: number): number {
  if (errors.length === 0) return 0;
  return errors.filter((e) => e <= thresholdMeters).length / errors.length;
}
