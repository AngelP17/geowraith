import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { retrieveMapillaryImages } from '../sfm/mapillary.js';
import { extractCLIPEmbedding } from '../services/clipExtractor.js';

interface LandmarkTarget {
  id: string;
  label: string;
  lat: number;
  lon: number;
  radiusMeters: number;
  maxImages: number;
}

const TARGETS: LandmarkTarget[] = [
  {
    id: 'marrakech',
    label: 'Marrakech Medina',
    lat: 31.6295,
    lon: -7.9811,
    radiusMeters: 2000,
    maxImages: 60,
  },
  {
    id: 'cape_point',
    label: 'Cape Point',
    lat: -34.3568,
    lon: 18.496,
    radiusMeters: 2000,
    maxImages: 70,
  },
  {
    id: 'copacabana',
    label: 'Copacabana Beach',
    lat: -22.9719,
    lon: -43.1823,
    radiusMeters: 2000,
    maxImages: 70,
  },
  {
    id: 'table_mountain',
    label: 'Table Mountain',
    lat: -33.9628,
    lon: 18.4098,
    radiusMeters: 2000,
    maxImages: 70,
  },
];

const CACHE_ROOT = path.resolve(process.cwd(), '.cache');
const OUTPUT_DIR = path.resolve(CACHE_ROOT, 'mapillary_failing_landmarks');

async function downloadImagesForTarget(target: LandmarkTarget): Promise<number> {
  console.log(`\n[Mapillary] Fetching images for ${target.label}...`);
  console.log(`[Mapillary]   Location: (${target.lat}, ${target.lon})`);
  console.log(`[Mapillary]   Radius: ${target.radiusMeters}m, Max: ${target.maxImages}`);

  const images = await retrieveMapillaryImages(
    target.lat,
    target.lon,
    target.radiusMeters,
    target.maxImages
  );

  if (images.length === 0) {
    console.warn(`[Mapillary]   ⚠️  No images found for ${target.label}`);
    return 0;
  }

  console.log(`[Mapillary]   Found ${images.length} images`);

  let downloaded = 0;
  for (const image of images) {
    try {
      const response = await fetch(image.url);
      if (!response.ok) {
        console.warn(`[Mapillary]   Failed to download ${image.url}: ${response.status}`);
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const filename = `${target.id}_${image.id}.jpg`;
      const filepath = path.join(OUTPUT_DIR, filename);

      await writeFile(filepath, buffer);
      downloaded++;

      if (downloaded % 10 === 0) {
        console.log(`[Mapillary]   Downloaded ${downloaded}/${images.length}...`);
      }
    } catch (error) {
      console.warn(`[Mapillary]   Error downloading ${image.id}:`, error);
    }
  }

  console.log(`[Mapillary]   ✓ Downloaded ${downloaded}/${images.length} images for ${target.label}`);
  return downloaded;
}

async function main(): Promise<void> {
  console.log('🗺️  Downloading Mapillary street-level images for failing landmarks');

  if (!process.env.MAPILLARY_ACCESS_TOKEN) {
    console.error('\n❌ MAPILLARY_ACCESS_TOKEN not configured in .env');
    console.error('Add your token to backend/.env:');
    console.error('  MAPILLARY_ACCESS_TOKEN=MLY|...|...\n');
    process.exit(1);
  }

  // Create output directory
  await mkdir(OUTPUT_DIR, { recursive: true });
  console.log(`\n[Setup] Output directory: ${OUTPUT_DIR}`);

  let totalDownloaded = 0;
  for (const target of TARGETS) {
    const count = await downloadImagesForTarget(target);
    totalDownloaded += count;
  }

  console.log(`\n✅ Downloaded ${totalDownloaded} total images`);
  console.log(`\n📍 Next steps:`);
  console.log(`   1. cd backend`);
  console.log(`   2. npm run refine:anchors`);
  console.log(`   3. npm run benchmark:validation`);
}

main().catch((error) => {
  console.error('[Mapillary] Fatal error:', error);
  process.exit(1);
});
