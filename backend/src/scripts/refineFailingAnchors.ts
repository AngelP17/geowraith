import 'dotenv/config';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { HNSWIndex } from '../services/annIndex.js';
import { embedGeoLocations, extractCLIPEmbedding } from '../services/clipExtractor.js';
import type { ReferenceVectorRecord } from '../types.js';
import { cosineSimilarity } from '../utils/math.js';

interface TargetLandmark {
  id: string;
  label: string;
  lat: number;
  lon: number;
  aliases: string[];
  keep: number;
}

interface ImageCandidate {
  imagePath: string;
  vector: number[];
  score: number;
}

interface CachedVectorsFile {
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

const IMAGE_SOURCE_DIRS = [
  path.join(CACHE_ROOT, 'mapillary_failing_landmarks'),
  path.join(CACHE_ROOT, 'boost_failing_landmarks'),
  path.join(CACHE_ROOT, 'ultra_densified_final'),
  path.join(CACHE_ROOT, 'ultra_densified'),
  path.join(CACHE_ROOT, 'densified_landmarks_v2'),
  path.join(CACHE_ROOT, 'densified_landmarks'),
  path.join(CACHE_ROOT, 'api_images_extra'),
  path.join(CACHE_ROOT, 'api_images'),
  path.join(CACHE_ROOT, 'smartblend_gallery', 'images'),
];

const TARGETS: TargetLandmark[] = [
  {
    id: 'marrakech',
    label: 'Marrakech Medina',
    lat: 31.6295,
    lon: -7.9811,
    aliases: ['marrakech'],
    keep: 45,
  },
  {
    id: 'cape_point',
    label: 'Cape Point',
    lat: -34.3568,
    lon: 18.496,
    aliases: ['cape_point', 'cape'],
    keep: 55,
  },
  {
    id: 'table_mountain',
    label: 'Table Mountain',
    lat: -33.9628,
    lon: 18.4098,
    aliases: ['table_mountain', 'table'],
    keep: 60,
  },
  {
    id: 'copacabana',
    label: 'Copacabana Beach',
    lat: -22.9719,
    lon: -43.1823,
    aliases: ['copacabana'],
    keep: 60,
  },
  {
    id: 'moai',
    label: 'Moai Statues',
    lat: -27.1258,
    lon: -109.2774,
    aliases: ['moai', 'moai_statues'],
    keep: 45,
  },
];

const DIVERSITY_SIMILARITY_LIMIT = 0.995;

function isImageFile(filename: string): boolean {
  return /\.(jpg|jpeg|png|webp)$/i.test(filename);
}

function pathMatchesAliases(filepath: string, aliases: string[]): boolean {
  const normalized = path.basename(filepath).toLowerCase();
  return aliases.some((alias) => normalized.includes(alias));
}

async function collectCandidatePaths(target: TargetLandmark): Promise<string[]> {
  const unique = new Set<string>();

  for (const dir of IMAGE_SOURCE_DIRS) {
    let files: string[];
    try {
      files = await fs.readdir(dir);
    } catch {
      continue;
    }

    const matching = files
      .filter((file) => isImageFile(file) && pathMatchesAliases(file, target.aliases))
      .map((file) => path.resolve(dir, file));

    for (const file of matching) {
      unique.add(file);
    }
  }

  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}

function pickDiverseTopCandidates(candidates: ImageCandidate[], targetCount: number): ImageCandidate[] {
  const selected: ImageCandidate[] = [];

  for (const candidate of candidates) {
    const isNearDuplicate = selected.some(
      (chosen) => cosineSimilarity(candidate.vector, chosen.vector) >= DIVERSITY_SIMILARITY_LIMIT
    );

    if (!isNearDuplicate) {
      selected.push(candidate);
    }

    if (selected.length >= targetCount) {
      break;
    }
  }

  if (selected.length < targetCount) {
    const fallback = candidates.filter((candidate) => !selected.includes(candidate));
    for (const candidate of fallback) {
      selected.push(candidate);
      if (selected.length >= targetCount) {
        break;
      }
    }
  }

  return selected;
}

async function embedCandidatesForTarget(target: TargetLandmark, paths: string[]): Promise<ImageCandidate[]> {
  const [coordVector] = await embedGeoLocations([{ lat: target.lat, lon: target.lon }]);
  const candidates: ImageCandidate[] = [];

  let processed = 0;
  let failed = 0;

  for (const imagePath of paths) {
    processed += 1;

    try {
      const buffer = await fs.readFile(imagePath);
      const vector = await extractCLIPEmbedding(buffer);
      const score = cosineSimilarity(vector, coordVector);

      candidates.push({
        imagePath,
        vector,
        score,
      });
    } catch (error) {
      failed += 1;
      console.warn(`[RefineAnchors] Failed embedding ${imagePath}:`, error);
    }
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.imagePath.localeCompare(b.imagePath);
  });

