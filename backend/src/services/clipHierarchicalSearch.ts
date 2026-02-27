/**
 * Hierarchical CLIP geolocation: country → city two-stage search.
 *
 * Stage 1: Classify image into top countries using country-level prompts
 * Stage 2: Match against cities within those countries
 *
 * This prevents cross-continent errors by narrowing the search space.
 */

import type { VectorMatch } from '../types.js';
import { FEATURE_VECTOR_SIZE } from '../data/referenceVectors.js';
import { cosineSimilarity } from '../utils/math.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let clipPipeline: any = null;
let pipelineReady = false;
let loadingPromise: Promise<void> | null = null;

const CLIP_MODEL_ID = 'Xenova/clip-vit-base-patch32';

async function ensurePipeline(): Promise<void> {
  if (pipelineReady) return;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    const { env, pipeline } = await import('@xenova/transformers');
    env.backends.onnx.wasm.proxy = false;
    clipPipeline = await pipeline('zero-shot-image-classification', CLIP_MODEL_ID);
    pipelineReady = true;
  })();
  return loadingPromise;
}

function normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return norm > 0 ? vec.map(v => v / norm) : vec;
}

interface CountryEntry { country: string; prompts: string[]; embedding?: number[] }
interface CityEntry { city: string; country: string; lat: number; lon: number; prompts: string[]; embedding?: number[] }

let countryEmbeddings: CountryEntry[] = [];
let cityEmbeddings: CityEntry[] = [];
let embeddingsReady = false;

async function embedTexts(texts: string[]): Promise<number[][]> {
  await ensurePipeline();
  const { Tensor } = await import('@xenova/transformers');
  const tok = clipPipeline.tokenizer;
  const model = clipPipeline.model;
  const dummy = new Tensor('float32', new Float32Array(3 * 224 * 224), [1, 3, 224, 224]);

  const batchSize = 64;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const inputs = tok(batch, { padding: true, truncation: true });
    const output = await model.session.run({
      input_ids: inputs.input_ids,
      attention_mask: inputs.attention_mask,
      pixel_values: dummy,
    });
    const data = output.text_embeds.data as Float32Array;
    const dim = output.text_embeds.dims[1] as number;
    for (let j = 0; j < batch.length; j++) {
      results.push(normalize(Array.from(data.slice(j * dim, (j + 1) * dim))));
    }
  }
  return results;
}

async function embedImageBuffer(imageBuffer: Buffer): Promise<number[]> {
  await ensurePipeline();
  const sharp = (await import('sharp')).default;
  const { RawImage, Tensor } = await import('@xenova/transformers');
  const proc = clipPipeline.processor;
  const tok = clipPipeline.tokenizer;
  const model = clipPipeline.model;

  const pixels = await sharp(imageBuffer)
    .rotate().removeAlpha()
    .resize(224, 224, { fit: 'cover', position: 'centre' })
    .raw().toBuffer();

  const image = new RawImage(new Uint8ClampedArray(pixels), 224, 224, 3);
  const imageInputs = await proc(image);
  const dummyText = tok('a', { padding: true, truncation: true });

  const output = await model.session.run({
    input_ids: dummyText.input_ids,
    attention_mask: dummyText.attention_mask,
    pixel_values: imageInputs.pixel_values,
  });

  return normalize(Array.from(output.image_embeds.data as Float32Array));
}

