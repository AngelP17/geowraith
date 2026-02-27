/**
 * Fetch more images for still-failing landmarks
 */

import 'dotenv/config';
import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import https from 'https';
import { extractCLIPEmbedding } from '../services/clipExtractor.js';

const PEXELS_KEY = process.env.PEXELS_API_KEY || '';
const PIXABAY_KEY = process.env.PIXABAY_API_KEY || '';
const OUTPUT_DIR = path.resolve(process.cwd(), '.cache/api_images_extra');

// Still failing landmarks - get MORE images
const FAILING_LANDMARKS = [
  { id: 'stonehenge', name: 'Stonehenge England', lat: 51.1788, lon: -1.8262 },
  { id: 'milford_sound', name: 'Milford Sound New Zealand', lat: -44.6414, lon: 167.8974 },
  { id: 'neuschwanstein', name: 'Neuschwanstein Castle Germany', lat: 47.5575, lon: 10.7498 },
  { id: 'banff', name: 'Banff National Park Canada', lat: 51.4968, lon: -115.9281 },
  { id: 'moai', name: 'Moai Statues Easter Island', lat: -27.1258, lon: -109.2774 },
  { id: 'copacabana', name: 'Copacabana Beach Rio', lat: -22.9719, lon: -43.1823 },
  { id: 'tower_bridge', name: 'Tower Bridge London', lat: 51.5055, lon: -0.0754 },
  { id: 'table_mountain', name: 'Table Mountain Cape Town', lat: -33.9628, lon: 18.4098 },
  { id: 'great_barrier_reef', name: 'Great Barrier Reef Australia', lat: -18.2871, lon: 147.6992 },
  { id: 'salar_uyuni', name: 'Salar de Uyuni Bolivia', lat: -20.1338, lon: -67.4891 },
  { id: 'schonbrunn', name: 'Schonbrunn Palace Vienna', lat: 48.1845, lon: 16.3119 },
];

async function fetchPexels(landmark: typeof FAILING_LANDMARKS[0], count = 15) {
  if (!PEXELS_KEY) return [];
  try {
    const res = await axios.get('https://api.pexels.com/v1/search', {
      headers: { Authorization: PEXELS_KEY },
      params: { query: landmark.name, per_page: count },
      timeout: 10000,
    });
    return res.data.photos.map((p: any) => ({
      url: p.src.original || p.src.large,
      lat: landmark.lat,
      lon: landmark.lon,
      source: 'pexels',
      landmarkId: landmark.id,
    }));
  } catch { return []; }
}

async function fetchPixabay(landmark: typeof FAILING_LANDMARKS[0], count = 15) {
  if (!PIXABAY_KEY) return [];
  try {
    const res = await axios.get('https://pixabay.com/api/', {
      params: { key: PIXABAY_KEY, q: landmark.name.replace(/\s+/g, '+'), per_page: count },
      timeout: 10000,
    });
    return res.data.hits.map((h: any) => ({
      url: h.largeImageURL,
      lat: landmark.lat,
      lon: landmark.lon,
      source: 'pixabay',
      landmarkId: landmark.id,
    }));
  } catch { return []; }
}

async function downloadImage(url: string, outputPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    https.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode !== 200) { resolve(false); return; }
      const chunks: Buffer[] = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', async () => {
        try { await fs.writeFile(outputPath, Buffer.concat(chunks)); resolve(true); }
        catch { resolve(false); }
      });
    }).on('error', () => resolve(false));
  });
}

async function main() {
  console.log('🌐 Fetching MORE images for failing landmarks...\n');
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  const allImages: any[] = [];
  
  for (const landmark of FAILING_LANDMARKS) {
    console.log(`📍 ${landmark.name}`);
    const [pex, pix] = await Promise.all([
      fetchPexels(landmark),
      fetchPixabay(landmark),
    ]);
    console.log(`  Pexels: ${pex.length} | Pixabay: ${pix.length}`);
    allImages.push(...pex, ...pix);
  }
  
  console.log(`\n📊 Total: ${allImages.length} images`);
  
  // Download and embed
  const vectors: any[] = [];
  for (let i = 0; i < allImages.length; i++) {
    const img = allImages[i];
    const filename = `${img.landmarkId}_${img.source}_${i}.jpg`;
    const outputPath = path.join(OUTPUT_DIR, filename);
    
    process.stdout.write(`[${i + 1}/${allImages.length}] ${filename.substring(0, 40)}... `);
    
    if (!await downloadImage(img.url, outputPath)) {
      console.log('FAIL');
      continue;
    }
    
    try {
      const buffer = await fs.readFile(outputPath);
      const embedding = await extractCLIPEmbedding(buffer);
      vectors.push({
        id: `${img.landmarkId}_extra_${i}`,
        label: `${img.landmarkId} extra`,
        lat: img.lat,
        lon: img.lon,
        vector: embedding,
      });
      console.log('✓');
    } catch { console.log('EMBED FAIL'); }
  }
  
  // Append to existing file
  const existingPath = path.resolve(process.cwd(), '.cache/geoclip/referenceImageVectors.api_images.json');
  const existing = JSON.parse(await fs.readFile(existingPath, 'utf8'));
  existing.vectors.push(...vectors);
  await fs.writeFile(existingPath, JSON.stringify(existing, null, 2));
  
  console.log(`\n✅ Added ${vectors.length} new vectors`);
  console.log(`Total API vectors: ${existing.vectors.length}`);
}

main().catch(console.error);
