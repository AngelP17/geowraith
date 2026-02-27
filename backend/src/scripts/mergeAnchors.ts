/**
 * Merge all image anchors: SmartBlend + API images
 */

import { promises as fs } from 'fs';
import path from 'path';
import { HNSWIndex } from '../services/annIndex.js';

const PURE_GEOCLIP = path.resolve(process.cwd(), '.cache/geoclip/referenceImageVectors.pure_geoclip.json');
const API_IMAGES = path.resolve(process.cwd(), '.cache/geoclip/referenceImageVectors.api_images.json');
const OUTPUT = path.resolve(process.cwd(), '.cache/geoclip/referenceImageVectors.merged_v1.json');
const INDEX_OUTPUT = path.resolve(process.cwd(), '.cache/geoclip/hnsw_index.merged_v1.bin');

async function main() {
  console.log('🔄 Merging all image anchors...\n');
  
  // Load pure geoclip anchors
  const pureData = await fs.readFile(PURE_GEOCLIP, 'utf8');
  const pure = JSON.parse(pureData);
  console.log(`Pure GeoCLIP anchors: ${pure.vectors.length}`);
  
  // Load API images
  const apiData = await fs.readFile(API_IMAGES, 'utf8');
  const api = JSON.parse(apiData);
  console.log(`API image anchors: ${api.vectors.length}`);
  
  // Merge
  const merged = {
    version: 'merged_v1',
    vectors: [...pure.vectors, ...api.vectors],
  };
  
  console.log(`\nTotal anchors: ${merged.vectors.length}`);
  
  // Save
  await fs.writeFile(OUTPUT, JSON.stringify(merged, null, 2));
  console.log(`✓ Saved to ${OUTPUT}`);
  
  // Build HNSW index
  console.log('\n🏗️ Building HNSW index...');
  const index = new HNSWIndex({
    M: 16,
    efConstruction: 200,
    efSearch: 128,
  });
  
  await index.buildIndex(merged.vectors);
  console.log(`✓ Index ready: ${index.size} vectors`);
  
  await index.saveIndex(INDEX_OUTPUT);
  console.log(`✓ Saved to ${INDEX_OUTPUT}`);
  
  console.log('\n✅ Done! Update IMAGE_VECTOR_VERSION to "merged_v1" to use');
}

main().catch(console.error);
