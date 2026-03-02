/**
 * Build enriched HNSW index with synthetic landmarks
 * 
 * Loads base reference vectors, appends synthetic landmarks,
 * and builds a new HNSW index for improved accuracy.
 */

import * as fs from 'fs';
import * as path from 'path';
import hnswlib from 'hnswlib-node';
import { FEATURE_VECTOR_SIZE } from '../data/referenceVectors.js';

const CACHE_DIR = path.resolve(process.cwd(), '.cache/geoclip');
const LANDMARK_DB_DIR = path.resolve(process.cwd(), '.cache/landmark_db');

// Base reference vectors (from existing index)
const BASE_VECTORS_FILE = path.join(CACHE_DIR, 'referenceVectors.300000.json');

// Synthetic landmarks
const SYNTHETIC_EMBEDDINGS_FILE = path.join(LANDMARK_DB_DIR, 'synthetic_embeddings.json');
const SYNTHETIC_METADATA_FILE = path.join(LANDMARK_DB_DIR, 'synthetic_landmarks.json');

// Output files
const OUTPUT_VERSION = 'v2-synthetic-enriched';
const OUTPUT_INDEX_FILE = path.join(CACHE_DIR, `hnsw_index.${OUTPUT_VERSION}.bin`);
const OUTPUT_VECTORS_FILE = path.join(CACHE_DIR, `referenceVectors.${OUTPUT_VERSION}.json`);

interface ReferenceVector {
  id: string;
  embedding: number[];
  lat: number;
  lon: number;
  source?: string;
}

interface HNSWMetadata {
  version: string;
  timestamp: string;
  totalPoints: number;
  basePoints: number;
  syntheticPoints: number;
  coordinateBounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  syntheticCategories: Record<string, number>;
}

async function buildEnrichedIndex(): Promise<void> {
  console.log('============================================================');
  console.log('Building Enriched HNSW Index with Synthetic Landmarks');
  console.log('============================================================\n');
  
  // Check prerequisites
  if (!fs.existsSync(BASE_VECTORS_FILE)) {
    console.error(`❌ Base vectors not found: ${BASE_VECTORS_FILE}`);
    console.log('   Run corpus download first: npm run download:corpus');
    process.exit(1);
  }
  
  if (!fs.existsSync(SYNTHETIC_EMBEDDINGS_FILE)) {
    console.error(`❌ Synthetic embeddings not found: ${SYNTHETIC_EMBEDDINGS_FILE}`);
    console.log('   Run: npm run build:synthetic');
    process.exit(1);
  }
  
  // Load base vectors
  console.log('[Build] Loading base reference vectors...');
  const baseVectors: ReferenceVector[] = JSON.parse(fs.readFileSync(BASE_VECTORS_FILE, 'utf-8'));
  console.log(`  Loaded ${baseVectors.length} base vectors`);
  
  // Load synthetic landmarks
  console.log('\n[Build] Loading synthetic landmarks...');
  const syntheticMetadata = JSON.parse(fs.readFileSync(SYNTHETIC_METADATA_FILE, 'utf-8'));
  const syntheticLandmarks: ReferenceVector[] = syntheticMetadata.map((m: {
    id: string;
    embedding: number[];
    lat: number;
    lon: number;
    category: string;
  }) => ({
    id: m.id,
    embedding: m.embedding,
    lat: m.lat,
    lon: m.lon,
    source: 'synthetic',
  }));
  console.log(`  Loaded ${syntheticLandmarks.length} synthetic landmarks`);
  
  // Combine vectors
  const allVectors = [...baseVectors, ...syntheticLandmarks];
  console.log(`\n[Build] Total vectors: ${allVectors.length}`);
  
  // Build HNSW index
  console.log('\n[Build] Building HNSW index...');
  const index = new hnswlib.HierarchicalNSW('cosine', FEATURE_VECTOR_SIZE);
  index.initIndex(allVectors.length, 32, 200, 100);
  
  for (let i = 0; i < allVectors.length; i++) {
    index.addPoint(allVectors[i]!.embedding, i);
    if ((i + 1) % 10000 === 0) {
      process.stdout.write(`\r  ${i + 1}/${allVectors.length} points indexed...`);
    }
  }
  console.log(`\r  Indexed ${allVectors.length} points.`);
  
  // Calculate coordinate bounds
  const allLats = allVectors.map(v => v.lat);
  const allLons = allVectors.map(v => v.lon);
  
  // Count synthetic categories
  const syntheticCategories = syntheticLandmarks.reduce((acc, v) => {
    const cat = v.id.split('_')[0] || 'unknown';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Create metadata
  const metadata: HNSWMetadata = {
    version: OUTPUT_VERSION,
    timestamp: new Date().toISOString(),
    totalPoints: allVectors.length,
    basePoints: baseVectors.length,
    syntheticPoints: syntheticLandmarks.length,
    coordinateBounds: {
      minLat: Math.min(...allLats),
      maxLat: Math.max(...allLats),
      minLon: Math.min(...allLons),
      maxLon: Math.max(...allLons),
    },
    syntheticCategories,
  };
  
  // Save index
  console.log('\n[Build] Saving index...');
  index.writeIndexSync(OUTPUT_INDEX_FILE);
  
  // Save vectors (for coordinate lookup)
  fs.writeFileSync(OUTPUT_VECTORS_FILE, JSON.stringify(allVectors));
  
  // Save metadata
  fs.writeFileSync(
    path.join(CACHE_DIR, `hnsw_index.${OUTPUT_VERSION}.metadata.json`),
    JSON.stringify(metadata, null, 2)
  );
  
  console.log('\n✓ Enriched index built successfully!');
  console.log(`\n  Index: ${OUTPUT_INDEX_FILE}`);
  console.log(`  Vectors: ${OUTPUT_VECTORS_FILE}`);
  
  console.log('\n============================================================');
  console.log('Enriched Index Summary');
  console.log('============================================================');
  console.log(`  Base vectors:     ${baseVectors.length.toLocaleString()}`);
  console.log(`  Synthetic points: ${syntheticLandmarks.length}`);
  console.log(`  Total points:     ${allVectors.length.toLocaleString()}`);
  console.log(`  Size increase:    ${((syntheticLandmarks.length / baseVectors.length) * 100).toFixed(3)}%`);
  console.log('\n  Synthetic coverage:');
  Object.entries(syntheticCategories).forEach(([cat, count]) => {
    const name = { mrk: 'Marrakech', cop: 'Copacabana', tm: 'Table Mtn', cp: 'Cape Point' }[cat] || cat;
    console.log(`    ${name}: ${count} points`);
  });
  console.log('\n  Coordinate bounds:');
  console.log(`    Lat: [${metadata.coordinateBounds.minLat.toFixed(2)}, ${metadata.coordinateBounds.maxLat.toFixed(2)}]`);
  console.log(`    Lon: [${metadata.coordinateBounds.minLon.toFixed(2)}, ${metadata.coordinateBounds.maxLon.toFixed(2)}]`);
  console.log('\nTo use the enriched index:');
  console.log('  GEOWRAITH_USE_SYNTHETIC_INDEX=true npm run benchmark:validation');
  console.log('============================================================');
}

// Run if executed directly
buildEnrichedIndex().catch(console.error);

export { buildEnrichedIndex };