  console.log(
    `[RefineAnchors] ${target.label}: processed=${processed}, embedded=${candidates.length}, failed=${failed}`
  );

  return candidates;
}

function buildRefinedRecords(target: TargetLandmark, selected: ImageCandidate[]): ReferenceVectorRecord[] {
  return selected.map((candidate, index) => ({
    id: `refined_${target.id}_${String(index + 1).padStart(3, '0')}`,
    label: target.label,
    lat: target.lat,
    lon: target.lon,
    vector: candidate.vector,
  }));
}

function uniqueLandmarkCount(vectors: ReferenceVectorRecord[]): number {
  return new Set(vectors.map((vector) => vector.label)).size;
}

async function main(): Promise<void> {
  console.log('🎯 Refining failing landmark anchors with coordinate-consistency scoring');

  const raw = await fs.readFile(MERGED_VECTORS_PATH, 'utf8');
  const parsed = JSON.parse(raw) as CachedVectorsFile;
  const existingVectors = Array.isArray(parsed.vectors) ? parsed.vectors : [];
  if (existingVectors.length === 0) {
    throw new Error(`No vectors found in ${MERGED_VECTORS_PATH}`);
  }

  const targetLabels = new Set(TARGETS.map((target) => target.label));
  const baseVectors = existingVectors.filter((vector) => !targetLabels.has(vector.label));

  console.log(`[RefineAnchors] Existing vectors: ${existingVectors.length}`);
  console.log(`[RefineAnchors] Base vectors after removing target labels: ${baseVectors.length}`);

  const refinedVectors: ReferenceVectorRecord[] = [];
  for (const target of TARGETS) {
    console.log(`\n[RefineAnchors] Collecting candidates for ${target.label}...`);
    const candidatePaths = await collectCandidatePaths(target);
    console.log(`[RefineAnchors] ${target.label}: found ${candidatePaths.length} candidate images`);

    if (candidatePaths.length === 0) {
      console.warn(`[RefineAnchors] No candidate images found for ${target.label}; skipping`);
      continue;
    }

    const candidates = await embedCandidatesForTarget(target, candidatePaths);
    if (candidates.length === 0) {
      console.warn(`[RefineAnchors] No embeddings produced for ${target.label}; skipping`);
      continue;
    }

    const selected = pickDiverseTopCandidates(candidates, Math.min(target.keep, candidates.length));
    const records = buildRefinedRecords(target, selected);
    refinedVectors.push(...records);

    const best = selected[0]?.score ?? 0;
    const cutoff = selected[selected.length - 1]?.score ?? 0;
    console.log(
      `[RefineAnchors] ${target.label}: selected ${selected.length} vectors (best=${best.toFixed(4)}, cutoff=${cutoff.toFixed(4)})`
    );
  }

  const nextVectors = [...baseVectors, ...refinedVectors];
  console.log(`\n[RefineAnchors] Final vector count: ${nextVectors.length}`);
  console.log(`[RefineAnchors] Unique landmarks: ${uniqueLandmarkCount(nextVectors)}`);

  const nextPayload: CachedVectorsFile = {
    ...parsed,
    timestamp: new Date().toISOString(),
    note: 'Refined failing-landmark anchors with coordinate-consistency ranking',
    totalVectors: nextVectors.length,
    uniqueLandmarks: uniqueLandmarkCount(nextVectors),
    vectors: nextVectors,
  };

  await fs.writeFile(MERGED_VECTORS_PATH, JSON.stringify(nextPayload, null, 2));
  console.log(`[RefineAnchors] Saved refined vectors: ${MERGED_VECTORS_PATH}`);

  console.log('[RefineAnchors] Rebuilding merged HNSW index...');
  const index = new HNSWIndex({ M: 16, efConstruction: 200, efSearch: 128 });
  await index.buildIndex(nextVectors);
  await index.saveIndex(HNSW_PATH);
  console.log(`[RefineAnchors] HNSW rebuilt with ${index.size} vectors: ${HNSW_PATH}`);
}

main().catch((error) => {
  console.error('[RefineAnchors] Failed:', error);
  process.exit(1);
});
