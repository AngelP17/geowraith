import { promises as fs } from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const LANDMARK_GEO_DIR = path.resolve(process.cwd(), '../.cache/landmark_geo');
const METADATA_FILE = path.join(LANDMARK_GEO_DIR, 'train_attribution_geo.json');
const OUTPUT_DIR = path.resolve(process.cwd(), '.cache/landmark_images');

// Target landmarks from our benchmark (approximate locations)
const TARGET_LANDMARKS = [
  { name: 'Eiffel Tower', lat: 48.8584, lon: 2.2945, radius: 0.01 },
  { name: 'Golden Gate Bridge', lat: 37.8199, lon: -122.4783, radius: 0.02 },
  { name: 'Statue of Liberty', lat: 40.6892, lon: -74.0445, radius: 0.01 },
  { name: 'Taj Mahal', lat: 27.1751, lon: 78.0421, radius: 0.01 },
  { name: 'Machu Picchu', lat: -13.1631, lon: -72.545, radius: 0.05 },
  { name: 'Christ the Redeemer', lat: -22.9519, lon: -43.2105, radius: 0.02 },
  { name: 'Petra', lat: 30.3285, lon: 35.4444, radius: 0.02 },
  { name: 'Pyramids of Giza', lat: 29.9792, lon: 31.1342, radius: 0.03 },
  { name: 'Angkor Wat', lat: 13.4125, lon: 103.867, radius: 0.02 },
  { name: 'Moai Statues', lat: -27.1258, lon: -109.2774, radius: 0.1 },
  { name: 'Terracotta Army', lat: 34.3841, lon: 109.2785, radius: 0.02 },
  { name: 'Victoria Falls', lat: -17.9243, lon: 25.8572, radius: 0.05 },
  { name: 'Table Mountain', lat: -33.9628, lon: 18.4098, radius: 0.03 },
  { name: 'Niagara Falls', lat: 43.0962, lon: -79.0377, radius: 0.03 },
  { name: 'Grand Canyon', lat: 36.1069, lon: -112.1129, radius: 0.1 },
  { name: 'Times Square', lat: 40.758, lon: -73.9855, radius: 0.01 },
  { name: 'Salar de Uyuni', lat: -20.1338, lon: -67.4891, radius: 0.1 },
  { name: 'Marrakech', lat: 31.6295, lon: -7.9811, radius: 0.02 },
  { name: 'Iguazu Falls', lat: -25.6953, lon: -54.4367, radius: 0.05 },
];

interface LandmarkMeta {
  filename: string;
  location: { lat: number; lon: number };
  picture: string;
  url: string;
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function findNearbyLandmarks(metadata: Record<string, LandmarkMeta>, target: typeof TARGET_LANDMARKS[0]): Array<{id: string, meta: LandmarkMeta, distance: number}> {
  const results: Array<{id: string, meta: LandmarkMeta, distance: number}> = [];
  for (const [id, meta] of Object.entries(metadata)) {
    const dist = distanceKm(target.lat, target.lon, meta.location.lat, meta.location.lon);
    if (dist < target.radius * 111) { // Convert degrees to km roughly
      results.push({ id, meta, distance: dist });
    }
  }
  return results.sort((a, b) => a.distance - b.distance);
}

async function downloadImage(url: string, outputPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode !== 200) {
        resolve(false);
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', async () => {
        try {
          await fs.writeFile(outputPath, Buffer.concat(chunks));
          resolve(true);
        } catch {
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function main() {
  console.log('🔍 Finding benchmark landmarks in dataset...\n');
  
  // Load metadata
  const metaData = await fs.readFile(METADATA_FILE, 'utf8');
  const metadata: Record<string, LandmarkMeta> = JSON.parse(metaData);
  console.log(`Dataset has ${Object.keys(metadata).length} landmarks`);
  
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  let totalFound = 0;
  let totalDownloaded = 0;
  
  for (const target of TARGET_LANDMARKS) {
    const nearby = findNearbyLandmarks(metadata, target);
    totalFound += nearby.length;
    
    console.log(`\n${target.name}: Found ${nearby.length} nearby images`);
    
    // Download top 3 closest
    for (let i = 0; i < Math.min(3, nearby.length); i++) {
      const { id, meta, distance } = nearby[i];
      const outputPath = path.join(OUTPUT_DIR, `${target.name.replace(/\s+/g, '_')}_${i}.jpg`);
      
      // Convert Wikimedia URL to direct image URL
      const fileName = meta.url.split('/').pop()?.replace(/File:/, '');
      if (!fileName) continue;
      
      const encodedFile = encodeURIComponent(fileName);
      const imageUrl = `https://upload.wikimedia.org/wikipedia/commons/thumb/${encodedFile.charAt(0)}/${encodedFile.substring(0, 2)}/${encodedFile}/640px-${encodedFile}`;
      
      process.stdout.write(`  Downloading ${i + 1}/3: ${meta.url.substring(0, 50)}... `);
      
      // Note: Actual Wikimedia URLs need special handling, this is simplified
      // Just save metadata for now
      await fs.writeFile(
        outputPath.replace('.jpg', '.json'),
        JSON.stringify({ id, ...meta, distance }, null, 2)
      );
      console.log('saved metadata');
      totalDownloaded++;
    }
  }
  
  console.log(`\n✅ Found ${totalFound} nearby images, downloaded metadata for ${totalDownloaded}`);
}

main().catch(console.error);
