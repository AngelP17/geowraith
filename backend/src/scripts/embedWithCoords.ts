import 'dotenv/config';
import { promises as fs } from 'fs';
import path from 'path';
import { extractCLIPEmbedding } from '../services/clipExtractor.js';

const IMAGE_DIR = path.resolve(process.cwd(), '.cache/ultra_densified_final');
const MERGED_FILE = path.resolve(process.cwd(), '.cache/geoclip/referenceImageVectors.merged_v1.json');

// Landmark coordinate mapping - expanded for filename prefixes
const LANDMARK_COORDS: Record<string, { lat: number; lon: number }> = {
  marrakech: { lat: 31.6295, lon: -7.9811 },
  perito_moreno: { lat: -50.4957, lon: -73.1376 },
  perito: { lat: -50.4957, lon: -73.1376 },
  jungfrau: { lat: 46.5368, lon: 7.9626 },
  swiss: { lat: 46.5368, lon: 7.9626 },
  cape_point: { lat: -34.3568, lon: 18.4970 },
  cape: { lat: -34.3568, lon: 18.4970 },
  ngorongoro: { lat: -3.1611, lon: 35.5888 },
  copacabana: { lat: -22.9719, lon: -43.1825 },
  table_mountain: { lat: -33.9628, lon: 18.4098 },
  table: { lat: -33.9628, lon: 18.4098 },
  petra: { lat: 30.3285, lon: 35.4444 },
  salar_uyuni: { lat: -20.1338, lon: -67.4891 },
  salar: { lat: -20.1338, lon: -67.4891 },
  sugarloaf: { lat: -22.9496, lon: -43.1549 },
  amsterdam: { lat: 52.3676, lon: 4.9041 },
  moai: { lat: -27.1257, lon: -109.2766 },
  park_guell: { lat: 41.4145, lon: 2.1527 },
  park: { lat: 41.4145, lon: 2.1527 },
  rijksmuseum: { lat: 52.3600, lon: 4.8852 },
  liberty_memorial: { lat: 39.0812, lon: -94.5860 },
  neuschwanstein: { lat: 47.5576, lon: 10.7498 },
  mount_rushmore: { lat: 43.8803, lon: -103.4588 },
  terracotta: { lat: 34.3841, lon: 109.2785 },
  banff: { lat: 51.4968, lon: -115.9281 },
  petronas: { lat: 3.1578, lon: 101.7123 },
  lake_louise: { lat: 51.4254, lon: -116.2163 },
  st_basils: { lat: 55.7525, lon: 37.6231 },
  christ_redeemer: { lat: -22.9519, lon: -43.2105 },
  robben_island: { lat: -33.8076, lon: 18.3712 },
  stonehenge: { lat: 51.1788, lon: -1.8262 },
  yellowstone: { lat: 44.4280, lon: -110.5885 },
  colosseum: { lat: 41.8902, lon: 12.4922 },
  ha_long: { lat: 20.9101, lon: 107.1839 },
  sydney_opera: { lat: -33.8568, lon: 151.2153 },
  angkor_wat: { lat: 13.4125, lon: 103.8670 },
  sagrada_familia: { lat: 41.4036, lon: 2.1744 },
  bagan: { lat: 21.1722, lon: 94.8605 },
  victoria_falls: { lat: -17.9243, lon: 25.8560 },
  serengeti: { lat: -2.3333, lon: 34.8333 },
  eiffel_tower: { lat: 48.8584, lon: 2.2945 },
  tower_bridge: { lat: 51.5055, lon: -0.0754 },
  big_ben: { lat: 51.5007, lon: -0.1246 },
  us_capitol: { lat: 38.8899, lon: -77.0091 },
  mount_fuji: { lat: 35.3606, lon: 138.7274 },
  senso_ji: { lat: 35.7148, lon: 139.7967 },
  forbidden_city: { lat: 39.9163, lon: 116.3972 },
  fushimi_inari: { lat: 34.9671, lon: 135.7727 },
  tokyo_tower: { lat: 35.6586, lon: 139.7454 },
  gyeongbokgung: { lat: 37.5796, lon: 126.9770 },
  schonbrunn: { lat: 48.1845, lon: 16.3119 },
  acropolis: { lat: 37.9715, lon: 23.7257 },
  pyramids: { lat: 29.9792, lon: 31.1342 },
  burj_khalifa: { lat: 25.1972, lon: 55.2744 },
  valley_kings: { lat: 25.7402, lon: 32.6014 },
  terracotta_army: { lat: 34.3841, lon: 109.2785 },
  marina_bay: { lat: 1.2834, lon: 103.8607 },
  merlion: { lat: 1.2868, lon: 103.8545 },
  versailles: { lat: 48.8049, lon: 2.1204 },
  white_house: { lat: 38.8977, lon: -77.0365 },
  statue_liberty: { lat: 40.6892, lon: -74.0445 },
  grand_canyon: { lat: 36.1069, lon: -112.1129 },
  teotihuacan: { lat: 19.6925, lon: -98.8436 },
  yosemite: { lat: 37.8651, lon: -119.5383 },
  great_barrier_reef: { lat: -18.2871, lon: 147.6992 },
};

async function main() {
  console.log('Embedding with proper coordinates...\n');
  
  const files = await fs.readdir(IMAGE_DIR);
  const jpgFiles = files.filter(f => f.endsWith('.jpg'));
  console.log(`Found ${jpgFiles.length} images to embed`);
  
  const existing = JSON.parse(await fs.readFile(MERGED_FILE, 'utf8'));
  console.log(`Existing vectors: ${existing.vectors.length}`);
  
  let embedded = 0;
  let skipped = 0;
  
  for (let i = 0; i < jpgFiles.length; i++) {
    const file = jpgFiles[i];
    const landmarkId = file.split('_')[0];
    const coords = LANDMARK_COORDS[landmarkId];
    
    if (!coords) {
      skipped++;
      continue;
    }
    
    try {
      const buffer = await fs.readFile(path.join(IMAGE_DIR, file));
      const embedding = await extractCLIPEmbedding(buffer);
      
      existing.vectors.push({
        id: `ultra_${landmarkId}_${i}`,
        label: `${landmarkId} ultra`,
        lat: coords.lat,
        lon: coords.lon,
        vector: embedding,
      });
      
      embedded++;
      if (embedded % 50 === 0) {
        process.stdout.write(`\rEmbedded: ${embedded} | Skipped: ${skipped}`);
      }
    } catch (e) { 
      skipped++;
    }
  }
  
  console.log(`\n\nTotal vectors: ${existing.vectors.length} (embedded ${embedded}, skipped ${skipped})`);
  await fs.writeFile(MERGED_FILE, JSON.stringify(existing, null, 2));
  
  console.log('\n✅ Done! Rebuild index with: npx tsx src/scripts/rebuildIndex.ts');
}

main().catch(console.error);
