/**
 * CLIP-based geolocation service.
 *
 * Uses @xenova/transformers CLIP model to match images against
 * pre-computed text embeddings of world cities. This provides
 * city-level geolocation when GeoCLIP ONNX models are unavailable.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { FEATURE_VECTOR_SIZE } from '../data/referenceVectors.js';
import type { ReferenceVectorRecord } from '../types.js';

const CACHE_DIR = path.resolve(process.cwd(), '.cache/clip');
const TEXT_EMBEDDINGS_CACHE = path.join(CACHE_DIR, 'city_text_embeddings.json');
const CACHE_VERSION = 'clip-city-v3';
const CLIP_MODEL_ID = 'Xenova/clip-vit-base-patch32';
const IMAGE_SIZE = 224;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let textModel: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let visionModel: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let tokenizer: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let processor: any = null;

let modelsReady = false;

async function loadModels(): Promise<void> {
  if (modelsReady) return;

  const transformers = await import('@xenova/transformers');
  const { CLIPTextModelWithProjection, CLIPVisionModelWithProjection, AutoTokenizer, AutoProcessor } = transformers;

  console.log('[CLIP] Loading CLIP models from HuggingFace cache...');
  const startTime = Date.now();

  [textModel, visionModel, tokenizer, processor] = await Promise.all([
    CLIPTextModelWithProjection.from_pretrained(CLIP_MODEL_ID),
    CLIPVisionModelWithProjection.from_pretrained(CLIP_MODEL_ID),
    AutoTokenizer.from_pretrained(CLIP_MODEL_ID),
    AutoProcessor.from_pretrained(CLIP_MODEL_ID),
  ]);

  modelsReady = true;
  console.log(`[CLIP] Models loaded in ${Date.now() - startTime}ms`);
}

function normalizeVector(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (norm <= 0) return vec;
  return vec.map(v => v / norm);
}

/**
 * Compute text embedding for a single text string.
 * Returns a normalized 512-dim vector.
 */
async function embedText(text: string): Promise<number[]> {
  await loadModels();
  const inputs = await tokenizer(text, { padding: true, truncation: true });
  const output = await textModel(inputs);
  const embeds = output.text_embeds?.data ?? output.text_embeds;
  if (!embeds) {
    throw new Error('CLIP text model returned no text_embeds');
  }
  return normalizeVector(Array.from(embeds as Float32Array));
}

/**
 * Compute text embeddings for multiple texts (batched).
 * Returns normalized 512-dim vectors.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  await loadModels();
  const results: number[][] = [];
  const batchSize = 32;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const embeddings = await Promise.all(batch.map(t => embedText(t)));
    results.push(...embeddings);
  }
  return results;
}

/**
 * Compute image embedding from raw image buffer.
 * Returns a normalized vector in the CLIP embedding space.
 */
export async function embedImage(imageBuffer: Buffer): Promise<number[]> {
  await loadModels();
  const { RawImage } = await import('@xenova/transformers');

  const pixels = await sharp(imageBuffer)
    .rotate()
    .removeAlpha()
    .resize(IMAGE_SIZE, IMAGE_SIZE, { fit: 'cover', position: 'centre' })
    .raw()
    .toBuffer();

  const image = new RawImage(pixels, IMAGE_SIZE, IMAGE_SIZE, 3);
  const imageInputs = await processor(image);
  const output = await visionModel(imageInputs);
  const embeds = output.image_embeds?.data ?? output.image_embeds;

  if (!embeds) {
    throw new Error('CLIP vision model returned no image_embeds');
  }

  const vec = normalizeVector(Array.from(embeds as Float32Array));
  if (vec.length !== FEATURE_VECTOR_SIZE) {
    throw new Error(`CLIP embedding size ${vec.length} != expected ${FEATURE_VECTOR_SIZE}`);
  }
  return vec;
}

/** Text prompt templates for city geolocation. */
const PROMPT_TEMPLATES = [
  'A photograph taken in {city}, {country}',
  'A street view from {city}, {country}',
  'An outdoor scene in {city}, {country}',
];

