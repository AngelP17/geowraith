import 'dotenv/config';
import { promises as fs } from 'fs';
import path from 'path';
import { extractCLIPEmbedding } from '../services/clipExtractor.js';
import { HNSWIndex } from '../services/annIndex.js';
import type { ReferenceVectorRecord } from '../types.js';

// ============== CONFIG ==============
const CACHE_ROOT = path.resolve(process.cwd(), '.cache');
const OUTPUT_PATH = path.resolve(CACHE_ROOT, 'geoclip', 'referenceImageVectors.merged_v1.json');
const INDEX_PATH = path.resolve(CACHE_ROOT, 'geoclip', 'hnsw_index.merged_v1.bin');

// All image directories to process
const IMAGE_DIRS = [
  path.join(CACHE_ROOT, 'smartblend_gallery', 'images'),
  path.join(CACHE_ROOT, 'api_images'),
  path.join(CACHE_ROOT, 'api_images_extra'),
  path.join(CACHE_ROOT, 'densified_landmarks'),
  path.join(CACHE_ROOT, 'densified_landmarks_v2'),
  path.join(CACHE_ROOT, 'ultra_densified'),
  path.join(CACHE_ROOT, 'ultra_densified_final'),
];

// Comprehensive landmark coordinate mapping
const LANDMARK_COORDS: Record<string, { lat: number; lon: number; label: string }> = {
  // Original SmartBlend landmarks
  big_ben: { lat: 51.5007, lon: -0.1246, label: 'Big Ben, London' },
  christ_redeemer: { lat: -22.9519, lon: -43.2105, label: 'Christ the Redeemer' },
  colosseum: { lat: 41.8902, lon: 12.4922, label: 'Colosseum, Rome' },
  great_wall: { lat: 40.4319, lon: 116.5704, label: 'Great Wall of China' },
  pyramids_giza: { lat: 29.9792, lon: 31.1342, label: 'Pyramids of Giza' },
  pyramids: { lat: 29.9792, lon: 31.1342, label: 'Pyramids of Giza' },
  machu_picchu: { lat: -13.1631, lon: -72.5450, label: 'Machu Picchu' },
  machu: { lat: -13.1631, lon: -72.5450, label: 'Machu Picchu' },

  // Densified failing landmarks
  marrakech: { lat: 31.6295, lon: -7.9811, label: 'Marrakech Medina' },
  perito_moreno: { lat: -50.4957, lon: -73.1376, label: 'Perito Moreno Glacier' },
  perito: { lat: -50.4957, lon: -73.1376, label: 'Perito Moreno Glacier' },
  jungfrau: { lat: 46.5368, lon: 7.9626, label: 'Jungfrau, Swiss Alps' },
  swiss: { lat: 46.5368, lon: 7.9626, label: 'Swiss Alps' },
  cape_point: { lat: -34.3568, lon: 18.4970, label: 'Cape Point' },
  cape: { lat: -34.3568, lon: 18.4970, label: 'Cape Point' },
  ngorongoro: { lat: -3.1611, lon: 35.5888, label: 'Ngorongoro Crater' },
  copacabana: { lat: -22.9719, lon: -43.1825, label: 'Copacabana Beach' },
  table_mountain: { lat: -33.9628, lon: 18.4098, label: 'Table Mountain' },
  table: { lat: -33.9628, lon: 18.4098, label: 'Table Mountain' },
  petra: { lat: 30.3285, lon: 35.4444, label: 'Petra, Jordan' },
  salar_uyuni: { lat: -20.1338, lon: -67.4891, label: 'Salar de Uyuni' },
  salar: { lat: -20.1338, lon: -67.4891, label: 'Salar de Uyuni' },

  // Additional landmarks
  sugarloaf: { lat: -22.9496, lon: -43.1549, label: 'Sugarloaf Mountain' },
  amsterdam: { lat: 52.3676, lon: 4.9041, label: 'Amsterdam' },
  moai: { lat: -27.1257, lon: -109.2766, label: 'Moai Statues, Easter Island' },
  park_guell: { lat: 41.4145, lon: 2.1527, label: 'Park Güell' },
  park: { lat: 41.4145, lon: 2.1527, label: 'Park Güell' },
  rijksmuseum: { lat: 52.3600, lon: 4.8852, label: 'Rijksmuseum' },
  liberty_memorial: { lat: 39.0812, lon: -94.5860, label: 'Liberty Memorial' },
  neuschwanstein: { lat: 47.5576, lon: 10.7498, label: 'Neuschwanstein Castle' },
  mount_rushmore: { lat: 43.8803, lon: -103.4588, label: 'Mount Rushmore' },
  terracotta: { lat: 34.3841, lon: 109.2785, label: 'Terracotta Army' },
  banff: { lat: 51.4968, lon: -115.9281, label: 'Banff National Park' },
  petronas: { lat: 3.1578, lon: 101.7123, label: 'Petronas Towers' },
  lake_louise: { lat: 51.4254, lon: -116.2163, label: 'Lake Louise' },
  st_basils: { lat: 55.7525, lon: 37.6231, label: 'St Basils Cathedral' },
  robben_island: { lat: -33.8076, lon: 18.3712, label: 'Robben Island' },
  stonehenge: { lat: 51.1788, lon: -1.8262, label: 'Stonehenge' },
  yellowstone: { lat: 44.4280, lon: -110.5885, label: 'Yellowstone' },
  ha_long: { lat: 20.9101, lon: 107.1839, label: 'Ha Long Bay' },
  sydney_opera: { lat: -33.8568, lon: 151.2153, label: 'Sydney Opera House' },
  angkor_wat: { lat: 13.4125, lon: 103.8670, label: 'Angkor Wat' },
  angkor: { lat: 13.4125, lon: 103.8670, label: 'Angkor Wat' },
  sagrada_familia: { lat: 41.4036, lon: 2.1744, label: 'Sagrada Familia' },
  sagrada: { lat: 41.4036, lon: 2.1744, label: 'Sagrada Familia' },
  bagan: { lat: 21.1722, lon: 94.8605, label: 'Bagan Temples' },
  victoria_falls: { lat: -17.9243, lon: 25.8560, label: 'Victoria Falls' },
  victoria: { lat: -17.9243, lon: 25.8560, label: 'Victoria Falls' },
  serengeti: { lat: -2.3333, lon: 34.8333, label: 'Serengeti National Park' },
  eiffel_tower: { lat: 48.8584, lon: 2.2945, label: 'Eiffel Tower' },
  eiffel: { lat: 48.8584, lon: 2.2945, label: 'Eiffel Tower' },
  tower_bridge: { lat: 51.5055, lon: -0.0754, label: 'Tower Bridge' },
  us_capitol: { lat: 38.8899, lon: -77.0091, label: 'US Capitol' },
  mount_fuji: { lat: 35.3606, lon: 138.7274, label: 'Mount Fuji' },
  senso_ji: { lat: 35.7148, lon: 139.7967, label: 'Senso-ji Temple' },
  forbidden_city: { lat: 39.9163, lon: 116.3972, label: 'Forbidden City' },
  forbidden: { lat: 39.9163, lon: 116.3972, label: 'Forbidden City' },
  fushimi_inari: { lat: 34.9671, lon: 135.7727, label: 'Fushimi Inari' },
  fushimi: { lat: 34.9671, lon: 135.7727, label: 'Fushimi Inari' },
  tokyo_tower: { lat: 35.6586, lon: 139.7454, label: 'Tokyo Tower' },
  tokyo: { lat: 35.6586, lon: 139.7454, label: 'Tokyo Tower' },
  gyeongbokgung: { lat: 37.5796, lon: 126.9770, label: 'Gyeongbokgung Palace' },
  schonbrunn: { lat: 48.1845, lon: 16.3119, label: 'Schönbrunn Palace' },
  acropolis: { lat: 37.9715, lon: 23.7257, label: 'Acropolis' },
  burj_khalifa: { lat: 25.1972, lon: 55.2744, label: 'Burj Khalifa' },
  burj: { lat: 25.1972, lon: 55.2744, label: 'Burj Khalifa' },
  valley_kings: { lat: 25.7402, lon: 32.6014, label: 'Valley of the Kings' },
  valley: { lat: 25.7402, lon: 32.6014, label: 'Valley of the Kings' },
  terracotta_army: { lat: 34.3841, lon: 109.2785, label: 'Terracotta Army' },
  marina_bay: { lat: 1.2834, lon: 103.8607, label: 'Marina Bay Sands' },
  marina: { lat: 1.2834, lon: 103.8607, label: 'Marina Bay Sands' },
  merlion: { lat: 1.2868, lon: 103.8545, label: 'Merlion' },
  versailles: { lat: 48.8049, lon: 2.1204, label: 'Palace of Versailles' },
  white_house: { lat: 38.8977, lon: -77.0365, label: 'White House' },
  white: { lat: 38.8977, lon: -77.0365, label: 'White House' },
  statue_liberty: { lat: 40.6892, lon: -74.0445, label: 'Statue of Liberty' },
  statue: { lat: 40.6892, lon: -74.0445, label: 'Statue of Liberty' },
  grand_canyon: { lat: 36.1069, lon: -112.1129, label: 'Grand Canyon' },
  grand: { lat: 36.1069, lon: -112.1129, label: 'Grand Canyon' },
  teotihuacan: { lat: 19.6925, lon: -98.8436, label: 'Teotihuacan' },
  yosemite: { lat: 37.8651, lon: -119.5383, label: 'Yosemite National Park' },
  great_barrier_reef: { lat: -18.2871, lon: 147.6992, label: 'Great Barrier Reef' },
  golden_gate: { lat: 37.8199, lon: -122.4783, label: 'Golden Gate Bridge' },
  golden: { lat: 37.8199, lon: -122.4783, label: 'Golden Gate Bridge' },
  milford_sound: { lat: -44.6483, lon: 167.9058, label: 'Milford Sound' },
  taj_mahal: { lat: 27.1751, lon: 78.0421, label: 'Taj Mahal' },
  alhambra: { lat: 37.1760, lon: -3.5881, label: 'Alhambra' },
  charles_bridge: { lat: 50.0869, lon: 14.4112, label: 'Charles Bridge' },
  duomo_florence: { lat: 43.7733, lon: 11.2558, label: 'Florence Duomo' },
  chichen_itza: { lat: 20.6843, lon: -88.5678, label: 'Chichen Itza' },
  leaning_tower_pisa: { lat: 43.7230, lon: 10.3966, label: 'Leaning Tower of Pisa' },
  brandenburg_gate: { lat: 52.5163, lon: 13.3777, label: 'Brandenburg Gate' },
  st_peters_basilica: { lat: 41.9022, lon: 12.4539, label: 'St Peters Basilica' },
  london_eye: { lat: 51.5033, lon: -0.1196, label: 'London Eye' },
  arc_de_triomphe: { lat: 48.8738, lon: 2.2950, label: 'Arc de Triomphe' },
  mont_saint_michel: { lat: 48.6361, lon: -1.5114, label: 'Mont Saint-Michel' },
  borobudur: { lat: -7.6079, lon: 110.2039, label: 'Borobudur' },
  kilimanjaro: { lat: -3.0674, lon: 37.3556, label: 'Mount Kilimanjaro' },
  baobab_avenue: { lat: -19.8333, lon: 44.0667, label: 'Avenue of the Baobabs' },
  iguazu_falls: { lat: -25.6953, lon: -54.4367, label: 'Iguazu Falls' },
  angel_falls: { lat: 5.9671, lon: -62.5361, label: 'Angel Falls' },
  uluru: { lat: -25.3444, lon: 131.0369, label: 'Uluru' },
  empire_state_building: { lat: 40.7484, lon: -73.9857, label: 'Empire State Building' },
  hollywood_sign: { lat: 34.1341, lon: -118.3215, label: 'Hollywood Sign' },
  niagara_falls: { lat: 43.0962, lon: -79.0377, label: 'Niagara Falls' },
  buckingham_palace: { lat: 51.5014, lon: -0.1419, label: 'Buckingham Palace' },
};

