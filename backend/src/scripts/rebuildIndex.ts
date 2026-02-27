import { getReferenceVectors, warmupReferenceIndex } from '../services/geoclipIndex.js';
import { getHNSWIndex, invalidateHNSWIndex } from '../services/annIndex.js';
import { promises as fs } from 'fs';
import path from 'path';

async function rebuild() {
  console.log('🔄 Rebuilding GeoCLIP reference index with REAL embeddings...\n');
  
  // Clear any cached index
  invalidateHNSWIndex();
  
  const startTime = Date.now();
  
  // Build reference vectors with real GeoCLIP
  console.log('Step 1: Generating reference vectors...');
  const vectors = await getReferenceVectors();
  console.log(`  ✓ Generated ${vectors.length} reference vectors`);
  
  // Build HNSW index
  console.log('\nStep 2: Building HNSW index...');
  const index = await getHNSWIndex();
  console.log(`  ✓ HNSW index ready with ${index.size} vectors`);
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ Index rebuild complete in ${elapsed}s`);
  console.log('\nNext: Run benchmark to verify accuracy improvement');
}

rebuild().catch(err => {
  console.error('Rebuild failed:', err);
  process.exit(1);
});
