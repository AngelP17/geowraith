/**
 * Multi-Source Public Domain Image Downloader (Barrel Export)
 * 
 * @deprecated Use the modular imports from './multiSourceDownloader/' instead.
 * This file is kept for backward compatibility.
 * 
 * Usage:
 *   npx tsx src/scripts/multiSourceDownloader.ts --count=30
 */

// Re-export all public APIs from the modular implementation
export { 
  EUROPE_IMAGES,
  ASIA_IMAGES,
  NORTH_AMERICA_IMAGES,
  SOUTH_AMERICA_IMAGES,
  AFRICA_IMAGES,
  OCEANIA_IMAGES,
  PUBLIC_DOMAIN_IMAGES,
} from './multiSourceDownloader/data.js';

export {
  sleep,
  downloadImage,
  validateImage,
  downloadWithFallback,
  processImage,
} from './multiSourceDownloader/downloader.js';

export { main } from './multiSourceDownloader/index.js';

export type {
  ImageSource,
  DownloaderConfig,
  DownloadResult,
} from './multiSourceDownloader/types.js';

// Run main when executed directly
import { main } from './multiSourceDownloader/index.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('[Downloader] Fatal error:', error);
    process.exit(1);
  });
}
