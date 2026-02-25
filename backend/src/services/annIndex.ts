import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import hnswlib from 'hnswlib-node';
import type { ReferenceVectorRecord, VectorMatch } from '../types.js';
import { FEATURE_VECTOR_SIZE } from '../data/referenceVectors.js';

/** HNSW index configuration parameters. */
interface HNSWConfig {
  /** Number of bi-directional links for each node (higher = better recall, more memory). */
  M: number;
  /** Size of dynamic candidate list during construction (higher = better quality, slower build). */
  efConstruction: number;
  /** Size of dynamic candidate list during search (higher = better recall, slower search). */
  efSearch: number;
}

/** Default HNSW parameters optimized for 50K 512-dim vectors.
 * Higher efSearch = better recall but slower search.
 */
const DEFAULT_CONFIG: HNSWConfig = {
  M: 16,
  efConstruction: 200,
  efSearch: 64,
};

/** Wrapper around hnswlib-node for ANN search with cosine similarity. */
export class HNSWIndex {
  private index: hnswlib.HierarchicalNSW | null = null;
  private vectors: ReferenceVectorRecord[] = [];
  private config: HNSWConfig;
  private isBuilt = false;

  constructor(config: Partial<HNSWConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Build HNSW index from reference vectors.
   * Uses 'ip' (inner product) space since vectors are normalized (ip = 1 - cosine_similarity).
   */
  async buildIndex(vectors: ReferenceVectorRecord[]): Promise<void> {
    if (vectors.length === 0) {
      throw new Error('Cannot build HNSW index: empty vector list');
    }

    this.vectors = vectors;

    // Create index with cosine space for proper cosine similarity
    const HierarchicalNSW = hnswlib.HierarchicalNSW || (hnswlib as unknown as { default: typeof hnswlib }).default?.HierarchicalNSW;
    if (!HierarchicalNSW) {
      throw new Error('HierarchicalNSW not found in hnswlib-node');
    }
    this.index = new HierarchicalNSW('cosine', FEATURE_VECTOR_SIZE);

    // Initialize index with HNSW parameters (M, efConstruction)
    this.index.initIndex({
      maxElements: vectors.length,
      m: this.config.M,
      efConstruction: this.config.efConstruction,
      randomSeed: 100,
    });

    // Add vectors to index (normalize for cosine similarity)
    for (let i = 0; i < vectors.length; i += 1) {
      const record = vectors[i];
      if (!record.vector || record.vector.length !== FEATURE_VECTOR_SIZE) {
        throw new Error(`Invalid vector for ${record.id}: expected ${FEATURE_VECTOR_SIZE} dims`);
      }
      // Normalize vector for cosine similarity
      const norm = Math.sqrt(record.vector.reduce((sum, v) => sum + v * v, 0));
      const normalizedVector = norm > 0 ? record.vector.map((v) => v / norm) : record.vector;
      this.index.addPoint(normalizedVector, i);
    }

    // Set ef parameter for search
    this.index.setEf(this.config.efSearch);
    this.isBuilt = true;
  }

  /**
   * Search for k nearest neighbors.
   * Returns vectors sorted by similarity (highest first).
   */
  search(query: number[], k: number): VectorMatch[] {
    if (!this.index || !this.isBuilt) {
      throw new Error('HNSW index not initialized. Call buildIndex() first.');
    }
    if (query.length !== FEATURE_VECTOR_SIZE) {
      throw new Error(`Query vector must have ${FEATURE_VECTOR_SIZE} dimensions, got ${query.length}`);
    }
    if (k <= 0) {
      throw new Error('k must be positive');
    }

    const searchK = Math.min(k, this.vectors.length);
    const norm = Math.sqrt(query.reduce((sum, v) => sum + v * v, 0));
    const normalizedQuery = norm > 0 ? query.map((v) => v / norm) : query;
    const result = this.index.searchKnn(normalizedQuery, searchK);

    // Convert cosine distances to similarities
    // Cosine distance = 1 - cosine_similarity
    // Therefore: cosine_similarity = 1 - cosine_distance
    const matches: VectorMatch[] = [];
    for (let i = 0; i < result.neighbors.length; i += 1) {
      const idx = result.neighbors[i];
      // Ensure valid index
      if (idx < 0 || idx >= this.vectors.length) {
        continue;
      }
      const cosineDistance = result.distances[i];
      const cosineSim = 1 - cosineDistance;

      const record = this.vectors[idx];
      if (!record) {
        throw new Error(`Index returned invalid neighbor index: ${idx}`);
      }

      matches.push({
        id: record.id,
        label: record.label,
        lat: record.lat,
        lon: record.lon,
        vector: record.vector,
        similarity: Math.max(-1, Math.min(1, cosineSim)), // Clamp to [-1, 1]
      });
    }

    // Sort by similarity descending (highest first)
    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  /** Save index to disk. */
  async saveIndex(path: string): Promise<void> {
    if (!this.index || !this.isBuilt) {
      throw new Error('Cannot save: index not built');
    }
    await mkdir(path.split('/').slice(0, -1).join('/'), { recursive: true });
    this.index.writeIndexSync(path);
  }

  /** Load index from disk. Returns true if successful. */
  async loadIndex(path: string, expectedVectorCount: number, vectors?: ReferenceVectorRecord[]): Promise<boolean> {
    try {
      if (!existsSync(path)) {
        return false;
      }

      const HierarchicalNSW = hnswlib.HierarchicalNSW || (hnswlib as unknown as { default: typeof hnswlib }).default?.HierarchicalNSW;
      if (!HierarchicalNSW) {
        throw new Error('HierarchicalNSW not found in hnswlib-node');
      }
      this.index = new HierarchicalNSW('cosine', FEATURE_VECTOR_SIZE);
      this.index.readIndexSync(path);

      // Verify the index has expected dimensions and size
      const currentCount = this.index.getCurrentCount();
      if (currentCount !== expectedVectorCount) {
        return false;
      }

      // Store reference vectors for metadata lookup during search
      if (vectors && vectors.length === expectedVectorCount) {
        this.vectors = vectors;
      }

      this.index.setEf(this.config.efSearch);
      this.isBuilt = true;
      return true;
    } catch {
      this.index = null;
      this.isBuilt = false;
      return false;
    }
  }

  /** Get the number of vectors in the index. */
  get size(): number {
    return this.index?.getCurrentCount() ?? 0;
  }

  /** Check if index is built and ready. */
  get ready(): boolean {
    return this.isBuilt && this.index !== null;
  }

  /** Set efSearch parameter for search quality/speed tradeoff. */
  setEfSearch(ef: number): void {
    if (this.index) {
      this.index.setEf(ef);
    }
    this.config.efSearch = ef;
  }
}

/** Global HNSW index instance. */
let hnswIndexInstance: HNSWIndex | null = null;
let hnswIndexPromise: Promise<HNSWIndex> | null = null;

/** Get or create the global HNSW index instance. */
export async function getHNSWIndex(): Promise<HNSWIndex> {
  if (hnswIndexInstance?.ready) {
    return hnswIndexInstance;
  }

  if (!hnswIndexPromise) {
    hnswIndexPromise = (async () => {
      const { getReferenceVectors } = await import('./geoclipIndex.js');
      const vectors = await getReferenceVectors();

      const index = new HNSWIndex();
      await index.buildIndex(vectors);

      hnswIndexInstance = index;
      return index;
    })();
  }

  return hnswIndexPromise;
}

/** Invalidate the cached HNSW index (for testing). */
export function invalidateHNSWIndex(): void {
  hnswIndexInstance = null;
  hnswIndexPromise = null;
}
