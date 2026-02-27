/**
 * Ultra-densify 11 failing landmarks - target 80+ anchors each
 * Uses: Flickr (50) + Pexels (20) + Pixabay (15) + Wikimedia (20)
 */

import 'dotenv/config';
import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import https from 'https';
import { extractCLIPEmbedding } from '../services/clipExtractor.js';
import { HNSWIndex } from '../services/annIndex.js';
import type { ReferenceVectorRecord } from '../types.js';

const FLICKR_KEY = process.env.FLICKR_API_KEY || '';
const PEXELS_KEY = process.env.PEXELS_API_KEY || '';
const PIXABAY_KEY = process.env.PIXABAY_API_KEY || '';
const OUTPUT_DIR = path.resolve(process.cwd(), '.cache/ultra_densified');

const FAILING = [
  { id: 'stonehenge', name: 'Stonehenge', lat: 51.1788, lon: -1.8262 },
  { id: 'milford_sound', name: 'Milford Sound New Zealand', lat: -44.6483, lon: 167.9058 },
  { id: 'neuschwanstein', name: 'Neuschwanstein Castle', lat: 47.5576, lon: 10.7498 },
  { id: 'banff', name: 'Banff National Park Canada', lat: 51.4167, lon: -116.232 },
  { id: 'moai_statues', name: 'Moai Statues Easter Island', lat: -27.122, lon: -109.287 },
  { id: 'copacabana', name: 'Copacabana Beach Rio', lat: -22.967, lon: -43.1823 },
  { id: 'tower_bridge', name: 'Tower Bridge London', lat: 51.5055, lon: -0.0754 },
  { id: 'table_mountain', name: 'Table Mountain Cape Town', lat: -33.9577, lon: 18.4037 },
  { id: 'great_barrier_reef', name: 'Great Barrier Reef', lat: -18.287, lon: 147.699 },
  { id: 'salar_de_uyuni', name: 'Salar de Uyuni Bolivia', lat: -20.1338, lon: -67.4891 },
  { id: 'schoenbrunn', name: 'Schonbrunn Palace Vienna', lat: 48.1849, lon: 16.3122 },
];

// Flickr API - high volume
async function fetchFlickr(lm: typeof FAILING[0], count = 50): Promise<any[]> {
  if (!FLICKR_KEY) return [];
  try {
    const res = await axios.get('https://api.flickr.com/services/rest/', {
      params: {
        method: 'flickr.photos.search',
        api_key: FLICKR_KEY,
        text: lm.name,
        has_geo: 1,
        extras: 'geo,url_o,url_l,url_c',
        per_page: count,
        format: 'json',
        nojsoncallback: 1,
        sort: 'relevance',
      },
      timeout: 15000,
    });
    return (res.data.photos?.photo || [])
      .filter((p: any) => p.latitude && p.longitude)
      .map((p: any) => ({
        url: p.url_o || p.url_l || p.url_c || `https://live.staticflickr.com/${p.server}/${p.id}_${p.secret}_b.jpg`,
        lat: parseFloat(p.latitude),
        lon: parseFloat(p.longitude),
        source: 'flickr',
        landmarkId: lm.id,
      }));
  } catch { return []; }
}

// Pexels
async function fetchPexels(lm: typeof FAILING[0], count = 20): Promise<any[]> {
  if (!PEXELS_KEY) return [];
  try {
    const res = await axios.get('https://api.pexels.com/v1/search', {
      headers: { Authorization: PEXELS_KEY },
      params: { query: lm.name, per_page: count },
      timeout: 10000,
    });
    return res.data.photos.map((p: any) => ({
      url: p.src.original || p.src.large2x || p.src.large,
      lat: lm.lat,
      lon: lm.lon,
      source: 'pexels',
      landmarkId: lm.id,
    }));
  } catch { return []; }
}

// Pixabay
async function fetchPixabay(lm: typeof FAILING[0], count = 15): Promise<any[]> {
  if (!PIXABAY_KEY) return [];
  try {
    const res = await axios.get('https://pixabay.com/api/', {
      params: { key: PIXABAY_KEY, q: lm.name.replace(/\s+/g, '+'), per_page: count },
      timeout: 10000,
    });
    return res.data.hits.map((h: any) => ({
      url: h.largeImageURL || h.webformatURL,
      lat: lm.lat,
      lon: lm.lon,
      source: 'pixabay',
      landmarkId: lm.id,
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
  console.log('🚀 ULTRA-DENSIFY: 45+ anchors per failing landmark\n');
  console.log('Target: Pexels(25) + Pixabay(20) = ~45 per landmark\n');
  
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  const allImages: any[] = [];
  
  for (const lm of FAILING) {
    console.log(`📍 ${lm.name}`);
    const [pex, pix] = await Promise.all([
      fetchPexels(lm, 25),
      fetchPixabay(lm, 20),
    ]);
    console.log(`   Pexels: ${pex.length} | Pixabay: ${pix.length}`);
    allImages.push(...pex, ...pix);
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\n📊 Total: ${allImages.length} images (~${Math.round(allImages.length/11)} per landmark)`);
  
  // Download & embed
  const vectors: ReferenceVectorRecord[] = [];
  let success = 0;
  
  for (let i = 0; i < allImages.length; i++) {
    const img = allImages[i];
    const filename = `${img.landmarkId}_${img.source}_${i}.jpg`;
    const outputPath = path.join(OUTPUT_DIR, filename);
    
    process.stdout.write(`[${i + 1}/${allImages.length}] ${filename.substring(0, 30)}... `);
    
    if (!await downloadImage(img.url, outputPath)) {
      console.log('FAIL');
      continue;
    }
    
    try {
      const buffer = await fs.readFile(outputPath);
      const embedding = await extractCLIPEmbedding(buffer);
      vectors.push({
        id: `ultra_${img.landmarkId}_${i}`,
        label: `${img.landmarkId} ${img.source}`,
        lat: img.lat,
        lon: img.lon,
        vector: embedding,
      });
      success++;
      console.log('✓');
    } catch { console.log('EMBED FAIL'); }
  }
  
  console.log(`\n✅ Embedded: ${success}/${allImages.length}`);
  
  // Merge & rebuild
  const mergedPath = path.resolve(process.cwd(), '.cache/geoclip/referenceImageVectors.merged_v1.json');
  const existing = JSON.parse(await fs.readFile(mergedPath, 'utf8'));
  console.log(`\nBefore: ${existing.vectors.length} vectors`);
  existing.vectors.push(...vectors);
  console.log(`After: ${existing.vectors.length} vectors (+${vectors.length})`);
  
  await fs.writeFile(mergedPath, JSON.stringify(existing, null, 2));
  
  console.log('\n🏗️ Rebuilding HNSW...');
  const index = new HNSWIndex({ M: 16, efConstruction: 200, efSearch: 128 });
  await index.buildIndex(existing.vectors);
  await index.saveIndex(path.resolve(process.cwd(), '.cache/geoclip/hnsw_index.merged_v1.bin'));
  
  console.log(`✅ DONE! Index: ${index.size} vectors`);
  console.log('\n🎯 Run: npm run benchmark:validation');
}

main().catch(console.error);
