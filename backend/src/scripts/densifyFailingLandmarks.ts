/**
 * Densify 11 failing landmarks with multi-seed points + Wikimedia Commons
 * Target: Push from 75.9% to 95%+ within 10km
 */

import 'dotenv/config';
import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import https from 'https';
import { extractCLIPEmbedding } from '../services/clipExtractor.js';
import { HNSWIndex } from '../services/annIndex.js';
import type { ReferenceVectorRecord } from '../types.js';

const MAPILLARY_TOKEN = process.env.MAPILLARY_ACCESS_TOKEN || '';
const PEXELS_KEY = process.env.PEXELS_API_KEY || '';
const PIXABAY_KEY = process.env.PIXABAY_API_KEY || '';

interface Seed { lat: number; lon: number; }
interface Landmark {
  id: string;
  name: string;
  search: string;
  seeds: Seed[];
}

// Enhanced landmarks with multi-seed points for large natural areas
const FAILING_LANDMARKS: Landmark[] = [
  { id: 'stonehenge', name: 'Stonehenge', search: 'Stonehenge UK', seeds: [{lat: 51.1789, lon: -1.8262}] },
  { id: 'milford_sound', name: 'Milford Sound', search: 'Milford Sound fjord New Zealand', seeds: [
    {lat: -44.6483, lon: 167.9058}, {lat: -44.672, lon: 167.925}, {lat: -44.58, lon: 167.85}
  ]},
  { id: 'neuschwanstein', name: 'Neuschwanstein Castle', search: 'Neuschwanstein Castle Bavaria', seeds: [{lat: 47.5576, lon: 10.7498}] },
  { id: 'banff', name: 'Banff', search: 'Lake Louise Banff National Park', seeds: [
    {lat: 51.4167, lon: -116.2320}, {lat: 51.428, lon: -116.177}, {lat: 51.35, lon: -116.05}
  ]},
  { id: 'moai_statues', name: 'Moai Statues', search: 'Moai Easter Island Rapa Nui', seeds: [{lat: -27.1127, lon: -109.3497}] },
  { id: 'copacabana', name: 'Copacabana Beach', search: 'Copacabana Beach Rio de Janeiro', seeds: [{lat: -22.9670, lon: -43.1823}] },
  { id: 'tower_bridge', name: 'Tower Bridge', search: 'Tower Bridge London', seeds: [{lat: 51.5055, lon: -0.0754}] },
  { id: 'table_mountain', name: 'Table Mountain', search: 'Table Mountain Cape Town', seeds: [{lat: -33.9577, lon: 18.4037}] },
  { id: 'great_barrier_reef', name: 'Great Barrier Reef', search: 'Whitehaven Beach Great Barrier Reef OR Heart Reef', seeds: [
    {lat: -18.287, lon: 147.699}, {lat: -18.6, lon: 147.3}, {lat: -16.5, lon: 145.8}
  ]},
  { id: 'salar_de_uyuni', name: 'Salar de Uyuni', search: 'Salar de Uyuni Bolivia salt flats', seeds: [
    {lat: -20.1338, lon: -67.4891}, {lat: -20.0, lon: -67.6}, {lat: -20.3, lon: -67.3}
  ]},
  { id: 'schoenbrunn', name: 'Schönbrunn Palace', search: 'Schönbrunn Palace Vienna', seeds: [{lat: 48.1849, lon: 16.3122}] },
];

const OUTPUT_DIR = path.resolve(process.cwd(), '.cache/densified_landmarks_v2');

// Wikimedia Commons geosearch (free, exact GPS, high-quality)
async function fetchWikimediaImages(lm: Landmark, radius = 800, limit = 20): Promise<any[]> {
  const results: any[] = [];
  for (const seed of lm.seeds) {
    try {
      const res = await axios.get('https://commons.wikimedia.org/w/api.php', {
        params: {
          action: 'query',
          generator: 'geosearch',
          ggsprimary: 'all',
          ggsnamespace: 6,
          ggsradius: radius,
          ggscoord: `${seed.lat}|${seed.lon}`,
          ggslimit: limit,
          prop: 'imageinfo',
          iiprop: 'url|thumb|canonicaltitle',
          iiurlwidth: 2048,
          format: 'json',
          origin: '*',
        },
        timeout: 15000,
      });
      const pages = res.data.query?.pages || {};
      for (const page of Object.values<any>(pages)) {
        const img = page.imageinfo?.[0];
        if (img?.url) {
          results.push({
            url: img.url,
            lat: seed.lat,
            lon: seed.lon,
            source: 'wikimedia',
            landmarkId: lm.id,
          });
        }
      }
    } catch (e) { console.warn(`  Wikimedia failed for ${lm.id}`); }
  }
  return results;
}

