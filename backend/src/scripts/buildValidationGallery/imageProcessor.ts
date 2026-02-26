/**
 * Image processing and validation utilities.
 */

import type { GalleryImage, WikimediaImage } from './types.js';
import { IMAGES_DIR } from './config.js';
import path from 'node:path';
import { extractGpsFromExtmetadata, downloadImage } from './wikimedia.js';
import { verifyGpsWithExif } from './exif.js';
import { classifySceneType } from './utils.js';

/**
 * Process a single Wikimedia image and convert it to a GalleryImage.
 * Returns null if the image doesn't meet criteria or processing fails.
 */
export async function processWikimediaImage(
  apiImage: WikimediaImage,
  index: number
): Promise<GalleryImage | null> {
  const width = apiImage.width ?? 0;
  const height = apiImage.height ?? 0;

  const gpsFromMetadata = extractGpsFromExtmetadata(apiImage.extmetadata);
  if (!gpsFromMetadata) return null;

  const filename = apiImage.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const localPath = path.join(IMAGES_DIR, filename);

  // eslint-disable-next-line no-console
  console.log(
    `[GalleryBuilder] Found GPS: ${apiImage.name} (${gpsFromMetadata.lat.toFixed(4)}, ${gpsFromMetadata.lon.toFixed(4)})`
  );

  const downloadResult = await downloadImage(apiImage.url, localPath);
  if (!downloadResult.success) {
    // eslint-disable-next-line no-console
    console.log(
      `[GalleryBuilder] Download failed${downloadResult.error ? `: ${downloadResult.error}` : ''}, skipping`
    );
    return null;
  }

  const gpsFromExif = await verifyGpsWithExif(localPath);
  if (!gpsFromExif) {
    // eslint-disable-next-line no-console
    console.log(`[GalleryBuilder] EXIF verification failed, skipping`);
    return null;
  }

  const coordinates = gpsFromExif;
  const categoriesStr = apiImage.extmetadata?.Categories?.value ?? '';
  const categories = categoriesStr.split('|').map((c) => c.trim()).filter((c) => c.length > 0);

  let description = apiImage.extmetadata?.ImageDescription?.value;
  if (description && description.startsWith('{')) {
    description = undefined;
  }

  const galleryImage: GalleryImage = {
    id: `wikimedia_${String(index + 1).padStart(4, '0')}`,
    source: 'wikimedia_commons',
    filename,
    url: apiImage.url,
    local_path: localPath,
    coordinates,
    accuracy_radius: 30,
    image_info: {
      width,
      height,
      size_bytes: downloadResult.size,
      mime_type: apiImage.mime ?? 'unknown',
    },
    metadata: {
      title: apiImage.name,
      description,
      artist: apiImage.extmetadata?.Artist?.value,
      capture_date: apiImage.extmetadata?.DateTimeOriginal?.value,
      categories,
    },
  };

  return galleryImage;
}

export { downloadImage, extractGpsFromExtmetadata } from './wikimedia.js';
export { verifyGpsWithExif } from './exif.js';
