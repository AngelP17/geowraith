import { promises as fs } from 'fs';
import path from 'path';
import type { ReferenceVectorRecord } from '../types.js';
import { HNSWIndex } from '../services/annIndex.js';

const LANDMARK_GEO_DIR = path.resolve(process.cwd(), '../.cache/landmark_geo');
const VECTORS_FILE = path.join(LANDMARK_GEO_DIR, 'id_payload_vector.json');
const METADATA_FILE = path.join(LANDMARK_GEO_DIR, 'train_attribution_geo.json');
const OUTPUT_DIR = path.resolve(process.cwd(), '.cache/geoclip');

interface LandmarkEntry {
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
  console.log('🏗️ Building landmark image reference index...\n');
  
  // Load vectors
  console.log('Loading landmark vectors...');
  const vectorsData = await fs.readFile(VECTORS_FILE, 'utf8');
  const entries: LandmarkEntry[] = JSON.parse(vectorsData);
  console.log(`  ✓ Loaded ${entries.length} landmark embeddings`);
  
  // Convert to ReferenceVectorRecord format
  console.log('\nConverting to reference format...');
  const references: ReferenceVectorRecord[] = entries.map((entry, i) => ({
    id: `landmark_${i}`,
    label: entry.payload.url.split('/').pop()?.replace(/\.jpg$/i, '') || entry.id,
    lat: entry.payload.location.lat,
    lon: entry.payload.location.lon,
    vector: entry.vector,
  }));
  
  console.log(`  ✓ ${references.length} references ready`);
  console.log(`  Sample: ${references[0].label} at (${references[0].lat}, ${references[0].lon})`);
  console.log(`  Vector dim: ${references[0].vector.length}`);
  
  // Build HNSW index
  console.log('\nBuilding HNSW index...');
  const index = new HNSWIndex({
    M: 16,
    efConstruction: 200,
    efSearch: 128, // Higher for better recall
  });
  
  await index.buildIndex(references);
  console.log(`  ✓ Index built with ${index.size} vectors`);
  
  // Save index
  const indexPath = path.join(OUTPUT_DIR, 'hnsw_index.landmark_geo.bin');
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await index.saveIndex(indexPath);
  console.log(`  ✓ Saved to ${indexPath}`);
  
  // Save reference vectors for metadata lookup
  const refsPath = path.join(OUTPUT_DIR, 'referenceVectors.landmark_geo.json');
  await fs.writeFile(
    refsPath,
    JSON.stringify({ version: 'landmark_geo_v1', vectors: references }, null, 2)
  );
  console.log(`  ✓ Saved references to ${refsPath}`);
  
  console.log('\n✅ Landmark image index complete!');
  console.log('\nNext: Update backend to use this index and run benchmark');
}

main().catch(console.error);
