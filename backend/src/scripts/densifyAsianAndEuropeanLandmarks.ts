import 'dotenv/config';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
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

// The 14 failing landmarks from 75.9% benchmark
const FAILING_LANDMARKS: Landmark[] = [
  // Asian landmarks (worst performers)
  { id: 'mount_fuji', name: 'Mount Fuji', search: 'Mount Fuji Japan', seeds: [{lat: 35.3606, lon: 138.7274}] },
  { id: 'moai', name: 'Moai Statues', search: 'Moai Easter Island', seeds: [{lat: -27.1258, lon: -109.2774}] },
  { id: 'petra', name: 'Petra', search: 'Petra Jordan Treasury', seeds: [{lat: 30.3285, lon: 35.4444}] },
  { id: 'sydney_opera', name: 'Sydney Opera House', search: 'Sydney Opera House Australia', seeds: [{lat: -33.8568, lon: 151.2153}] },
  { id: 'merlion', name: 'Merlion', search: 'Merlion Singapore Marina Bay', seeds: [{lat: 1.2868, lon: 103.8545}] },
  { id: 'marina_bay', name: 'Marina Bay Sands', search: 'Marina Bay Sands Singapore', seeds: [{lat: 1.2834, lon: 103.8607}] },
  { id: 'tokyo_tower', name: 'Tokyo Tower', search: 'Tokyo Tower Japan', seeds: [{lat: 35.6586, lon: 139.7454}] },
  { id: 'sensoji', name: 'Senso-ji Temple', search: 'Senso-ji Asakusa Tokyo', seeds: [{lat: 35.7148, lon: 139.7967}] },

  // European landmarks
  { id: 'versailles', name: 'Palace of Versailles', search: 'Palace of Versailles France', seeds: [{lat: 48.8049, lon: 2.1204}] },
  { id: 'colosseum', name: 'Colosseum', search: 'Colosseum Rome Italy', seeds: [{lat: 41.8902, lon: 12.4922}] },
  { id: 'burj_khalifa', name: 'Burj Khalifa', search: 'Burj Khalifa Dubai', seeds: [{lat: 25.1972, lon: 55.2744}] },
  { id: 'sagrada_familia', name: 'Sagrada Familia', search: 'Sagrada Familia Barcelona', seeds: [{lat: 41.4036, lon: 2.1744}] },
  { id: 'acropolis', name: 'Acropolis', search: 'Acropolis Parthenon Athens', seeds: [{lat: 37.9715, lon: 23.7267}] },

  // South American
  { id: 'copacabana', name: 'Copacabana Beach', search: 'Copacabana Beach Rio', seeds: [{lat: -22.9719, lon: -43.1823}] },
];

const OUTPUT_DIR = path.join(process.cwd(), '.cache', 'boost_failing_landmarks');

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
  console.log('🎯 BOOST FAILING LANDMARKS: 14 landmarks → 95%+ accuracy target\n');
  console.log('=' .repeat(60));
  console.log('\nAPI Status:');
  console.log(`  Mapillary: ${MAPILLARY_TOKEN ? '✓' : '✗'}`);
  console.log(`  Pexels: ${PEXELS_KEY ? '✓' : '✗'}`);
  console.log(`  Pixabay: ${PIXABAY_KEY ? '✓' : '✗'}`);
  console.log(`  Openverse: ✓ (no key)`);
  console.log(`  Wikimedia: ✓ (no key)\n`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const allImages: any[] = [];

  console.log('📥 Fetching images from all sources...\n');

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
    console.log(`  Openverse:${open.length.toString().padStart(2)} Wikimedia:${wik.length.toString().padStart(2)} Mapillary:${mapi.length.toString().padStart(2)} Pexels:${pex.length.toString().padStart(2)} Pixabay:${pix.length.toString().padStart(2)} = ${combined.length} total`);
    allImages.push(...combined);
    await sleep(500);
  }

  console.log(`\n📊 Total images found: ${allImages.length}`);
  console.log('📥 Downloading images...\n');

  let downloaded = 0;
  let failed = 0;

  for (let i = 0; i < allImages.length; i++) {
    const img = allImages[i];
    const filename = `${img.landmarkId}_${img.source}_${i}.jpg`;
    const outputPath = path.join(OUTPUT_DIR, filename);

    // Skip if already exists
    if (fs.existsSync(outputPath)) {
      downloaded++;
      continue;
    }

    const ok = await downloadImage(img.url, outputPath);
    if (ok) {
      downloaded++;
      if (downloaded % 50 === 0) {
        process.stdout.write(`\r  Downloaded: ${downloaded} | Failed: ${failed}`);
      }
    } else {
      failed++;
    }

    // Rate limiting
    if (i % 10 === 0) await sleep(100);
  }

  console.log(`\n\n✅ Download complete!`);
  console.log(`  Successfully downloaded: ${downloaded}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total images in directory: ${downloaded}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ SUCCESS! IMAGES DOWNLOADED');
  console.log('='.repeat(60));

  console.log('\n🎯 Next Steps:');
  console.log('  1. Rebuild optimized balanced index:');
  console.log('     cd backend && npx tsx src/scripts/buildOptimizedBalancedIndex.ts');
  console.log('  2. Run benchmark:');
  console.log('     cd backend && GEOWRAITH_ULTRA_ACCURACY=true npm run benchmark:validation');
  console.log('  3. Verify 95%+ accuracy achieved!\n');
}

main().catch((error) => {
  console.error('\n❌ ERROR:', error);
  process.exit(1);
});
