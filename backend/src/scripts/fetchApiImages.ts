/**
 * Fetch images from Mapillary, Pexels, and Pixabay APIs
 * Uses exact GPS from Mapillary, assigns landmark coords to Pexels/Pixabay
 */

import 'dotenv/config';
import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import https from 'https';
import { extractCLIPEmbedding } from '../services/clipExtractor.js';
import type { ReferenceVectorRecord } from '../types.js';

// API Keys from .env
const MAPILLARY_TOKEN = process.env.MAPILLARY_ACCESS_TOKEN || '';
const PEXELS_KEY = process.env.PEXELS_API_KEY || '';
const PIXABAY_KEY = process.env.PIXABAY_API_KEY || '';

const OUTPUT_DIR = path.resolve(process.cwd(), '.cache/api_images');

// Failing landmarks from benchmark
const FAILING_LANDMARKS = [
  { id: 'golden_gate', name: 'Golden Gate Bridge San Francisco', lat: 37.8199, lon: -122.4783 },
  { id: 'eiffel_tower', name: 'Eiffel Tower Paris', lat: 48.8584, lon: 2.2945 },
  { id: 'statue_liberty', name: 'Statue of Liberty New York', lat: 40.6892, lon: -74.0445 },
  { id: 'taj_mahal', name: 'Taj Mahal India', lat: 27.1751, lon: 78.0421 },
  { id: 'machu_picchu', name: 'Machu Picchu Peru', lat: -13.1631, lon: -72.545 },
  { id: 'petra', name: 'Petra Jordan', lat: 30.3285, lon: 35.4444 },
  { id: 'angkor_wat', name: 'Angkor Wat Cambodia', lat: 13.4125, lon: 103.867 },
  { id: 'table_mountain', name: 'Table Mountain South Africa', lat: -33.9628, lon: 18.4098 },
  { id: 'victoria_falls', name: 'Victoria Falls Zambia', lat: -17.9243, lon: 25.8572 },
  { id: 'grand_canyon', name: 'Grand Canyon Arizona', lat: 36.1069, lon: -112.1129 },
];

interface ImageResult {
  url: string;
  lat: number;
  lon: number;
  source: string;
  landmarkId: string;
}

// Mapillary - REAL GPS per photo!
async function fetchMapillaryImages(landmark: typeof FAILING_LANDMARKS[0], count = 10): Promise<ImageResult[]> {
  if (!MAPILLARY_TOKEN) {
    console.log('  ⚠️ No Mapillary token');
    return [];
  }
  
  try {
    const res = await axios.get('https://graph.mapillary.com/images', {
      headers: { Authorization: `OAuth ${MAPILLARY_TOKEN}` },
      params: {
        fields: 'id,geometry,thumb_1024_url',
        closeto: `${landmark.lon},${landmark.lat}`,
        radius: 500,
        limit: count,
      },
      timeout: 10000,
    });
    
    return res.data.data.map((img: any) => ({
      url: img.thumb_1024_url,
      lat: img.geometry.coordinates[1],
      lon: img.geometry.coordinates[0],
      source: 'mapillary',
      landmarkId: landmark.id,
    }));
  } catch (e) {
    console.log(`  ✗ Mapillary error: ${e instanceof Error ? e.message : String(e)}`);
    return [];
  }
}

// Pexels - beautiful stock photos
async function fetchPexelsImages(landmark: typeof FAILING_LANDMARKS[0], count = 8): Promise<ImageResult[]> {
  if (!PEXELS_KEY) return [];
  
  try {
    const res = await axios.get('https://api.pexels.com/v1/search', {
      headers: { Authorization: PEXELS_KEY },
      params: { query: landmark.name, per_page: count, orientation: 'landscape' },
      timeout: 10000,
    });
    
    return res.data.photos.map((p: any) => ({
      url: p.src.original || p.src.large2x || p.src.large,
      lat: landmark.lat,
      lon: landmark.lon,
      source: 'pexels',
      landmarkId: landmark.id,
    }));
  } catch (e) {
    return [];
  }
}

// Pixabay - more stock photos
async function fetchPixabayImages(landmark: typeof FAILING_LANDMARKS[0], count = 8): Promise<ImageResult[]> {
  if (!PIXABAY_KEY) return [];
  
  try {
    const res = await axios.get('https://pixabay.com/api/', {
      params: {
        key: PIXABAY_KEY,
        q: landmark.name.replace(/\s+/g, '+'),
        image_type: 'photo',
        per_page: count,
      },
      timeout: 10000,
    });
    
    return res.data.hits.map((h: any) => ({
      url: h.largeImageURL || h.webformatURL,
      lat: landmark.lat,
      lon: landmark.lon,
      source: 'pixabay',
      landmarkId: landmark.id,
    }));
  } catch (e) {
    return [];
  }
}

// Download image
async function downloadImage(url: string, outputPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : https;
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
  });
}

async function main() {
  console.log('🌐 Fetching images from APIs...\n');
  console.log(`Mapillary token: ${MAPILLARY_TOKEN ? '✓' : '✗'}`);
  console.log(`Pexels key: ${PEXELS_KEY ? '✓' : '✗'}`);
  console.log(`Pixabay key: ${PIXABAY_KEY ? '✓' : '✗'}\n`);
  
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  const allImages: ImageResult[] = [];
  
  for (const landmark of FAILING_LANDMARKS) {
    console.log(`📍 ${landmark.name}`);
    
    // Fetch from all sources
    const [mapillary, pexels, pixabay] = await Promise.all([
      fetchMapillaryImages(landmark),
      fetchPexelsImages(landmark),
      fetchPixabayImages(landmark),
    ]);
    
    console.log(`  Mapillary: ${mapillary.length} | Pexels: ${pexels.length} | Pixabay: ${pixabay.length}`);
    
    allImages.push(...mapillary, ...pexels, ...pixabay);
  }
  
  console.log(`\n📊 Total images to download: ${allImages.length}`);
  
  // Download and embed
  const references: ReferenceVectorRecord[] = [];
  let downloaded = 0;
  let embedded = 0;
  
  for (let i = 0; i < allImages.length; i++) {
    const img = allImages[i];
    const filename = `${img.landmarkId}_${img.source}_${i}.jpg`;
    const outputPath = path.join(OUTPUT_DIR, filename);
    
    process.stdout.write(`\r[${i + 1}/${allImages.length}] Downloading ${filename.substring(0, 40)}... `);
    
    const success = await downloadImage(img.url, outputPath);
    if (!success) {
      console.log('FAIL');
      continue;
    }
    downloaded++;
    
    // Embed with GeoCLIP
    try {
      const buffer = await fs.readFile(outputPath);
      const embedding = await extractCLIPEmbedding(buffer);
      
      references.push({
        id: `${img.landmarkId}_${img.source}_${i}`,
        label: `${img.landmarkId} - ${img.source}`,
        lat: img.lat,
        lon: img.lon,
        vector: embedding,
      });
      
      embedded++;
      process.stdout.write(`✓\n`);
    } catch (err) {
      console.log(`EMBED FAIL: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  console.log(`\n✅ Downloaded: ${downloaded}, Embedded: ${embedded}`);
  
  // Save references
  const outputFile = path.resolve(process.cwd(), '.cache/geoclip/referenceImageVectors.api_images.json');
  await fs.writeFile(
    outputFile,
    JSON.stringify({ version: 'api_images_v1', vectors: references }, null, 2)
  );
  
  console.log(`✓ Saved ${references.length} vectors to ${outputFile}`);
}

main().catch(console.error);
