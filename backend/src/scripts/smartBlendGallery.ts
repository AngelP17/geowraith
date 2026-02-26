/**
 * SmartBlend validation gallery builder.
 * Backward-compatible barrel export - redirects to modular implementation.
 *
 * Usage:
 *   npx tsx src/scripts/smartBlendGallery.ts --min-images=10
 *   npx tsx src/scripts/smartBlendGallery.ts --min-images=10 --aggressive
 *
 * @deprecated Use smartBlendGallery/index.ts directly
 */

export type {
  LandmarkSource,
  GalleryImage,
  GalleryStats,
  GalleryManifest,
  DownloadResult,
  ImageInfo,
} from './smartBlendGallery/types.js';

export {
  LANDMARKS,
  OUTPUT_DIR,
  IMAGES_SUBDIR,
  CSV_FILENAME,
  MANIFEST_FILENAME,
  USER_AGENT,
  REQUEST_TIMEOUT_MS,
  MAX_RETRIES,
} from './smartBlendGallery/data.js';

export {
  parseMinImages,
  hasFlag,
  ensureDirs,
  ensureCachedOrDownload,
  imageInfo,
} from './smartBlendGallery/downloader.js';

export {
  createEmptyManifest,
  addImageToManifest,
  createCsvRow,
  updateStats,
  writeManifest,
  writeCsv,
  getManifestPath,
  getCsvPath,
} from './smartBlendGallery/manifest.js';

// Re-export main as default for CLI compatibility
export { main as default } from './smartBlendGallery/index.js';

// Run main if executed directly
import { main } from './smartBlendGallery/index.js';
main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[SmartBlend] Fatal error:', error);
  process.exit(1);
});