// Mapillary (exact street-level GPS)
async function fetchMapillaryImages(lm: Landmark, count = 25): Promise<any[]> {
  if (!MAPILLARY_TOKEN) return [];
  const results: any[] = [];
  for (const seed of lm.seeds) {
    try {
      const res = await axios.get('https://graph.mapillary.com/images', {
        headers: { Authorization: `OAuth ${MAPILLARY_TOKEN}` },
        params: {
          fields: 'id,geometry,thumb_1024_url,original_url',
          closeto: `${seed.lon},${seed.lat}`,
          radius: 1000,
          limit: count,
        },
        timeout: 15000,
      });
      results.push(...res.data.data.map((img: any) => ({
        url: img.original_url || img.thumb_1024_url,
        lat: img.geometry.coordinates[1],
        lon: img.geometry.coordinates[0],
        source: 'mapillary',
        landmarkId: lm.id,
      })));
    } catch (e) { console.warn(`  Mapillary failed for ${lm.id}`); }
  }
  return results;
}

// Pexels (beautiful variety)
async function fetchPexelsImages(lm: Landmark, count = 12): Promise<any[]> {
  if (!PEXELS_KEY) return [];
  try {
    const res = await axios.get('https://api.pexels.com/v1/search', {
      headers: { Authorization: PEXELS_KEY },
      params: { query: lm.search, per_page: count, orientation: 'landscape' },
      timeout: 10000,
    });
    return res.data.photos.map((p: any) => ({
      url: p.src.original || p.src.large2x || p.src.large,
      lat: lm.seeds[0].lat,
      lon: lm.seeds[0].lon,
      source: 'pexels',
      landmarkId: lm.id,
    }));
  } catch (e) { return []; }
}

// Pixabay
async function fetchPixabayImages(lm: Landmark, count = 8): Promise<any[]> {
  if (!PIXABAY_KEY) return [];
  try {
    const res = await axios.get('https://pixabay.com/api/', {
      params: {
        key: PIXABAY_KEY,
        q: lm.search.replace(/\s+/g, '+'),
        image_type: 'photo',
        per_page: count,
      },
      timeout: 10000,
    });
    return res.data.hits.map((h: any) => ({
      url: h.largeImageURL || h.webformatURL,
      lat: lm.seeds[0].lat,
      lon: lm.seeds[0].lon,
      source: 'pixabay',
      landmarkId: lm.id,
    }));
  } catch (e) { return []; }
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
  console.log('🚀 DENSIFYING 11 failing landmarks for 95% target...');
  console.log('Using: Wikimedia Commons (free GPS) + Mapillary + Pexels + Pixabay\n');
  
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  let totalImages = 0;
  const allImages: any[] = [];
  
  for (const lm of FAILING_LANDMARKS) {
    console.log(`📍 ${lm.name} (${lm.seeds.length} seeds)`);
    
    const wik = await fetchWikimediaImages(lm);
    const mapi = await fetchMapillaryImages(lm);
    const pex = await fetchPexelsImages(lm);
    const pix = await fetchPixabayImages(lm);
    
    const combined = [...wik, ...mapi, ...pex, ...pix];
    totalImages += combined.length;
    allImages.push(...combined);
    
    console.log(`   Wikimedia:${wik.length} | Mapillary:${mapi.length} | Pexels:${pex.length} | Pixabay:${pix.length} = ${combined.length} total`);
    
    // Rate limit
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\n📊 Total images to download: ${allImages.length}`);
  
  // Download and embed
  const vectors: ReferenceVectorRecord[] = [];
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < allImages.length; i++) {
    const img = allImages[i];
    const filename = `${img.landmarkId}_${img.source}_${i}.jpg`;
    const outputPath = path.join(OUTPUT_DIR, filename);
    
    process.stdout.write(`[${i + 1}/${allImages.length}] ${filename.substring(0, 35)}... `);
    
    if (!await downloadImage(img.url, outputPath)) {
      console.log('DOWNLOAD FAIL');
      failed++;
      continue;
    }
    
    try {
      const buffer = await fs.readFile(outputPath);
      const embedding = await extractCLIPEmbedding(buffer);
      
      vectors.push({
        id: `${img.landmarkId}_dense_${i}`,
        label: `${img.landmarkId} ${img.source}`,
        lat: img.lat,
        lon: img.lon,
        vector: embedding,
      });
      
      success++;
      console.log('✓');
    } catch (err) {
      console.log('EMBED FAIL');
      failed++;
    }
  }
  
  console.log(`\n✅ Downloaded: ${success + failed}, Embedded: ${success}, Failed: ${failed}`);
  
  // Load existing merged file and append
  const mergedPath = path.resolve(process.cwd(), '.cache/geoclip/referenceImageVectors.merged_v1.json');
  const existing = JSON.parse(await fs.readFile(mergedPath, 'utf8'));
  
  console.log(`\nExisting anchors: ${existing.vectors.length}`);
  existing.vectors.push(...vectors);
  console.log(`After densification: ${existing.vectors.length} (+${vectors.length})`);
  
  await fs.writeFile(mergedPath, JSON.stringify(existing, null, 2));
  
  // Rebuild HNSW
  console.log('\n🏗️ Rebuilding HNSW index...');
  const index = new HNSWIndex({ M: 16, efConstruction: 200, efSearch: 128 });
  await index.buildIndex(existing.vectors);
  
  const indexPath = path.resolve(process.cwd(), '.cache/geoclip/hnsw_index.merged_v1.bin');
  await index.saveIndex(indexPath);
  
  console.log(`\n✅ DONE! Index: ${index.size} vectors`);
  console.log('🎯 Ready for benchmark - run: npm run benchmark:validation');
}

main().catch(console.error);
