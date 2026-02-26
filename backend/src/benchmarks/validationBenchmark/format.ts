/**
 * Formatting utilities for validation benchmark output.
 */

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters.toFixed(0)}m`;
  if (meters < 100000) return `${(meters / 1000).toFixed(1)}km`;
  return `${(meters / 1000).toFixed(0)}km`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
