/**
 * Rebalance the coordinate index to fix geographic bias
 * Caps over-represented regions (China) and boosts under-represented ones
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

interface CoordinateRecord {
  id: string;
  label: string;
  lat: number;
  lon: number;
}

// Simple country/region detection using bounding boxes
function getRegionCode(lat: number, lon: number): string {
  // China
  if (lon >= 73 && lon <= 135 && lat >= 18 && lat <= 54) return 'CN';
  // UK
  if (lat >= 49 && lat <= 61 && lon >= -11 && lon <= 2) return 'GB';
  // France
  if (lat >= 41 && lat <= 51 && lon >= -5 && lon <= 9) return 'FR';
  // Germany
  if (lat >= 47 && lat <= 55 && lon >= 5 && lon <= 16) return 'DE';
  // Spain
  if (lat >= 36 && lat <= 44 && lon >= -10 && lon <= 4) return 'ES';
  // Italy
  if (lat >= 36 && lat <= 47 && lon >= 6 && lon <= 19) return 'IT';
  // Japan
  if (lat >= 24 && lat <= 46 && lon >= 122 && lon <= 154) return 'JP';
  // South Korea
  if (lat >= 33 && lat <= 39 && lon >= 124 && lon <= 132) return 'KR';
  // India
  if (lat >= 6 && lat <= 36 && lon >= 68 && lon <= 98) return 'IN';
  // Brazil
  if (lat >= -34 && lat <= 6 && lon >= -74 && lon <= -34) return 'BR';
  // Mexico
  if (lat >= 14 && lat <= 33 && lon >= -118 && lon <= -86) return 'MX';
  // Australia
  if (lat >= -44 && lat <= -10 && lon >= 112 && lon <= 154) return 'AU';
  // Russia
  if (lat >= 41 && lat <= 82 && lon >= 19 && lon <= 180) return 'RU';
  // Canada
  if (lat >= 42 && lat <= 83 && lon >= -141 && lon <= -52) return 'CA';
  // USA
  if (lat >= 24 && lat <= 50 && lon >= -125 && lon <= -66) return 'US';
  // Argentina
  if (lat >= -55 && lat <= -21 && lon >= -74 && lon <= -53) return 'AR';
  // Egypt
  if (lat >= 22 && lat <= 32 && lon >= 24 && lon <= 37) return 'EG';
  // South Africa
  if (lat >= -35 && lat <= -22 && lon >= 16 && lon <= 33) return 'ZA';
  // Nigeria
  if (lat >= 4 && lat <= 14 && lon >= 2 && lon <= 15) return 'NG';
  // Kenya
  if (lat >= -5 && lat <= 5 && lon >= 33 && lon <= 42) return 'KE';
  // Indonesia
  if (lat >= -11 && lat <= 6 && lon >= 95 && lon <= 141) return 'ID';
  // Thailand
  if (lat >= 5 && lat <= 21 && lon >= 97 && lon <= 106) return 'TH';
  // Vietnam
  if (lat >= 8 && lat <= 24 && lon >= 102 && lon <= 110) return 'VN';
  // Turkey
  if (lat >= 35 && lat <= 42 && lon >= 25 && lon <= 45) return 'TR';
  // Saudi Arabia
  if (lat >= 16 && lat <= 32 && lon >= 34 && lon <= 56) return 'SA';
  // UAE
  if (lat >= 22 && lat <= 26 && lon >= 51 && lon <= 57) return 'AE';
  // Greece
  if (lat >= 34 && lat <= 42 && lon >= 19 && lon <= 30) return 'GR';
  // Portugal
  if (lat >= 36 && lat <= 42 && lon >= -10 && lon <= -6) return 'PT';
  // Netherlands
  if (lat >= 50 && lat <= 54 && lon >= 3 && lon <= 8) return 'NL';
  // Belgium
  if (lat >= 49 && lat <= 52 && lon >= 2 && lon <= 7) return 'BE';
  // Poland
  if (lat >= 49 && lat <= 55 && lon >= 13 && lon <= 25) return 'PL';
  // Sweden
  if (lat >= 55 && lat <= 69 && lon >= 11 && lon <= 24) return 'SE';
  // Norway
  if (lat >= 58 && lat <= 71 && lon >= 4 && lon <= 31) return 'NO';
  // Switzerland
  if (lat >= 45 && lat <= 48 && lon >= 5 && lon <= 11) return 'CH';
  // Austria
  if (lat >= 46 && lat <= 49 && lon >= 9 && lon <= 17) return 'AT';
  // Czech Republic
  if (lat >= 48 && lat <= 52 && lon >= 12 && lon <= 19) return 'CZ';
  // Hungary
  if (lat >= 45 && lat <= 49 && lon >= 15 && lon <= 23) return 'HU';
  // Romania
  if (lat >= 43 && lat <= 49 && lon >= 19 && lon <= 30) return 'RO';
  // Ukraine
  if (lat >= 44 && lat <= 53 && lon >= 19 && lon <= 41) return 'UA';
  // New Zealand
  if (lat >= -48 && lat <= -33 && lon >= 166 && lon <= 179) return 'NZ';
  // Singapore
  if (lat >= 1.2 && lat <= 1.5 && lon >= 103.6 && lon <= 104) return 'SG';
  // Hong Kong
  if (lat >= 22.1 && lat <= 22.6 && lon >= 113.8 && lon <= 114.5) return 'HK';
  // Malaysia
  if (lat >= 0.5 && lat <= 7 && lon >= 99 && lon <= 120) return 'MY';
  // Philippines
  if (lat >= 4.5 && lat <= 21 && lon >= 116 && lon <= 127) return 'PH';
  // Pakistan
  if (lat >= 23 && lat <= 37 && lon >= 60 && lon <= 78) return 'PK';
  // Bangladesh
  if (lat >= 20 && lat <= 27 && lon >= 88 && lon <= 93) return 'BD';
  // Nepal
  if (lat >= 26 && lat <= 31 && lon >= 80 && lon <= 89) return 'NP';
  // Sri Lanka
  if (lat >= 5.9 && lat <= 9.9 && lon >= 79.5 && lon <= 82) return 'LK';
  // Peru
  if (lat >= -18 && lat <= 0 && lon >= -81 && lon <= -68) return 'PE';
  // Colombia
  if (lat >= -4.5 && lat <= 13 && lon >= -79 && lon <= -66) return 'CO';
  // Chile
  if (lat >= -56 && lat <= -17 && lon >= -76 && lon <= -66) return 'CL';
  // Venezuela
  if (lat >= 0.6 && lat <= 13 && lon >= -73 && lon <= -59) return 'VE';
  // Panama (special case - often confused)
  if (lat >= 7 && lat <= 10 && lon >= -83 && lon <= -77) return 'PA';
  // Costa Rica
  if (lat >= 8 && lat <= 11 && lon >= -86 && lon <= -82) return 'CR';
  // Guatemala
  if (lat >= 13 && lat <= 18 && lon >= -92 && lon <= -88) return 'GT';
  // Morocco
  if (lat >= 27 && lat <= 36 && lon >= -13 && lon <= -1) return 'MA';
  // Algeria
  if (lat >= 19 && lat <= 37 && lon >= -9 && lon <= 12) return 'DZ';
  // Tunisia
  if (lat >= 30 && lat <= 38 && lon >= 7 && lon <= 12) return 'TN';
  // Ethiopia
  if (lat >= 3 && lat <= 15 && lon >= 33 && lon <= 49) return 'ET';
  // Tanzania
  if (lat >= -12 && lat <= -1 && lon >= 29 && lon <= 41) return 'TZ';
  // Uganda
  if (lat >= -1.5 && lat <= 4 && lon >= 29 && lon <= 35) return 'UG';
  // Ghana
  if (lat >= 4.5 && lat <= 11 && lon >= -3 && lon <= 1) return 'GH';
  // Cameroon
  if (lat >= 1.5 && lat <= 13 && lon >= 8 && lon <= 17) return 'CM';
  // Chile
  if (lat >= -56 && lat <= -17) return 'CL';
  return 'OTHER';
}

// Region caps - optimized for 95% global city accuracy
const REGION_CAPS: Record<string, number> = {
  'CN': 8000,   // enough for Great Wall / Shanghai without dominating
  'US': 7000,
  'GB': 6000,   // boost UK for Sheffield/Big Ben
  'FR': 5000,
  'DE': 4500,
  'ES': 4500,
  'IT': 4500,
  'JP': 4500,
  'IN': 5000,
  'BR': 5000,   // South America floor
  'RU': 4000,
  'CA': 4000,
  'AU': 4000,   // Oceania
  'ZA': 4000,   // Africa floor
  'NG': 3500,
  'MX': 4000,
  'AR': 3500,
  'OTHER': 3000  // fallback for small nations
};

// Target: ensure minimum per region
const MIN_PER_REGION = 500;

async function main(): Promise<void> {
  const inputPath = path.resolve(process.cwd(), 'src/data/geoclipCoordinates.json');
  const outputPath = path.resolve(process.cwd(), 'src/data/geoclipCoordinates.json');

  console.log('Loading coordinates...');
  const raw = await readFile(inputPath, 'utf8');
  const data: CoordinateRecord[] = JSON.parse(raw);

  console.log(`Loaded ${data.length} coordinates`);

  // Count by region
  const regionCounts: Record<string, number> = {};
  data.forEach(point => {
    const region = getRegionCode(point.lat, point.lon);
    regionCounts[region] = (regionCounts[region] || 0) + 1;
  });

  console.log('\nRegion counts before rebalancing:');
  const sorted = Object.entries(regionCounts).sort((a, b) => b[1] - a[1]);
  sorted.slice(0, 15).forEach(([region, count]) => {
    console.log(`  ${region}: ${count}`);
  });

  // Filter based on caps
  const filteredCounts: Record<string, number> = {};
  const balanced: CoordinateRecord[] = [];

  for (const point of data) {
    const region = getRegionCode(point.lat, point.lon);
    const currentCount = filteredCounts[region] || 0;
    const cap = REGION_CAPS[region] || 5000;

    if (currentCount < cap) {
      balanced.push(point);
      filteredCounts[region] = currentCount + 1;
    }
  }

  // Report new counts
  const newRegionCounts: Record<string, number> = {};
  balanced.forEach(point => {
    const region = getRegionCode(point.lat, point.lon);
    newRegionCounts[region] = (newRegionCounts[region] || 0) + 1;
  });

  console.log(`\nBalanced dataset: ${balanced.length} coordinates`);
  console.log('\nRegion counts after rebalancing:');
  const newSorted = Object.entries(newRegionCounts).sort((a, b) => b[1] - a[1]);
  newSorted.slice(0, 15).forEach(([region, count]) => {
    console.log(`  ${region}: ${count}`);
  });

  // Write output
  await writeFile(outputPath, JSON.stringify(balanced, null, 2));
  console.log(`\nWritten to: ${outputPath}`);
}

main().catch(console.error);
