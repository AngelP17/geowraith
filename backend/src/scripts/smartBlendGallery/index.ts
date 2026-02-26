/**
 * SmartBlend validation gallery builder.
 * Combines multiple fallback strategies to guarantee a usable gallery.
 *
 * Usage:
 *   npx tsx src/scripts/smartBlendGallery/index.ts --min-images=10
 *   npx tsx src/scripts/smartBlendGallery/index.ts --min-images=10 --aggressive
 */

import { LANDMARKS } from './data.js';
import {
  parseMinImages,
  hasFlag,
  ensureDirs,
  ensureCachedOrDownload,
  imageInfo,
} from './downloader.js';
import {
  createEmptyManifest,
  addImageToManifest,
  createCsvRow,
  updateStats,
  writeManifest,
  writeCsv,
  getManifestPath,
  getCsvPath,
} from './manifest.js';

export type {
  LandmarkSource,
  GalleryImage,
  GalleryStats,
  GalleryManifest,
  DownloadResult,
  ImageInfo,
} from './types.js';

export {
  LANDMARKS,
} from './data.js';

export {
  parseMinImages,
  hasFlag,
  ensureDirs,
  ensureCachedOrDownload,
  imageInfo,
} from './downloader.js';

export {
  createEmptyManifest,
  addImageToManifest,
  createCsvRow,
  updateStats,
  writeManifest,
  writeCsv,
  getManifestPath,
  getCsvPath,
} from './manifest.js';

export async function main() {
  const args = process.argv.slice(2);
  const minImages = parseMinImages(args);
  const aggressive = hasFlag(args, '--aggressive');

  await ensureDirs();

  const manifest = createEmptyManifest();
  const csvRows: string[] = ['filename,lat,lon,label,accuracy_radius'];

  for (const landmark of LANDMARKS) {
    const result = await ensureCachedOrDownload(landmark, aggressive);
    if (!result.ok) {
      continue;
    }

    const info = await imageInfo(result.filePath);
    addImageToManifest(manifest, landmark, result, info);
    csvRows.push(createCsvRow(landmark));
  }

  if (manifest.images.length < minImages && !aggressive) {
    throw new Error(`Only ${manifest.images.length} images available; rerun with --aggressive or retry later.`);
  }

  updateStats(manifest);

  await writeManifest(manifest);
  await writeCsv(csvRows);

  // eslint-disable-next-line no-console
  console.log(`[SmartBlend] Images: ${manifest.images.length}`);
  // eslint-disable-next-line no-console
  console.log(`[SmartBlend] Manifest: ${getManifestPath()}`);
  // eslint-disable-next-line no-console
  console.log(`[SmartBlend] CSV: ${getCsvPath()}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[SmartBlend] Fatal error:', error);
  process.exit(1);
});
