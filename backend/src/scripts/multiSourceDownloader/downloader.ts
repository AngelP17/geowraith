/**
 * Multi-Source Downloader - Download Logic
 * 
 * Handles image downloading with fallback support and validation.
 */

import { writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import https from 'node:https';
import http from 'node:http';
import type { ImageSource, DownloadResult } from './types.js';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function downloadImage(url: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const client = url.startsWith('https:') ? https : http;
    const request = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (GeoWraith Validation Bot)',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
      timeout: 30000,
    }, (response) => {
      if (response.statusCode !== 200) {
        resolve(null);
        return;
      }

      const chunks: Buffer[] = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    });

    request.on('error', () => resolve(null));
    request.on('timeout', () => {
      request.destroy();
      resolve(null);
    });
  });
}

function validateImage(buffer: Buffer): boolean {
  if (buffer.length < 1000) return false;
  
  // Check magic bytes
  const bytes = buffer.slice(0, 4);
  const isJPEG = bytes[0] === 0xFF && bytes[1] === 0xD8;
  const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50;
  const isWebP = bytes[0] === 0x52 && bytes[1] === 0x49;
  
  return isJPEG || isPNG || isWebP;
}

async function downloadWithFallback(source: ImageSource, outputPath: string): Promise<boolean> {
  const urls = [source.primaryUrl, ...source.fallbackUrls];
  
  for (const url of urls) {
    const buffer = await downloadImage(url);
    
    if (buffer && validateImage(buffer)) {
      await writeFile(outputPath, buffer);
      return true;
    }
  }
  
  return false;
}

export async function processImage(
  source: ImageSource, 
  imagePath: string, 
  delayMs: number,
  isLast: boolean
): Promise<DownloadResult> {
  // Check if already exists
  if (existsSync(imagePath)) {
    if (!isLast) {
      await sleep(delayMs);
    }
    return {
      success: true,
      skipped: true,
      filename: source.filename,
      source,
    };
  }
  
  // Download with fallback
  const success = await downloadWithFallback(source, imagePath);
  
  if (!isLast) {
    await sleep(delayMs);
  }
  
  return {
    success,
    skipped: false,
    filename: source.filename,
    source,
  };
}

export { sleep, downloadImage, validateImage, downloadWithFallback };
