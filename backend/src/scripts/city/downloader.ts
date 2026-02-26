/**
 * Robust image downloader with multiple fallback strategies.
 */

import { writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import type { CityImage } from './types.js';
import { withRetry, sleep } from './retry.js';

const FETCH_TIMEOUT_MS = 30000;
const MAX_DOWNLOAD_SIZE = 20 * 1024 * 1024; // 20MB

interface DownloadResult {
  success: boolean;
  filename?: string;
  error?: string;
  size?: number;
}

/**
 * Download image with multiple fallback strategies.
 */
export async function downloadImage(
  image: CityImage,
  imagesDir: string,
  index: number
): Promise<DownloadResult> {
  const filename = `${String(index).padStart(4, '0')}_${sanitizeFilename(image.title)}_${image.source}.jpg`;
  const filepath = path.join(imagesDir, filename);

  // Check if already exists
  try {
    await access(filepath);
    return { success: true, filename, size: 0 };
  } catch {
    // Continue to download
  }

  const urls = generateUrlVariants(image.url);
  let lastError = 'All URL variants failed';
  
  for (const url of urls) {
    try {
      const result = await tryDownloadUrl(url, filepath);
      if (result.success) {
        return { ...result, filename };
      }
      if (result.error) {
        lastError = result.error;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await sleep(500); // Brief delay between URL variants
  }

  return { success: false, error: lastError };
}

/**
 * Try downloading from a specific URL.
 */
async function tryDownloadUrl(url: string, filepath: string): Promise<DownloadResult> {
  return withRetry(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'GeoWraith City Scraper (research project; contact: geowraith@example.com)',
          'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://commons.wikimedia.org/',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error(`Invalid content-type: ${contentType}`);
      }

      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > MAX_DOWNLOAD_SIZE) {
        throw new Error('File too large');
      }

      const arrayBuffer = await response.arrayBuffer();
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('Empty response');
      }

      if (arrayBuffer.byteLength > MAX_DOWNLOAD_SIZE) {
        throw new Error('File too large after download');
      }

      // Ensure directory exists
      await mkdir(path.dirname(filepath), { recursive: true });
      
      // Write file
      await writeFile(filepath, Buffer.from(arrayBuffer));

      return { 
        success: true, 
        size: arrayBuffer.byteLength 
      };
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }, `Download ${url}`, { maxRetries: 2, baseDelayMs: 1000 });
}

/**
 * Generate URL variants for fallback attempts.
 */
function generateUrlVariants(url: string): string[] {
  const variants = [url];
  
  // Try different Wikimedia thumbnail sizes
  if (url.includes('wikimedia.org')) {
    variants.push(
      url.replace(/\/\d+px-/, '/800px-'),
      url.replace(/\/\d+px-/, '/640px-'),
      url.replace(/\/\d+px-/, '/400px-'),
      url.replace(/\/thumb\//, '/').replace(/\/\d+px-[^/]+$/, ''), // Original size
    );
  }

  // Try Flickr size suffix variants
  if (url.includes('live.staticflickr.com')) {
    variants.push(
      url.replace('_m.', '_b.'),
      url.replace('_m.', '_c.'),
      url.replace('_m.', '_z.'),
      url.replace('_m.', '_n.'),
      url.replace('_m.', '_o.'),
    );
  }
  
  return [...new Set(variants)]; // Remove duplicates
}

function sanitizeFilename(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 50);
}

export async function saveMetadata(
  imagesDir: string,
  metadata: unknown[],
): Promise<void> {
  const metadataPath = path.join(imagesDir, '..', 'metadata.csv');
  const header = 'id,title,url,source,width,height,size,filename,status\n';
  const rows = metadata.map((m: unknown) => {
    const img = m as { id: string; title: string; url: string; source: string; width: number; height: number; size: number; filename?: string; status: string };
    return `${img.id},${escapeCsv(img.title)},${img.url},${img.source},${img.width},${img.height},${img.size},${img.filename || ''},${img.status}`;
  }).join('\n');
  
  await writeFile(metadataPath, header + rows, 'utf8');
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
