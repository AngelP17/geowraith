import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { FEATURE_VECTOR_SIZE } from '../data/referenceVectors.js';
import type { ReferenceVectorRecord } from '../types.js';
import { embedGeoLocations } from './clipExtractor.js';

interface CoordinateRecord {
  id: string;
  label: string;
  lat: number;
  lon: number;
}

const CHUNK_SIZE = 256;
const CACHE_VERSION = 'v1-geoclip-50000-model-v2';
const COORDINATES_FILE = path.resolve(process.cwd(), 'src/data/geoclipCoordinates.json');
const CACHE_FILE = path.resolve(process.cwd(), '.cache/geoclip/referenceVectors.50000.json');

let indexPromise: Promise<ReferenceVectorRecord[]> | null = null;
let indexSource: 'model' | 'cache' | 'fallback' | 'unknown' = 'unknown';

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeCoordinate(input: unknown): CoordinateRecord {
  if (!input || typeof input !== 'object') {
    throw new Error('invalid coordinate record: expected object');
  }

  const obj = input as Partial<CoordinateRecord>;
  if (typeof obj.id !== 'string' || !obj.id) {
    throw new Error('invalid coordinate record: missing id');
  }
  if (typeof obj.label !== 'string' || !obj.label) {
    throw new Error(`invalid coordinate record ${obj.id}: missing label`);
  }
  if (!isFiniteCoordinate(obj.lat) || !isFiniteCoordinate(obj.lon)) {
    throw new Error(`invalid coordinate record ${obj.id}: invalid lat/lon`);
  }

  return {
    id: obj.id,
    label: obj.label,
    lat: obj.lat,
    lon: obj.lon,
  };
}

function normalizeReference(input: unknown): ReferenceVectorRecord {
  if (!input || typeof input !== 'object') {
    throw new Error('invalid reference vector record: expected object');
  }

  const obj = input as Partial<ReferenceVectorRecord>;
  if (typeof obj.id !== 'string' || typeof obj.label !== 'string') {
    throw new Error('invalid reference vector record: missing metadata');
  }
  if (!isFiniteCoordinate(obj.lat) || !isFiniteCoordinate(obj.lon)) {
    throw new Error(`invalid reference vector ${obj.id}: invalid coordinates`);
  }
  if (!Array.isArray(obj.vector) || obj.vector.length !== FEATURE_VECTOR_SIZE) {
    throw new Error(`invalid reference vector ${obj.id}: invalid embedding length`);
  }

  return {
    id: obj.id,
    label: obj.label,
    lat: obj.lat,
    lon: obj.lon,
    vector: obj.vector.map((value) => (Number.isFinite(value) ? Number(value) : 0)),
  };
}

async function loadCoordinates(): Promise<CoordinateRecord[]> {
  const raw = await readFile(COORDINATES_FILE, 'utf8');
  const parsed = JSON.parse(raw) as unknown[];
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('geoclip coordinate catalog is empty');
  }
  return parsed.map((record) => normalizeCoordinate(record));
}

async function loadIndexFromCache(): Promise<ReferenceVectorRecord[] | null> {
  try {
    const raw = await readFile(CACHE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as {
      version?: string;
      vectors?: unknown[];
    };

    if (parsed.version !== CACHE_VERSION || !Array.isArray(parsed.vectors)) {
      return null;
    }

    return parsed.vectors.map((record) => normalizeReference(record));
  } catch {
    return null;
  }
}

async function saveIndexToCache(vectors: ReferenceVectorRecord[]): Promise<void> {
  if (vectors.length > 20_000) {
    // Very large indexes can exceed JS string limits when serialized as JSON.
    return;
  }
  await mkdir(path.dirname(CACHE_FILE), { recursive: true });
  await writeFile(
    CACHE_FILE,
    JSON.stringify({
      version: CACHE_VERSION,
      vectors,
    })
  );
}

async function buildReferenceIndex(): Promise<ReferenceVectorRecord[]> {
  const coordinates = await loadCoordinates();
  const vectors: ReferenceVectorRecord[] = [];

  for (let i = 0; i < coordinates.length; i += CHUNK_SIZE) {
    const chunk = coordinates.slice(i, i + CHUNK_SIZE);
    const embeddings = await embedGeoLocations(chunk);
    for (let j = 0; j < chunk.length; j += 1) {
      const item = chunk[j];
      const embedding = embeddings[j];
      if (!embedding || embedding.length !== FEATURE_VECTOR_SIZE) {
        throw new Error(`missing GeoCLIP embedding for ${item.id}`);
      }
      vectors.push({
        id: item.id,
        label: item.label,
        lat: item.lat,
        lon: item.lon,
        vector: embedding,
      });
    }
  }

  try {
    await saveIndexToCache(vectors);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[GeoCLIP] Unable to persist reference cache, continuing with in-memory index:', error);
  }
  return vectors;
}

function fallbackVector(lat: number, lon: number): number[] {
  const seed = [
    lat / 90,
    lon / 180,
    Math.sin((lat * Math.PI) / 180),
    Math.cos((lon * Math.PI) / 180),
    Math.sin(((lat + lon) * Math.PI) / 180),
    Math.cos(((lat - lon) * Math.PI) / 180),
  ];

  const vector = new Array<number>(FEATURE_VECTOR_SIZE);
  for (let i = 0; i < FEATURE_VECTOR_SIZE; i += 1) {
    vector[i] = seed[i % seed.length] + ((i % 23) - 11) * 0.0003;
  }
  return vector;
}

async function buildFallbackIndex(): Promise<ReferenceVectorRecord[]> {
  const coordinates = await loadCoordinates();
  return coordinates.map((item) => ({
    id: item.id,
    label: item.label,
    lat: item.lat,
    lon: item.lon,
    vector: fallbackVector(item.lat, item.lon),
  }));
}

/** Load GeoCLIP reference vectors from cache or build them from coordinate catalog. */
export async function getReferenceVectors(): Promise<ReferenceVectorRecord[]> {
  if (!indexPromise) {
    indexPromise = (async () => {
      const cached = await loadIndexFromCache();
      if (cached && cached.length > 0) {
        indexSource = 'cache';
        return cached;
      }
      try {
        const vectors = await buildReferenceIndex();
        indexSource = 'model';
        return vectors;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('[GeoCLIP] Failed to build model-backed reference index, using fallback:', error);
        indexSource = 'fallback';
        return buildFallbackIndex();
      }
    })();
  }
  return indexPromise;
}

/** Warm reference index during service startup to avoid first-request latency. */
export async function warmupReferenceIndex(): Promise<void> {
  const vectors = await getReferenceVectors();
  // eslint-disable-next-line no-console
  console.log(`[GeoCLIP] Reference index ready with ${vectors.length} vectors`);
}

/** Current source used for the in-memory reference index. */
export function getReferenceIndexSource(): 'model' | 'cache' | 'fallback' | 'unknown' {
  return indexSource;
}
