/**
 * Generate stratified coordinate dataset for GeoCLIP reference index.
 *
 * This script creates 500K+ coordinates with stratified sampling across:
 * - Geographic regions (continents, countries)
 * - Climate zones
 * - Population density
 * - Latitude/longitude grid refinement
 *
 * Usage: npx tsx src/scripts/generateCoordinates500K.ts
 */

import { writeFile } from 'node:fs/promises';
import path from 'node:path';

interface CoordinateRecord {
  id: string;
  label: string;
  lat: number;
  lon: number;
}

interface StratificationConfig {
  region: string;
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
  weight: number;
  gridSize: number;
}

const STRATA: StratificationConfig[] = [
  { region: 'north_america_urban', latMin: 25, latMax: 50, lonMin: -130, lonMax: -65, weight: 0.18, gridSize: 0.5 },
  { region: 'north_america_sparse', latMin: 50, latMax: 72, lonMin: -168, lonMax: -52, weight: 0.08, gridSize: 1.5 },
  { region: 'south_america', latMin: -56, latMax: 13, lonMin: -82, lonMax: -34, weight: 0.15, gridSize: 0.4 },
  { region: 'europe_west', latMin: 35, latMax: 60, lonMin: -10, lonMax: 30, weight: 0.12, gridSize: 0.4 },
  { region: 'europe_east', latMin: 45, latMax: 70, lonMin: 15, lonMax: 60, weight: 0.08, gridSize: 0.6 },
  { region: 'africa_north', latMin: 15, latMax: 37, lonMin: -18, lonMax: 52, weight: 0.08, gridSize: 0.7 },
  { region: 'africa_sub', latMin: -35, latMax: 15, lonMin: -18, lonMax: 52, weight: 0.12, gridSize: 0.5 },
  { region: 'middle_east', latMin: 12, latMax: 42, lonMin: 25, lonMax: 65, weight: 0.05, gridSize: 0.6 },
  { region: 'south_asia', latMin: 5, latMax: 35, lonMin: 60, lonMax: 100, weight: 0.10, gridSize: 0.5 },
  { region: 'east_asia', latMin: 18, latMax: 52, lonMin: 100, lonMax: 150, weight: 0.15, gridSize: 0.4 },
  { region: 'southeast_asia', latMin: -10, latMax: 28, lonMin: 92, lonMax: 140, weight: 0.07, gridSize: 0.5 },
  { region: 'oceania', latMin: -47, latMax: -10, lonMin: 110, lonMax: 180, weight: 0.10, gridSize: 0.8 },
  { region: 'antarctica', latMin: -90, latMax: -60, lonMin: -180, lonMax: 180, weight: 0.01, gridSize: 5.0 },
];

