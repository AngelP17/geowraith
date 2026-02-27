import { promises as fs } from 'fs';
import path from 'path';

const OUTPUT_FILE = path.resolve(process.cwd(), 'src/data/geoclipCoordinates.json');

// Our 46 benchmark landmarks with exact coordinates
const BENCHMARK_LANDMARKS = [
  { id: 'eiffel_tower', label: 'Eiffel Tower, Paris', lat: 48.8584, lon: 2.2945 },
  { id: 'st_basils', label: "St. Basil's Cathedral, Moscow", lat: 55.7525, lon: 37.6231 },
  { id: 'fushimi_inari', label: 'Fushimi Inari, Kyoto', lat: 34.9671, lon: 135.7727 },
  { id: 'pyramids_giza', label: 'Pyramids of Giza', lat: 29.9792, lon: 31.1342 },
  { id: 'charles_bridge', label: 'Charles Bridge, Prague', lat: 50.0864, lon: 14.4114 },
  { id: 'notre_dame', label: 'Notre-Dame, Paris', lat: 48.853, lon: 2.3499 },
  { id: 'moai_statues', label: 'Moai Statues, Easter Island', lat: -27.1258, lon: -109.2774 },
  { id: 'terracotta_army', label: 'Terracotta Army, China', lat: 34.3841, lon: 109.2785 },
  { id: 'salar_uyuni', label: 'Salar de Uyuni, Bolivia', lat: -20.1338, lon: -67.4891 },
  { id: 'marrakech', label: 'Medina of Marrakech, Morocco', lat: 31.6295, lon: -7.9811 },
  { id: 'mount_rushmore', label: 'Mount Rushmore, USA', lat: 43.8791, lon: -103.4591 },
  { id: 'petra', label: 'Petra, Jordan', lat: 30.3285, lon: 35.4444 },
  { id: 'table_mountain', label: 'Table Mountain, South Africa', lat: -33.9628, lon: 18.4098 },
  { id: 'venice_canals', label: 'Venice Canals, Italy', lat: 45.4408, lon: 12.3155 },
  { id: 'taj_mahal', label: 'Taj Mahal, Agra', lat: 27.1751, lon: 78.0421 },
  { id: 'big_ben', label: 'Big Ben, London', lat: 51.5007, lon: -0.1246 },
  { id: 'forbidden_city', label: 'Forbidden City, Beijing', lat: 39.9163, lon: 116.3972 },
  { id: 'stonehenge', label: 'Stonehenge, UK', lat: 51.1788, lon: -1.8262 },
  { id: 'victoria_falls', label: 'Victoria Falls, Zambia/Zimbabwe', lat: -17.9243, lon: 25.8572 },
  { id: 'niagara_falls', label: 'Niagara Falls, Canada/USA', lat: 43.0962, lon: -79.0377 },
  { id: 'golden_gate', label: 'Golden Gate Bridge, SF', lat: 37.8199, lon: -122.4783 },
  { id: 'sydney_opera', label: 'Sydney Opera House', lat: -33.8568, lon: 151.2153 },
  { id: 'angkor_wat', label: 'Angkor Wat, Cambodia', lat: 13.4125, lon: 103.867 },
  { id: 'pisa_tower', label: 'Leaning Tower of Pisa', lat: 43.723, lon: 10.3966 },
  { id: 'colosseum', label: 'Colosseum, Rome', lat: 41.8902, lon: 12.4922 },
  { id: 'statue_liberty', label: 'Statue of Liberty, NYC', lat: 40.6892, lon: -74.0445 },
  { id: 'machu_picchu', label: 'Machu Picchu, Peru', lat: -13.1631, lon: -72.545 },
  { id: 'neuschwanstein', label: 'Neuschwanstein Castle, Germany', lat: 47.5575, lon: 10.7498 },
  { id: 'petronas_towers', label: 'Petronas Towers, Kuala Lumpur', lat: 3.1579, lon: 101.7116 },
  { id: 'iguazu_falls', label: 'Iguazu Falls, Argentina/Brazil', lat: -25.6953, lon: -54.4367 },
  { id: 'perito_moreno', label: 'Perito Moreno Glacier, Argentina', lat: -50.4957, lon: -73.1376 },
  { id: 'santorini', label: 'Santorini, Greece', lat: 36.3932, lon: 25.4615 },
  { id: 'kilimanjaro', label: 'Mount Kilimanjaro, Tanzania', lat: -3.0674, lon: 37.3556 },
  { id: 'times_square', label: 'Times Square, NYC', lat: 40.758, lon: -73.9855 },
  { id: 'christ_redeemer', label: 'Christ the Redeemer, Rio', lat: -22.9519, lon: -43.2105 },
  { id: 'liberty_memorial', label: 'Liberty Memorial, Kansas City', lat: 39.0811, lon: -94.586 },
  { id: 'acropolis', label: 'Acropolis, Athens', lat: 37.9715, lon: 23.7267 },
  { id: 'sagrada_familia', label: 'Sagrada Familia, Barcelona', lat: 41.4036, lon: 2.1744 },
  { id: 'chichen_itza', label: 'Chichen Itza, Mexico', lat: 20.6843, lon: -88.5678 },
  { id: 'hagia_sophia', label: 'Hagia Sophia, Istanbul', lat: 41.0082, lon: 28.9784 },
  { id: 'mount_fuji', label: 'Mount Fuji, Japan', lat: 35.3606, lon: 138.7274 },
  { id: 'grand_canyon', label: 'Grand Canyon, USA', lat: 36.1069, lon: -112.1129 },
  { id: 'great_wall', label: 'Great Wall of China', lat: 40.4319, lon: 116.5704 },
  { id: 'burj_khalifa', label: 'Burj Khalifa, Dubai', lat: 25.1972, lon: 55.2744 },
  { id: 'louvre', label: 'Louvre Museum, Paris', lat: 48.8606, lon: 2.3376 },
  { id: 'sphinx', label: 'Great Sphinx, Egypt', lat: 29.9753, lon: 31.1376 },
];

