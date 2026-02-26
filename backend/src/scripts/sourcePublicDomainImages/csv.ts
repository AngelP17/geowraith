/**
 * CSV generation utilities
 */

import { writeFile } from 'node:fs/promises';
import type { SourcedImage } from './types.js';

export const CSV_HEADER = 'filename,lat,lon,label,accuracy_radius';

export function generateCsvLine(image: SourcedImage): string {
  return `${image.filename},${image.lat},${image.lon},"${image.label}",30`;
}

export async function writeCsvFile(
  csvPath: string,
  lines: string[]
): Promise<void> {
  const content = [CSV_HEADER, ...lines].join('\n');
  await writeFile(csvPath, content);
}

export function createCsvLines(images: SourcedImage[]): string[] {
  return images.map(generateCsvLine);
}
