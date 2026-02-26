/**
 * Utility functions for the validation gallery builder.
 */

import { access, mkdir } from 'node:fs/promises';

/**
 * Parse the --count argument from command line arguments.
 */
export function parseCount(argv: string[], defaultCount: number): number {
  const raw = argv.find((arg) => arg.startsWith('--count='))?.split('=')[1];
  const parsed = Number.parseInt(raw ?? `${defaultCount}`, 10);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 1000) {
    throw new Error('invalid --count argument (must be 1-1000)');
  }
  return parsed;
}

/**
 * Check if --demo flag is present in arguments.
 */
export function isDemoMode(argv: string[]): boolean {
  return argv.includes('--demo');
}

/**
 * Sleep for a specified number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Ensure a directory exists, creating it recursively if needed.
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await access(dirPath);
  } catch {
    await mkdir(dirPath, { recursive: true });
  }
}

/**
 * Get continent from coordinates using simple bounding boxes.
 */
export function getContinentFromCoordinates(lat: number, lon: number): string {
  if (lat > 35 && lon > -10 && lon < 40) return 'Europe';
  if (lat > 10 && lon > 25 && lon < 140) return 'Asia';
  if (lat > -35 && lon > -20 && lon < 55) return 'Africa';
  if (lat > 15 && lon > -170 && lon < -50) return 'North America';
  if (lat < 15 && lat > -60 && lon > -90 && lon < -30) return 'South America';
  if (lat < -10 && lon > 110 && lon < 180) return 'Oceania';
  if (lat < -60) return 'Antarctica';
  return 'Unknown';
}

/**
 * Estimate country from coordinates using simple bounding boxes.
 */
export function estimateCountryFromCoordinates(lat: number, lon: number): string {
  if (lat > 24 && lat < 50 && lon > -125 && lon < -66) return 'USA';
  if (lat > 49 && lat < 59 && lon > -8 && lon < 2) return 'UK';
  if (lat > 47 && lat < 55 && lon > 5 && lon < 15) return 'Germany';
  if (lat > 42 && lat < 51 && lon > -5 && lon < 8) return 'France';
  if (lat > 30 && lat < 46 && lon > 129 && lon < 146) return 'Japan';
  if (lat > -44 && lat < -10 && lon > 113 && lon < 154) return 'Australia';
  if (lat > -34 && lat < 5 && lon > -74 && lon < -34) return 'Brazil';
  if (lat > 6 && lat < 37 && lon > 68 && lon < 97) return 'India';
  if (lat > 18 && lat < 54 && lon > 73 && lon < 135) return 'China';
  if (lat > 41 && lat < 84 && lon > -141 && lon < -52) return 'Canada';
  return 'Other';
}

/**
 * Classify scene type based on title, description, and categories.
 */
export function classifySceneType(
  title: string,
  description: string = '',
  categories: string[] = []
): string {
  const text = `${title} ${description} ${categories.join(' ')}`.toLowerCase();

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
