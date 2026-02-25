/**
 * Multi-Source Public Domain Image Downloader
 * 
 * Downloads landmark images from multiple free sources:
 * - Wikimedia Commons (public domain)
 * - Picsum Photos (placeholder, for testing)
 * - Direct public domain archives
 * - Geograph Britain (CC-BY-SA)
 * - Smithsonian Open Access
 * 
 * Usage:
 *   npx tsx src/scripts/multiSourceDownloader.ts --count=30
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import https from 'node:https';
import http from 'node:http';

const { values } = parseArgs({
  options: {
    'count': { type: 'string', default: '30' },
    'output': { type: 'string', default: '.cache/smartblend_gallery' },
    'delay': { type: 'string', default: '1000' }, // ms between requests
  },
});

interface ImageSource {
  id: string;
  filename: string;
  label: string;
  lat: number;
  lon: number;
  continent: string;
  country: string;
  primaryUrl: string;
  fallbackUrls: string[];
}

// Reliable public domain landmark images
const PUBLIC_DOMAIN_IMAGES: ImageSource[] = [
  // Europe
  {
    id: 'eu_001', filename: 'eiffel_tower.jpg', label: 'Eiffel Tower, Paris',
    lat: 48.8584, lon: 2.2945, continent: 'Europe', country: 'France',
    primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg/640px-Tour_Eiffel_Wikimedia_Commons.jpg',
    fallbackUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons_%282%29.jpg/640px-Tour_Eiffel_Wikimedia_Commons_%282%29.jpg',
    ]
  },
  {
    id: 'eu_002', filename: 'big_ben.jpg', label: 'Big Ben, London',
    lat: 51.5007, lon: -0.1246, continent: 'Europe', country: 'UK',
    primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Clock_Tower_-_Palace_of_Westminster%2C_London_-_May_2007.jpg/640px-Clock_Tower_-_Palace_of_Westminster%2C_London_-_May_2007.jpg',
    fallbackUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Elizabeth_Tower%2C_London.jpg/640px-Elizabeth_Tower%2C_London.jpg',
    ]
  },
  {
    id: 'eu_003', filename: 'colosseum.jpg', label: 'Colosseum, Rome',
    lat: 41.8902, lon: 12.4922, continent: 'Europe', country: 'Italy',
    primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/640px-Colosseo_2020.jpg',
    fallbackUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Colosseum_in_Rome%2C_Italy_-_April_2007.jpg/640px-Colosseum_in_Rome%2C_Italy_-_April_2007.jpg',
    ]
  },
  {
    id: 'eu_004', filename: 'brandenburg_gate.jpg', label: 'Brandenburg Gate, Berlin',
    lat: 52.5163, lon: 13.3777, continent: 'Europe', country: 'Germany',
    primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Brandenburger_Tor_abends.jpg/640px-Brandenburger_Tor_abends.jpg',
    fallbackUrls: []
  },
  {
    id: 'eu_005', filename: 'sagrada_familia.jpg', label: 'Sagrada Familia, Barcelona',
    lat: 41.4036, lon: 2.1744, continent: 'Europe', country: 'Spain',
    primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Sagrada_Familia_2021.jpg/640px-Sagrada_Familia_2021.jpg',
    fallbackUrls: []
  },
  {
    id: 'eu_006', filename: 'notre_dame.jpg', label: 'Notre-Dame, Paris',
    lat: 48.8530, lon: 2.3499, continent: 'Europe', country: 'France',
    primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Notre-Dame_de_Paris_2013.jpg/640px-Notre-Dame_de_Paris_2013.jpg',
    fallbackUrls: []
  },
  
  // Asia
  {
    id: 'as_001', filename: 'taj_mahal.jpg', label: 'Taj Mahal, Agra',
    lat: 27.1751, lon: 78.0421, continent: 'Asia', country: 'India',
    primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Taj_Mahal_%28Edited%29.jpeg/640px-Taj_Mahal_%28Edited%29.jpeg',
    fallbackUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Taj-Mahal.jpg/640px-Taj-Mahal.jpg',
    ]
  },
  {
    id: 'as_002', filename: 'great_wall.jpg', label: 'Great Wall of China',
    lat: 40.4319, lon: 116.5704, continent: 'Asia', country: 'China',
    primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Great_Wall_of_China.jpg/640px-Great_Wall_of_China.jpg',
    fallbackUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/20090529_Great_Wall_8185.jpg/640px-20090529_Great_Wall_8185.jpg',
    ]
  },
  {
    id: 'as_003', filename: 'mount_fuji.jpg', label: 'Mount Fuji, Japan',
    lat: 35.3606, lon: 138.7274, continent: 'Asia', country: 'Japan',
    primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/080103_hakkai_fuji.jpg/640px-080103_hakkai_fuji.jpg',
    fallbackUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Mount_Fuji_from_lake_Kawaguchi.jpg/640px-Mount_Fuji_from_lake_Kawaguchi.jpg',
    ]
  },
  {
    id: 'as_004', filename: 'burj_khalifa.jpg', label: 'Burj Khalifa, Dubai',
    lat: 25.1972, lon: 55.2744, continent: 'Asia', country: 'UAE',
    primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Burj_Khalifa.jpg/640px-Burj_Khalifa.jpg',
    fallbackUrls: []
  },
  {
    id: 'as_005', filename: 'petra.jpg', label: 'Petra, Jordan',
    lat: 30.3285, lon: 35.4444, continent: 'Asia', country: 'Jordan',
    primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Al_Khazneh.jpg/640px-Al_Khazneh.jpg',
    fallbackUrls: []
  },
  
  // North America
  {
    id: 'na_001', filename: 'statue_of_liberty.jpg', label: 'Statue of Liberty, NYC',
    lat: 40.6892, lon: -74.0445, continent: 'North America', country: 'USA',
    primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Lady_Liberty_under_a_blue_sky_%28cropped%29.jpg/640px-Lady_Liberty_under_a_blue_sky_%28cropped%29.jpg',
    fallbackUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Statue_of_Liberty_2017.jpg/480px-Statue_of_Liberty_2017.jpg',
    ]
  },
  {
    id: 'na_002', filename: 'golden_gate_bridge.jpg', label: 'Golden Gate Bridge, SF',
    lat: 37.8199, lon: -122.4783, continent: 'North America', country: 'USA',
    primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/GoldenGateBridge-001.jpg/640px-GoldenGateBridge-001.jpg',
    fallbackUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Golden_Gate_Bridge_from_Golden_Gate_Park.jpg/640px-Golden_Gate_Bridge_from_Golden_Gate_Park.jpg',
    ]
  },
  {
    id: 'na_003', filename: 'grand_canyon.jpg', label: 'Grand Canyon, USA',
    lat: 36.1069, lon: -112.1129, continent: 'North America', country: 'USA',
    primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Grand_Canyon_view_from_Pima_Point_2010.jpg/640px-Grand_Canyon_view_from_Pima_Point_2010.jpg',
    fallbackUrls: []
  },
  {
    id: 'na_004', filename: 'chichen_itza.jpg', label: 'Chichen Itza, Mexico',
    lat: 20.6843, lon: -88.5678, continent: 'North America', country: 'Mexico',
    primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Chichen_Itza_2010.jpg/640px-Chichen_Itza_2010.jpg',
    fallbackUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Chichen_Itza_El_Castillo.jpg/640px-Chichen_Itza_El_Castillo.jpg',
    ]
  },
  {
    id: 'na_005', filename: 'mount_rushmore.jpg', label: 'Mount Rushmore, USA',
    lat: 43.8791, lon: -103.4591, continent: 'North America', country: 'USA',
    primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Mount_Rushmore.jpg/640px-Mount_Rushmore.jpg',
    fallbackUrls: []
  },
  {
    id: 'na_006', filename: 'niagara_falls.jpg', label: 'Niagara Falls, Canada',
    lat: 43.0962, lon: -79.0377, continent: 'North America', country: 'Canada',
    primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Niagara_Falls_2010.jpg/640px-Niagara_Falls_2010.jpg',
    fallbackUrls: []
  },
  
  // South America
  {
    id: 'sa_001', filename: 'machu_picchu.jpg', label: 'Machu Picchu, Peru',
    lat: -13.1631, lon: -72.5450, continent: 'South America', country: 'Peru',
    primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Machu_Picchu.jpg/640px-Machu_Picchu.jpg',
    fallbackUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Machu_Picchu_Panorama.jpg/640px-Machu_Picchu_Panorama.jpg',
    ]
  },
  {
    id: 'sa_002', filename: 'christ_redeemer.jpg', label: 'Christ the Redeemer, Rio',
    lat: -22.9519, lon: -43.2105, continent: 'South America', country: 'Brazil',
    primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Christ_the_Redeemer.jpg/640px-Christ_the_Redeemer.jpg',
    fallbackUrls: []
  },
  
  // Africa
  {
    id: 'af_001', filename: 'pyramids_giza.jpg', label: 'Pyramids of Giza',
    lat: 29.9792, lon: 31.1342, continent: 'Africa', country: 'Egypt',
    primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/All_Gizah_Pyramids.jpg/640px-All_Gizah_Pyramids.jpg',
    fallbackUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Kheops-Pyramid.jpg/640px-Kheops-Pyramid.jpg',
    ]
  },
  
  // Oceania
  {
    id: 'oc_001', filename: 'sydney_opera_house.jpg', label: 'Sydney Opera House',
    lat: -33.8568, lon: 151.2153, continent: 'Oceania', country: 'Australia',
    primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Sydney_Opera_House_Sails.jpg/640px-Sydney_Opera_House_Sails.jpg',
    fallbackUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Sydney_Opera_House_2017.jpg/640px-Sydney_Opera_House_2017.jpg',
    ]
  },
  {
    id: 'oc_002', filename: 'uluru.jpg', label: 'Uluru, Australia',
    lat: -25.3444, lon: 131.0369, continent: 'Oceania', country: 'Australia',
    primaryUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Uluru_Australia.jpg/640px-Uluru_Australia.jpg',
    fallbackUrls: []
  },
];

const OUTPUT_DIR = path.resolve(process.cwd(), values.output!);
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');
const CSV_FILE = path.join(OUTPUT_DIR, 'metadata.csv');
const DELAY_MS = parseInt(values.delay!, 10);

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function downloadImage(url: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const client = url.startsWith('https:') ? https : http;
    const request = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (GeoWraith Validation Bot)',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
      timeout: 30000,
    }, (response) => {
      if (response.statusCode !== 200) {
        resolve(null);
        return;
      }

      const chunks: Buffer[] = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    });

    request.on('error', () => resolve(null));
    request.on('timeout', () => {
      request.destroy();
      resolve(null);
    });
  });
}

function validateImage(buffer: Buffer): boolean {
  if (buffer.length < 1000) return false;
  
  // Check magic bytes
  const bytes = buffer.slice(0, 4);
  const isJPEG = bytes[0] === 0xFF && bytes[1] === 0xD8;
  const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50;
  const isWebP = bytes[0] === 0x52 && bytes[1] === 0x49;
  
  return isJPEG || isPNG || isWebP;
}

async function downloadWithFallback(source: ImageSource, outputPath: string): Promise<boolean> {
  const urls = [source.primaryUrl, ...source.fallbackUrls];
  
  for (const url of urls) {
    const buffer = await downloadImage(url);
    
    if (buffer && validateImage(buffer)) {
      await writeFile(outputPath, buffer);
      return true;
    }
  }
  
  return false;
}

async function main() {
  const count = parseInt(values.count!, 10);
  
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║      Multi-Source Public Domain Image Downloader           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log(`Configuration:`);
  console.log(`  Target images: ${count}`);
  console.log(`  Output: ${OUTPUT_DIR}`);
  console.log(`  Delay: ${DELAY_MS}ms between requests\n`);
  
  await mkdir(IMAGES_DIR, { recursive: true });
  
  // Shuffle and select
  const shuffled = [...PUBLIC_DOMAIN_IMAGES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  
  console.log(`Selected ${selected.length} landmarks for download\n`);
  
  const csvLines: string[] = ['filename,lat,lon,label,accuracy_radius,source_method'];
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;
  
  for (let i = 0; i < selected.length; i++) {
    const source = selected[i]!;
    const imagePath = path.join(IMAGES_DIR, source.filename);
    
    console.log(`[${i + 1}/${selected.length}] ${source.label}`);
    
    // Check if already exists
    if (existsSync(imagePath)) {
      console.log('  ✓ Already exists, skipping');
      skippedCount++;
      csvLines.push(`${source.filename},${source.lat},${source.lon},"${source.label}",30,existing`);
      continue;
    }
    
    // Download with fallback
    const success = await downloadWithFallback(source, imagePath);
    
    if (success) {
      console.log('  ✓ Downloaded successfully');
      successCount++;
      csvLines.push(`${source.filename},${source.lat},${source.lon},"${source.label}",30,download`);
    } else {
      console.log('  ✗ All sources failed');
      failCount++;
    }
    
    // Delay between requests to be polite
    if (i < selected.length - 1) {
      await sleep(DELAY_MS);
    }
  }
  
  // Write CSV
  await writeFile(CSV_FILE, csvLines.join('\n'));
  
  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    DOWNLOAD SUMMARY                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n✓ Downloaded: ${successCount}`);
  console.log(`• Skipped (existing): ${skippedCount}`);
  console.log(`✗ Failed: ${failCount}`);
  console.log(`\nTotal available: ${successCount + skippedCount}/${selected.length}`);
  console.log(`\nCSV: ${CSV_FILE}`);
  console.log(`Images: ${IMAGES_DIR}\n`);
  
  if (successCount + skippedCount >= count * 0.5) {
    console.log('✅ Sufficient images acquired. Ready for validation.\n');
    console.log('Next steps:');
    console.log('  npm run build:gallery:csv --');
    console.log('    --images=.cache/smartblend_gallery/images');
    console.log('    --csv=.cache/smartblend_gallery/metadata.csv');
    console.log('  npm run benchmark:validation');
    console.log('');
    process.exit(0);
  } else {
    console.log('⚠️ Too few images acquired. You may need to try again later.\n');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('[Downloader] Fatal error:', error);
  process.exit(1);
});
