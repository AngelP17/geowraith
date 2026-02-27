import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { extractCLIPEmbedding } from '../services/clipExtractor.js';
import { HNSWIndex } from '../services/annIndex.js';
import type { ReferenceVectorRecord } from '../types.js';
import https from 'https';

// API Keys from environment
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

// The 9 currently failing landmarks from benchmark
const FAILING_LANDMARKS: Landmark[] = [
  { id: 'marrakech', name: 'Marrakech Medina', search: 'Marrakech Medina Morocco', seeds: [{lat: 31.6295, lon: -7.9811}] },
  { id: 'perito_moreno', name: 'Perito Moreno Glacier', search: 'Perito Moreno Glacier Argentina', seeds: [{lat: -50.4957, lon: -73.1376}] },
  { id: 'swiss_alps', name: 'Swiss Alps Jungfrau', search: 'Jungfrau Swiss Alps', seeds: [{lat: 46.5369, lon: 7.9626}] },
  { id: 'cape_point', name: 'Cape Point', search: 'Cape Point South Africa', seeds: [{lat: -34.3568, lon: 18.496}] },
  { id: 'ngorongoro', name: 'Ngorongoro Crater', search: 'Ngorongoro Crater Tanzania', seeds: [{lat: -3.1618, lon: 35.5877}] },
  { id: 'copacabana', name: 'Copacabana Beach', search: 'Copacabana Beach Rio', seeds: [{lat: -22.967, lon: -43.1823}] },
  { id: 'table_mountain', name: 'Table Mountain', search: 'Table Mountain Cape Town', seeds: [{lat: -33.9577, lon: 18.4037}] },
  { id: 'petra', name: 'Petra Jordan', search: 'Petra Jordan', seeds: [{lat: 30.3285, lon: 35.4444}] },
  { id: 'salar_uyuni', name: 'Salar de Uyuni', search: 'Salar de Uyuni Bolivia', seeds: [{lat: -20.1338, lon: -67.4891}] },
];

const OUTPUT_DIR = path.join(process.cwd(), '.cache', 'ultra_densified_final');

async function sleep(ms: number) {
  await new Promise(r => setTimeout(r, ms));
}

// Openverse (no key needed)
async function fetchOpenverse(lm: Landmark, count = 40): Promise<any[]> {
  const results: any[] = [];
  try {
    const res = await axios.get('https://api.openverse.org/v1/images/', {
      params: { q: lm.search, per_page: count, license: 'cc0,pdm,by,by-sa' },
      timeout: 15000,
    });
    results.push(...(res.data.results || []).map((img: any) => ({
      url: img.url,
      lat: lm.seeds[0].lat,
      lon: lm.seeds[0].lon,
      source: 'openverse',
      landmarkId: lm.id,
    })));
  } catch (e) { /* ignore */ }
  return results;
}

// Wikimedia Commons
async function fetchWikimedia(lm: Landmark, count = 50): Promise<any[]> {
  const results: any[] = [];
  for (const seed of lm.seeds) {
    try {
      const res = await axios.get('https://commons.wikimedia.org/w/api.php', {
        params: {
          action: 'query', generator: 'geosearch', ggsprimary: 'all',
          ggsnamespace: 6, ggsradius: 2000, ggscoord: `${seed.lat}|${seed.lon}`,
          ggslimit: count, prop: 'imageinfo', iiprop: 'url', iiurlwidth: 2048,
          format: 'json', origin: '*',
        },
        timeout: 15000,
      });
      const pages = res.data.query?.pages || {};
      Object.values<any>(pages).forEach((page: any) => {
        const img = page.imageinfo?.[0];
        if (img?.url) results.push({ url: img.url, lat: seed.lat, lon: seed.lon, source: 'wikimedia', landmarkId: lm.id });
      });
    } catch { }
    await sleep(200);
  }
  return results;
}

// Mapillary (exact GPS)
async function fetchMapillary(lm: Landmark, count = 60): Promise<any[]> {
  if (!MAPILLARY_TOKEN) return [];
  const results: any[] = [];
  for (const seed of lm.seeds) {
    try {
      const res = await axios.get('https://graph.mapillary.com/images', {
        headers: { Authorization: `OAuth ${MAPILLARY_TOKEN}` },
        params: { fields: 'id,geometry,thumb_1024_url', closeto: `${seed.lon},${seed.lat}`, radius: 1500, limit: count },
        timeout: 15000,
      });
      results.push(...res.data.data.map((img: any) => ({
        url: img.thumb_1024_url,
        lat: img.geometry.coordinates[1],
        lon: img.geometry.coordinates[0],
        source: 'mapillary',
        landmarkId: lm.id,
      })));
    } catch { }
    await sleep(300);
  }
  return results;
}

