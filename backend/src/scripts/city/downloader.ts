import { writeFile } from 'node:fs/promises';
import { statSync } from 'node:fs';
import type { CityImage } from './types.js';

export interface DownloadResult {
  saved: boolean;
  size: number;
}

const IMAGE_MIN_BYTES = 1000;

export async function downloadImage(url: string, timeoutMs: number): Promise<Buffer | null> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (GeoWraith Research)',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    return null;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return validateImage(buffer) ? buffer : null;
}

export async function saveImage(
  image: CityImage,
  outputPath: string,
  timeoutMs: number
): Promise<DownloadResult> {
  const buffer = await downloadImage(image.url, timeoutMs);
  if (!buffer) {
    return { saved: false, size: 0 };
  }

  await writeFile(outputPath, buffer);
  const stats = statSync(outputPath);
  return { saved: true, size: stats.size };
}

function validateImage(buffer: Buffer): boolean {
  if (buffer.length < IMAGE_MIN_BYTES) {
    return false;
  }

  const bytes = buffer.subarray(0, 4);
  const isJPEG = bytes[0] === 0xFF && bytes[1] === 0xD8;
  const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50;
  const isWebP = bytes[0] === 0x52 && bytes[1] === 0x49;
  return isJPEG || isPNG || isWebP;
}
