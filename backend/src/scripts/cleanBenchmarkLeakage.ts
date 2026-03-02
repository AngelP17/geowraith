import { promises as fs } from 'node:fs';
import path from 'node:path';
import { HNSWIndex } from '../services/annIndex.js';
import type { ReferenceVectorRecord } from '../types.js';

const CACHE_ROOT = path.resolve(process.cwd(), '.cache');
const GEOCLIP_CACHE = path.resolve(CACHE_ROOT, 'geoclip');

const FILES_TO_CLEAN = [
  'referenceImageVectors.merged_v1.json',
  'referenceVectors.v3-unified-endgame.json',
];

interface CachedVectorsFile {
  version?: string;
  timestamp?: string;
  note?: string;
  totalVectors?: number;
  uniqueLandmarks?: number;
  vectors?: ReferenceVectorRecord[];
}

async function main(): Promise<void> {
  console.log('🧹 Cleaning benchmark leakage from corpus files');
  console.log('━'.repeat(60));

  for (const filename of FILES_TO_CLEAN) {
    const filepath = path.join(GEOCLIP_CACHE, filename);

    try {
      // Load existing file
      const raw = await fs.readFile(filepath, 'utf8');
      const parsed = JSON.parse(raw);

      // Handle both formats: flat array or object with vectors property
      let existingVectors: ReferenceVectorRecord[];
      let isObjectFormat = false;

      if (Array.isArray(parsed)) {
        existingVectors = parsed;
      } else if (parsed && Array.isArray(parsed.vectors)) {
        existingVectors = parsed.vectors;
        isObjectFormat = true;
      } else {
        console.log(`⚠️  ${filename}: Invalid format, skipping`);
        continue;
      }

      if (existingVectors.length === 0) {
        console.log(`⚠️  ${filename}: No vectors found, skipping`);
        continue;
      }

      // Count contamination
      const contaminatedCount = existingVectors.filter(v => v.id.startsWith('validation_')).length;
      const cleanVectors = existingVectors.filter(v => !v.id.startsWith('validation_'));

      console.log(`\n📄 ${filename}`);
      console.log(`   Total vectors: ${existingVectors.length}`);
      console.log(`   Contaminated: ${contaminatedCount} (${((contaminatedCount / existingVectors.length) * 100).toFixed(1)}%)`);
      console.log(`   Clean vectors: ${cleanVectors.length}`);

      if (contaminatedCount === 0) {
        console.log(`   ✓ Already clean, skipping`);
        continue;
      }

      // Save cleaned file in the same format
      let cleanedPayload: CachedVectorsFile | ReferenceVectorRecord[];

      if (isObjectFormat) {
        cleanedPayload = {
          ...(parsed as CachedVectorsFile),
          timestamp: new Date().toISOString(),
          note: `Cleaned ${contaminatedCount} validation_* anchors (benchmark leakage removed)`,
          totalVectors: cleanVectors.length,
          vectors: cleanVectors,
        };
      } else {
        cleanedPayload = cleanVectors;
      }

      await fs.writeFile(filepath, JSON.stringify(cleanedPayload, null, 2));
      console.log(`   ✓ Saved clean corpus (removed ${contaminatedCount} validation anchors)`);

      // Rebuild HNSW index if this is the merged file
      if (filename === 'referenceImageVectors.merged_v1.json') {
        const hnswPath = path.join(GEOCLIP_CACHE, 'hnsw_index.merged_v1.bin');
        console.log(`\n🔧 Rebuilding HNSW index...`);

        const index = new HNSWIndex({ M: 16, efConstruction: 200, efSearch: 128 });
        await index.buildIndex(cleanVectors);
        await index.saveIndex(hnswPath);

        console.log(`   ✓ HNSW rebuilt with ${index.size} clean vectors`);
      }

    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log(`⚠️  ${filename}: File not found, skipping`);
      } else {
        throw error;
      }
    }
  }

  console.log('\n━'.repeat(60));
  console.log('✨ Cleanup complete');
  console.log('\n📋 Next steps:');
  console.log('   1. Rebuild unified index: npx tsx src/scripts/buildUnifiedIndex.ts');
  console.log('   2. Re-run benchmark: npm run benchmark');
  console.log('   3. Document honest baseline accuracy');
  console.log('\n⚠️  Do NOT add validation images to the corpus again!');
  console.log('   Create a separate holdout set for future benchmarks.');
}

main().catch((error) => {
  console.error('❌ Cleanup failed:', error);
  process.exit(1);
});