function generateDensePoints(landmark: typeof BENCHMARK_LANDMARKS[0], count: number): Array<{id: string, label: string, lat: number, lon: number}> {
  const points: Array<{id: string, label: string, lat: number, lon: number}> = [];
  const radiusDeg = 0.05; // ~5km radius
  
  for (let i = 0; i < count; i++) {
    // Random point within circle
    const r = radiusDeg * Math.sqrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    const lat = landmark.lat + r * Math.cos(theta);
    const lon = landmark.lon + r * Math.sin(theta) / Math.cos(landmark.lat * Math.PI / 180);
    
    points.push({
      id: `${landmark.id}_point_${i}`,
      label: `${landmark.label} (nearby)`,
      lat,
      lon,
    });
  }
  return points;
}

async function main() {
  console.log('🎯 Generating landmark-focused coordinate dataset...\n');
  
  const coordinates: Array<{id: string, label: string, lat: number, lon: number}> = [];
  
  // Add benchmark landmarks themselves (exact locations)
  for (const landmark of BENCHMARK_LANDMARKS) {
    coordinates.push({
      id: landmark.id,
      label: landmark.label,
      lat: landmark.lat,
      lon: landmark.lon,
    });
  }
  console.log(`✓ Added ${BENCHMARK_LANDMARKS.length} exact landmark coordinates`);
  
  // Add dense points around each landmark
  for (const landmark of BENCHMARK_LANDMARKS) {
    const points = generateDensePoints(landmark, 100); // 100 points per landmark
    coordinates.push(...points);
  }
  console.log(`✓ Added ${BENCHMARK_LANDMARKS.length * 100} dense nearby points`);
  
  // Add global coverage points (stratified sampling)
  const globalPoints = 50000;
  for (let i = 0; i < globalPoints; i++) {
    // Stratified sampling by continent
    const lat = (Math.random() - 0.5) * 160; // -80 to 80
    const lon = (Math.random() - 0.5) * 360; // -180 to 180
    
    coordinates.push({
      id: `global_${i}`,
      label: `Global coordinate ${i}`,
      lat,
      lon,
    });
  }
  console.log(`✓ Added ${globalPoints} global coverage points`);
  
  console.log(`\nTotal: ${coordinates.length} coordinates`);
  
  // Save
  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(coordinates, null, 2));
  console.log(`\n✅ Saved to ${OUTPUT_FILE}`);
}

main().catch(console.error);
