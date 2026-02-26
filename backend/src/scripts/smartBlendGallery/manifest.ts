/**
 * SmartBlend Gallery - Manifest generation
 */

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { GalleryManifest, LandmarkSource, DownloadResult, ImageInfo } from './types.js';
import { OUTPUT_DIR, CSV_FILENAME, MANIFEST_FILENAME } from './data.js';

const OUTPUT_PATH = path.resolve(process.cwd(), OUTPUT_DIR);
const CSV_PATH = path.join(OUTPUT_PATH, CSV_FILENAME);
const MANIFEST_PATH = path.join(OUTPUT_PATH, MANIFEST_FILENAME);

export function createEmptyManifest(): GalleryManifest {
  return {
    images: [],
    stats: {
      total: 0,
      by_continent: {},
      by_country_estimate: {},
      by_scene_type: {
        urban: 0,
        rural: 0,
        landmark: 0,
        nature: 0,
        unknown: 0,
      },
    },
    created_at: new Date().toISOString(),
  };
}

export function addImageToManifest(
  manifest: GalleryManifest,
  landmark: LandmarkSource,
  result: DownloadResult,
  info: ImageInfo
): void {
  manifest.images.push({
    id: landmark.id,
    source: result.source,
    filename: landmark.filename,
    url: result.usedUrl,
    local_path: result.filePath,
    coordinates: { lat: landmark.lat, lon: landmark.lon },
    accuracy_radius: 50,
    image_info: {
      width: info.width,
      height: info.height,
      size_bytes: info.size,
      mime_type: info.mime,
    },
    metadata: {
      title: landmark.label,
      description: landmark.label,
      categories: ['landmark'],
    },
  });
}

export function createCsvRow(landmark: LandmarkSource): string {
  return `${landmark.filename},${landmark.lat},${landmark.lon},"${landmark.label}",50`;
}

export function updateStats(manifest: GalleryManifest): void {
  manifest.stats.total = manifest.images.length;
  manifest.stats.by_scene_type.landmark = manifest.images.length;
}

export async function writeManifest(manifest: GalleryManifest): Promise<void> {
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

export async function writeCsv(csvRows: string[]): Promise<void> {
  await writeFile(CSV_PATH, `${csvRows.join('\n')}\n`);
}

export function getManifestPath(): string {
  return MANIFEST_PATH;
}

export function getCsvPath(): string {
  return CSV_PATH;
}