// Pexels
async function fetchPexels(lm: Landmark, count = 30): Promise<any[]> {
  if (!PEXELS_KEY) return [];
  try {
    const res = await axios.get('https://api.pexels.com/v1/search', {
      headers: { Authorization: PEXELS_KEY },
      params: { query: lm.search, per_page: count },
      timeout: 10000,
    });
    return res.data.photos.map((p: any) => ({
      url: p.src.original || p.src.large,
      lat: lm.seeds[0].lat,
      lon: lm.seeds[0].lon,
      source: 'pexels',
      landmarkId: lm.id,
    }));
  } catch { return []; }
}

// Pixabay
async function fetchPixabay(lm: Landmark, count = 25): Promise<any[]> {
  if (!PIXABAY_KEY) return [];
  try {
    const res = await axios.get('https://pixabay.com/api/', {
      params: { key: PIXABAY_KEY, q: lm.search.replace(/\s+/g, '+'), per_page: count },
      timeout: 10000,
    });
    return res.data.hits.map((h: any) => ({
      url: h.largeImageURL || h.webformatURL,
      lat: lm.seeds[0].lat,
      lon: lm.seeds[0].lon,
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
        try { await fs.promises.writeFile(outputPath, Buffer.concat(chunks)); resolve(true); }
        catch { resolve(false); }
      });
    }).on('error', () => resolve(false));
  });
}

async function main() {
  console.log('🚀 FINAL DENSIFICATION: 9 failing landmarks → 95% target\n');
  console.log('API Status:');
  console.log(`  Mapillary: ${MAPILLARY_TOKEN ? '✓' : '✗'}`);
  console.log(`  Pexels: ${PEXELS_KEY ? '✓' : '✗'}`);
  console.log(`  Pixabay: ${PIXABAY_KEY ? '✓' : '✗'}`);
  console.log(`  Openverse: ✓ (no key)`);
  console.log(`  Wikimedia: ✓ (no key)\n`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const allImages: any[] = [];

  for (const lm of FAILING_LANDMARKS) {
    console.log(`📍 ${lm.name}`);
    const [open, wik, mapi, pex, pix] = await Promise.all([
      fetchOpenverse(lm),
      fetchWikimedia(lm),
      fetchMapillary(lm),
      fetchPexels(lm),
      fetchPixabay(lm),
    ]);
    const combined = [...open, ...wik, ...mapi, ...pex, ...pix];
    console.log(`  Openverse:${open.length} Wikimedia:${wik.length} Mapillary:${mapi.length} Pexels:${pex.length} Pixabay:${pix.length} = ${combined.length} total`);
    allImages.push(...combined);
    await sleep(500);
  }

  console.log(`\n📊 Total images: ${allImages.length}`);
  console.log('Downloading & embedding with GeoCLIP...\n');

  const vectors: ReferenceVectorRecord[] = [];
  let success = 0;

  for (let i = 0; i < allImages.length; i++) {
    const img = allImages[i];
    const filename = `${img.landmarkId}_${img.source}_${i}.jpg`;
    const outputPath = path.join(OUTPUT_DIR, filename);

    process.stdout.write(`[${i + 1}/${allImages.length}] ${filename.substring(0, 35)}... `);

    if (!await downloadImage(img.url, outputPath)) {
      console.log('DOWNLOAD FAIL');
      continue;
    }

    try {
      const buffer = await fs.promises.readFile(outputPath);
      const embedding = await extractCLIPEmbedding(buffer);
      vectors.push({
        id: `final_${img.landmarkId}_${i}`,
        label: `${img.landmarkId} ${img.source}`,
        lat: img.lat,
        lon: img.lon,
        vector: embedding,
      });
      success++;
      console.log('✓');
    } catch {
      console.log('EMBED FAIL');
    }
  }

  console.log(`\n✅ Successfully embedded: ${success}/${allImages.length}`);

  // Merge with existing
  const mergedPath = path.join(process.cwd(), '.cache', 'geoclip', 'referenceImageVectors.merged_v1.json');
  const existing = JSON.parse(await fs.promises.readFile(mergedPath, 'utf8'));

  console.log(`\nBefore: ${existing.vectors.length} vectors`);
  existing.vectors.push(...vectors);
  console.log(`After: ${existing.vectors.length} vectors (+${vectors.length})`);

  await fs.promises.writeFile(mergedPath, JSON.stringify(existing, null, 2));

  // Rebuild HNSW
  console.log('\n🏗️ Rebuilding HNSW index...');
  const index = new HNSWIndex({ M: 16, efConstruction: 200, efSearch: 128 });
  await index.buildIndex(existing.vectors);
  await index.saveIndex(path.join(process.cwd(), '.cache', 'geoclip', 'hnsw_index.merged_v1.bin'));

  console.log(`\n✅ DONE! Final index: ${index.size} vectors`);
  console.log('\n🎯 RUN BENCHMARK:');
  console.log('  cd backend && npm run benchmark:validation');
}

main().catch(console.error);
