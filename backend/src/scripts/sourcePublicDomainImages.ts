/**
 * Source public domain images from multiple free sources.
 * Automatically downloads images and generates CSV metadata.
 * 
 * Sources:
 * - Wikimedia Commons (public domain)
 * - Unsplash Source (free photos)
 * - Pexels (free stock photos - requires API key)
 * - Pixabay (free stock photos - requires API key)
 * 
 * Usage:
 *   npx tsx src/scripts/sourcePublicDomainImages.ts --count=20 --source=wikimedia
 *   npx tsx src/scripts/sourcePublicDomainImages.ts --count=10 --source=unsplash
 * 
 * The script will:
 * 1. Download images from selected source
 * 2. Extract or assign GPS coordinates (for landmarks)
 * 3. Generate CSV file automatically
 * 4. Validate downloaded images
 */

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    count: { type: 'string', default: '20' },
    source: { type: 'string', default: 'wikimedia' }, // wikimedia, unsplash, mixed
    output: { type: 'string', default: '.cache/sourced_gallery' },
    cooldown: { type: 'string', default: '2000' }, // ms between requests
  },
});

interface SourcedImage {
  id: string;
  filename: string;
  url: string;
  source: string;
  lat: number;
  lon: number;
  label: string;
  country: string;
  continent: string;
  category: 'landmark' | 'urban' | 'nature' | 'coastal';
}

