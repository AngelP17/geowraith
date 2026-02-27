import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { FEATURE_VECTOR_SIZE } from '../data/referenceVectors.js';
import type { ReferenceVectorRecord } from '../types.js';
import { embedGeoLocations } from './clipExtractor.js';
import { HNSWIndex } from './annIndex.js';
import { getReferenceImageVectors } from './referenceImageIndex.js';
import { COORDINATE_CONFIG } from '../config.js';
import { buildCityReferenceVectors } from './clipGeolocator.js';

interface CoordinateRecord {
  id: string;
  label: string;
  lat: number;
  lon: number;
}

const CHUNK_SIZE = COORDINATE_CONFIG.chunkSize;
const TARGET_COORDINATES = COORDINATE_CONFIG.targetCount;
const CACHE_VERSION = `v2-geoclip-${TARGET_COORDINATES}-model-v2`;
const COORDINATES_FILE = path.resolve(process.cwd(), 'src/data/geoclipCoordinates.json');
const CACHE_FILE = path.resolve(process.cwd(), `.cache/geoclip/referenceVectors.${TARGET_COORDINATES}.json`);
const HNSW_INDEX_FILE = path.resolve(process.cwd(), `.cache/geoclip/hnsw_index.${CACHE_VERSION}.bin`);

/** HNSW index configuration. */
const HNSW_CONFIG = {
  M: 16,
  efConstruction: 200,
  efSearch: 64,
};

let indexPromise: Promise<ReferenceVectorRecord[]> | null = null;
let indexSource: 'model' | 'cache' | 'clip' | 'fallback' | 'unknown' = 'unknown';
let referenceImageAnchorCount = 0;

/** Global HNSW index instance. */
let hnswIndex: HNSWIndex | null = null;
let hnswIndexPromise: Promise<HNSWIndex> | null = null;

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

// Build coordinate embeddings using GeoCLIP location model
async function buildReferenceIndex(): Promise<ReferenceVectorRecord[]> {
  console.log('[GeoCLIP] Building coordinate embeddings from location model...');
  
  try {
    const coordinates = await loadCoordinates();
    console.log(`[GeoCLIP] Loaded ${coordinates.length} coordinates, embedding...`);
    
    const coordsToEmbed = coordinates.map(c => ({ lat: c.lat, lon: c.lon }));
    const embeddings = await embedGeoLocations(coordsToEmbed);
    
    const vectors: ReferenceVectorRecord[] = coordinates.map((coord, i) => ({
      id: coord.id || `coord_${i}`,
      label: coord.label || `${coord.lat.toFixed(2)}, ${coord.lon.toFixed(2)}`,
      lat: coord.lat,
      lon: coord.lon,
      vector: embeddings[i],
    }));
    
    console.log(`[GeoCLIP] Built ${vectors.length} coordinate embeddings`);
    return vectors;
  } catch (error) {
    console.error('[GeoCLIP] Failed to build coordinate embeddings:', error);
    return [];
  }
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
      let baseVectors: ReferenceVectorRecord[];
      const cached = await loadIndexFromCache();
      if (cached && cached.length > 0) {
        indexSource = 'cache';
        baseVectors = cached;
      } else {
        try {
          baseVectors = await buildReferenceIndex();
          indexSource = 'model';
        } catch (geoclipError) {
          console.warn('[GeoCLIP] GeoCLIP models unavailable, trying CLIP text-based index:', geoclipError);
          try {
            baseVectors = await buildCityReferenceVectors();
            indexSource = 'clip';
            console.log(`[CLIP] Built CLIP text-based reference index with ${baseVectors.length} city vectors`);
          } catch (clipError) {
            console.warn('[CLIP] CLIP index also failed, using deterministic fallback:', clipError);
            indexSource = 'fallback';
            baseVectors = await buildFallbackIndex();
          }
        }
      }

      // COMBINED MODE: Use both coordinate embeddings AND image anchors for best accuracy
      try {
        const imageAnchors = await getReferenceImageVectors();
        referenceImageAnchorCount = imageAnchors.length;
        if (imageAnchors.length > 0) {
          // eslint-disable-next-line no-console
          console.log(`[GeoCLIP] COMBINED MODE: ${baseVectors.length} coordinate vectors + ${imageAnchors.length} image anchors`);
          // Combine coordinate embeddings with image anchors for best accuracy
          return [...baseVectors, ...imageAnchors];
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('[GeoCLIP] Failed to load image anchors:', error);
      }
      referenceImageAnchorCount = 0;
      // Fallback only if no image anchors available
      return baseVectors;
    })();
  }
  return indexPromise;
}

/** Warm reference index during service startup to avoid first-request latency. */
export async function warmupReferenceIndex(): Promise<void> {
  const vectors = await getReferenceVectors();
  // eslint-disable-next-line no-console
  console.log(`[GeoCLIP] Reference index ready with ${vectors.length} vectors (${referenceImageAnchorCount} image anchors)`);
}

/** Current source used for the in-memory reference index. */
export function getReferenceIndexSource(): 'model' | 'cache' | 'clip' | 'fallback' | 'unknown' {
  return indexSource;
}
/** Number of image-anchor vectors appended to the base coordinate index. */
export function getReferenceImageAnchorCount(): number {
  return referenceImageAnchorCount;
}

/**
 * Get or build the HNSW ANN index.
 * Loads from disk cache if available, otherwise builds from reference vectors.
 */
export async function getHNSWIndex(): Promise<HNSWIndex> {
  if (hnswIndex?.ready) {
    return hnswIndex;
  }

  if (!hnswIndexPromise) {
    hnswIndexPromise = (async () => {
      // Load reference vectors first to verify index size
      const vectors = await getReferenceVectors();

      // Try to load existing HNSW index from disk
      const cachedIndex = new HNSWIndex(HNSW_CONFIG);
      const loaded = await cachedIndex.loadIndex(HNSW_INDEX_FILE, vectors.length, vectors);
      if (loaded) {
        // eslint-disable-next-line no-console
        console.log(`[HNSW] Loaded cached index with ${cachedIndex.size} vectors`);
        hnswIndex = cachedIndex;
        return cachedIndex;
      }

      // Build new index from reference vectors
      const newIndex = new HNSWIndex(HNSW_CONFIG);
      await newIndex.buildIndex(vectors);

      // Save to cache for future runs
      try {
        await mkdir(path.dirname(HNSW_INDEX_FILE), { recursive: true });
        await newIndex.saveIndex(HNSW_INDEX_FILE);
        // eslint-disable-next-line no-console
        console.log(`[HNSW] Built and cached index with ${vectors.length} vectors`);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('[HNSW] Failed to save index cache:', error);
      }

      hnswIndex = newIndex;
      return newIndex;
    })();
  }

  return hnswIndexPromise;
}

/** Invalidate HNSW index cache (useful for testing). */
export function invalidateHNSWIndex(): void {
  hnswIndex = null;
  hnswIndexPromise = null;
}
