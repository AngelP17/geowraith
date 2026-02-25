/**
 * Build a local validation gallery using embedded sample images.
 * This avoids Wikimedia API rate limits by using local/generated samples.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

interface GalleryImage {
  id: string;
  filename: string;
  label: string;
  lat: number;
  lon: number;
  continent: string;
  sceneType: 'urban' | 'rural' | 'landmark' | 'nature';
  // Small base64-encoded JPEG (2x2 pixels)
  base64: string;
}

// Minimal valid JPEG images
const SAMPLE_IMAGES: GalleryImage[] = [
  {
    id: 'sample_001',
    filename: 'eiffel_tower_sample.jpg',
    label: 'Eiffel Tower, Paris',
    lat: 48.8584,
    lon: 2.2945,
    continent: 'Europe',
    sceneType: 'landmark',
    base64: '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
  },
  {
    id: 'sample_002',
    filename: 'statue_liberty_sample.jpg',
    label: 'Statue of Liberty, NYC',
    lat: 40.6892,
    lon: -74.0445,
    continent: 'North America',
    sceneType: 'landmark',
    base64: '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
  },
  {
    id: 'sample_003',
    filename: 'taj_mahal_sample.jpg',
    label: 'Taj Mahal, Agra',
    lat: 27.1751,
    lon: 78.0421,
    continent: 'Asia',
    sceneType: 'landmark',
    base64: '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
  },
];

const OUTPUT_DIR = path.resolve(process.cwd(), '.cache/validation_gallery');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');
const MANIFEST_FILE = path.join(OUTPUT_DIR, 'manifest.json');

// Match the structure expected by validationBenchmark.ts
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

async function main() {
  console.log('[LocalGalleryBuilder] Building local validation gallery\n');

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
        landmark: 0,
        nature: 0,
        unknown: 0,
      },
    },
    created_at: new Date().toISOString(),
  };

  for (const img of SAMPLE_IMAGES) {
    const imagePath = path.join(IMAGES_DIR, img.filename);
    const imageBuffer = Buffer.from(img.base64, 'base64');
    
    await writeFile(imagePath, imageBuffer);
    
    manifest.images.push({
      id: img.id,
      source: 'local_sample',
      filename: img.filename,
      url: '',
      local_path: imagePath,
      coordinates: { lat: img.lat, lon: img.lon },
      accuracy_radius: 30,
      image_info: {
        width: 2,
        height: 2,
        size_bytes: imageBuffer.length,
        mime_type: 'image/jpeg',
      },
      metadata: {
        title: img.label,
        description: `Sample image for ${img.label}`,
        categories: [img.sceneType, img.continent.toLowerCase()],
      },
    });

    manifest.stats.by_continent[img.continent] = (manifest.stats.by_continent[img.continent] || 0) + 1;
    manifest.stats.by_scene_type[img.sceneType]++;
    manifest.stats.total++;

    console.log(`[LocalGalleryBuilder] Added ${img.label} (${img.lat.toFixed(4)}, ${img.lon.toFixed(4)})`);
  }

  await writeFile(MANIFEST_FILE, JSON.stringify(manifest, null, 2));

  console.log('\n========================================');
  console.log('[LocalGalleryBuilder] Gallery build complete!');
  console.log('========================================');
  console.log(`Images: ${manifest.stats.total}`);
  console.log(`Manifest: ${MANIFEST_FILE}`);
  console.log('\nGeographic distribution:');
  console.log(`  By continent: ${JSON.stringify(manifest.stats.by_continent)}`);
  console.log(`  By scene type: ${JSON.stringify(manifest.stats.by_scene_type)}`);
  console.log('\nNote: These are minimal sample images for pipeline testing.');
  console.log('For real validation, use actual landmark photos.');
}

main().catch((error) => {
  console.error('[LocalGalleryBuilder] Fatal error:', error);
  process.exit(1);
});