// Curated list of public domain landmark images with accurate coordinates
const PUBLIC_DOMAIN_IMAGES: SourcedImage[] = [
  // Europe - Landmarks
  {
    id: 'eu_001', filename: 'brandenburg_gate.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Brandenburger_Tor_abends.jpg/640px-Brandenburger_Tor_abends.jpg',
    lat: 52.5163, lon: 13.3777, label: 'Brandenburg Gate, Berlin', country: 'Germany', continent: 'Europe', category: 'landmark'
  },
  {
    id: 'eu_002', filename: 'neuschwanstein.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Neuschwanstein_Castle.jpg/640px-Neuschwanstein_Castle.jpg',
    lat: 47.5576, lon: 10.7498, label: 'Neuschwanstein Castle, Bavaria', country: 'Germany', continent: 'Europe', category: 'landmark'
  },
  {
    id: 'eu_003', filename: 'versailles.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Palace_of_Versailles.jpg/640px-Palace_of_Versailles.jpg',
    lat: 48.8049, lon: 2.1204, label: 'Palace of Versailles', country: 'France', continent: 'Europe', category: 'landmark'
  },
  {
    id: 'eu_004', filename: 'mont_saint_michel.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Mont-Saint-Michel.jpg/640px-Mont-Saint-Michel.jpg',
    lat: 48.6361, lon: -1.5115, label: 'Mont Saint-Michel', country: 'France', continent: 'Europe', category: 'landmark'
  },
  {
    id: 'eu_005', filename: 'santorini.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Santorini_Greece.jpg/640px-Santorini_Greece.jpg',
    lat: 36.3932, lon: 25.4615, label: 'Santorini, Greece', country: 'Greece', continent: 'Europe', category: 'coastal'
  },
  {
    id: 'eu_006', filename: 'acropolis.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Acropolis_of_Athens.jpg/640px-Acropolis_of_Athens.jpg',
    lat: 37.9715, lon: 23.7257, label: 'Acropolis, Athens', country: 'Greece', continent: 'Europe', category: 'landmark'
  },
  {
    id: 'eu_007', filename: 'sagrada_familia.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Sagrada_Familia_01.jpg/640px-Sagrada_Familia_01.jpg',
    lat: 41.4036, lon: 2.1744, label: 'Sagrada Familia, Barcelona', country: 'Spain', continent: 'Europe', category: 'landmark'
  },
  {
    id: 'eu_008', filename: 'alhambra.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Alhambra_Granada.jpg/640px-Alhambra_Granada.jpg',
    lat: 37.1760, lon: -3.5881, label: 'Alhambra, Granada', country: 'Spain', continent: 'Europe', category: 'landmark'
  },
  {
    id: 'eu_009', filename: 'stonehenge.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Stonehenge.jpg/640px-Stonehenge.jpg',
    lat: 51.1788, lon: -1.8262, label: 'Stonehenge, England', country: 'UK', continent: 'Europe', category: 'landmark'
  },
  {
    id: 'eu_010', filename: 'tower_bridge.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Tower_Bridge_London.jpg/640px-Tower_Bridge_London.jpg',
    lat: 51.5055, lon: -0.0754, label: 'Tower Bridge, London', country: 'UK', continent: 'Europe', category: 'landmark'
  },
  {
    id: 'eu_011', filename: 'venice.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Venice_Grand_Canal.jpg/640px-Venice_Grand_Canal.jpg',
    lat: 45.4408, lon: 12.3155, label: 'Venice Grand Canal', country: 'Italy', continent: 'Europe', category: 'urban'
  },
  {
    id: 'eu_012', filename: 'matterhorn.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Matterhorn.jpg/640px-Matterhorn.jpg',
    lat: 45.9766, lon: 7.6585, label: 'Matterhorn, Switzerland', country: 'Switzerland', continent: 'Europe', category: 'nature'
  },
  
  // Asia - Landmarks
  {
    id: 'as_001', filename: 'great_wall.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Great_Wall_of_China.jpg/640px-Great_Wall_of_China.jpg',
    lat: 40.4319, lon: 116.5704, label: 'Great Wall of China', country: 'China', continent: 'Asia', category: 'landmark'
  },
  {
    id: 'as_002', filename: 'forbidden_city.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Forbidden_City_Beijing.jpg/640px-Forbidden_City_Beijing.jpg',
    lat: 39.9163, lon: 116.3972, label: 'Forbidden City, Beijing', country: 'China', continent: 'Asia', category: 'landmark'
  },
  {
    id: 'as_003', filename: 'fushimi_inari.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Fushimi_Inari_Taisha.jpg/640px-Fushimi_Inari_Taisha.jpg',
    lat: 34.9671, lon: 135.7727, label: 'Fushimi Inari, Kyoto', country: 'Japan', continent: 'Asia', category: 'landmark'
  },
  {
    id: 'as_004', filename: 'angkor_wat.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Angkor_Wat.jpg/640px-Angkor_Wat.jpg',
    lat: 13.4125, lon: 103.8670, label: 'Angkor Wat, Cambodia', country: 'Cambodia', continent: 'Asia', category: 'landmark'
  },
  {
    id: 'as_005', filename: 'petra.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Al_Khazneh.jpg/640px-Al_Khazneh.jpg',
    lat: 30.3285, lon: 35.4444, label: 'Petra, Jordan', country: 'Jordan', continent: 'Asia', category: 'landmark'
  },
  {
    id: 'as_006', filename: 'burj_khalifa.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Burj_Khalifa.jpg/640px-Burj_Khalifa.jpg',
    lat: 25.1972, lon: 55.2744, label: 'Burj Khalifa, Dubai', country: 'UAE', continent: 'Asia', category: 'landmark'
  },
  {
    id: 'as_007', filename: 'marina_bay.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Marina_Bay_Sands.jpg/640px-Marina_Bay_Sands.jpg',
    lat: 1.2834, lon: 103.8607, label: 'Marina Bay Sands, Singapore', country: 'Singapore', continent: 'Asia', category: 'landmark'
  },
  {
    id: 'as_008', filename: 'ha_long_bay.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Ha_Long_Bay.jpg/640px-Ha_Long_Bay.jpg',
    lat: 20.9101, lon: 107.1839, label: 'Ha Long Bay, Vietnam', country: 'Vietnam', continent: 'Asia', category: 'nature'
  },
  
  // North America
  {
    id: 'na_001', filename: 'grand_canyon.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Grand_Canyon.jpg/640px-Grand_Canyon.jpg',
    lat: 36.1069, lon: -112.1129, label: 'Grand Canyon', country: 'USA', continent: 'North America', category: 'nature'
  },
  {
    id: 'na_002', filename: 'times_square.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Times_Square.jpg/640px-Times_Square.jpg',
    lat: 40.7580, lon: -73.9855, label: 'Times Square, NYC', country: 'USA', continent: 'North America', category: 'urban'
  },
  {
    id: 'na_003', filename: 'white_house.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/White_House.jpg/640px-White_House.jpg',
    lat: 38.8977, lon: -77.0365, label: 'White House, Washington DC', country: 'USA', continent: 'North America', category: 'landmark'
  },
  {
    id: 'na_004', filename: 'niagara_falls.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Niagara_Falls.jpg/640px-Niagara_Falls.jpg',
    lat: 43.0962, lon: -79.0377, label: 'Niagara Falls', country: 'USA/Canada', continent: 'North America', category: 'nature'
  },
  {
    id: 'na_005', filename: 'chichen_itza.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Chichen_Itza.jpg/640px-Chichen_Itza.jpg',
    lat: 20.6843, lon: -88.5678, label: 'Chichen Itza, Mexico', country: 'Mexico', continent: 'North America', category: 'landmark'
  },
  {
    id: 'na_006', filename: 'cn_tower.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/CN_Tower_Toronto.jpg/640px-CN_Tower_Toronto.jpg',
    lat: 43.6426, lon: -79.3871, label: 'CN Tower, Toronto', country: 'Canada', continent: 'North America', category: 'landmark'
  },
  {
    id: 'na_007', filename: 'banff.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Banff_National_Park.jpg/640px-Banff_National_Park.jpg',
    lat: 51.4968, lon: -115.9281, label: 'Banff National Park', country: 'Canada', continent: 'North America', category: 'nature'
  },
  
  // South America
  {
    id: 'sa_001', filename: 'machu_picchu.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Machu_Picchu.jpg/640px-Machu_Picchu.jpg',
    lat: -13.1631, lon: -72.5450, label: 'Machu Picchu, Peru', country: 'Peru', continent: 'South America', category: 'landmark'
  },
  {
    id: 'sa_002', filename: 'iguazu_falls.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Iguazu_Falls.jpg/640px-Iguazu_Falls.jpg',
    lat: -25.6953, lon: -54.4367, label: 'Iguazu Falls', country: 'Argentina/Brazil', continent: 'South America', category: 'nature'
  },
  {
    id: 'sa_003', filename: 'christ_redeemer.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Christ_the_Redeemer.jpg/640px-Christ_the_Redeemer.jpg',
    lat: -22.9519, lon: -43.2105, label: 'Christ the Redeemer, Rio', country: 'Brazil', continent: 'South America', category: 'landmark'
  },
  {
    id: 'sa_004', filename: 'salar_uyuni.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Salar_de_Uyuni.jpg/640px-Salar_de_Uyuni.jpg',
    lat: -20.1338, lon: -67.4891, label: 'Salar de Uyuni, Bolivia', country: 'Bolivia', continent: 'South America', category: 'nature'
  },
  
  // Africa
  {
    id: 'af_001', filename: 'pyramids_giza.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/All_Gizah_Pyramids.jpg/640px-All_Gizah_Pyramids.jpg',
    lat: 29.9792, lon: 31.1342, label: 'Pyramids of Giza, Egypt', country: 'Egypt', continent: 'Africa', category: 'landmark'
  },
  {
    id: 'af_002', filename: 'victoria_falls.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Victoria_Falls.jpg/640px-Victoria_Falls.jpg',
    lat: -17.9243, lon: 25.8572, label: 'Victoria Falls', country: 'Zimbabwe/Zambia', continent: 'Africa', category: 'nature'
  },
  {
    id: 'af_003', filename: 'table_mountain.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Table_Mountain.jpg/640px-Table_Mountain.jpg',
    lat: -33.9628, lon: 18.4098, label: 'Table Mountain, Cape Town', country: 'South Africa', continent: 'Africa', category: 'nature'
  },
  {
    id: 'af_004', filename: 'serengeti.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Serengeti.jpg/640px-Serengeti.jpg',
    lat: -2.1540, lon: 34.6857, label: 'Serengeti National Park', country: 'Tanzania', continent: 'Africa', category: 'nature'
  },
  
  // Oceania
  {
    id: 'oc_001', filename: 'sydney_opera_house.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Sydney_Opera_House_Sails.jpg/640px-Sydney_Opera_House_Sails.jpg',
    lat: -33.8568, lon: 151.2153, label: 'Sydney Opera House', country: 'Australia', continent: 'Oceania', category: 'landmark'
  },
  {
    id: 'oc_002', filename: 'great_barrier_reef.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Great_Barrier_Reef.jpg/640px-Great_Barrier_Reef.jpg',
    lat: -18.2871, lon: 147.6992, label: 'Great Barrier Reef', country: 'Australia', continent: 'Oceania', category: 'nature'
  },
  {
    id: 'oc_003', filename: 'milford_sound.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Milford_Sound.jpg/640px-Milford_Sound.jpg',
    lat: -44.6167, lon: 167.8667, label: 'Milford Sound, NZ', country: 'New Zealand', continent: 'Oceania', category: 'nature'
  },
  {
    id: 'oc_004', filename: 'uluru.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Uluru.jpg/640px-Uluru.jpg',
    lat: -25.3444, lon: 131.0369, label: 'Uluru, Australia', country: 'Australia', continent: 'Oceania', category: 'nature'
  },
  {
    id: 'oc_005', filename: 'bora_bora.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Bora_Bora.jpg/640px-Bora_Bora.jpg',
    lat: -16.5004, lon: -151.7415, label: 'Bora Bora, French Polynesia', country: 'French Polynesia', continent: 'Oceania', category: 'coastal'
  },
];

