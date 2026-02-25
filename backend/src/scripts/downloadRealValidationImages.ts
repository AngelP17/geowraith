/**
 * Download real landmark images for validation.
 * Uses multiple public domain sources to avoid rate limits.
 */

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

interface LandmarkImage {
  id: string;
  filename: string;
  label: string;
  lat: number;
  lon: number;
  continent: string;
  url: string;
  source: string;
}

// Landmark images from Wikimedia Commons (license varies; used for validation only).
const LANDMARKS: LandmarkImage[] = [
  {
    id: 'landmark_001',
    filename: 'eiffel_tower.jpg',
    label: 'Eiffel Tower, Paris, France',
    lat: 48.8584,
    lon: 2.2945,
    continent: 'Europe',
    // Wikimedia Commons - public domain
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg/640px-Tour_Eiffel_Wikimedia_Commons.jpg',
    source: 'wikimedia',
  },
  {
    id: 'landmark_002',
    filename: 'statue_of_liberty.jpg',
    label: 'Statue of Liberty, New York, USA',
    lat: 40.6892,
    lon: -74.0445,
    continent: 'North America',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Lady_Liberty_under_a_blue_sky_%28cropped%29.jpg/640px-Lady_Liberty_under_a_blue_sky_%28cropped%29.jpg',
    source: 'wikimedia',
  },
  {
    id: 'landmark_003',
    filename: 'taj_mahal.jpg',
    label: 'Taj Mahal, Agra, India',
    lat: 27.1751,
    lon: 78.0421,
    continent: 'Asia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Taj_Mahal_%28Edited%29.jpeg/640px-Taj_Mahal_%28Edited%29.jpeg',
    source: 'wikimedia',
  },
  {
    id: 'landmark_004',
    filename: 'big_ben.jpg',
    label: 'Big Ben, London, UK',
    lat: 51.4994,
    lon: -0.1245,
    continent: 'Europe',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Clock_Tower_-_Palace_of_Westminster%2C_London_-_May_2007.jpg/640px-Clock_Tower_-_Palace_of_Westminster%2C_London_-_May_2007.jpg',
    source: 'wikimedia',
  },
  {
    id: 'landmark_005',
    filename: 'sydney_opera_house.jpg',
    label: 'Sydney Opera House, Australia',
    lat: -33.8568,
    lon: 151.2153,
    continent: 'Oceania',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Sydney_Opera_House_Sails.jpg/640px-Sydney_Opera_House_Sails.jpg',
    source: 'wikimedia',
  },
  {
    id: 'landmark_006',
    filename: 'colosseum.jpg',
    label: 'Colosseum, Rome, Italy',
    lat: 41.8902,
    lon: 12.4922,
    continent: 'Europe',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/640px-Colosseo_2020.jpg',
    source: 'wikimedia',
  },
  {
    id: 'landmark_007',
    filename: 'golden_gate_bridge.jpg',
    label: 'Golden Gate Bridge, San Francisco, USA',
    lat: 37.8199,
    lon: -122.4783,
    continent: 'North America',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/GoldenGateBridge-001.jpg/640px-GoldenGateBridge-001.jpg',
    source: 'wikimedia',
  },
  {
    id: 'landmark_008',
    filename: 'sagrada_familia.jpg',
    label: 'Sagrada Familia, Barcelona, Spain',
    lat: 41.4036,
    lon: 2.1744,
    continent: 'Europe',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/%D0%A1%D0%B0%D0%B3%D1%80%D0%B0%D0%B4%D0%B0_%D0%A4%D0%B0%D0%BC%D1%96%D0%BB%D1%96%D1%8F_%D0%B2_%D0%91%D0%B0%D1%80%D1%86%D0%B5%D0%BB%D0%BE%D0%BD%D1%96.jpg/640px-%D0%A1%D0%B0%D0%B3%D1%80%D0%B0%D0%B4%D0%B0_%D0%A4%D0%B0%D0%BC%D1%96%D0%BB%D1%96%D1%8F_%D0%B2_%D0%91%D0%B0%D1%80%D1%86%D0%B5%D0%BB%D0%BE%D0%BD%D1%96.jpg',
    source: 'wikimedia',
  },
  {
    id: 'landmark_009',
    filename: 'mount_fuji.jpg',
    label: 'Mount Fuji, Japan',
    lat: 35.3606,
    lon: 138.7274,
    continent: 'Asia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/080103_hakkai_fuji.jpg/640px-080103_hakkai_fuji.jpg',
    source: 'wikimedia',
  },
  {
    id: 'landmark_010',
    filename: 'christ_redeemer.jpg',
    label: 'Christ the Redeemer, Rio de Janeiro, Brazil',
    lat: -22.9519,
    lon: -43.2105,
    continent: 'South America',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Aerial_view_of_the_Statue_of_Christ_the_Redeemer.jpg/640px-Aerial_view_of_the_Statue_of_Christ_the_Redeemer.jpg',
    source: 'wikimedia',
  },
];

