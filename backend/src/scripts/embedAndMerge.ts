import 'dotenv/config';
import { promises as fs } from 'fs';
import path from 'path';
import { extractCLIPEmbedding } from '../services/clipExtractor.js';
import { HNSWIndex } from '../services/annIndex.js';

const IMAGE_DIR = path.resolve(process.cwd(), '.cache/ultra_densified_final');
const MERGED_FILE = path.resolve(process.cwd(), '.cache/geoclip/referenceImageVectors.merged_v1.json');
const INDEX_FILE = path.resolve(process.cwd(), '.cache/geoclip/hnsw_index.merged_v1.bin');

async function main() {
  console.log('Embedding downloaded images and merging...\n');
  
  const files = await fs.readdir(IMAGE_DIR);
  const jpgFiles = files.filter(f => f.endsWith('.jpg'));
  console.log(`Found ${jpgFiles.length} images to embed`);
  
  // Load existing
  const existing = JSON.parse(await fs.readFile(MERGED_FILE, 'utf8'));
  console.log(`Existing vectors: ${existing.vectors.length}`);
  
  let embedded = 0;
  
  for (let i = 0; i < jpgFiles.length; i++) {
    const file = jpgFiles[i];
    const landmarkId = file.split('_')[0];
    
    try {
      const buffer = await fs.readFile(path.join(IMAGE_DIR, file));
      const embedding = await extractCLIPEmbedding(buffer);
      
      existing.vectors.push({
        id: `final_${landmarkId}_${i}`,
        label: `${landmarkId} final`,
        lat: 0,
        lon: 0,
        vector: embedding,
      });
      
      embedded++;
      process.stdout.write(`\rEmbedded: ${embedded}/${jpgFiles.length}`);
    } catch { /* skip */ }
  }
  
  console.log(`\n\nTotal vectors: ${existing.vectors.length}`);
  await fs.writeFile(MERGED_FILE, JSON.stringify(existing, null, 2));
  
  // Rebuild HNSW
  console.log('\nRebuilding HNSW index...');
  const index = new HNSWIndex({ M: 16, efConstruction: 200, efSearch: 128 });
  await index.buildIndex(existing.vectors);
  await index.saveIndex(INDEX_FILE);
  
  console.log(`✅ Done! Index: ${index.size} vectors`);
}

main().catch(console.error);
