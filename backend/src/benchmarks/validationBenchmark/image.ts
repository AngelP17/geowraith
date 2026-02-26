/**
 * Image download and caching utilities for validation benchmark.
 */

import { readFile, access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import fetch from 'node-fetch';
import type { GalleryImage } from './types.js';

const USER_AGENT = 'GeoWraith/0.2.0 (validation benchmark)';

export async function ensureImageAvailable(image: GalleryImage): Promise<Buffer | null> {
  try {
    // Check if image exists locally
    try {
      await access(image.local_path);
      return readFile(image.local_path);
    } catch {
      // Image not found locally, try to download
      console.log(`  📥 Downloading ${image.filename}...`);
    }

    // Download the image
    const response = await fetch(image.url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      console.error(`  ✗ Download failed: HTTP ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure directory exists
    const dir = path.dirname(image.local_path);
    await mkdir(dir, { recursive: true });

    // Save for future use
    const { writeFile } = await import('node:fs/promises');
    await writeFile(image.local_path, buffer);

    return buffer;
  } catch (error) {
    console.error(`  ✗ Error: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}
