/**
 * Image download utilities
 */

import { writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { SourcedImage, ProcessImageOptions, ProcessImageResult } from './types.js';

const MIN_VALID_SIZE = 1000; // bytes
const MAX_RETRIES = 3;

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadImageBuffer(url: string): Promise<Buffer | null> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'GeoWraith/0.2.0 (research dataset collection)',
    },
  });
  
  if (!response.ok) {
    console.warn(`  HTTP ${response.status}: ${url}`);
    return null;
  }
  
  const buffer = await response.arrayBuffer();
  
  // Validate it's an image (check magic bytes)
  const bytes = new Uint8Array(buffer.slice(0, 4));
  const isJPEG = bytes[0] === 0xFF && bytes[1] === 0xD8;
  const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50;
  
  if (!isJPEG && !isPNG) {
    console.warn(`  Not a valid image: ${url}`);
    return null;
  }
  
  return Buffer.from(buffer);
}

export async function downloadImage(url: string, outputPath: string): Promise<boolean> {
  try {
    const buffer = await downloadImageBuffer(url);
    if (!buffer) return false;
    
    await writeFile(outputPath, buffer);
    return true;
  } catch (error) {
    console.warn(`  Download failed: ${error}`);
    return false;
  }
}

async function isValidExistingImage(imagePath: string): Promise<boolean> {
  if (!existsSync(imagePath)) return false;
  
  try {
    const buffer = await readFile(imagePath);
    return buffer.length > MIN_VALID_SIZE;
  } catch {
    return false;
  }
}

export async function processImage(
  options: ProcessImageOptions
): Promise<ProcessImageResult> {
  const { image, imagePath, cooldownMs, index, total } = options;
  
  console.log(`[${index + 1}/${total}] ${image.label}`);
  
  // Skip if already exists and valid
  if (await isValidExistingImage(imagePath)) {
    console.log('  ✓ Already exists');
    return {
      success: true,
      csvLine: `${image.filename},${image.lat},${image.lon},"${image.label}",30`,
    };
  }
  
  // Download with retry
  let success = false;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 1) {
      console.log(`  Retry ${attempt}/${MAX_RETRIES}...`);
      await sleep(cooldownMs * attempt);
    }
    
    success = await downloadImage(image.url, imagePath);
    if (success) break;
  }
  
  if (success) {
    console.log('  ✓ Downloaded');
    return {
      success: true,
      csvLine: `${image.filename},${image.lat},${image.lon},"${image.label}",30`,
    };
  } else {
    console.log('  ✗ Failed after retries');
    return { success: false, csvLine: null };
  }
}
