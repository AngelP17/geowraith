/**
 * SmartBlend Gallery - Image download logic
 */

import { writeFile, stat, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import fetch from 'node-fetch';
import sharp from 'sharp';
import type { LandmarkSource, DownloadResult, ImageInfo } from './types.js';
import { USER_AGENT, REQUEST_TIMEOUT_MS, MAX_RETRIES, OUTPUT_DIR, IMAGES_SUBDIR } from './data.js';

const IMAGES_DIR = path.resolve(process.cwd(), OUTPUT_DIR, IMAGES_SUBDIR);

export function parseMinImages(args: string[]): number {
  const raw = args.find((arg) => arg.startsWith('--min-images='))?.split('=')[1];
  const value = Number.parseInt(raw ?? '10', 10);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('Invalid --min-images value');
  }
  return value;
}

export function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

async function fetchWithRetry(url: string): Promise<Buffer | null> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        if (response.status === 429 && attempt < MAX_RETRIES) {
          const waitMs = 1000 * attempt * attempt;
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }
        return null;
      }

      const buf = Buffer.from(await response.arrayBuffer());
      return buf;
    } catch {
      if (attempt === MAX_RETRIES) return null;
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
  return null;
}

export async function imageInfo(filePath: string): Promise<ImageInfo> {
  const meta = await sharp(filePath).metadata();
  const stats = await stat(filePath);
  return {
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    size: stats.size,
    mime: meta.format ? `image/${meta.format}` : 'image/unknown',
  };
}

export async function ensureDirs(): Promise<void> {
  await mkdir(IMAGES_DIR, { recursive: true });
  await mkdir(path.resolve(process.cwd(), OUTPUT_DIR), { recursive: true });
}

async function createPlaceholder(filePath: string): Promise<void> {
  const buffer = Buffer.from(
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
    'base64'
  );
  await writeFile(filePath, buffer);
}

export async function ensureCachedOrDownload(
  landmark: LandmarkSource,
  aggressive: boolean
): Promise<DownloadResult> {
  const targetPath = path.join(IMAGES_DIR, landmark.filename);

  if (existsSync(targetPath)) {
    return { ok: true, source: 'cache', filePath: targetPath, usedUrl: '' };
  }

  for (const url of landmark.urls) {
    const buffer = await fetchWithRetry(url);
    if (buffer) {
      await writeFile(targetPath, buffer);
      return { ok: true, source: 'download', filePath: targetPath, usedUrl: url };
    }
  }

  if (aggressive) {
    await createPlaceholder(targetPath);
    return { ok: true, source: 'placeholder', filePath: targetPath, usedUrl: '' };
  }

  return { ok: false, source: 'failed', filePath: targetPath, usedUrl: '' };
}
