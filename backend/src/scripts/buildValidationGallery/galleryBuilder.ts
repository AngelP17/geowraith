/**
 * Gallery builder - main orchestration logic for building from Wikimedia.
 */

import type { GalleryImage, GalleryManifest } from './types.js';
import { IMAGES_DIR, MIN_WIDTH, MIN_HEIGHT, MAX_FILE_BYTES, REQUEST_DELAY_MS } from './config.js';
import { ensureDirectory, sleep } from './utils.js';
import { fetchWikimediaImages } from './wikimedia.js';
import { processWikimediaImage } from './imageProcessor.js';
import { calculateStats } from './manifest.js';

/**
 * Build a gallery by fetching images from Wikimedia Commons.
 */
export async function buildGalleryFromWikimedia(targetCount: number): Promise<GalleryManifest> {
  const images: GalleryImage[] = [];
  const seenFilenames = new Set<string>();
  let continueToken: string | undefined;
  let attempts = 0;
  const maxAttempts = targetCount * 30;

  // eslint-disable-next-line no-console
  console.log(`[GalleryBuilder] Starting Wikimedia gallery build (target: ${targetCount} images)`);
  // eslint-disable-next-line no-console
  console.log(`[GalleryBuilder] Rate limit: ${REQUEST_DELAY_MS}ms between requests\n`);

  await ensureDirectory(IMAGES_DIR);

  while (images.length < targetCount && attempts < maxAttempts) {
    try {
      if (attempts % 50 === 0) {
        // eslint-disable-next-line no-console
        console.log(
          `[GalleryBuilder] Fetching batch (have ${images.length}/${targetCount}, scanned ${attempts})...`
        );
      }

      const data = await fetchWikimediaImages(continueToken);
      const apiImages = data.query?.allimages;

      if (!apiImages || apiImages.length === 0) {
        // eslint-disable-next-line no-console
        console.warn('[GalleryBuilder] No more images from API');
        break;
      }

      for (const apiImage of apiImages) {
        if (images.length >= targetCount) break;
        attempts++;

        const width = apiImage.width ?? 0;
        const height = apiImage.height ?? 0;
        if (width < MIN_WIDTH || height < MIN_HEIGHT) continue;

        const sizeBytes = apiImage.size ?? 0;
        if (sizeBytes > MAX_FILE_BYTES) continue;

        const filename = apiImage.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        if (seenFilenames.has(filename)) continue;
        seenFilenames.add(filename);

        const galleryImage = await processWikimediaImage(apiImage, images.length);
        if (!galleryImage) continue;

        images.push(galleryImage);
        // eslint-disable-next-line no-console
        console.log(`[GalleryBuilder] ✓ Added ${apiImage.name} (${images.length}/${targetCount})`);
      }

      continueToken = data.continue?.aicontinue;
      if (!continueToken) {
        // eslint-disable-next-line no-console
        console.log('[GalleryBuilder] No more results from API');
        break;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[GalleryBuilder] Error during fetch:', error);
      await sleep(REQUEST_DELAY_MS * 3);
    }
  }

  if (images.length < targetCount) {
    // eslint-disable-next-line no-console
    console.warn(
      `[GalleryBuilder] Warning: Only found ${images.length} images with GPS data (target was ${targetCount})`
    );
  }

  return {
    images,
    stats: calculateStats(images),
    created_at: new Date().toISOString(),
  };
}
