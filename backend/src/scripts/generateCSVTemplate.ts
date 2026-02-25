/**
 * Generate a CSV template for building validation gallery from local images.
 * This creates a starter CSV with landmark coordinates that users can fill
 * with their own photos or downloaded images.
 * 
 * Usage:
 *   npx tsx src/scripts/generateCSVTemplate.ts --output=my_landmarks.csv
 * 
 * Then:
 *   1. Download images matching the labels
 *   2. Place them in a folder
 *   3. Run: npm run build:gallery:csv -- --images=/path --csv=my_landmarks.csv
 */

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    output: { type: 'string', default: 'landmarks_template.csv' },
    count: { type: 'string', default: '30' },
  },
});

interface LandmarkTemplate {
  filename: string;
  lat: number;
  lon: number;
  label: string;
  country: string;
  category: string;
}

// Curated list of iconic landmarks with accurate coordinates
const LANDMARK_TEMPLATES: LandmarkTemplate[] = [
  // Europe
  { filename: 'eiffel_tower.jpg', lat: 48.8584, lon: 2.2945, label: 'Eiffel Tower, Paris', country: 'France', category: 'landmark' },
  { filename: 'colosseum.jpg', lat: 41.8902, lon: 12.4922, label: 'Colosseum, Rome', country: 'Italy', category: 'landmark' },
  { filename: 'big_ben.jpg', lat: 51.5007, lon: -0.1246, label: 'Big Ben, London', country: 'UK', category: 'landmark' },
  { filename: 'sagrada_familia.jpg', lat: 41.4036, lon: 2.1744, label: 'Sagrada Familia, Barcelona', country: 'Spain', category: 'landmark' },
  { filename: 'acropolis.jpg', lat: 37.9715, lon: 23.7257, label: 'Acropolis, Athens', country: 'Greece', category: 'landmark' },
  { filename: 'neuschwanstein.jpg', lat: 47.5576, lon: 10.7498, label: 'Neuschwanstein Castle', country: 'Germany', category: 'landmark' },
  { filename: 'santorini.jpg', lat: 36.3932, lon: 25.4615, label: 'Santorini', country: 'Greece', category: 'coastal' },
  { filename: 'stonehenge.jpg', lat: 51.1788, lon: -1.8262, label: 'Stonehenge', country: 'UK', category: 'landmark' },
  { filename: 'matterhorn.jpg', lat: 45.9766, lon: 7.6585, label: 'Matterhorn', country: 'Switzerland', category: 'mountain' },
  
  // North America
  { filename: 'statue_of_liberty.jpg', lat: 40.6892, lon: -74.0445, label: 'Statue of Liberty, NYC', country: 'USA', category: 'landmark' },
  { filename: 'grand_canyon.jpg', lat: 36.1069, lon: -112.1129, label: 'Grand Canyon', country: 'USA', category: 'nature' },
  { filename: 'times_square.jpg', lat: 40.7580, lon: -73.9855, label: 'Times Square, NYC', country: 'USA', category: 'urban' },
  { filename: 'golden_gate_bridge.jpg', lat: 37.8199, lon: -122.4783, label: 'Golden Gate Bridge', country: 'USA', category: 'landmark' },
  { filename: 'white_house.jpg', lat: 38.8977, lon: -77.0365, label: 'White House, DC', country: 'USA', category: 'landmark' },
  { filename: 'chichen_itza.jpg', lat: 20.6843, lon: -88.5678, label: 'Chichen Itza', country: 'Mexico', category: 'landmark' },
  { filename: 'cn_tower.jpg', lat: 43.6426, lon: -79.3871, label: 'CN Tower, Toronto', country: 'Canada', category: 'landmark' },
  
  // Asia
  { filename: 'taj_mahal.jpg', lat: 27.1751, lon: 78.0421, label: 'Taj Mahal, Agra', country: 'India', category: 'landmark' },
  { filename: 'great_wall.jpg', lat: 40.4319, lon: 116.5704, label: 'Great Wall of China', country: 'China', category: 'landmark' },
  { filename: 'forbidden_city.jpg', lat: 39.9163, lon: 116.3972, label: 'Forbidden City, Beijing', country: 'China', category: 'landmark' },
  { filename: 'fushimi_inari.jpg', lat: 34.9671, lon: 135.7727, label: 'Fushimi Inari, Kyoto', country: 'Japan', category: 'landmark' },
  { filename: 'mount_fuji.jpg', lat: 35.3606, lon: 138.7274, label: 'Mount Fuji', country: 'Japan', category: 'mountain' },
  { filename: 'angkor_wat.jpg', lat: 13.4125, lon: 103.8670, label: 'Angkor Wat', country: 'Cambodia', category: 'landmark' },
  { filename: 'petra.jpg', lat: 30.3285, lon: 35.4444, label: 'Petra, Jordan', country: 'Jordan', category: 'landmark' },
  { filename: 'burj_khalifa.jpg', lat: 25.1972, lon: 55.2744, label: 'Burj Khalifa, Dubai', country: 'UAE', category: 'landmark' },
  { filename: 'marina_bay.jpg', lat: 1.2834, lon: 103.8607, label: 'Marina Bay Sands, Singapore', country: 'Singapore', category: 'landmark' },
  
  // South America
  { filename: 'machu_picchu.jpg', lat: -13.1631, lon: -72.5450, label: 'Machu Picchu', country: 'Peru', category: 'landmark' },
  { filename: 'christ_redeemer.jpg', lat: -22.9519, lon: -43.2105, label: 'Christ the Redeemer, Rio', country: 'Brazil', category: 'landmark' },
  { filename: 'iguazu_falls.jpg', lat: -25.6953, lon: -54.4367, label: 'Iguazu Falls', country: 'Argentina', category: 'nature' },
  
  // Africa
  { filename: 'pyramids_giza.jpg', lat: 29.9792, lon: 31.1342, label: 'Pyramids of Giza', country: 'Egypt', category: 'landmark' },
  { filename: 'victoria_falls.jpg', lat: -17.9243, lon: 25.8572, label: 'Victoria Falls', country: 'Zimbabwe', category: 'nature' },
  { filename: 'table_mountain.jpg', lat: -33.9628, lon: 18.4098, label: 'Table Mountain, Cape Town', country: 'South Africa', category: 'mountain' },
  { filename: 'serengeti.jpg', lat: -2.1540, lon: 34.6857, label: 'Serengeti', country: 'Tanzania', category: 'nature' },
  
  // Oceania
  { filename: 'sydney_opera_house.jpg', lat: -33.8568, lon: 151.2153, label: 'Sydney Opera House', country: 'Australia', category: 'landmark' },
  { filename: 'uluru.jpg', lat: -25.3444, lon: 131.0369, label: 'Uluru', country: 'Australia', category: 'nature' },
  { filename: 'great_barrier_reef.jpg', lat: -18.2871, lon: 147.6992, label: 'Great Barrier Reef', country: 'Australia', category: 'nature' },
  { filename: 'milford_sound.jpg', lat: -44.6167, lon: 167.8667, label: 'Milford Sound', country: 'New Zealand', category: 'nature' },
];

