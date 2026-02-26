/**
 * Source public domain images from multiple free sources.
 * 
 * @deprecated Import from sourcePublicDomainImages/ submodules instead.
 * This barrel file is kept for backward compatibility.
 */

// Re-export all types
export type {
  SourcedImage,
  CliOptions,
  Config,
  DownloadResult,
  ProcessImageOptions,
  ProcessImageResult,
} from './sourcePublicDomainImages/types.js';

// Re-export data
export {
  PUBLIC_DOMAIN_IMAGES,
  TOTAL_IMAGE_COUNT,
} from './sourcePublicDomainImages/data.js';

// Re-export CSV utilities
export {
  CSV_HEADER,
  generateCsvLine,
  writeCsvFile,
  createCsvLines,
} from './sourcePublicDomainImages/csv.js';

// Re-export downloader utilities
export {
  sleep,
  downloadImage,
  processImage,
} from './sourcePublicDomainImages/downloader.js';

// Run CLI if executed directly
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if this file is being run directly
if (process.argv[1]?.includes('sourcePublicDomainImages.ts')) {
  // Import and run the main module
  await import(join(__dirname, 'sourcePublicDomainImages/index.js'));
}
