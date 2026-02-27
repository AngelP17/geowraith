import 'dotenv/config';
import { promises as fs } from 'fs';
import path from 'path';
import { HNSWIndex } from '../services/annIndex.js';
import type { ReferenceVectorRecord } from '../types.js';

// ============== CONFIG ==============
const LANDMARK_GEO_FILE = path.resolve(process.cwd(), '..', '.cache', 'landmark_geo', 'id_payload_vector.json');
const OUTPUT_PATH = path.resolve(process.cwd(), '.cache', 'geoclip', 'referenceImageVectors.merged_v1.json');
const INDEX_PATH = path.resolve(process.cwd(), '.cache', 'geoclip', 'hnsw_index.merged_v1.bin');

// Sample to match original "562 image anchors" mentioned in commit
// const MAX_VECTORS = 562;  // Original count
const MAX_VECTORS = 3266;  // Use all available (test both)

interface LandmarkGeoEntry {
  id: string;
  payload: {
    filename: string;
    location: { lat: number; lon: number };
    picture: string;
    url: string;
  };
  vector: number[];
}

async function main() {
  console.log('🔄 RESTORING ORIGINAL 84.5% LANDMARK INDEX\n');
  console.log('=' .repeat(60));

  // Step 1: Load landmark_geo data
  console.log('\n📥 Loading landmark_geo data...');
  const raw = await fs.readFile(LANDMARK_GEO_FILE, 'utf8');
  const landmarkGeoData: LandmarkGeoEntry[] = JSON.parse(raw);
  console.log(`  Found ${landmarkGeoData.length} landmark geo entries`);

  // Step 2: Convert to ReferenceVectorRecord format
  console.log('\n🔄 Converting to reference vector format...');
  const vectors: ReferenceVectorRecord[] = [];

  for (let i = 0; i < Math.min(landmarkGeoData.length, MAX_VECTORS); i++) {
    const entry = landmarkGeoData[i];

    // Validate entry
    if (!entry.vector || entry.vector.length !== 512) {
      console.warn(`  Skipping entry ${i}: invalid vector`);
      continue;
    }

    if (!entry.payload?.location || typeof entry.payload.location.lat !== 'number') {
      console.warn(`  Skipping entry ${i}: missing location`);
      continue;
    }

    // Extract landmark name from filename or picture ID
    const pictureName = entry.payload.picture || entry.payload.filename || `landmark_${i}`;
    const label = pictureName.replace(/_/g, ' ').replace(/\.[^.]+$/, '');

    vectors.push({
      id: entry.payload.picture || entry.id,
      label: label,
      lat: entry.payload.location.lat,
      lon: entry.payload.location.lon,
      vector: entry.vector,
    });

    if ((i + 1) % 500 === 0) {
      console.log(`  Processed: ${i + 1}/${Math.min(landmarkGeoData.length, MAX_VECTORS)}`);
    }
  }

  console.log(`\n✅ Converted ${vectors.length} vectors`);

  // Step 3: Save to merged_v1 format
  console.log('\n💾 Saving merged vectors...');
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(
    OUTPUT_PATH,
    JSON.stringify({
      version: 'merged_v1',
      timestamp: new Date().toISOString(),
      note: 'Restored from original landmark_geo data (84.5% baseline)',
      totalVectors: vectors.length,
      source: 'landmark_geo/id_payload_vector.json',
      vectors,
    }, null, 2)
  );
  console.log(`  ✓ Saved to: ${OUTPUT_PATH}`);

  // Step 4: Rebuild HNSW index
  console.log('\n🏗️  Rebuilding HNSW ANN index...');
  const index = new HNSWIndex({ M: 16, efConstruction: 200, efSearch: 128 });
  await index.buildIndex(vectors);
  await index.saveIndex(INDEX_PATH);
  console.log(`  ✓ Index built with ${index.size} vectors`);
  console.log(`  ✓ Saved to: ${INDEX_PATH}`);

  // Step 5: Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ SUCCESS! RESTORED ORIGINAL INDEX');
  console.log('='.repeat(60));
  console.log(`\n📊 Statistics:`);
  console.log(`  Total vectors: ${vectors.length}`);
  console.log(`  Source: landmark_geo (Wikimedia Commons)`);
  console.log(`  Expected accuracy: ~84.5% (baseline)`);

  console.log('\n🎯 Next Step:');
  console.log('  Run benchmark:');
  console.log('    cd backend && GEOWRAITH_ULTRA_ACCURACY=true npm run benchmark:validation');
  console.log('');
}

main().catch((error) => {
  console.error('\n❌ ERROR:', error);
  process.exit(1);
});
