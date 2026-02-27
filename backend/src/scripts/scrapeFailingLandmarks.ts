import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Landmarks that failed in benchmark - need image anchors
const FAILING_LANDMARKS = [
  { id: 'golden_gate', label: 'Golden Gate Bridge, SF', lat: 37.8199, lon: -122.4783 },
  { id: 'eiffel_tower', label: 'Eiffel Tower, Paris', lat: 48.8584, lon: 2.2945 },
  { id: 'terracotta_army', label: 'Terracotta Army, China', lat: 34.3841, lon: 109.2785 },
  { id: 'perito_moreno', label: 'Perito Moreno Glacier, Argentina', lat: -50.4957, lon: -73.1376 },
  { id: 'cape_point', label: 'Cape Point, South Africa', lat: -34.3568, lon: 18.4960 },
  { id: 'ngorongoro', label: 'Ngorongoro Crater, Tanzania', lat: -3.1618, lon: 35.5876 },
  { id: 'copacabana', label: 'Copacabana Beach, Rio', lat: -22.9719, lon: -43.1830 },
  { id: 'tower_bridge', label: 'Tower Bridge, London', lat: 51.5055, lon: -0.0754 },
  { id: 'table_mountain', label: 'Table Mountain, South Africa', lat: -33.9628, lon: 18.4098 },
  { id: 'angkor_wat', label: 'Angkor Wat, Cambodia', lat: 13.4125, lon: 103.867 },
  { id: 'great_barrier_reef', label: 'Great Barrier Reef, Australia', lat: -18.2871, lon: 147.6992 },
  { id: 'petra', label: 'Petra, Jordan', lat: 30.3285, lon: 35.4444 },
  { id: 'moai_statues', label: 'Moai Statues, Easter Island', lat: -27.1258, lon: -109.2774 },
  { id: 'statue_liberty', label: 'Statue of Liberty, NYC', lat: 40.6892, lon: -74.0445 },
  { id: 'grand_canyon', label: 'Grand Canyon, USA', lat: 36.1069, lon: -112.1129 },
  { id: 'forbidden_city', label: 'Forbidden City, Beijing', lat: 39.9163, lon: 116.3972 },
  { id: 'white_house', label: 'White House, Washington DC', lat: 38.8977, lon: -77.0365 },
  { id: 'victoria_falls', label: 'Victoria Falls, Zambia/Zimbabwe', lat: -17.9243, lon: 25.8572 },
  { id: 'salar_uyuni', label: 'Salar de Uyuni, Bolivia', lat: -20.1338, lon: -67.4891 },
  { id: 'marrakech', label: 'Medina of Marrakech, Morocco', lat: 31.6295, lon: -7.9811 },
];

async function main() {
  console.log('Creating CSV for failing landmarks...\n');
  
  const outputDir = path.resolve(process.cwd(), '.cache/failing_landmarks');
  await mkdir(outputDir, { recursive: true });
  
  // Create CSV for SmartBlend to process
  const csvLines = ['filename,lat,lon,label,accuracy_radius'];
  
  for (const landmark of FAILING_LANDMARKS) {
    const filename = `${landmark.id}.jpg`;
    csvLines.push(`${filename},${landmark.lat},${landmark.lon},"${landmark.label}",30`);
  }
  
  const csvPath = path.join(outputDir, 'targets.csv');
  await writeFile(csvPath, csvLines.join('\n'));
  
  console.log(`✅ Created CSV with ${FAILING_LANDMARKS.length} landmarks`);
  console.log(`   Saved to: ${csvPath}`);
  console.log('\nNext: Run SmartBlend to download images:');
  console.log(`   npm run smartblend -- --targets=${csvPath}`);
}

main().catch(console.error);
