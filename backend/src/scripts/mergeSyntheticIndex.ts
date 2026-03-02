/**
 * Merge synthetic landmark embeddings into HNSW index
 * 
 * Combines base OSV5M index with synthetic landmarks for improved
 * geo-coverage in failure locations.
 */

import * as fs from 'fs';
import * as path from 'path';
import hnswlib from 'hnswlib-node';
import { FEATURE_VECTOR_SIZE } from '../data/referenceVectors.js';

const CACHE_DIR = path.resolve(process.cwd(), '.cache/geoclip');
const LANDMARK_DB_DIR = path.resolve(process.cwd(), '.cache/landmark_db');

const BASE_INDEX_FILE = path.join(CACHE_DIR, 'hnsw_index.v3.bin');
const BASE_METADATA_FILE = path.join(CACHE_DIR, 'hnsw_index.v3.metadata.json');
const SYNTHETIC_EMBEDDINGS_FILE = path.join(LANDMARK_DB_DIR, 'synthetic_embeddings.json');

const OUTPUT_INDEX_FILE = path.join(CACHE_DIR, 'hnsw_index.v3-synthetic-merged.bin');
const OUTPUT_METADATA_FILE = path.join(CACHE_DIR, 'hnsw_index.v3-synthetic-merged.metadata.json');

interface HNSWMetadata {
  version: string;
  timestamp: string;
  totalPoints: number;
  cities: string[];
  countries: string[];
  coordinateBounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  coordinates: Array<[number, number]>;
  ids: string[];
}

async function mergeSyntheticIndex(): Promise<void> {
  console.log('============================================================');
  console.log('Merging Synthetic Landmarks into HNSW Index');
  console.log('============================================================\n');
  
  // Check if base index exists
  if (!fs.existsSync(BASE_INDEX_FILE)) {
    console.error(`❌ Base index not found: ${BASE_INDEX_FILE}`);
    console.log('   Run corpus download first: npm run download:corpus');
    process.exit(1);
  }
  
  // Check if synthetic embeddings exist
  if (!fs.existsSync(SYNTHETIC_EMBEDDINGS_FILE)) {
    console.error(`❌ Synthetic embeddings not found: ${SYNTHETIC_EMBEDDINGS_FILE}`);
    console.log('   Run: npm run build:synthetic');
    process.exit(1);
  }
  
  // Load base index
  console.log('[Merge] Loading base index...');
  const baseIndex = new hnswlib.HierarchicalNSW('cosine', FEATURE_VECTOR_SIZE);
  baseIndex.readIndexSync(BASE_INDEX_FILE);
  
  // Load base metadata
  const baseMetadata: HNSWMetadata = JSON.parse(fs.readFileSync(BASE_METADATA_FILE, 'utf-8'));
  console.log(`  Base index: ${baseMetadata.totalPoints} points`);
  
  // Load synthetic embeddings
  console.log('\n[Merge] Loading synthetic landmarks...');
  const syntheticData = JSON.parse(fs.readFileSync(SYNTHETIC_EMBEDDINGS_FILE, 'utf-8'));
  const syntheticEmbeddings: number[][] = syntheticData.embeddings;
  const syntheticCoords: Array<[number, number]> = syntheticData.coordinates;
  const syntheticIds: string[] = syntheticData.ids;
  console.log(`  Synthetic landmarks: ${syntheticEmbeddings.length} points`);
  
  // Calculate new size
  const newSize = baseMetadata.totalPoints + syntheticEmbeddings.length;
  console.log(`\n[Merge] Creating merged index with ${newSize} points...`);
  
  // Create new index
  const mergedIndex = new hnswlib.HierarchicalNSW('cosine', FEATURE_VECTOR_SIZE);
  mergedIndex.initIndex(newSize, 32, 200, 100);
  
  // Copy base index data
  console.log('[Merge] Copying base index...');
  for (let i = 0; i < baseMetadata.totalPoints; i++) {
    const point = baseIndex.getPoint(i);
    mergedIndex.addPoint(point, i);
    if ((i + 1) % 1000 === 0) {
      process.stdout.write(`\r  ${i + 1}/${baseMetadata.totalPoints} points...`);
    }
  }
  console.log('\r  Base index copied.');
  
  // Add synthetic landmarks
  console.log('[Merge] Adding synthetic landmarks...');
  for (let i = 0; i < syntheticEmbeddings.length; i++) {
    const idx = baseMetadata.totalPoints + i;
    mergedIndex.addPoint(syntheticEmbeddings[i]!, idx);
  }
  console.log(`  Added ${syntheticEmbeddings.length} synthetic points.`);
  
  // Merge metadata
  const mergedMetadata: HNSWMetadata = {
    version: '3-synthetic-merged',
    timestamp: new Date().toISOString(),
    totalPoints: newSize,
    cities: [...baseMetadata.cities, 'synthetic_landmarks'],
    countries: baseMetadata.countries,
    coordinateBounds: {
      minLat: Math.min(baseMetadata.coordinateBounds.minLat, ...syntheticCoords.map(c => c[0])),
      maxLat: Math.max(baseMetadata.coordinateBounds.maxLat, ...syntheticCoords.map(c => c[0])),
      minLon: Math.min(baseMetadata.coordinateBounds.minLon, ...syntheticCoords.map(c => c[1])),
      maxLon: Math.max(baseMetadata.coordinateBounds.maxLon, ...syntheticCoords.map(c => c[1])),
    },
    coordinates: [...baseMetadata.coordinates, ...syntheticCoords],
    ids: [...baseMetadata.ids, ...syntheticIds],
  };
  
  // Save merged index
  console.log('\n[Merge] Saving merged index...');
  mergedIndex.writeIndexSync(OUTPUT_INDEX_FILE);
  fs.writeFileSync(OUTPUT_METADATA_FILE, JSON.stringify(mergedMetadata, null, 2));
  
  console.log(`\n✓ Merged index saved:`);
  console.log(`  - ${OUTPUT_INDEX_FILE}`);
  console.log(`  - ${OUTPUT_METADATA_FILE}`);
  
  console.log('\n============================================================');
  console.log('Merge Summary');
  console.log('============================================================');
  console.log(`  Base points:      ${baseMetadata.totalPoints}`);
  console.log(`  Synthetic points: ${syntheticEmbeddings.length}`);
  console.log(`  Total points:     ${newSize}`);
  console.log(`  Size increase:    ${((syntheticEmbeddings.length / baseMetadata.totalPoints) * 100).toFixed(2)}%`);
  console.log('\nTo use the merged index:');
  console.log('  GEOWRAITH_USE_SYNTHETIC_INDEX=true npm run benchmark:validation');
  console.log('============================================================');
}

// Run if executed directly
mergeSyntheticIndex().catch(console.error);

export { mergeSyntheticIndex };