async function main() {
  const targetCount = parseInt(values.count!, 10);
  const outputFile = path.resolve(process.cwd(), values.output!);
  
  console.log('[CSVTemplate] Generating landmark CSV template');
  console.log(`  Output: ${outputFile}`);
  console.log(`  Landmarks: ${Math.min(targetCount, LANDMARK_TEMPLATES.length)}`);
  console.log('');
  
  // Shuffle and select
  const shuffled = [...LANDMARK_TEMPLATES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(targetCount, shuffled.length));
  
  // Generate CSV
  const lines: string[] = [];
  lines.push('filename,lat,lon,label,accuracy_radius');
  
  for (const landmark of selected) {
    lines.push(`${landmark.filename},${landmark.lat},${landmark.lon},"${landmark.label}",30`);
  }
  
  await writeFile(outputFile, lines.join('\n'));
  
  console.log('✓ CSV template generated');
  console.log('');
  console.log('========================================');
  console.log('Next Steps:');
  console.log('========================================');
  console.log('');
  console.log('1. Download photos matching the labels in the CSV');
  console.log('   Sources: Wikimedia Commons, Unsplash, Pexels, your own photos');
  console.log('');
  console.log('2. Place downloaded images in a folder');
  console.log('   Make sure filenames match the CSV (e.g., eiffel_tower.jpg)');
  console.log('');
  console.log('3. Build gallery:');
  console.log(`   npm run build:gallery:csv -- --images=/path/to/photos --csv=${values.output}`);
  console.log('');
  console.log('4. Run validation:');
  console.log('   npm run benchmark:validation');
  console.log('');
  console.log('========================================');
  console.log('Landmarks in template:');
  console.log('========================================');
  
  const byContinent: Record<string, number> = {};
  for (const l of selected) {
    const continent = l.country === 'Egypt' || l.country === 'Jordan' || l.country === 'UAE' ? 'Asia/Middle East' :
                     l.country === 'Australia' || l.country === 'New Zealand' ? 'Oceania' :
                     l.country === 'Argentina' || l.country === 'Brazil' || l.country === 'Peru' ? 'South America' :
                     l.country === 'South Africa' || l.country === 'Zimbabwe' || l.country === 'Tanzania' ? 'Africa' :
                     l.country === 'Canada' || l.country === 'USA' || l.country === 'Mexico' ? 'North America' :
                     'Europe';
    byContinent[continent] = (byContinent[continent] || 0) + 1;
    console.log(`  • ${l.label} (${l.country})`);
  }
  
  console.log('');
  console.log('By continent:', JSON.stringify(byContinent));
}

main().catch((error) => {
  console.error('[CSVTemplate] Error:', error);
  process.exit(1);
});
