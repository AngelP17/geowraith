import exifr from 'exifr';
import sharp from 'sharp';
import { ApiError } from '../errors.js';
import { FEATURE_VECTOR_SIZE } from '../data/referenceVectors.js';
import type { ImageGpsLocation, ImageSignals } from '../types.js';
import { extractCLIPEmbedding } from './clipExtractor.js';
import { embedImage } from './clipGeolocator.js';

const RESIZE_WIDTH = 64;
const RESIZE_HEIGHT = 64;
const HUE_BINS = 6;

function safeNumber(value: number | undefined, fallback = 0): number {
  if (!Number.isFinite(value)) return fallback;
  return Number(value);
}

function getHueBin(r: number, g: number, b: number): number {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  if (delta === 0) return 0;

  let hue = 0;
  if (max === rn) {
    hue = ((gn - bn) / delta) % 6;
  } else if (max === gn) {
    hue = (bn - rn) / delta + 2;
  } else {
    hue = (rn - gn) / delta + 4;
  }

  const degrees = (hue * 60 + 360) % 360;
  return Math.min(HUE_BINS - 1, Math.floor((degrees / 360) * HUE_BINS));
}

function getSaturation(r: number, g: number, b: number): number {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  if (max === 0) return 0;
  return (max - min) / max;
}

function getLuma(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

async function extractExifLocation(
  imageBuffer: Buffer,
  hasExif: boolean
): Promise<ImageGpsLocation | null> {
  if (!hasExif) {
    return null;
  }

  try {
    const gps = await exifr.gps(imageBuffer);
    if (!gps || !Number.isFinite(gps.latitude) || !Number.isFinite(gps.longitude)) {
      return null;
    }
    return {
      lat: gps.latitude,
      lon: gps.longitude,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[imageSignals] EXIF parse failed, continuing without EXIF location:', error);
    return null;
  }
}

async function decodeForFeatureExtraction(imageBuffer: Buffer): Promise<{
  format: string;
  width: number;
  height: number;
  hasExif: boolean;
  pixels: Buffer;
}> {
  try {
    const image = sharp(imageBuffer, { failOn: 'error' }).rotate();
    const metadata = await image.metadata();
    const format = metadata.format ?? 'unknown';
    const width = safeNumber(metadata.width);
    const height = safeNumber(metadata.height);

    if (!format || width <= 0 || height <= 0) {
      throw new ApiError(400, 'invalid_input', 'Unsupported or malformed image payload');
    }

    const pixels = await image
      .resize(RESIZE_WIDTH, RESIZE_HEIGHT, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer();

    return {
      format,
      width,
      height,
      hasExif: Boolean(metadata.exif),
      pixels,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(400, 'invalid_input', 'Unable to decode image payload');
  }
}

function computeImageVector(pixels: Buffer): number[] {
  const hueHistogram = new Array<number>(HUE_BINS).fill(0);
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let rSqSum = 0;
  let gSqSum = 0;
  let bSqSum = 0;
  let lumaSum = 0;
  let lumaSqSum = 0;
  let saturationSum = 0;

  const pixelCount = pixels.length / 3;
  for (let i = 0; i < pixels.length; i += 3) {
    const r = pixels[i] ?? 0;
    const g = pixels[i + 1] ?? 0;
    const b = pixels[i + 2] ?? 0;

    rSum += r;
    gSum += g;
    bSum += b;
    rSqSum += r * r;
    gSqSum += g * g;
    bSqSum += b * b;

    const luma = getLuma(r, g, b);
    lumaSum += luma;
    lumaSqSum += luma * luma;
    saturationSum += getSaturation(r, g, b);
    hueHistogram[getHueBin(r, g, b)] += 1;
  }

  const meanR = rSum / pixelCount / 255;
  const meanG = gSum / pixelCount / 255;
  const meanB = bSum / pixelCount / 255;
  const stdR = Math.sqrt(Math.max(0, rSqSum / pixelCount - (rSum / pixelCount) ** 2)) / 255;
  const stdG = Math.sqrt(Math.max(0, gSqSum / pixelCount - (gSum / pixelCount) ** 2)) / 255;
  const stdB = Math.sqrt(Math.max(0, bSqSum / pixelCount - (bSum / pixelCount) ** 2)) / 255;
  const meanLuma = lumaSum / pixelCount;
  const stdLuma = Math.sqrt(Math.max(0, lumaSqSum / pixelCount - meanLuma ** 2));
  const meanSaturation = saturationSum / pixelCount;

  const normalizedHue = hueHistogram.map((value) => value / pixelCount);
  return [
    meanR,
    meanG,
    meanB,
    stdR,
    stdG,
    stdB,
    meanLuma,
    stdLuma,
    meanSaturation,
    ...normalizedHue,
  ];
}

function expandVector(base: number[], targetSize: number): number[] {
  if (base.length >= targetSize) return base.slice(0, targetSize);
  const expanded = new Array<number>(targetSize);
  for (let i = 0; i < targetSize; i += 1) {
    const source = base[i % base.length] ?? 0;
    const positionBias = ((i % 17) - 8) * 0.0005;
    expanded[i] = source + positionBias;
  }
  return expanded;
}

/** Extract GeoCLIP embeddings and optional EXIF geolocation from an image payload. */
export async function extractImageSignals(imageBuffer: Buffer): Promise<ImageSignals> {
  const decoded = await decodeForFeatureExtraction(imageBuffer);
  const exifLocation = await extractExifLocation(imageBuffer, decoded.hasExif);

  let vector: number[];
  let embeddingSource: ImageSignals['embeddingSource'] = 'geoclip';
  try {
    vector = await extractCLIPEmbedding(imageBuffer);
  } catch {
    try {
      vector = await embedImage(imageBuffer);
      embeddingSource = 'clip';
    } catch (clipError) {
      console.warn(
        '[imageSignals] CLIP extraction failed, using deterministic fallback embedding:',
        clipError
      );
      vector = expandVector(computeImageVector(decoded.pixels), FEATURE_VECTOR_SIZE);
      embeddingSource = 'fallback';
    }
  }

  if (vector.length !== FEATURE_VECTOR_SIZE) {
    throw new ApiError(
      500,
      'feature_error',
      `Feature vector length mismatch: expected ${FEATURE_VECTOR_SIZE}, got ${vector.length}`
    );
  }

  return {
    meta: {
      format: decoded.format,
      width: decoded.width,
      height: decoded.height,
    },
    vector,
    exifLocation,
    embeddingSource,
  };
}
