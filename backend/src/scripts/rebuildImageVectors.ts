import { extractCLIPEmbedding } from '../services/clipExtractor.js';
import { promises as fs } from 'fs';
import path from 'path';
import type { ReferenceVectorRecord } from '../types.js';

const IMAGE_DIR = path.resolve(process.cwd(), '.cache/smartblend_gallery/images');
const METADATA_CSV = path.resolve(process.cwd(), '.cache/smartblend_gallery/metadata.csv');
const OUTPUT_FILE = path.resolve(process.cwd(), '.cache/geoclip/referenceImageVectors.multi-source-v2.json');

interface LandmarkMeta {
  filename: string;
  lat: number;
  lon: number;
  label: string;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  values.push(current);
  return values;
}

async function loadMetadata(): Promise<LandmarkMeta[]> {
  const csv = await fs.readFile(METADATA_CSV, 'utf8');
  const lines = csv.split('\n').filter(l => l.trim());
  const landmarks: LandmarkMeta[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length >= 4) {
      landmarks.push({
        filename: values[0],
        lat: parseFloat(values[1]),
        lon: parseFloat(values[2]),
        label: values[3].replace(/^"|"$/g, ''),
      });
    }
  }
  return landmarks;
}

async function main() {
  console.log('🔄 Rebuilding image anchor vectors with real GeoCLIP...\n');
  
  const landmarks = await loadMetadata();
  console.log(`Found ${landmarks.length} landmarks in metadata`);
  
  const vectors: ReferenceVectorRecord[] = [];
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < landmarks.length; i++) {
    const landmark = landmarks[i];
    const imagePath = path.join(IMAGE_DIR, landmark.filename);
    
    try {
      const imageBuffer = await fs.readFile(imagePath);
      const embedding = await extractCLIPEmbedding(imageBuffer);
      
      vectors.push({
        id: `img_${i}`,
        label: landmark.label,
        lat: landmark.lat,
        lon: landmark.lon,
        vector: embedding,
      });
      
      success++;
      process.stdout.write(`\r  Processed ${i + 1}/${landmarks.length}: ${landmark.label.substring(0, 40)}`);
    } catch (err) {
      failed++;
      console.log(`\n  ✗ Failed: ${landmark.label} - ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  console.log(`\n\n✓ Generated ${success} vectors (${failed} failed)`);

  // Save vectors
  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(
    OUTPUT_FILE,
    JSON.stringify({ version: 'multi-source-v2', vectors }, null, 2)
  );
  
  console.log(`✓ Saved to ${OUTPUT_FILE}`);
  console.log('\nNext: Rebuild HNSW index and run benchmark');
}

main().catch(console.error);
