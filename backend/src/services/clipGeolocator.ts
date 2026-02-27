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
const CACHE_VERSION = 'clip-city-v4';
const CLIP_MODEL_ID = 'Xenova/clip-vit-base-patch32';
const IMAGE_SIZE = 224;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let clipPipeline: any = null;
let pipelineReady = false;
let loadingPromise: Promise<void> | null = null;

async function ensurePipeline(): Promise<void> {
  if (pipelineReady) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const { env, pipeline } = await import('@xenova/transformers');
    env.backends.onnx.wasm.proxy = false;

    console.log('[CLIP] Loading CLIP model (first run downloads from HuggingFace)...');
    const startTime = Date.now();
    clipPipeline = await pipeline('zero-shot-image-classification', CLIP_MODEL_ID);
    pipelineReady = true;
    console.log(`[CLIP] Model loaded in ${Date.now() - startTime}ms`);
  })();

  return loadingPromise;
}

function normalizeVector(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (norm <= 0) return vec;
  return vec.map(v => v / norm);
}

/**
 * Compute text embeddings for a batch of strings.
 * Uses a dummy pixel input since the ONNX session requires both modalities.
 */
async function embedTextBatch(texts: string[]): Promise<number[][]> {
  await ensurePipeline();

  const { Tensor } = await import('@xenova/transformers');
  const tok = clipPipeline.tokenizer;
  const model = clipPipeline.model;

  const textInputs = tok(texts, { padding: true, truncation: true });
  const dummyPixels = new Tensor('float32', new Float32Array(3 * IMAGE_SIZE * IMAGE_SIZE), [1, 3, IMAGE_SIZE, IMAGE_SIZE]);

  const output = await model.session.run({
    input_ids: textInputs.input_ids,
    attention_mask: textInputs.attention_mask,
    pixel_values: dummyPixels,
  });

  const data = output.text_embeds.data as Float32Array;
  const dim = output.text_embeds.dims[1] as number;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i++) {
    const vec = Array.from(data.slice(i * dim, (i + 1) * dim));
    results.push(normalizeVector(vec));
  }
  return results;
}

/**
 * Compute image embedding from raw image buffer.
 * Returns a normalized 512-dim vector in the CLIP embedding space.
 */
export async function embedImage(imageBuffer: Buffer): Promise<number[]> {
  await ensurePipeline();

  const { RawImage, Tensor } = await import('@xenova/transformers');
  const proc = clipPipeline.processor;
  const tok = clipPipeline.tokenizer;
  const model = clipPipeline.model;

  const pixels = await sharp(imageBuffer)
    .rotate()
    .removeAlpha()
    .resize(IMAGE_SIZE, IMAGE_SIZE, { fit: 'cover', position: 'centre' })
    .raw()
    .toBuffer();

  const image = new RawImage(new Uint8ClampedArray(pixels), IMAGE_SIZE, IMAGE_SIZE, 3);
  const imageInputs = await proc(image);
  const dummyText = tok('a', { padding: true, truncation: true });

  const output = await model.session.run({
    input_ids: dummyText.input_ids,
    attention_mask: dummyText.attention_mask,
    pixel_values: imageInputs.pixel_values,
  });

  const data = output.image_embeds.data as Float32Array;
  const vec = normalizeVector(Array.from(data));

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

interface CachedEmbeddings {
  version: string;
  vectors: Array<{ id: string; label: string; lat: number; lon: number; vector: number[] }>;
}

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

async function saveCachedEmbeddings(vectors: ReferenceVectorRecord[]): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(TEXT_EMBEDDINGS_CACHE, JSON.stringify({ version: CACHE_VERSION, vectors }));
}

/**
 * Build reference vectors from world city database using CLIP text embeddings.
 * Each city gets an averaged embedding from multiple prompt templates.
 * Results are cached for fast reload on subsequent starts.
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

  for (let i = 0; i < WORLD_CITIES_RAW.length; i++) {
    const c = WORLD_CITIES_RAW[i];
    const prompts = PROMPT_TEMPLATES.map(t =>
      t.replace('{city}', c.city).replace('{country}', c.country)
    );

    const embeddings = await embedTextBatch(prompts);

    const avg = new Array<number>(FEATURE_VECTOR_SIZE).fill(0);
    for (const emb of embeddings) {
      for (let d = 0; d < FEATURE_VECTOR_SIZE; d++) {
        avg[d] += emb[d] / embeddings.length;
      }
    }

    vectors.push({
      id: `city_${i}`,
      label: `${c.city}, ${c.country}`,
      lat: c.lat,
      lon: c.lon,
      vector: normalizeVector(avg),
    });

    if ((i + 1) % 50 === 0 || i + 1 === WORLD_CITIES_RAW.length) {
      console.log(`[CLIP] Embedded ${i + 1}/${WORLD_CITIES_RAW.length} cities`);
    }
  }

  try {
    await saveCachedEmbeddings(vectors);
    console.log(`[CLIP] Cached ${vectors.length} city embeddings (${Date.now() - startTime}ms)`);
  } catch (err) {
    console.warn('[CLIP] Failed to cache embeddings:', err);
  }

  return vectors;
}

/** Preload CLIP models during startup. */
export async function warmupCLIPGeolocator(): Promise<void> {
  console.log('[CLIP] Warming up CLIP geolocation pipeline...');
  await ensurePipeline();
  console.log('[CLIP] CLIP models ready');
}

/** Check if CLIP models are loaded and ready. */
export function isClipReady(): boolean {
  return pipelineReady;
}
