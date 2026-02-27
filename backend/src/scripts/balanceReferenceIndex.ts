import 'dotenv/config';
import { promises as fs } from 'fs';
import path from 'path';
import { HNSWIndex } from '../services/annIndex.js';

// ============== CONFIG ==============
const CACHE_ROOT = path.resolve(process.cwd(), '.cache');
const INPUT_PATH = path.resolve(CACHE_ROOT, 'geoclip', 'referenceImageVectors.merged_v1.json');
const OUTPUT_PATH = path.resolve(CACHE_ROOT, 'geoclip', 'referenceImageVectors.merged_v1.json');
const INDEX_PATH = path.resolve(CACHE_ROOT, 'geoclip', 'hnsw_index.merged_v1.bin');

// Balance configuration
const MAX_IMAGES_PER_LANDMARK = 30; // Limit each landmark to avoid class imbalance

async function main() {
  console.log('🎯 BALANCING REFERENCE INDEX FOR FAIR LANDMARK REPRESENTATION\n');
  console.log('=' .repeat(60));

  // Step 1: Load existing merged vectors
  console.log('\n📥 Loading existing merged vectors...');
  const raw = await fs.readFile(INPUT_PATH, 'utf8');
  const data = JSON.parse(raw);
  const allVectors = data.vectors || [];
  console.log(`  Loaded ${allVectors.length} vectors`);

  // Step 2: Group by landmark
  console.log('\n📊 Analyzing landmark distribution...');
  const landmarkGroups = new Map<string, any[]>();

  for (const vector of allVectors) {
    const landmark = vector.label;
    if (!landmarkGroups.has(landmark)) {
      landmarkGroups.set(landmark, []);
    }
    landmarkGroups.get(landmark)!.push(vector);
  }

  console.log(`  Found ${landmarkGroups.size} unique landmarks`);
  console.log('\n  Top 10 landmarks (before balancing):');
  const sortedLandmarks = Array.from(landmarkGroups.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);

  for (const [landmark, vectors] of sortedLandmarks) {
    console.log(`    ${landmark}: ${vectors.length} images`);
  }

  // Step 3: Balance by sampling max N images per landmark
  console.log(`\n⚖️  Balancing to max ${MAX_IMAGES_PER_LANDMARK} images per landmark...`);
  const balancedVectors: any[] = [];
  let totalReduced = 0;

  for (const [landmark, vectors] of landmarkGroups.entries()) {
    if (vectors.length <= MAX_IMAGES_PER_LANDMARK) {
      // Keep all if under limit
      balancedVectors.push(...vectors);
    } else {
      // Randomly sample N images
      const sampled = vectors
        .sort(() => Math.random() - 0.5) // Shuffle
        .slice(0, MAX_IMAGES_PER_LANDMARK);
      balancedVectors.push(...sampled);
      totalReduced += (vectors.length - MAX_IMAGES_PER_LANDMARK);
      console.log(`    ${landmark}: ${vectors.length} → ${MAX_IMAGES_PER_LANDMARK} (-${vectors.length - MAX_IMAGES_PER_LANDMARK})`);
    }
  }

  console.log(`\n  Removed ${totalReduced} vectors to balance dataset`);
  console.log(`  Final vector count: ${balancedVectors.length}`);

  // Step 4: Save balanced vectors
  console.log('\n💾 Saving balanced vectors...');
  const outputData = {
    version: 'merged_v1',
    timestamp: new Date().toISOString(),
    note: 'Balanced SmartBlend + densified landmarks (max 30 per landmark)',
    totalVectors: balancedVectors.length,
    maxImagesPerLandmark: MAX_IMAGES_PER_LANDMARK,
    vectors: balancedVectors,
  };

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(outputData, null, 2));
  console.log(`  ✓ Saved to: ${OUTPUT_PATH}`);

  // Step 5: Rebuild HNSW index
  console.log('\n🏗️  Rebuilding HNSW ANN index...');
  const index = new HNSWIndex({ M: 16, efConstruction: 200, efSearch: 128 });
  await index.buildIndex(balancedVectors);
  await index.saveIndex(INDEX_PATH);
  console.log(`  ✓ Index built with ${index.size} vectors`);
  console.log(`  ✓ Saved to: ${INDEX_PATH}`);

  // Step 6: Final statistics
  console.log('\n' + '='.repeat(60));
  console.log('✅ SUCCESS! INDEX BALANCED');
  console.log('='.repeat(60));
  console.log(`\n📊 Final Statistics:`);
  console.log(`  Before: ${allVectors.length} vectors (imbalanced)`);
  console.log(`  After: ${balancedVectors.length} vectors (balanced)`);
  console.log(`  Landmarks: ${landmarkGroups.size}`);
  console.log(`  Max per landmark: ${MAX_IMAGES_PER_LANDMARK}`);
  console.log(`  Average per landmark: ${Math.round(balancedVectors.length / landmarkGroups.size)}`);

  console.log('\n🎯 Next Step:');
  console.log('  Run benchmark:');
  console.log('    cd backend && GEOWRAITH_ULTRA_ACCURACY=true npm run benchmark:validation');
  console.log('');
}

main().catch((error) => {
  console.error('\n❌ ERROR:', error);
  process.exit(1);
});
