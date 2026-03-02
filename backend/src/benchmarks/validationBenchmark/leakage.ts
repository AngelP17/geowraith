import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ReferenceVectorRecord } from '../../types.js';
import type { BenchmarkConfig } from './config.js';

const GEOCLIP_CACHE = path.resolve(process.cwd(), '.cache/geoclip');
const CORPUS_FILES = [
  'referenceImageVectors.merged_v1.json',
  'referenceVectors.v3-unified-endgame.json',
];

interface StoredVectorsPayload {
  vectors?: ReferenceVectorRecord[];
}

function parseStoredVectors(raw: string): ReferenceVectorRecord[] {
  const parsed = JSON.parse(raw) as ReferenceVectorRecord[] | StoredVectorsPayload;
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (parsed && Array.isArray(parsed.vectors)) {
    return parsed.vectors;
  }
  return [];
}

export async function assertNoBenchmarkLeakage(config: BenchmarkConfig): Promise<void> {
  if (process.env.GEOWRAITH_ALLOW_BENCHMARK_LEAKAGE === 'true') {
    return;
  }

  const contaminated: Array<{ file: string; ids: string[] }> = [];
  for (const filename of CORPUS_FILES) {
    const fullPath = path.join(GEOCLIP_CACHE, filename);
    try {
      const raw = await readFile(fullPath, 'utf8');
      const vectors = parseStoredVectors(raw);
      const leakedIds = vectors
        .map((vector) => vector.id)
        .filter((id) => config.leakagePrefixes.some((prefix) => id.startsWith(prefix)));
      if (leakedIds.length > 0) {
        contaminated.push({
          file: fullPath,
          ids: leakedIds.slice(0, 8),
        });
      }
    } catch {
      continue;
    }
  }

  if (contaminated.length === 0) {
    return;
  }

  const details = contaminated
    .map((entry) => `${entry.file}: ${entry.ids.join(', ')}`)
    .join('; ');
  throw new Error(
    `Benchmark leakage detected for ${config.name}. Remove benchmark-derived anchors before ` +
      `running this benchmark. ${details}`,
  );
}