/**
 * Extract landmark ID from filename
 * Examples: "angkor_wat_pexels_100.jpg" → "angkor_wat"
 *           "eiffel_tower_wikimedia_5.jpg" → "eiffel_tower"
 *           "cape_point_openverse_207.jpg" → "cape_point"
 */
function extractLandmarkId(filename: string): string {
  const base = filename.replace(/\.(jpg|jpeg|png)$/i, '').toLowerCase();
  const parts = base.split('_');

  // Try two-word combinations (angkor_wat, eiffel_tower, cape_point, etc.)
  if (parts.length >= 2) {
    const twoWord = `${parts[0]}_${parts[1]}`;
    if (LANDMARK_COORDS[twoWord]) {
      return twoWord;
    }
  }
  
  // Try three-word (mount_rushmore, palace_of_versailles)
  if (parts.length >= 3) {
    const threeWord = `${parts[0]}_${parts[1]}_${parts[2]}`;
    if (LANDMARK_COORDS[threeWord]) {
      return threeWord;
    }
  }

  // Fall back to single word
  return parts[0];
}

/**
 * Load existing SmartBlend metadata.csv if available
 */
async function loadSmartBlendMetadata(): Promise<Map<string, { lat: number; lon: number; label: string }>> {
  const metadataPath = path.join(CACHE_ROOT, 'smartblend_gallery', 'metadata.csv');
  const map = new Map<string, { lat: number; lon: number; label: string }>();

  try {
    const csv = await fs.readFile(metadataPath, 'utf8');
    const lines = csv.split('\n').filter(l => l.trim());

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 4) {
        const filename = parts[0];
        const lat = parseFloat(parts[1]);
        const lon = parseFloat(parts[2]);
        const label = parts[3].replace(/^"|"$/g, '');

        if (filename && !isNaN(lat) && !isNaN(lon)) {
          map.set(filename, { lat, lon, label });
        }
      }
    }
  } catch (error) {
    console.warn('Could not load SmartBlend metadata.csv:', error);
  }

  return map;
}

