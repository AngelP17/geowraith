/**
 * Wikimedia API integration for fetching geotagged images.
 */

import fetch from 'node-fetch';
import type { WikimediaImage, WikimediaApiResponse } from './types.js';
import { WIKIMEDIA_API, USER_AGENT, REQUEST_DELAY_MS, MAX_RETRIES } from './config.js';
import { sleep } from './utils.js';

/**
 * Fetch images from Wikimedia Commons API.
 */
export async function fetchWikimediaImages(continueToken?: string): Promise<WikimediaApiResponse> {
  const params = new URLSearchParams({
    action: 'query',
    list: 'allimages',
    aisort: 'timestamp',
    aidir: 'ascending',
    aistart: '2010-01-01T00:00:00Z',
    aiprop: 'url|size|mime|extmetadata',
    ailimit: '50',
    format: 'json',
    origin: '*',
  });

  if (continueToken) {
    params.set('aicontinue', continueToken);
  }

  const response = await fetch(`${WIKIMEDIA_API}?${params.toString()}`, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Wikimedia API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<WikimediaApiResponse>;
}

/**
 * Download an image from a URL to a local path with retry logic.
 */
export async function downloadImage(
  url: string,
  localPath: string,
  retries = 0
): Promise<{ size: number; success: boolean; error?: string }> {
  try {
    // Add delay before each download to respect rate limits
    await sleep(REQUEST_DELAY_MS);

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      if ((response.status === 429 || response.status >= 500) && retries < MAX_RETRIES) {
        const delay = REQUEST_DELAY_MS * (retries + 1) * 3;
        // eslint-disable-next-line no-console
        console.log(
          `[GalleryBuilder] Rate limited, waiting ${delay}ms before retry ${retries + 1}/${MAX_RETRIES}...`
        );
        await sleep(delay);
        return downloadImage(url, localPath, retries + 1);
      }
      return { size: 0, success: false, error: `HTTP ${response.status}` };
    }

    const { writeFile } = await import('node:fs/promises');
    const { MAX_FILE_BYTES } = await import('./config.js');

    const contentLength = Number(response.headers.get('content-length'));
    if (contentLength > MAX_FILE_BYTES) {
      return { size: contentLength, success: false, error: 'File too large' };
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > MAX_FILE_BYTES) {
      return { size: buffer.length, success: false, error: 'File too large' };
    }

    await writeFile(localPath, buffer);
    return { size: buffer.length, success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { size: 0, success: false, error: errorMsg };
  }
}

/**
 * Extract GPS coordinates from Wikimedia extended metadata.
 */
export function extractGpsFromExtmetadata(
  metadata: WikimediaImage['extmetadata']
): { lat: number; lon: number } | null {
  if (!metadata) return null;

  const latStr = metadata.GPSLatitude?.value;
  const lonStr = metadata.GPSLongitude?.value;

  if (!latStr || !lonStr) return null;

  const lat = Number.parseFloat(latStr);
  const lon = Number.parseFloat(lonStr);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;

  return { lat, lon };
}
