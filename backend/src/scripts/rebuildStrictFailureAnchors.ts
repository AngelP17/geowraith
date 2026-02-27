import 'dotenv/config';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import axios from 'axios';
import { HNSWIndex } from '../services/annIndex.js';
import { embedGeoLocations, extractCLIPEmbedding } from '../services/clipExtractor.js';
import type { ReferenceVectorRecord } from '../types.js';
import { cosineSimilarity } from '../utils/math.js';

interface LandmarkTarget {
  id: string;
  label: string;
  lat: number;
  lon: number;
  radiusMeters: number;
  limit: number;
  keep: number;
}

interface WikimediaImage {
  title: string;
  url: string;
  thumbUrl?: string;
}

interface ScoredCandidate {
  sourceUrl: string;
  vector: number[];
  score: number;
}

interface VectorCache {
  version?: string;
  timestamp?: string;
  note?: string;
  totalVectors?: number;
  uniqueLandmarks?: number;
  vectors?: ReferenceVectorRecord[];
}

const CACHE_ROOT = path.resolve(process.cwd(), '.cache');
const MERGED_VECTORS_PATH = path.resolve(CACHE_ROOT, 'geoclip', 'referenceImageVectors.merged_v1.json');
const HNSW_PATH = path.resolve(CACHE_ROOT, 'geoclip', 'hnsw_index.merged_v1.bin');
const STRICT_TMP_DIR = path.resolve(CACHE_ROOT, 'strict_failure_anchors');

const TARGETS: LandmarkTarget[] = [
  {
    id: 'marrakech',
    label: 'Marrakech Medina',
    lat: 31.6295,
    lon: -7.9811,
    radiusMeters: 2500,
    limit: 80,
    keep: 35,
  },
  {
    id: 'cape_point',
    label: 'Cape Point',
    lat: -34.3568,
    lon: 18.496,
    radiusMeters: 3000,
    limit: 80,
    keep: 45,
  },
  {
    id: 'copacabana',
    label: 'Copacabana Beach',
    lat: -22.9719,
    lon: -43.1823,
    radiusMeters: 3000,
    limit: 80,
    keep: 45,
  },
  {
    id: 'table_mountain',
    label: 'Table Mountain',
    lat: -33.9628,
    lon: 18.4098,
    radiusMeters: 3000,
    limit: 80,
    keep: 45,
  },
];

const REQUEST_TIMEOUT_MS = 20_000;
const USER_AGENT = 'GeoWraith/2.2 (strict anchor rebuild)';
const DIVERSITY_SIMILARITY_LIMIT = 0.995;
const DOWNLOAD_RETRY_DELAY_MS = 1_500;
const DOWNLOAD_ATTEMPTS = 3;
const MIN_REPLACEMENT_VECTORS = 10;

function uniqueLandmarkCount(vectors: ReferenceVectorRecord[]): number {
  return new Set(vectors.map((vector) => vector.label)).size;
}

async function fetchWikimediaGeosearch(target: LandmarkTarget): Promise<WikimediaImage[]> {
  const response = await axios.get('https://commons.wikimedia.org/w/api.php', {
    params: {
      action: 'query',
      generator: 'geosearch',
      ggsnamespace: 6,
      ggsradius: target.radiusMeters,
      ggslimit: Math.min(target.limit, 500),
      ggscoord: `${target.lat}|${target.lon}`,
      prop: 'imageinfo',
      iiprop: 'url|mime|size',
      iiurlwidth: 2048,
      format: 'json',
      origin: '*',
    },
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      'User-Agent': USER_AGENT,
    },
  });

  const pages = response.data?.query?.pages ?? {};
  const results: WikimediaImage[] = [];

  for (const page of Object.values<{
    title?: string;
    imageinfo?: Array<{ url?: string; thumburl?: string; mime?: string }>;
  }>(pages)) {
    const url = page.imageinfo?.[0]?.url;
    const thumbUrl = page.imageinfo?.[0]?.thumburl;
    const mime = page.imageinfo?.[0]?.mime ?? '';
    const title = page.title ?? '';

    if (!url || !title) {
      continue;
    }
    if (!mime.startsWith('image/')) {
      continue;
    }
    results.push({ title, url, thumbUrl });
  }

  results.sort((a, b) => {
    const titleCmp = a.title.localeCompare(b.title);
    if (titleCmp !== 0) return titleCmp;
    return a.url.localeCompare(b.url);
  });

  const deduped: WikimediaImage[] = [];
  const seen = new Set<string>();
  for (const item of results) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    deduped.push(item);
  }

  return deduped.slice(0, target.limit);
}

async function downloadImage(url: string): Promise<Buffer> {
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < DOWNLOAD_ATTEMPTS) {
    attempt += 1;
    try {
      const response = await axios.get<ArrayBuffer>(url, {
        responseType: 'arraybuffer',
        timeout: REQUEST_TIMEOUT_MS,
        headers: {
          'User-Agent': USER_AGENT,
        },
      });
      return Buffer.from(response.data);
    } catch (error) {
      lastError = error;
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status !== 429 && status !== 503) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, DOWNLOAD_RETRY_DELAY_MS * attempt));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('image download failed');
}

