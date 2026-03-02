/**
 * Download Mapillary reference images for failure locations
 * Uses provided access token to fetch street-level imagery
 */

import * as fs from 'fs';
import * as path from 'path';
import { retrieveMapillaryImages, downloadMapillaryImage } from '../sfm/mapillary.js';
import { extractCLIPEmbedding } from '../services/clipExtractor.js';

const REFERENCE_DIR = path.resolve(process.cwd(), '.cache/mapillary_references');

const FAILURE_LOCATIONS = [
  { name: 'Marrakech', lat: 31.6295, lon: -7.9811, radius: 5000, maxImages: 100 },
  { name: 'Copacabana', lat: -22.9714, lon: -43.1822, radius: 3000, maxImages: 100 },
  { name: 'TableMountain', lat: -33.9628, lon: 18.4098, radius: 4000, maxImages: 100 },
  { name: 'CapePoint', lat: -34.3570, lon: 18.4971, radius: 3000, maxImages: 50 },
];

interface ReferenceEntry {
  id: string;
  embedding: number[];
  lat: number;
  lon: number;
  location: string;
  source: string;
}

async function downloadReferences(): Promise<void> {
  console.log('============================================================');
  console.log('Downloading Mapillary References for Failure Locations');
  console.log('============================================================\n');
  
  if (!fs.existsSync(REFERENCE_DIR)) {
    fs.mkdirSync(REFERENCE_DIR, { recursive: true });
  }
  
  const allEntries: ReferenceEntry[] = [];
  
  for (const loc of FAILURE_LOCATIONS) {
    console.log(`\n[${loc.name}] Searching for images...`);
    const images = await retrieveMapillaryImages(loc.lat, loc.lon, loc.radius, loc.maxImages);
    console.log(`  Found ${images.length} images`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const img of images) {
      try {
        // Download image to buffer
        const buffer = await downloadMapillaryImage(img.url);
        
        // Save to disk
        const imagePath = path.join(REFERENCE_DIR, `${img.id}.jpg`);
        fs.writeFileSync(imagePath, buffer);
        
        // Generate embedding
        const embedding = await extractCLIPEmbedding(buffer);
        
        allEntries.push({
          id: img.id,
          embedding,
          lat: img.coordinates.lat,
          lon: img.coordinates.lon,
          location: loc.name,
          source: 'mapillary',
        });
        
        successCount++;
        process.stdout.write(`\r  ${successCount} embedded, ${failCount} failed...`);
      } catch (err) {
        failCount++;
      }
    }
    
    console.log(`\r  ✓ ${loc.name}: ${successCount} embedded, ${failCount} failed`);
  }
  
  // Save embeddings
  const embeddingsPath = path.join(REFERENCE_DIR, 'mapillary_embeddings.json');
  fs.writeFileSync(embeddingsPath, JSON.stringify({
    embeddings: allEntries.map(e => e.embedding),
    coordinates: allEntries.map(e => [e.lat, e.lon]),
    ids: allEntries.map(e => e.id),
    locations: allEntries.map(e => e.location),
  }, null, 2));
  
  // Save full metadata
  const metadataPath = path.join(REFERENCE_DIR, 'mapillary_metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(allEntries, null, 2));
  
  console.log('\n============================================================');
  console.log('Mapillary Reference Download Complete');
  console.log('============================================================');
  console.log(`Total references: ${allEntries.length}`);
  const byLoc = allEntries.reduce((acc, e) => {
    acc[e.location] = (acc[e.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  Object.entries(byLoc).forEach(([name, count]) => {
    console.log(`  ${name}: ${count} images`);
  });
  console.log(`\nFiles saved:`);
  console.log(`  - ${embeddingsPath}`);
  console.log(`  - ${metadataPath}`);
  console.log('============================================================');
}

downloadReferences().catch(console.error);
