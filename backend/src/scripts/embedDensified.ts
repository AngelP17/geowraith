import { promises as fs } from 'fs';
import path from 'path';
import { extractCLIPEmbedding } from '../services/clipExtractor.js';
import { HNSWIndex } from '../services/annIndex.js';

const IMAGE_DIR = path.resolve(process.cwd(), '.cache/densified_landmarks');
const MERGED_FILE = path.resolve(process.cwd(), '.cache/geoclip/referenceImageVectors.merged_v1.json');

async function main() {
  console.log('Embedding densified images...\n');
  
  const files = await fs.readdir(IMAGE_DIR);
  const jpgFiles = files.filter(f => f.endsWith('.jpg'));
  console.log(`Found ${jpgFiles.length} images to embed`);
  
  // Load existing
  const existing = JSON.parse(await fs.readFile(MERGED_FILE, 'utf8'));
  console.log(`Existing vectors: ${existing.vectors.length}`);
  
  let embedded = 0;
  
  for (let i = 0; i < jpgFiles.length; i++) {
    const file = jpgFiles[i];
    const parts = file.replace('.jpg', '').split('_');
    const landmarkId = parts.slice(0, -2).join('_'); // Handle multi-word IDs
    
    try {
      const buffer = await fs.readFile(path.join(IMAGE_DIR, file));
      const embedding = await extractCLIPEmbedding(buffer);
      
      // Extract coordinates from landmark ID (simplified - use landmark coords)
      existing.vectors.push({
        id: `dense_${i}`,
        label: `${landmarkId} dense`,
        lat: 0, // Will be matched by landmark
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
  console.log('\nRebuilding HNSW...');
  const index = new HNSWIndex({ M: 16, efConstruction: 200, efSearch: 128 });
  await index.buildIndex(existing.vectors);
  
  const indexPath = path.resolve(process.cwd(), '.cache/geoclip/hnsw_index.merged_v1.bin');
  await index.saveIndex(indexPath);
  
  console.log(`✅ Index: ${index.size} vectors`);
}

main().catch(console.error);
