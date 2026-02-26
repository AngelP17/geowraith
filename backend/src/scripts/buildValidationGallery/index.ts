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
 */

import { parseCount, isDemoMode } from './utils.js';
import { DEFAULT_TARGET_COUNT, CACHE_DIR } from './config.js';
import { buildGalleryFromWikimedia } from './galleryBuilder.js';
import { createDemoManifest, saveManifest, MANIFEST_PATH } from './manifest.js';
import type { GalleryManifest } from './types.js';

/**
 * Main entry point for the gallery builder CLI.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const count = parseCount(args, DEFAULT_TARGET_COUNT);
  const demo = isDemoMode(args);

  // eslint-disable-next-line no-console
  console.log('[GalleryBuilder] Building validation gallery for GeoWraith\n');

  let manifest: GalleryManifest;

  if (demo) {
    // eslint-disable-next-line no-console
    console.log('[GalleryBuilder] Creating DEMO gallery with known landmarks');
    manifest = createDemoManifest();
    // eslint-disable-next-line no-console
    console.log(`[GalleryBuilder] Created ${manifest.images.length} demo entries\n`);
    // eslint-disable-next-line no-console
    console.log('NOTE: Demo mode creates metadata entries without downloading images.');
    // eslint-disable-next-line no-console
    console.log('Images will be downloaded on-demand during validation benchmark.\n');
  } else {
    // eslint-disable-next-line no-console
    console.log(`[GalleryBuilder] Target count: ${count}`);
    // eslint-disable-next-line no-console
    console.log(`[GalleryBuilder] Output directory: ${CACHE_DIR}\n`);
    manifest = await buildGalleryFromWikimedia(count);
  }

  // Write manifest
  await saveManifest(manifest);

  // eslint-disable-next-line no-console
  console.log('\n========================================');
  // eslint-disable-next-line no-console
  console.log('[GalleryBuilder] Gallery build complete!');
  // eslint-disable-next-line no-console
  console.log('========================================');
  // eslint-disable-next-line no-console
  console.log(`Images: ${manifest.images.length}`);
  // eslint-disable-next-line no-console
  console.log(`Manifest: ${MANIFEST_PATH}`);
  // eslint-disable-next-line no-console
  console.log('\nGeographic distribution:');
  // eslint-disable-next-line no-console
  console.log(`  By continent: ${JSON.stringify(manifest.stats.by_continent)}`);
  // eslint-disable-next-line no-console
  console.log(`  By scene type: ${JSON.stringify(manifest.stats.by_scene_type)}`);

  if (!demo && manifest.images.length < count) {
    // eslint-disable-next-line no-console
    console.log('\nTIP: Wikimedia Commons has strict rate limiting.');
    // eslint-disable-next-line no-console
    console.log('Consider using --demo mode for quick testing:');
    // eslint-disable-next-line no-console
    console.log('  npm run build:gallery -- --demo');
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[GalleryBuilder] Fatal error:', error);
  process.exit(1);
});
