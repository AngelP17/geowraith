/**
 * Build validation gallery by sourcing geotagged images.
 *
 * This script creates a validation dataset for GeoWraith benchmarking.
 * It supports multiple sources:
 * 1. Wikimedia Commons API (with rate limiting)
 * 2. Manual image URLs with known coordinates
 *
 * Usage:
 *   npx tsx src/scripts/buildValidationGallery.ts --count=100
 *   npx tsx src/scripts/buildValidationGallery.ts --demo (create demo with synthetic data)
 *
 * @deprecated This file is kept for backward compatibility. Import from
 *   `buildValidationGallery/` module directly for new code.
 */

// Re-export all types
export type {
  WikimediaImage,
  WikimediaApiResponse,
  GalleryImage,
  GalleryManifest,
} from './buildValidationGallery/types.js';

// Re-export all functions
export {
  // Config
  WIKIMEDIA_API,
  USER_AGENT,
  REQUEST_DELAY_MS,
  MAX_RETRIES,
  MIN_WIDTH,
  MIN_HEIGHT,
  MAX_FILE_BYTES,
  DEFAULT_TARGET_COUNT,
  CACHE_DIR,
  IMAGES_DIR,
  MANIFEST_PATH,
} from './buildValidationGallery/config.js';

export {
  // Utils
  parseCount,
  isDemoMode,
  sleep,
  ensureDirectory,
  getContinentFromCoordinates,
  estimateCountryFromCoordinates,
  classifySceneType,
} from './buildValidationGallery/utils.js';

export {
  // Wikimedia API
  fetchWikimediaImages,
  downloadImage,
  extractGpsFromExtmetadata,
} from './buildValidationGallery/wikimedia.js';

export {
  // EXIF
  verifyGpsWithExif,
} from './buildValidationGallery/exif.js';

export {
  // Image processing
  processWikimediaImage,
} from './buildValidationGallery/imageProcessor.js';

export {
  // Manifest
  calculateStats,
  createDemoManifest,
  saveManifest,
} from './buildValidationGallery/manifest.js';

export {
  // Gallery builder
  buildGalleryFromWikimedia,
} from './buildValidationGallery/galleryBuilder.js';

// Run CLI if this file is executed directly
import './buildValidationGallery/index.js';