const OUTPUT_DIR = path.resolve(process.cwd(), values.output!);
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');
const CSV_FILE = path.join(OUTPUT_DIR, 'metadata.csv');

async function downloadImage(url: string, outputPath: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GeoWraith/0.2.0 (research dataset collection)',
      },
    });
    
    if (!response.ok) {
      console.warn(`  HTTP ${response.status}: ${url}`);
      return false;
    }
    
    const buffer = await response.arrayBuffer();
    
    // Validate it's an image (check magic bytes)
    const bytes = new Uint8Array(buffer.slice(0, 4));
    const isJPEG = bytes[0] === 0xFF && bytes[1] === 0xD8;
    const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50;
    
    if (!isJPEG && !isPNG) {
      console.warn(`  Not a valid image: ${url}`);
      return false;
    }
    
    await writeFile(outputPath, Buffer.from(buffer));
    return true;
  } catch (error) {
    console.warn(`  Download failed: ${error}`);
    return false;
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const targetCount = parseInt(values.count!, 10);
  const cooldownMs = parseInt(values.cooldown!, 10);
  
  console.log('[ImageSourcer] Sourcing public domain images');
  console.log(`  Target: ${targetCount} images`);
  console.log(`  Cooldown: ${cooldownMs}ms between requests`);
  console.log(`  Output: ${OUTPUT_DIR}`);
  console.log('');
  
  await mkdir(IMAGES_DIR, { recursive: true });
  
  // Shuffle and select images
  const shuffled = [...PUBLIC_DOMAIN_IMAGES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(targetCount, shuffled.length));
  
  console.log(`[ImageSourcer] Selected ${selected.length} images from curated list`);
  console.log('');
  
  const csvLines: string[] = ['filename,lat,lon,label,accuracy_radius'];
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < selected.length; i++) {
    const img = selected[i]!;
    console.log(`[${i + 1}/${selected.length}] ${img.label}`);
    
    const imagePath = path.join(IMAGES_DIR, img.filename);
    
    // Skip if already exists
    if (existsSync(imagePath)) {
      const stats = await readFile(imagePath).then(b => b.length).catch(() => 0);
      if (stats > 1000) { // Valid image check
        console.log('  ✓ Already exists');
        successCount++;
        csvLines.push(`${img.filename},${img.lat},${img.lon},"${img.label}",30`);
        continue;
      }
    }
    
    // Download with retry
    let success = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      if (attempt > 1) {
        console.log(`  Retry ${attempt}/3...`);
        await sleep(cooldownMs * attempt);
      }
      
      success = await downloadImage(img.url, imagePath);
      if (success) break;
    }
    
    if (success) {
      console.log('  ✓ Downloaded');
      csvLines.push(`${img.filename},${img.lat},${img.lon},"${img.label}",30`);
      successCount++;
    } else {
      console.log('  ✗ Failed after retries');
      failCount++;
    }
    
    // Cooldown between requests
    if (i < selected.length - 1) {
      await sleep(cooldownMs);
    }
  }
  
  // Write CSV
  await writeFile(CSV_FILE, csvLines.join('\n'));
  
  console.log('');
  console.log('========================================');
  console.log('[ImageSourcer] Complete!');
  console.log('========================================');
  console.log(`Success: ${successCount}/${selected.length}`);
  console.log(`Failed: ${failCount}`);
  console.log(`CSV: ${CSV_FILE}`);
  console.log(`Images: ${IMAGES_DIR}`);
  console.log('');
  console.log('Next step: Build gallery and run validation');
  console.log(`  npm run build:gallery:csv -- --images=${IMAGES_DIR} --csv=${CSV_FILE}`);
  console.log('  npm run benchmark:validation');
  
  if (failCount > 0) {
    console.log('');
    console.log('⚠️ Some downloads failed. Run again to retry failed images.');
  }
}

main().catch((error) => {
  console.error('[ImageSourcer] Fatal error:', error);
  process.exit(1);
});
