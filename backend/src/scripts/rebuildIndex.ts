import 'dotenv/config';
import { promises as fs } from 'fs';
import path from 'path';
import { HNSWIndex } from '../services/annIndex.js';

const MERGED_FILE = path.resolve(process.cwd(), '.cache/geoclip/referenceImageVectors.merged_v1.json');
const INDEX_FILE = path.resolve(process.cwd(), '.cache/geoclip/hnsw_index.merged_v1.bin');

async function main() {
  console.log('Rebuilding HNSW index...\n');
  
  const data = JSON.parse(await fs.readFile(MERGED_FILE, 'utf8'));
  console.log(`Vectors: ${data.vectors.length}`);
  
  const index = new HNSWIndex({ M: 16, efConstruction: 200, efSearch: 128 });
  await index.buildIndex(data.vectors);
  await index.saveIndex(INDEX_FILE);
  
  console.log(`✅ Index rebuilt: ${index.size} vectors`);
}

main().catch(console.error);
