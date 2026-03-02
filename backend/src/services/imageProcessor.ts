import sharp from 'sharp';
import type { ImagePreprocessMode } from '../types.js';

function normalizeInput(input: Buffer | File): Promise<Buffer> | Buffer {
  if (Buffer.isBuffer(input)) {
    return input;
  }
  return input.arrayBuffer().then((buffer) => Buffer.from(buffer));
}

async function buildStandardizedJpeg(
  input: Buffer,
  mode: Exclude<ImagePreprocessMode, 'none'>
): Promise<Buffer> {
  const image = sharp(input, {
    failOnError: false,
    unlimited: true,
  }).rotate();

  if (mode === 'jpeg-only') {
    return image.jpeg({ quality: 90, progressive: true }).toBuffer();
  }

  const fit = mode === 'contain-224-jpeg' ? 'contain' : 'cover';
  return image
    .resize(224, 224, {
      fit,
      position: 'center',
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .jpeg({ quality: 90, progressive: true })
    .toBuffer();
}

/**
 * Convert any image format to standardized JPEG for GeoCLIP processing.
 * Handles HEIC, AVIF, WebP, PNG, and other formats.
 * Resizes to 224x224 (GeoCLIP expected input size).
 *
 * @param input - Raw image buffer or File object
 * @returns Standardized JPEG buffer
 */
export async function convertToStandardFormat(
  input: Buffer | File
): Promise<Buffer> {
  return preprocessImageForInference(input, 'cover-224-jpeg');
}

/**
 * Normalize image bytes before embedding. This is configurable so benchmark
 * ablations can compare the current center-crop path against less destructive modes.
 */
export async function preprocessImageForInference(
  input: Buffer | File,
  mode: ImagePreprocessMode
): Promise<Buffer> {
  const buffer = await normalizeInput(input);
  try {
    if (mode === 'none') {
      return buffer;
    }
    return await buildStandardizedJpeg(buffer, mode);
  } catch (error) {
    throw new Error(
      `Failed to process image: ${error instanceof Error ? error.message : 'unknown error'}`
    );
  }
}

/**
 * Extract image metadata using Sharp.
 * Useful for debugging and signal extraction.
 *
 * @param buffer - Image buffer
 * @returns Image metadata
 */
export async function extractImageMetadata(buffer: Buffer): Promise<{
  format: string;
  width: number;
  height: number;
  hasAlpha: boolean;
}> {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      format: metadata.format || 'unknown',
      width: metadata.width || 0,
      height: metadata.height || 0,
      hasAlpha: metadata.hasAlpha || false,
    };
  } catch (error) {
    return {
      format: 'unknown',
      width: 0,
      height: 0,
      hasAlpha: false,
    };
  }
}

/**
 * Check if the buffer is a valid image that can be processed.
 *
 * @param buffer - Potential image buffer
 * @returns Boolean indicating if valid image
 */
export async function isValidImage(buffer: Buffer): Promise<boolean> {
  try {
    await sharp(buffer).metadata();
    return true;
  } catch {
    return false;
  }
}
