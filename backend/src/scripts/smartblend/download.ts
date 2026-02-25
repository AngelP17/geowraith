/**
 * SmartBlend download helpers.
 */

import { copyFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import type { LandmarkSource } from './landmarks.js';
import { fetchOpenverseCandidate } from './openverse.js';

export interface DownloadOptions {
  maxRetries: number;
  timeoutMs: number;
  allowUnverified: boolean;
  enableOpenverse: boolean;
  enableUnsplashSource: boolean;
  openverseLicenses: string[];
  openversePageSize: number;
  openverseTimeoutMs: number;
}

const USER_AGENT = 'GeoWraith/0.2.0 (smart blend validation)';

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isValidImage(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 4));
  const isValid =
    (bytes[0] === 0xFF && bytes[1] === 0xD8) ||
    (bytes[0] === 0x89 && bytes[1] === 0x50) ||
    (bytes[0] === 0x52 && bytes[1] === 0x49);
  return isValid && buffer.byteLength >= 1000;
}

async function downloadImage(
  url: string,
  outputPath: string,
  timeoutMs: number
): Promise<boolean> {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    return false;
  }

  const buffer = await response.arrayBuffer();
  if (!isValidImage(buffer)) {
    return false;
  }

  await writeFile(outputPath, Buffer.from(buffer));
  return true;
}

/**
 * Download with Openverse + URL fallback and retry.
 */
export async function downloadWithFallback(
  landmark: LandmarkSource,
  outputPath: string,
  options: DownloadOptions
): Promise<{ success: boolean; source: string; attempts: number }> {
  if (options.enableOpenverse) {
    try {
      const candidate = await fetchOpenverseCandidate(
        landmark.label.replace(/,.*$/, ''),
        {
          licenses: options.openverseLicenses,
          pageSize: options.openversePageSize,
          timeoutMs: options.openverseTimeoutMs,
        }
      );
      if (candidate?.url) {
        const ok = await downloadImage(candidate.url, outputPath, options.timeoutMs);
        if (ok) {
          return { success: true, source: `openverse:${candidate.license}`, attempts: 1 };
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.log(`  Openverse lookup failed: ${message}`);
    }
  }

  if (options.allowUnverified) {
    for (let urlIndex = 0; urlIndex < landmark.urls.length; urlIndex++) {
      const url = landmark.urls[urlIndex]!;
      const sourceName = url.includes('wikimedia') ? 'wikimedia' : 'direct';

      for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
        try {
          console.log(`  Trying ${sourceName} (attempt ${attempt}/${options.maxRetries})...`);
          const ok = await downloadImage(url, outputPath, options.timeoutMs);
          if (ok) {
            return { success: true, source: sourceName, attempts: attempt };
          }
          console.log(`    Invalid image or HTTP failure`);
          await sleep(Math.min(2000 * attempt, 10000));
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.log(`    Failed: ${errorMsg}`);
          if (attempt < options.maxRetries) {
            const backoff = Math.min(1000 * Math.pow(2, attempt), 15000);
            console.log(`    Backing off ${backoff}ms...`);
            await sleep(backoff);
          }
        }
      }
    }
  }

  if (options.enableUnsplashSource) {
    try {
      const query = encodeURIComponent(landmark.label.replace(/,.*$/, ''));
      const url = `https://source.unsplash.com/640x480/?${query}`;
      const ok = await downloadImage(url, outputPath, options.timeoutMs);
      if (ok) {
        return { success: true, source: 'unsplash_source', attempts: options.maxRetries + 1 };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.log(`  Unsplash source failed: ${message}`);
    }
  }

  return { success: false, source: 'none', attempts: options.maxRetries };
}

/**
 * Try existing validation gallery images as fallback.
 */
export async function tryExistingFallback(
  landmark: LandmarkSource,
  outputPath: string
): Promise<boolean> {
  const fallbackPaths = [
    path.resolve(process.cwd(), '.cache/validation_gallery/images', landmark.filename),
    path.resolve(process.cwd(), '.cache/sourced_gallery/images', landmark.filename),
  ];

  for (const fallbackPath of fallbackPaths) {
    if (existsSync(fallbackPath)) {
      const stats = statSync(fallbackPath);
      if (stats.size > 1000) {
        console.log('  Using existing cached image');
        await copyFile(fallbackPath, outputPath);
        return true;
      }
    }
  }

  return false;
}

/**
 * Create a minimal valid JPEG as a last-resort placeholder.
 */
export async function createPlaceholderImage(outputPath: string): Promise<boolean> {
  const placeholder = Buffer.from(
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
    'base64'
  );
  await writeFile(outputPath, placeholder);
  return true;
}
