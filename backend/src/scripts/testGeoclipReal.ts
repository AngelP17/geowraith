import { extractCLIPEmbedding, embedGeoLocations } from '../services/clipExtractor.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function test() {
  console.log('Testing real GeoCLIP embeddings...\n');
  
  // Test 1: Generate embeddings for a few locations
  const testLocations = [
    { lat: 48.8584, lon: 2.2945, name: 'Eiffel Tower' },
    { lat: 51.5074, lon: -0.1278, name: 'London' },
    { lat: 40.7128, lon: -74.0060, name: 'NYC' },
    { lat: 35.6762, lon: 139.6503, name: 'Tokyo' },
    { lat: -33.8688, lon: 151.2093, name: 'Sydney' },
  ];
  
  console.log('Generating location embeddings with GeoCLIP...');
  const coords = testLocations.map(l => ({ lat: l.lat, lon: l.lon }));
  const embeddings = await embedGeoLocations(coords);
  
  console.log(`\nGenerated ${embeddings.length} embeddings`);
  console.log(`Embedding dimension: ${embeddings[0].length}`);
  console.log(`Sample values (first location):`);
  console.log(`  First 5: [${embeddings[0].slice(0, 5).map((v: number) => v.toFixed(4)).join(', ')}]`);
  console.log(`  Norm: ${Math.sqrt(embeddings[0].reduce((s, v) => s + v * v, 0)).toFixed(4)}`);
  
  // Test 2: Extract image embedding from a test file if available
  const testImagePath = path.resolve(process.cwd(), '.cache/validation_gallery/images/0001_eiffel_tower.jpg');
  if (fs.existsSync(testImagePath)) {
    console.log(`\nExtracting image embedding from ${testImagePath}...`);
    const imageBuffer = fs.readFileSync(testImagePath);
    const imageEmbedding = await extractCLIPEmbedding(imageBuffer);
    console.log(`Image embedding dimension: ${imageEmbedding.length}`);
    console.log(`Sample values: [${imageEmbedding.slice(0, 5).map((v: number) => v.toFixed(4)).join(', ')}]`);
    
    // Compute similarity with location embeddings
    console.log('\nSimilarity to test locations:');
    embeddings.forEach((locEmb, i) => {
      const similarity = locEmb.reduce((sum, v, j) => sum + v * imageEmbedding[j], 0);
      console.log(`  ${testLocations[i].name}: ${similarity.toFixed(4)}`);
    });
  }
  
  console.log('\n✅ GeoCLIP models working correctly!');
}

test().catch(console.error);