const POPULATION_HOTSPOTS: Array<{ lat: number; lon: number; name: string; count: number }> = [
  { lat: 40.71, lon: -74.01, name: 'New York Metro', count: 800 },
  { lat: 34.05, lon: -118.24, name: 'Los Angeles', count: 600 },
  { lat: 51.51, lon: -0.13, name: 'London', count: 500 },
  { lat: 48.86, lon: 2.35, name: 'Paris', count: 450 },
  { lat: 35.68, lon: 139.65, name: 'Tokyo', count: 700 },
  { lat: 31.23, lon: 121.47, name: 'Shanghai', count: 550 },
  { lat: 39.90, lon: 116.41, name: 'Beijing', count: 500 },
  { lat: 37.77, lon: -122.42, name: 'San Francisco', count: 400 },
  { lat: 41.88, lon: -87.63, name: 'Chicago', count: 450 },
  { lat: 52.52, lon: 13.41, name: 'Berlin', count: 350 },
  { lat: 45.46, lon: 9.19, name: 'Milan', count: 300 },
  { lat: 41.90, lon: 12.50, name: 'Rome', count: 350 },
  { lat: 41.39, lon: 2.17, name: 'Barcelona', count: 300 },
  { lat: 52.37, lon: 4.90, name: 'Amsterdam', count: 280 },
  { lat: 59.33, lon: 18.07, name: 'Stockholm', count: 250 },
  { lat: 55.76, lon: 37.62, name: 'Moscow', count: 400 },
  { lat: 41.01, lon: 28.98, name: 'Istanbul', count: 350 },
  { lat: 25.20, lon: 55.27, name: 'Dubai', count: 300 },
  { lat: 1.35, lon: 103.82, name: 'Singapore', count: 350 },
  { lat: 22.32, lon: 114.17, name: 'Hong Kong', count: 350 },
  { lat: 19.08, lon: 72.88, name: 'Mumbai', count: 450 },
  { lat: 13.76, lon: 100.50, name: 'Bangkok', count: 350 },
  { lat: 37.57, lon: 126.98, name: 'Seoul', count: 450 },
  { lat: -33.87, lon: 151.21, name: 'Sydney', count: 350 },
  { lat: -23.55, lon: -46.63, name: 'Sao Paulo', count: 450 },
  { lat: 19.43, lon: -99.13, name: 'Mexico City', count: 400 },
  { lat: 43.65, lon: -79.38, name: 'Toronto', count: 350 },
  { lat: 49.28, lon: -123.12, name: 'Vancouver', count: 300 },
  { lat: 47.61, lon: -122.33, name: 'Seattle', count: 300 },
  { lat: 42.36, lon: -71.06, name: 'Boston', count: 280 },
  { lat: 33.75, lon: -84.39, name: 'Atlanta', count: 280 },
  { lat: 25.76, lon: -80.19, name: 'Miami', count: 280 },
  { lat: 39.74, lon: -104.99, name: 'Denver', count: 280 },
  { lat: 33.45, lon: -112.07, name: 'Phoenix', count: 280 },
  { lat: 53.48, lon: -2.24, name: 'Manchester', count: 250 },
  { lat: 52.49, lon: -1.89, name: 'Birmingham', count: 250 },
  { lat: 55.86, lon: -4.26, name: 'Glasgow', count: 200 },
  { lat: 53.41, lon: -2.99, name: 'Liverpool', count: 200 },
  { lat: 51.45, lon: -2.59, name: 'Bristol', count: 180 },
  { lat: 55.95, lon: -3.19, name: 'Edinburgh', count: 180 },
  { lat: 51.28, lon: -1.08, name: 'Canterbury', count: 150 },
  { lat: 51.75, lon: -1.25, name: 'Oxford', count: 150 },
  { lat: 52.21, lon: 0.12, name: 'Cambridge', count: 150 },
  { lat: 53.96, lon: -1.08, name: 'York', count: 120 },
  { lat: 51.38, lon: -2.36, name: 'Bath', count: 100 },
  { lat: 50.82, lon: -0.14, name: 'Brighton', count: 150 },
  // NEW: UK cities - Sheffield, Leeds, Newcastle, etc.
  { lat: 53.38, lon: -1.46, name: 'Sheffield', count: 250 },
  { lat: 53.80, lon: -1.55, name: 'Leeds', count: 250 },
  { lat: 54.98, lon: -1.62, name: 'Newcastle', count: 180 },
  { lat: 53.46, lon: -2.23, name: 'Salford', count: 150 },
  { lat: 53.58, lon: -2.43, name: ' Bolton', count: 120 },
  { lat: 53.72, lon: -2.32, name: 'Bradford', count: 150 },
  { lat: 52.92, lon: -1.48, name: 'Nottingham', count: 180 },
  { lat: 52.48, lon: -1.89, name: 'Leicester', count: 180 },
  { lat: 53.23, lon: -0.54, name: 'Lincoln', count: 100 },
  { lat: 52.64, lon: -1.14, name: 'Coventry', count: 150 },
  { lat: 51.89, lon: -2.06, name: 'Cheltenham', count: 80 },
  { lat: 51.45, lon: -0.37, name: 'Richmond', count: 100 },
  // Central America - Panama, Costa Rica, Guatemala, etc.
  { lat: 8.98, lon: -79.52, name: 'Panama City', count: 200 },
  { lat: 9.93, lon: -84.09, name: 'San Jose Costa Rica', count: 180 },
  { lat: 14.63, lon: -90.51, name: 'Guatemala City', count: 180 },
  { lat: 12.12, lon: -86.25, name: 'Managua', count: 120 },
  { lat: 13.69, lon: -89.19, name: 'San Salvador', count: 120 },
  { lat: 15.50, lon: -88.03, name: 'Belize City', count: 80 },
  { lat: 9.31, lon: -79.82, name: 'Colon Panama', count: 80 },
  { lat: 8.22, lon: -81.12, name: 'Bocas del Toro', count: 60 },
  { lat: 10.32, lon: -84.82, name: 'Liberia Costa Rica', count: 60 },
  // Caribbean
  { lat: 18.22, lon: -66.59, name: 'San Juan Puerto Rico', count: 180 },
  { lat: 21.17, lon: -86.83, name: 'Cancun', count: 150 },
  { lat: 18.99, lon: -69.93, name: 'Santo Domingo', count: 180 },
  { lat: 18.47, lon: -69.93, name: 'Santiago Dominican', count: 120 },
  { lat: 17.25, lon: -62.72, name: 'St Kitts', count: 60 },
  { lat: 17.12, lon: -61.85, name: 'Antigua', count: 60 },
  { lat: 15.18, lon: -61.38, name: 'Dominica', count: 60 },
  // More South America
  { lat: 8.75, lon: -75.88, name: 'Cartagena Colombia', count: 150 },
  { lat: 6.25, lon: -75.60, name: 'Medellin', count: 180 },
  { lat: 10.96, lon: -74.80, name: 'Barranquilla', count: 150 },
  { lat: 3.45, lon: -76.53, name: 'Cali', count: 150 },
  { lat: 4.71, lon: -74.07, name: 'Bogota', count: 250 },
  { lat: -12.05, lon: -77.04, name: 'Lima', count: 250 },
  { lat: 50.11, lon: 8.68, name: 'Frankfurt', count: 200 },
  { lat: 48.14, lon: 11.58, name: 'Munich', count: 250 },
  { lat: 48.21, lon: 16.37, name: 'Vienna', count: 250 },
  { lat: 50.08, lon: 14.44, name: 'Prague', count: 220 },
  { lat: 47.50, lon: 19.04, name: 'Budapest', count: 220 },
  { lat: 52.23, lon: 21.01, name: 'Warsaw', count: 250 },
  { lat: 50.85, lon: 4.35, name: 'Brussels', count: 200 },
  { lat: 50.94, lon: 6.96, name: 'Cologne', count: 200 },
  { lat: 53.55, lon: 9.99, name: 'Hamburg', count: 200 },
  { lat: 48.86, lon: 2.35, name: 'Paris Suburbs', count: 300 },
  { lat: 43.60, lon: 3.88, name: 'Montpellier', count: 120 },
  { lat: 45.76, lon: 4.84, name: 'Lyon', count: 180 },
  { lat: 43.30, lon: 5.37, name: 'Marseille', count: 180 },
  { lat: 43.77, lon: 11.25, name: 'Florence', count: 120 },
  { lat: 45.44, lon: 12.32, name: 'Venice', count: 100 },
  { lat: 40.85, lon: 14.25, name: 'Naples', count: 200 },
  { lat: 38.72, lon: -9.14, name: 'Lisbon', count: 200 },
  { lat: 40.42, lon: -3.70, name: 'Madrid Suburbs', count: 250 },
  { lat: 37.98, lon: 23.73, name: 'Athens', count: 180 },
  { lat: 60.17, lon: 24.94, name: 'Helsinki', count: 150 },
  { lat: 59.91, lon: 10.75, name: 'Oslo', count: 150 },
  { lat: 55.68, lon: 12.57, name: 'Copenhagen', count: 180 },
  { lat: 47.38, lon: 8.54, name: 'Zurich', count: 180 },
  { lat: 46.95, lon: 7.45, name: 'Bern', count: 100 },
  { lat: 46.02, lon: 8.95, name: 'Lugano', count: 80 },
  { lat: -1.29, lon: 36.82, name: 'Nairobi', count: 180 },
  { lat: -26.20, lon: 28.05, name: 'Johannesburg', count: 200 },
  { lat: -33.92, lon: 18.42, name: 'Cape Town', count: 180 },
  { lat: 30.04, lon: 31.24, name: 'Cairo', count: 250 },
  { lat: 33.89, lon: 35.50, name: 'Beirut', count: 120 },
  { lat: 32.09, lon: 34.78, name: 'Tel Aviv', count: 180 },
  { lat: 6.52, lon: 3.38, name: 'Lagos', count: 200 },
  { lat: 33.57, lon: -7.59, name: 'Casablanca', count: 150 },
  { lat: 28.61, lon: 77.21, name: 'Delhi', count: 400 },
  { lat: 12.97, lon: 77.59, name: 'Bangalore', count: 350 },
  { lat: 13.08, lon: 80.27, name: 'Chennai', count: 280 },
  { lat: 22.57, lon: 88.36, name: 'Kolkata', count: 300 },
  { lat: 23.13, lon: 113.26, name: 'Guangzhou', count: 350 },
  { lat: 22.54, lon: 114.06, name: 'Shenzhen', count: 350 },
  { lat: 30.57, lon: 104.07, name: 'Chengdu', count: 280 },
  { lat: 29.56, lon: 106.55, name: 'Chongqing', count: 280 },
  { lat: 23.13, lon: 113.26, name: 'Foshan', count: 200 },
  { lat: 22.28, lon: 114.16, name: 'Dongguan', count: 200 },
  { lat: 1.29, lon: 103.85, name: 'Johor Bahru', count: 120 },
  { lat: 3.14, lon: 101.69, name: 'Kuala Lumpur', count: 200 },
  { lat: 13.82, lon: 100.35, name: 'Nonthaburi', count: 150 },
  { lat: -6.21, lon: 106.85, name: 'Jakarta', count: 350 },
  { lat: -7.80, lon: 110.36, name: 'Yogyakarta', count: 120 },
  { lat: -8.67, lon: 115.19, name: 'Bali', count: 100 },
  { lat: 14.60, lon: 120.98, name: 'Manila', count: 250 },
  { lat: 25.03, lon: 121.57, name: 'Taipei', count: 280 },
  { lat: 10.82, lon: 106.63, name: 'Ho Chi Minh City', count: 350 },
  { lat: 21.03, lon: 105.85, name: 'Hanoi', count: 280 },
  { lat: 14.44, lon: 120.99, name: 'Quezon City', count: 180 },
  { lat: -6.92, lon: 107.61, name: 'Bandung', count: 180 },
  { lat: -0.03, lon: 109.33, name: 'Pontianak', count: 100 },
  { lat: 3.60, lon: 98.67, name: 'Medan', count: 120 },
  { lat: 0.54, lon: 101.45, name: 'Pekanbaru', count: 80 },
  { lat: -0.95, lon: 100.36, name: 'Padang', count: 80 },
  { lat: 5.55, lon: 95.32, name: 'Banda Aceh', count: 80 },
  { lat: 2.99, lon: 99.07, name: 'Lake Toba', count: 60 },
  { lat: -8.41, lon: 115.51, name: 'Ubud', count: 60 },
  { lat: -8.80, lon: 121.66, name: 'Flores', count: 50 },
  { lat: 12.12, lon: 102.74, name: 'Phnom Penh', count: 120 },
  { lat: 11.56, lon: 104.92, name: 'Siem Reap', count: 80 },
  { lat: 13.36, lon: 103.84, name: 'Angkor Wat', count: 80 },
  // MAJOR WORLD LANDMARKS - Add extra density for famous locations
  { lat: 40.4319, lon: 116.5704, name: 'Great Wall China', count: 300 },
  { lat: 27.1751, lon: 78.0421, name: 'Taj Mahal India', count: 200 },
  { lat: 25.1972, lon: 55.2744, name: 'Burj Khalifa Dubai', count: 200 },
  { lat: 25.2826, lon: 55.3138, name: 'Dubai Marina', count: 150 },
  { lat: -22.9519, lon: -43.2105, name: 'Christ Redeemer Brazil', count: 200 },
  { lat: -23.5633, lon: -46.6565, name: 'Sao Paulo Brazil', count: 300 },
  { lat: -34.6037, lon: -58.3816, name: 'Buenos Aires Argentina', count: 250 },
  { lat: -33.8688, lon: 151.2093, name: 'Sydney Opera House', count: 200 },
  { lat: -37.8175, lon: 144.9680, name: 'Melbourne Australia', count: 200 },
  { lat: -43.5267, lon: 172.6362, name: 'Christchurch NZ', count: 150 },
  { lat: 52.5163, lon: 13.3777, name: 'Brandenburg Gate Berlin', count: 150 },
  { lat: 51.5014, lon: -0.1419, name: 'Big Ben London', count: 150 },
  { lat: 48.8584, lon: 2.2945, name: 'Eiffel Tower Paris', count: 150 },
  { lat: 41.8902, lon: 12.4922, name: 'Colosseum Rome', count: 150 },
  { lat: 29.9792, lon: 31.1342, name: 'Pyramids Giza Egypt', count: 150 },
  { lat: 37.8199, lon: -122.4783, name: 'Golden Gate Bridge', count: 200 },
  { lat: 36.1070, lon: -112.1130, name: 'Grand Canyon USA', count: 150 },
  { lat: 36.0544, lon: -112.1401, name: 'Grand Canyon South Rim', count: 150 },
  { lat: 36.1699, lon: -115.1398, name: 'Las Vegas Strip', count: 150 },
  { lat: 36.1699, lon: -112.0, name: 'Route 66 Arizona', count: 100 },
  { lat: 35.3606, lon: 138.7274, name: 'Mount Fuji Japan', count: 150 },
  { lat: 35.6762, lon: 139.6503, name: 'Tokyo Tower', count: 150 },
  { lat: 35.6586, lon: 139.7454, name: 'Tokyo Skytree', count: 150 },
  // Africa landmarks
  { lat: -1.2921, lon: 36.8219, name: 'Nairobi Kenya', count: 150 },
  { lat: -26.2041, lon: 28.0473, name: 'Johannesburg South Africa', count: 150 },
  { lat: -33.9249, lon: 18.4241, name: 'Cape Town South Africa', count: 150 },
  { lat: 30.0444, lon: 31.2357, name: 'Cairo Egypt', count: 200 },
  // India landmarks  
  { lat: 28.6139, lon: 77.2090, name: 'India Gate Delhi', count: 150 },
  { lat: 12.9716, lon: 77.5946, name: 'Bangalore India', count: 200 },
  { lat: 13.0827, lon: 80.2707, name: 'Chennai India', count: 150 },
  // Southeast Asia landmarks
  { lat: 13.4125, lon: 103.8670, name: 'Siem Reap Angkor', count: 150 },
  { lat: 10.7769, lon: 106.7009, name: 'Ho Chi Minh City Vietnam', count: 200 },
  { lat: 21.0285, lon: 105.8542, name: 'Hanoi Vietnam', count: 150 },
  // Central America & Caribbean
  { lat: 18.2208, lon: -66.5901, name: 'San Juan Puerto Rico', count: 150 },
  { lat: 21.1743, lon: -86.4619, name: 'Cancun Mexico', count: 150 },
  { lat: 17.98, lon: 102.63, name: 'Vientiane', count: 80 },
  { lat: 17.98, lon: 102.63, name: 'Luang Prabang', count: 60 },
  { lat: 21.03, lon: 105.85, name: 'Ha Long Bay', count: 60 },
  { lat: 16.05, lon: 108.20, name: 'Da Nang', count: 100 },
  { lat: 16.05, lon: 108.20, name: 'Hoi An', count: 80 },
  { lat: 10.31, lon: 105.97, name: 'Mekong Delta', count: 80 },
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateGridCoordinates(
  latMin: number,
  latMax: number,
  lonMin: number,
  lonMax: number,
  gridSize: number,
  count: number,
  seedOffset: number
): CoordinateRecord[] {
  const coords: CoordinateRecord[] = [];
  const id = `geoclip_${String(coords.length + seedOffset).padStart(7, '0')}`;
  let idNum = seedOffset;

  for (let lat = latMin; lat < latMax; lat += gridSize) {
    for (let lon = lonMin; lon < lonMax; lon += gridSize) {
      if (coords.length >= count) break;

      const jitterLat = (seededRandom(idNum * 1.1) - 0.5) * gridSize * 0.9;
      const jitterLon = (seededRandom(idNum * 2.2) - 0.5) * gridSize * 0.9;

      coords.push({
        id: `geoclip_${String(idNum).padStart(7, '0')}`,
        label: `GeoCLIP Reference ${idNum}`,
        lat: lat + jitterLat,
        lon: lon + jitterLon,
      });
      idNum += 1;
    }
    if (coords.length >= count) break;
  }

  return coords;
}

function generatePopulationHotspotCoordinates(
  hotspots: Array<{ lat: number; lon: number; name: string; count: number }>,
  spreadKm: number
): CoordinateRecord[] {
  const coords: CoordinateRecord[] = [];
  let idNum = 1000000;

  for (const hotspot of hotspots) {
    const radiusDeg = spreadKm / 111;
    for (let i = 0; i < hotspot.count; i++) {
      const angle = seededRandom(idNum * 3.3) * 2 * Math.PI;
      const r = seededRandom(idNum * 4.4) * radiusDeg;

      coords.push({
        id: `geoclip_${String(idNum).padStart(7, '0')}`,
        label: hotspot.name,
        lat: hotspot.lat + r * Math.cos(angle),
        lon: hotspot.lon + r * Math.sin(angle),
      });
      idNum += 1;
    }
  }

  return coords;
}

async function main(): Promise<void> {
  const TARGET_TOTAL = 500000;  // Target 500K for global coverage
  const POPULATION_SPREAD_KM = 20;  // Tighter spread around landmarks
  const POPULATION_RATIO = 0.45;  // More population hotspots

  const populationCount = Math.floor(TARGET_TOTAL * POPULATION_RATIO);
  const gridCount = TARGET_TOTAL - populationCount;

  console.log(`Generating ${TARGET_TOTAL} coordinates...`);
  console.log(`  Population hotspots: ${populationCount}`);
  console.log(`  Grid coverage: ${gridCount}`);

  const coords: CoordinateRecord[] = [];

  const populationCoords = generatePopulationHotspotCoordinates(
    POPULATION_HOTSPOTS,
    POPULATION_SPREAD_KM
  );
  coords.push(...populationCoords.slice(0, populationCount));

  let gridCoordsGenerated = 0;
  const strataSeedOffset = 2000000;

  for (const strata of STRATA) {
    const strataTarget = Math.floor(gridCount * strata.weight);
    const generated = generateGridCoordinates(
      strata.latMin,
      strata.latMax,
      strata.lonMin,
      strata.lonMax,
      strata.gridSize,
      strataTarget,
      strataSeedOffset + gridCoordsGenerated
    );
    coords.push(...generated);
    gridCoordsGenerated += generated.length;
    console.log(`  ${strata.region}: ${generated.length} points`);
  }

  while (coords.length < TARGET_TOTAL) {
    const extraLat = (seededRandom(coords.length * 5.5) - 0.5) * 180;
    const extraLon = (seededRandom(coords.length * 6.6) - 0.5) * 360;
    coords.push({
      id: `geoclip_${String(coords.length).padStart(7, '0')}`,
      label: `GeoCLIP Reference ${coords.length}`,
      lat: extraLat,
      lon: extraLon,
    });
  }

  const finalCoords = coords.slice(0, TARGET_TOTAL);

  const outputPath = path.resolve(process.cwd(), 'src/data/geoclipCoordinates.json');
  await writeFile(outputPath, JSON.stringify(finalCoords, null, 2));

  console.log(`\nGenerated ${finalCoords.length} coordinates`);
  console.log(`Written to: ${outputPath}`);

  const latRange = { min: Infinity, max: -Infinity };
  const lonRange = { min: Infinity, max: -Infinity };

  for (const coord of finalCoords) {
    latRange.min = Math.min(latRange.min, coord.lat);
    latRange.max = Math.max(latRange.max, coord.lat);
    lonRange.min = Math.min(lonRange.min, coord.lon);
    lonRange.max = Math.max(lonRange.max, coord.lon);
  }

  console.log(`Latitude range: ${latRange.min.toFixed(2)} to ${latRange.max.toFixed(2)}`);
  console.log(`Longitude range: ${lonRange.min.toFixed(2)} to ${lonRange.max.toFixed(2)}`);
}

main().catch(console.error);