/** Build country and city embeddings from the world cities database. */
export async function buildHierarchicalIndex(): Promise<void> {
  if (embeddingsReady) return;

  const { WORLD_CITIES_RAW } = await import('../data/worldCities.js');

  const countrySet = new Map<string, CityEntry[]>();
  for (const c of WORLD_CITIES_RAW) {
    const existing = countrySet.get(c.country) ?? [];
    existing.push({
      city: c.city, country: c.country, lat: c.lat, lon: c.lon,
      prompts: [
        `A photograph of ${c.city}, ${c.country}`,
        `Street scene in ${c.city}, ${c.country}`,
        `Buildings and landmarks in ${c.city}`,
      ],
    });
    countrySet.set(c.country, existing);
  }

  console.log(`[CLIP-H] Building hierarchical index: ${countrySet.size} countries, ${WORLD_CITIES_RAW.length} cities`);

  const countryEntries: CountryEntry[] = [];
  for (const [country] of countrySet) {
    countryEntries.push({
      country,
      prompts: [
        `A photograph taken in ${country}`,
        `Typical scenery, landscape and buildings in ${country}`,
        `Urban architecture in ${country}`,
        `A place in ${country}`,
      ],
    });
  }

  const allCountryPrompts = countryEntries.flatMap(e => e.prompts);
  const countryEmbs = await embedTexts(allCountryPrompts);
  let idx = 0;
  for (const entry of countryEntries) {
    const vecs = countryEmbs.slice(idx, idx + entry.prompts.length);
    const avg = new Array<number>(FEATURE_VECTOR_SIZE).fill(0);
    for (const v of vecs) { for (let d = 0; d < FEATURE_VECTOR_SIZE; d++) avg[d] += v[d] / vecs.length; }
    entry.embedding = normalize(avg);
    idx += entry.prompts.length;
  }
  countryEmbeddings = countryEntries;

  const allCityPrompts = Array.from(countrySet.values()).flat().flatMap(c => c.prompts);
  const cityEmbs = await embedTexts(allCityPrompts);
  const allCities = Array.from(countrySet.values()).flat();
  idx = 0;
  for (const city of allCities) {
    const vecs = cityEmbs.slice(idx, idx + city.prompts.length);
    const avg = new Array<number>(FEATURE_VECTOR_SIZE).fill(0);
    for (const v of vecs) { for (let d = 0; d < FEATURE_VECTOR_SIZE; d++) avg[d] += v[d] / vecs.length; }
    city.embedding = normalize(avg);
    idx += city.prompts.length;
  }
  cityEmbeddings = allCities;
  embeddingsReady = true;
  console.log(`[CLIP-H] Hierarchical index ready`);
}

/**
 * Perform hierarchical geolocation:
 * 1. Find top countries by image-country similarity
 * 2. Search cities within those countries
 * 3. Return ranked city matches
 */
export async function hierarchicalGeolocate(imageBuffer: Buffer): Promise<VectorMatch[]> {
  if (!embeddingsReady) await buildHierarchicalIndex();

  const imageVec = await embedImageBuffer(imageBuffer);

  const countryScores = countryEmbeddings
    .filter(c => c.embedding)
    .map(c => ({ country: c.country, score: cosineSimilarity(imageVec, c.embedding!) }))
    .sort((a, b) => b.score - a.score);

  const topCountries = new Set(countryScores.slice(0, 12).map(c => c.country));
  const maxCountryScore = countryScores[0]?.score ?? 0;
  const countryScoreMap = new Map(countryScores.map(c => [c.country, c.score]));

  const candidateCities = cityEmbeddings
    .filter(c => topCountries.has(c.country) && c.embedding);

  const cityScores = candidateCities
    .map(c => {
      const rawSim = cosineSimilarity(imageVec, c.embedding!);
      const cScore = countryScoreMap.get(c.country) ?? 0;
      const boost = maxCountryScore > 0 ? 0.08 * (cScore / maxCountryScore) : 0;
      return { ...c, similarity: rawSim + boost };
    })
    .sort((a, b) => b.similarity - a.similarity);

  return cityScores.slice(0, 20).map((c, i) => ({
    id: `hcity_${i}`,
    label: `${c.city}, ${c.country}`,
    lat: c.lat,
    lon: c.lon,
    vector: c.embedding!,
    similarity: c.similarity,
  }));
}

export function isHierarchicalReady(): boolean { return embeddingsReady; }