const OUTPUT_DIR = path.resolve(process.cwd(), '.cache/validation_gallery');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');
const MANIFEST_FILE = path.join(OUTPUT_DIR, 'manifest.json');

interface GalleryManifest {
  images: Array<{
    id: string;
    source: string;
    filename: string;
    url: string;
    local_path: string;
    coordinates: { lat: number; lon: number };
    accuracy_radius: number;
    image_info: {
      width: number;
      height: number;
      size_bytes: number;
      mime_type: string;
    };
    metadata: {
      title: string;
      description?: string;
      categories: string[];
    };
  }>;
  stats: {
    total: number;
    by_continent: Record<string, number>;
    by_country_estimate: Record<string, number>;
    by_scene_type: {
      urban: number;
      rural: number;
      landmark: number;
      nature: number;
      unknown: number;
    };
  };
  created_at: string;
}

async function downloadImage(url: string, outputPath: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GeoWraith/0.2.0 (research validation)',
      },
    });
    
    if (!response.ok) {
      console.warn(`  HTTP ${response.status}: ${url}`);
      return false;
    }
    
    const buffer = await response.arrayBuffer();
    await writeFile(outputPath, Buffer.from(buffer));
    return true;
  } catch (error) {
    console.warn(`  Download failed: ${error}`);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  if (dryRun) {
    console.log('[RealImageDownloader] Dry run - planned downloads:\n');
    for (const landmark of LANDMARKS) {
      console.log(`- ${landmark.filename} (${landmark.label})`);
      console.log(`  ${landmark.url}`);
    }
    console.log('\nNo files were downloaded.');
    return;
  }

  console.log('[RealImageDownloader] Downloading real landmark images\n');
  
  await mkdir(IMAGES_DIR, { recursive: true });
  
  const manifest: GalleryManifest = {
    images: [],
    stats: {
      total: 0,
      by_continent: {},
      by_country_estimate: {},
      by_scene_type: {
        urban: 0,
        rural: 0,
        landmark: 10,
        nature: 0,
        unknown: 0,
      },
    },
    created_at: new Date().toISOString(),
  };
  
  let successCount = 0;
  let failCount = 0;
  
  for (const landmark of LANDMARKS) {
    console.log(`[${successCount + failCount + 1}/${LANDMARKS.length}] ${landmark.label}`);
    
    const imagePath = path.join(IMAGES_DIR, landmark.filename);
    
    // Skip if already exists
    if (existsSync(imagePath)) {
      console.log('  ✓ Already exists');
      successCount++;
    } else {
      // Download with delay to be respectful
      const success = await downloadImage(landmark.url, imagePath);
      if (!success) {
        failCount++;
        continue;
      }
      successCount++;
      console.log('  ✓ Downloaded');
      
      // Be nice to Wikimedia servers
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // Get file info
    const stats = await readFile(imagePath).then(b => ({
      size: b.length,
    })).catch(() => ({ size: 0 }));
    
    manifest.images.push({
      id: landmark.id,
      source: landmark.source,
      filename: landmark.filename,
      url: landmark.url,
      local_path: imagePath,
      coordinates: { lat: landmark.lat, lon: landmark.lon },
      accuracy_radius: 30,
      image_info: {
        width: 640,
        height: 480,
        size_bytes: stats.size,
        mime_type: 'image/jpeg',
      },
      metadata: {
        title: landmark.label,
        description: `Landmark photo for validation`,
        categories: ['landmark', landmark.continent.toLowerCase()],
      },
    });
    
    manifest.stats.by_continent[landmark.continent] = (manifest.stats.by_continent[landmark.continent] || 0) + 1;
    manifest.stats.total++;
  }
  
  await writeFile(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
  
  console.log('\n========================================');
  console.log('[RealImageDownloader] Complete!');
  console.log('========================================');
  console.log(`Downloaded: ${successCount}/${LANDMARKS.length}`);
  console.log(`Failed: ${failCount}`);
  console.log(`\nGeographic distribution:`);
  console.log(`  By continent: ${JSON.stringify(manifest.stats.by_continent)}`);
  
  if (failCount > 0) {
    console.log('\n⚠️ Some downloads failed. This is normal due to rate limiting.');
    console.log('Run the script again later to retry failed downloads.');
  }
}

main().catch((error) => {
  console.error('[RealImageDownloader] Fatal error:', error);
  process.exit(1);
});