function selectDiverseTop(candidates: ScoredCandidate[], keep: number): ScoredCandidate[] {
  const selected: ScoredCandidate[] = [];

  for (const candidate of candidates) {
    const nearDuplicate = selected.some(
      (picked) => cosineSimilarity(candidate.vector, picked.vector) >= DIVERSITY_SIMILARITY_LIMIT
    );
    if (!nearDuplicate) {
      selected.push(candidate);
    }
    if (selected.length >= keep) {
      break;
    }
  }

  if (selected.length < keep) {
    for (const candidate of candidates) {
      if (selected.includes(candidate)) continue;
      selected.push(candidate);
      if (selected.length >= keep) break;
    }
  }

  return selected;
}

async function buildStrictVectorsForTarget(target: LandmarkTarget): Promise<ReferenceVectorRecord[]> {
  const [coordVector] = await embedGeoLocations([{ lat: target.lat, lon: target.lon }]);
  const wikimediaImages = await fetchWikimediaGeosearch(target);

  console.log(`[StrictRebuild] ${target.label}: fetched ${wikimediaImages.length} Wikimedia candidates`);

  const scored: ScoredCandidate[] = [];

  let success = 0;
  let failed = 0;
  for (const item of wikimediaImages) {
    try {
      const candidateUrl = item.thumbUrl ?? item.url;
      const imageBuffer = await downloadImage(candidateUrl);
      const vector = await extractCLIPEmbedding(imageBuffer);
      const score = cosineSimilarity(vector, coordVector);
      scored.push({
        sourceUrl: candidateUrl,
        vector,
        score,
      });
      success += 1;
    } catch (error) {
      failed += 1;
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      console.warn(`[StrictRebuild] ${target.label}: skipped (${status ?? 'error'}) ${item.url}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.sourceUrl.localeCompare(b.sourceUrl);
  });

  const selected = selectDiverseTop(scored, Math.min(target.keep, scored.length));
  const vectors: ReferenceVectorRecord[] = selected.map((candidate, index) => ({
    id: `strict_${target.id}_${String(index + 1).padStart(3, '0')}`,
    label: target.label,
    lat: target.lat,
    lon: target.lon,
    vector: candidate.vector,
  }));

  const best = selected[0]?.score ?? 0;
  const cutoff = selected[selected.length - 1]?.score ?? 0;
  console.log(
    `[StrictRebuild] ${target.label}: embedded=${success}, failed=${failed}, selected=${vectors.length}, best=${best.toFixed(4)}, cutoff=${cutoff.toFixed(4)}`
  );

  return vectors;
}

async function main(): Promise<void> {
  console.log('🎯 Rebuilding strict failure anchors from Wikimedia geosearch');

  await rm(STRICT_TMP_DIR, { recursive: true, force: true });
  await mkdir(STRICT_TMP_DIR, { recursive: true });

  const raw = await readFile(MERGED_VECTORS_PATH, 'utf8');
  const parsed = JSON.parse(raw) as VectorCache;
  const existing = Array.isArray(parsed.vectors) ? parsed.vectors : [];
  if (existing.length === 0) {
    throw new Error(`No vectors found in ${MERGED_VECTORS_PATH}`);
  }

  const targetLabels = new Set(TARGETS.map((target) => target.label));
  const base = existing.filter((vector) => !targetLabels.has(vector.label));

  console.log(`[StrictRebuild] Existing vectors: ${existing.length}`);
  console.log(`[StrictRebuild] Base vectors after removing targets: ${base.length}`);

  const replacement: ReferenceVectorRecord[] = [];
  for (const target of TARGETS) {
    const currentVectors = existing.filter((vector) => vector.label === target.label);
    const vectors = await buildStrictVectorsForTarget(target);

    if (vectors.length >= Math.min(MIN_REPLACEMENT_VECTORS, currentVectors.length)) {
      replacement.push(...vectors);
      console.log(
        `[StrictRebuild] ${target.label}: using strict replacement (${vectors.length} vectors)`
      );
    } else {
      replacement.push(...currentVectors);
      console.warn(
        `[StrictRebuild] ${target.label}: insufficient strict vectors (${vectors.length}), keeping existing ${currentVectors.length}`
      );
    }
  }

  if (replacement.length === 0) {
    throw new Error('No strict replacement vectors were generated');
  }

  const next = [...base, ...replacement];
  const payload: VectorCache = {
    ...parsed,
    timestamp: new Date().toISOString(),
    note: 'Strict Wikimedia geosearch anchors for remaining 95%-gate failures',
    totalVectors: next.length,
    uniqueLandmarks: uniqueLandmarkCount(next),
    vectors: next,
  };

  await writeFile(MERGED_VECTORS_PATH, JSON.stringify(payload, null, 2));
  console.log(`[StrictRebuild] Saved vectors: ${MERGED_VECTORS_PATH} (${next.length})`);

  const index = new HNSWIndex({ M: 16, efConstruction: 200, efSearch: 128 });
  await index.buildIndex(next);
  await index.saveIndex(HNSW_PATH);
  console.log(`[StrictRebuild] Rebuilt index: ${HNSW_PATH} (${index.size})`);
}

main().catch((error) => {
  console.error('[StrictRebuild] Failed:', error);
  process.exit(1);
});