/**
 * Generate averaged text embedding for a city using multiple prompts.
 */
async function embedCity(city: string, country: string): Promise<number[]> {
  const prompts = PROMPT_TEMPLATES.map(t =>
    t.replace('{city}', city).replace('{country}', country)
  );
  const embeddings = await Promise.all(prompts.map(p => embedText(p)));

  const avg = new Array<number>(FEATURE_VECTOR_SIZE).fill(0);
  for (const emb of embeddings) {
    for (let i = 0; i < FEATURE_VECTOR_SIZE; i++) {
      avg[i] += emb[i] / embeddings.length;
    }
  }
  return normalizeVector(avg);
}

interface CachedEmbeddings {
  version: string;
  vectors: Array<{ id: string; label: string; lat: number; lon: number; vector: number[] }>;
}

/**
 * Load city text embeddings from cache.
 */
async function loadCachedEmbeddings(): Promise<ReferenceVectorRecord[] | null> {
  try {
    const raw = await readFile(TEXT_EMBEDDINGS_CACHE, 'utf8');
    const data = JSON.parse(raw) as CachedEmbeddings;
    if (data.version !== CACHE_VERSION || !Array.isArray(data.vectors)) return null;
    return data.vectors;
  } catch {
    return null;
  }
}

/**
 * Save city text embeddings to cache.
 */
async function saveCachedEmbeddings(vectors: ReferenceVectorRecord[]): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  const data: CachedEmbeddings = { version: CACHE_VERSION, vectors };
  await writeFile(TEXT_EMBEDDINGS_CACHE, JSON.stringify(data));
}

/**
 * Build reference vectors from world city database using CLIP text embeddings.
 * Caches results for fast reload on subsequent starts.
 */
export async function buildCityReferenceVectors(): Promise<ReferenceVectorRecord[]> {
  const cached = await loadCachedEmbeddings();
  if (cached && cached.length > 0) {
    console.log(`[CLIP] Loaded ${cached.length} cached city text embeddings`);
    return cached;
  }

  const { WORLD_CITIES_RAW } = await import('../data/worldCities.js');
  console.log(`[CLIP] Building text embeddings for ${WORLD_CITIES_RAW.length} cities...`);
  const startTime = Date.now();

  const vectors: ReferenceVectorRecord[] = [];
  const chunkSize = 50;

  for (let i = 0; i < WORLD_CITIES_RAW.length; i += chunkSize) {
    const chunk = WORLD_CITIES_RAW.slice(i, i + chunkSize);
    const embeddings = await Promise.all(
      chunk.map(c => embedCity(c.city, c.country))
    );

    for (let j = 0; j < chunk.length; j++) {
      const c = chunk[j];
      vectors.push({
        id: `city_${i + j}`,
        label: `${c.city}, ${c.country}`,
        lat: c.lat,
        lon: c.lon,
        vector: embeddings[j],
      });
    }

    if ((i + chunkSize) % 200 === 0 || i + chunkSize >= WORLD_CITIES_RAW.length) {
      console.log(`[CLIP] Embedded ${Math.min(i + chunkSize, WORLD_CITIES_RAW.length)}/${WORLD_CITIES_RAW.length} cities`);
    }
  }

  try {
    await saveCachedEmbeddings(vectors);
    console.log(`[CLIP] Cached ${vectors.length} city embeddings in ${Date.now() - startTime}ms`);
  } catch (err) {
    console.warn('[CLIP] Failed to cache embeddings:', err);
  }

  return vectors;
}

/** Preload CLIP models during startup. */
export async function warmupCLIPGeolocator(): Promise<void> {
  console.log('[CLIP] Warming up CLIP geolocation pipeline...');
  await loadModels();
  console.log('[CLIP] CLIP models ready');
}

/** Check if CLIP models are loaded and ready. */
export function isClipReady(): boolean {
  return modelsReady;
}
