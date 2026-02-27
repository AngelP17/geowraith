/**
 * GeoCLIP-based visual embedding extractor for geolocation.
 *
 * Uses local ONNX runtime with Xenova GeoCLIP models. This keeps inference
 * zero-cost and local-first while producing geolocation-specialized embeddings.
 */

import { access } from 'node:fs/promises';
import path from 'node:path';
import ort from 'onnxruntime-node';
import sharp from 'sharp';
import { FEATURE_VECTOR_SIZE } from '../data/referenceVectors.js';

// Resolve model dir from repo root (one level up from backend/)
const MODEL_DIR = path.resolve(process.cwd(), '..', '.cache/geoclip');
// Use available quantized models (q4 for vision, uint8 for location)
const VISION_MODEL = path.join(MODEL_DIR, 'vision_model_q4.onnx');
const LOCATION_MODEL = path.join(MODEL_DIR, 'location_model_uint8.onnx');

const IMAGE_SIZE = 224;
const IMAGE_MEAN = [0.48145466, 0.4578275, 0.40821073];
const IMAGE_STD = [0.26862954, 0.26130258, 0.27577711];
const SESSION_OPTIONS: ort.InferenceSession.SessionOptions = {
  executionProviders: ['cpu'],
};

let visionSession: ort.InferenceSession | null = null;
let locationSession: ort.InferenceSession | null = null;

async function ensureModelFiles(): Promise<void> {
  try {
    await access(VISION_MODEL);
    await access(LOCATION_MODEL);
  } catch (error) {
    throw new Error(
      `GeoCLIP model files are missing under ${MODEL_DIR}. Download vision_model_q4.onnx and location_model_uint8.onnx before enabling model-backed inference.`,
      { cause: error }
    );
  }
}

async function getGeoCLIPSessions(): Promise<{
  vision: ort.InferenceSession;
  location: ort.InferenceSession;
}> {
  if (!visionSession || !locationSession) {
    await ensureModelFiles();
    const startTime = Date.now();
    [visionSession, locationSession] = await Promise.all([
      ort.InferenceSession.create(VISION_MODEL, SESSION_OPTIONS),
      ort.InferenceSession.create(LOCATION_MODEL, SESSION_OPTIONS),
    ]);
    // eslint-disable-next-line no-console
    console.log(`[GeoCLIP] ONNX sessions loaded in ${Date.now() - startTime}ms (cpu EP)`);
  }
  return {
    vision: visionSession,
    location: locationSession,
  };
}

function normalizeEmbedding(input: Float32Array | number[]): number[] {
  const vector = Array.from(input);
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (!Number.isFinite(norm) || norm <= 0) {
    throw new Error('GeoCLIP produced a non-normalizable embedding');
  }
  return vector.map((value) => value / norm);
}

async function buildPixelTensor(imageBuffer: Buffer): Promise<ort.Tensor> {
  const pixels = await sharp(imageBuffer)
    .rotate()
    .removeAlpha()
    .resize(IMAGE_SIZE, IMAGE_SIZE, { fit: 'cover', position: 'centre' })
    .raw()
    .toBuffer();

  const tensorData = new Float32Array(1 * 3 * IMAGE_SIZE * IMAGE_SIZE);
  const planeSize = IMAGE_SIZE * IMAGE_SIZE;

  for (let i = 0; i < planeSize; i += 1) {
    const r = (pixels[i * 3] ?? 0) / 255;
    const g = (pixels[i * 3 + 1] ?? 0) / 255;
    const b = (pixels[i * 3 + 2] ?? 0) / 255;

    tensorData[i] = (r - IMAGE_MEAN[0]) / IMAGE_STD[0];
    tensorData[planeSize + i] = (g - IMAGE_MEAN[1]) / IMAGE_STD[1];
    tensorData[2 * planeSize + i] = (b - IMAGE_MEAN[2]) / IMAGE_STD[2];
  }

  return new ort.Tensor('float32', tensorData, [1, 3, IMAGE_SIZE, IMAGE_SIZE]);
}

/** Extract GeoCLIP image embedding from image bytes. */
export async function extractCLIPEmbedding(imageBuffer: Buffer): Promise<number[]> {
  const { vision } = await getGeoCLIPSessions();
  const pixelValues = await buildPixelTensor(imageBuffer);
  const output = await vision.run({ pixel_values: pixelValues });
  const imageEmbeds = output.image_embeds?.data;

  if (!(imageEmbeds instanceof Float32Array)) {
    throw new Error('GeoCLIP vision model returned unexpected output format');
  }

  const embedding = normalizeEmbedding(imageEmbeds);
  if (embedding.length !== FEATURE_VECTOR_SIZE) {
    throw new Error(
      `GeoCLIP embedding size mismatch: expected ${FEATURE_VECTOR_SIZE}, got ${embedding.length}`
    );
  }
  return embedding;
}

/**
 * Build GeoCLIP embeddings for candidate coordinates.
 * Input order is `[lat, lon]` to match GeoCLIP gallery format.
 */
export async function embedGeoLocations(coords: Array<{ lat: number; lon: number }>): Promise<number[][]> {
  if (coords.length === 0) return [];

  const { location } = await getGeoCLIPSessions();
  const input = new Float32Array(coords.length * 2);
  for (let i = 0; i < coords.length; i += 1) {
    input[i * 2] = coords[i].lat;
    input[i * 2 + 1] = coords[i].lon;
  }

  const output = await location.run({
    location: new ort.Tensor('float32', input, [coords.length, 2]),
  });
  const locationEmbeds = output.location_embeds?.data;
  if (!(locationEmbeds instanceof Float32Array)) {
    throw new Error('GeoCLIP location model returned unexpected output format');
  }

  const embeddings: number[][] = [];
  for (let i = 0; i < coords.length; i += 1) {
    const start = i * FEATURE_VECTOR_SIZE;
    const end = start + FEATURE_VECTOR_SIZE;
    embeddings.push(normalizeEmbedding(locationEmbeds.slice(start, end)));
  }
  return embeddings;
}

/** Preload GeoCLIP ONNX sessions during startup. */
export async function warmupCLIP(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('[GeoCLIP] Warming up sessions...');
  await getGeoCLIPSessions();
  // eslint-disable-next-line no-console
  console.log('[GeoCLIP] Warmup complete');
}

/** Get current model info for diagnostics. */
export function getModelInfo(): { name: string; embeddingSize: number } {
  return {
    name: 'GeoCLIP-Large-Patch14 (ONNX q4 vision + uint8 location)',
    embeddingSize: FEATURE_VECTOR_SIZE,
  };
}
