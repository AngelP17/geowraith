import { promises as fs } from 'fs';
import path from 'path';
import { extractCLIPEmbedding } from '../services/clipExtractor.js';
import type { ReferenceVectorRecord } from '../types.js';

const SMARTBLEND_DIR = path.resolve(process.cwd(), '.cache/smartblend_gallery/images');
const METADATA_CSV = path.resolve(process.cwd(), '.cache/smartblend_gallery/metadata.csv');
const OUTPUT_FILE = path.resolve(process.cwd(), '.cache/geoclip/referenceImageVectors.pure_geoclip.json');

async function loadMetadata(): Promise<Map<string, {lat: number, lon: number, label: string}>> {
  const csv = await fs.readFile(METADATA_CSV, 'utf8');
  const lines = csv.split('\n').filter(l => l.trim());
  const map = new Map();
  
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length >= 4) {
      map.set(cols[0], {
        lat: parseFloat(cols[1]),
        lon: parseFloat(cols[2]),
        label: cols[3].replace(/^"|"$/g, ''),
      });
    }
  }
  return map;
}

async function main() {
  console.log('🔄 Rebuilding image anchors with REAL GeoCLIP embeddings...\n');
  
  const metadata = await loadMetadata();
  console.log(`Found ${metadata.size} images in SmartBlend gallery`);
  
  const files = await fs.readdir(SMARTBLEND_DIR);
  const jpgFiles = files.filter(f => f.endsWith('.jpg'));
  console.log(`Processing ${jpgFiles.length} images...\n`);
  
  const vectors: ReferenceVectorRecord[] = [];
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < jpgFiles.length; i++) {
    const file = jpgFiles[i];
    const meta = metadata.get(file);
    
    if (!meta) {
      console.log(`  ⚠️ No metadata for ${file}`);
      continue;
    }
    
    const imagePath = path.join(SMARTBLEND_DIR, file);
    
    try {
      const imageBuffer = await fs.readFile(imagePath);
      const embedding = await extractCLIPEmbedding(imageBuffer);
      
      vectors.push({
        id: `anchor_${i}`,
        label: meta.label,
        lat: meta.lat,
        lon: meta.lon,
        vector: embedding,
      });
      
      success++;
      process.stdout.write(`\r  ✓ ${success} embedded, ${failed} failed | ${file.substring(0, 40)}`);
    } catch (err) {
      failed++;
      console.log(`\n  ✗ Failed: ${file} - ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  console.log(`\n\n✅ Successfully embedded ${success}/${jpgFiles.length} images`);
  
  // Save
  await fs.writeFile(
    OUTPUT_FILE,
    JSON.stringify({ version: 'pure_geoclip_v1', vectors }, null, 2)
  );
  
  console.log(`✓ Saved ${vectors.length} GeoCLIP vectors to ${OUTPUT_FILE}`);
  console.log('\nNext: Rebuild HNSW index and run benchmark');
}

main().catch(console.error);