/**
 * Collect all image files from all directories
 */
async function collectAllImages(): Promise<Array<{ path: string; filename: string; source: string }>> {
  const allImages: Array<{ path: string; filename: string; source: string }> = [];

  for (const dir of IMAGE_DIRS) {
    try {
      const files = await fs.readdir(dir);
      const imageFiles = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f));

      const sourceName = path.basename(dir);
      for (const file of imageFiles) {
        allImages.push({
          path: path.join(dir, file),
          filename: file,
          source: sourceName,
        });
      }

      console.log(`  ${sourceName}: ${imageFiles.length} images`);
    } catch (error) {
      console.warn(`  Skipping ${path.basename(dir)}: ${error}`);
    }
  }

  return allImages;
}

/**
 * Main rebuild function
 */
async function main() {
  console.log('🔄 REBUILDING FULL LANDMARK INDEX FROM ALL SOURCES\n');
  console.log('=' .repeat(60));

  // Step 1: Load SmartBlend metadata
  console.log('\n📋 Loading SmartBlend metadata...');
  const smartBlendMeta = await loadSmartBlendMetadata();
  console.log(`  Found ${smartBlendMeta.size} entries in metadata.csv`);

  // Step 2: Collect all images
  console.log('\n📸 Collecting images from all directories:');
  const allImages = await collectAllImages();
  console.log(`\n  Total images found: ${allImages.length}`);

  // Step 3: Embed all images
  console.log('\n🧠 Embedding images with GeoCLIP...');
  console.log('  (This may take 10-30 minutes depending on your hardware)\n');

  const vectors: ReferenceVectorRecord[] = [];
  let embedded = 0;
  let skipped = 0;
  let noCoords = 0;

  for (let i = 0; i < allImages.length; i++) {
    const img = allImages[i];
    const progress = `[${i + 1}/${allImages.length}]`;

    // Try SmartBlend metadata first
    const metaEntry = smartBlendMeta.get(img.filename);
    let coords = metaEntry ? { lat: metaEntry.lat, lon: metaEntry.lon } : undefined;
    let label = metaEntry?.label || '';

    // Fall back to landmark coordinate mapping
    if (!coords) {
      const landmarkId = extractLandmarkId(img.filename);
      const landmarkInfo = LANDMARK_COORDS[landmarkId];

      if (landmarkInfo) {
        coords = { lat: landmarkInfo.lat, lon: landmarkInfo.lon };
        label = landmarkInfo.label;
      } else {
        noCoords++;
        if (noCoords <= 10) {
          console.log(`${progress} ⚠️  No coordinates for: ${img.filename} (landmark: ${landmarkId})`);
        }
        skipped++;
        continue;
      }
    }

    // Skip invalid coordinates
    if (!coords || (coords.lat === 0 && coords.lon === 0)) {
      noCoords++;
      skipped++;
      continue;
    }

    try {
      const buffer = await fs.readFile(img.path);
      const embedding = await extractCLIPEmbedding(buffer);

      vectors.push({
        id: `${img.source}_${embedded}`,
        label: label || img.filename,
        lat: coords.lat,
        lon: coords.lon,
        vector: embedding,
      });

      embedded++;

      if (embedded % 50 === 0) {
        process.stdout.write(`\r  Progress: ${embedded} embedded | ${skipped} skipped | ${(embedded / allImages.length * 100).toFixed(1)}%`);
      }
    } catch (error) {
      skipped++;
      if (skipped <= 10) {
        console.log(`${progress} ✗ Embedding failed: ${img.filename}`);
      }
    }
  }

  console.log(`\n\n✅ Embedding complete!`);
  console.log(`  Successfully embedded: ${embedded}`);
  console.log(`  Skipped (errors): ${skipped}`);
  console.log(`  Skipped (no coordinates): ${noCoords}`);
  console.log(`  Total vectors: ${vectors.length}`);

  // Step 4: Save merged vectors
  console.log('\n💾 Saving merged vectors...');
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(
    OUTPUT_PATH,
    JSON.stringify({
      version: 'merged_v1',
      timestamp: new Date().toISOString(),
      note: 'Merged SmartBlend + all densified landmarks',
      totalVectors: vectors.length,
      vectors,
    }, null, 2)
  );
  console.log(`  ✓ Saved to: ${OUTPUT_PATH}`);

  // Step 5: Rebuild HNSW index
  console.log('\n🏗️  Building HNSW ANN index...');
  const index = new HNSWIndex({ M: 16, efConstruction: 200, efSearch: 128 });
  await index.buildIndex(vectors);
  await index.saveIndex(INDEX_PATH);
  console.log(`  ✓ Index built with ${index.size} vectors`);
  console.log(`  ✓ Saved to: ${INDEX_PATH}`);

  // Step 6: Verify
  console.log('\n' + '='.repeat(60));
  console.log('✅ SUCCESS! FULL INDEX REBUILT');
  console.log('='.repeat(60));
  console.log(`\n📊 Final Statistics:`);
  console.log(`  Total vectors: ${vectors.length}`);
  console.log(`  HNSW index size: ${index.size}`);
  console.log(`  Cache version: merged_v1`);

  console.log('\n🎯 Next Steps:');
  console.log('  1. Verify vector count:');
  console.log(`     cat ${OUTPUT_PATH} | python3 -c "import json,sys; print(len(json.load(sys.stdin)['vectors']))"`);
  console.log('  2. Run benchmark:');
  console.log('     cd backend && GEOWRAITH_ULTRA_ACCURACY=true npm run benchmark:validation');
  console.log('');
}

main().catch((error) => {
  console.error('\n❌ ERROR:', error);
  process.exit(1);
});
