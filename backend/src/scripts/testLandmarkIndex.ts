import { HNSWIndex } from '../services/annIndex.js';
import { promises as fs } from 'fs';
import path from 'path';
import { extractCLIPEmbedding } from '../services/clipExtractor.js';

const INDEX_PATH = path.resolve(process.cwd(), '.cache/geoclip/hnsw_index.landmark_geo.bin');
const REFS_PATH = path.resolve(process.cwd(), '.cache/geoclip/referenceVectors.landmark_geo.json');
const TEST_IMAGE = path.resolve(process.cwd(), '.cache/validation_gallery/images/0001_eiffel_tower.jpg');

async function main() {
  console.log('Testing landmark image index...\n');
  
  // Load references
  console.log('Loading references...');
  const refsData = await fs.readFile(REFS_PATH, 'utf8');
  const { vectors: references } = JSON.parse(refsData);
  console.log(`  ✓ ${references.length} references`);
  
  // Load index
  console.log('\nLoading HNSW index...');
  const index = new HNSWIndex();
  const loaded = await index.loadIndex(INDEX_PATH, references.length, references);
  console.log(`  ✓ Index loaded: ${loaded}, size: ${index.size}`);
  
  // Test with Eiffel Tower image
  console.log('\nTesting with Eiffel Tower image...');
  const imageBuffer = await fs.readFile(TEST_IMAGE);
  const queryVector = await extractCLIPEmbedding(imageBuffer);
  console.log(`  ✓ Query embedding: ${queryVector.length} dims`);
  
  // Search
  console.log('\nSearching landmark index...');
  const matches = index.search(queryVector, 5);
  
  console.log('\nTop 5 matches:');
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    console.log(`  ${i + 1}. ${m.label.substring(0, 50)}`);
    console.log(`     Location: (${m.lat.toFixed(4)}, ${m.lon.toFixed(4)})`);
    console.log(`     Similarity: ${m.similarity.toFixed(4)}`);
    
    // Calculate distance to Eiffel Tower (48.8584, 2.2945)
    const dist = Math.sqrt(
      Math.pow(m.lat - 48.8584, 2) + Math.pow(m.lon - 2.2945, 2)
    );
    console.log(`     Distance from Eiffel: ~${(dist * 111).toFixed(1)}km`);
  }
}

main().catch(console.error);
