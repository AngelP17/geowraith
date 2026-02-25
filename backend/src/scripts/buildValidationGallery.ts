/**
 * Build validation gallery by sourcing geotagged images.
 *
 * This script creates a validation dataset for GeoWraith benchmarking.
 * It supports multiple sources:
 * 1. Wikimedia Commons API (with rate limiting)
 * 2. Manual image URLs with known coordinates
 *
 * Usage:
 *   npx tsx src/scripts/buildValidationGallery.ts --count=100
 *   npx tsx src/scripts/buildValidationGallery.ts --demo (create demo with synthetic data)
 */

import { writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import exifr from 'exifr';
import fetch from 'node-fetch';

// Constants
const WIKIMEDIA_API = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = 'GeoWraith/0.2.0 (validation gallery builder; research project)';
const REQUEST_DELAY_MS = 2000; // 2 seconds between requests (Wikimedia is strict)
const MAX_RETRIES = 3;
const MIN_WIDTH = 800;
const MIN_HEIGHT = 600;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const DEFAULT_TARGET_COUNT = 100;

const CACHE_DIR = path.resolve(process.cwd(), '.cache/validation_gallery');
const IMAGES_DIR = path.join(CACHE_DIR, 'images');
const MANIFEST_PATH = path.join(CACHE_DIR, 'manifest.json');

// Types
interface WikimediaImage {
  name: string;
  url: string;
  descriptionurl: string;
  size: number;
  width: number;
  height: number;
  mime: string;
  extmetadata?: {
    GPSLatitude?: { value: string };
    GPSLongitude?: { value: string };
    GPSAltitude?: { value: string };
    ObjectName?: { value: string };
    ImageDescription?: { value: string };
    Artist?: { value: string };
    DateTimeOriginal?: { value: string };
    Categories?: { value: string };
  };
}

interface WikimediaApiResponse {
  batchcomplete?: string;
  continue?: {
    aicontinue?: string;
    continue?: string;
  };
  query?: {
    allimages?: WikimediaImage[];
  };
}

interface GalleryImage {
  id: string;
  source: 'wikimedia_commons' | 'manual' | 'demo';
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
    artist?: string;
    capture_date?: string;
    categories: string[];
  };
}

interface GalleryManifest {
  images: GalleryImage[];
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

// Helper functions
function parseCount(argv: string[]): number {
  const raw = argv.find((arg) => arg.startsWith('--count='))?.split('=')[1];
  const parsed = Number.parseInt(raw ?? `${DEFAULT_TARGET_COUNT}`, 10);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 1000) {
    throw new Error('invalid --count argument (must be 1-1000)');
  }
  return parsed;
}

function isDemoMode(argv: string[]): boolean {
  return argv.includes('--demo');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await access(dirPath);
  } catch {
    await mkdir(dirPath, { recursive: true });
  }
}

function extractGpsFromExtmetadata(metadata: WikimediaImage['extmetadata']): { lat: number; lon: number } | null {
  if (!metadata) return null;

  const latStr = metadata.GPSLatitude?.value;
  const lonStr = metadata.GPSLongitude?.value;

  if (!latStr || !lonStr) return null;

  const lat = Number.parseFloat(latStr);
  const lon = Number.parseFloat(lonStr);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;

  return { lat, lon };
}

function getContinentFromCoordinates(lat: number, lon: number): string {
  if (lat > 35 && lon > -10 && lon < 40) return 'Europe';
  if (lat > 10 && lon > 25 && lon < 140) return 'Asia';
  if (lat > -35 && lon > -20 && lon < 55) return 'Africa';
  if (lat > 15 && lon > -170 && lon < -50) return 'North America';
  if (lat < 15 && lat > -60 && lon > -90 && lon < -30) return 'South America';
  if (lat < -10 && lon > 110 && lon < 180) return 'Oceania';
  if (lat < -60) return 'Antarctica';
  return 'Unknown';
}

function estimateCountryFromCoordinates(lat: number, lon: number): string {
  if (lat > 24 && lat < 50 && lon > -125 && lon < -66) return 'USA';
  if (lat > 49 && lat < 59 && lon > -8 && lon < 2) return 'UK';
  if (lat > 47 && lat < 55 && lon > 5 && lon < 15) return 'Germany';
  if (lat > 42 && lat < 51 && lon > -5 && lon < 8) return 'France';
  if (lat > 30 && lat < 46 && lon > 129 && lon < 146) return 'Japan';
  if (lat > -44 && lat < -10 && lon > 113 && lon < 154) return 'Australia';
  if (lat > -34 && lat < 5 && lon > -74 && lon < -34) return 'Brazil';
  if (lat > 6 && lat < 37 && lon > 68 && lon < 97) return 'India';
  if (lat > 18 && lat < 54 && lon > 73 && lon < 135) return 'China';
  if (lat > 41 && lat < 84 && lon > -141 && lon < -52) return 'Canada';
  return 'Other';
}

function classifySceneType(title: string, description: string = '', categories: string[] = []): string {
  const text = `${title} ${description} ${categories.join(' ')}`.toLowerCase();

  if (/landmark|monument|church|temple|castle|palace|museum|tower|bridge|statue/.test(text)) {
    return 'landmark';
  }
  if (/nature|forest|mountain|lake|river|ocean|beach|park|wildlife|national park/.test(text)) {
    return 'nature';
  }
  if (/city|urban|street|building|downtown|skyline|architecture/.test(text)) {
    return 'urban';
  }
  if (/countryside|village|rural|farm|field|country/.test(text)) {
    return 'rural';
  }
  return 'unknown';
}

async function fetchWikimediaImages(continueToken?: string): Promise<WikimediaApiResponse> {
  const params = new URLSearchParams({
    action: 'query',
    list: 'allimages',
    aisort: 'timestamp',
    aidir: 'ascending',
    aistart: '2010-01-01T00:00:00Z',
    aiprop: 'url|size|mime|extmetadata',
    ailimit: '50',
    format: 'json',
    origin: '*',
  });

  if (continueToken) {
    params.set('aicontinue', continueToken);
  }

  const response = await fetch(`${WIKIMEDIA_API}?${params.toString()}`, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Wikimedia API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<WikimediaApiResponse>;
}

async function downloadImage(url: string, localPath: string, retries = 0): Promise<{ size: number; success: boolean; error?: string }> {
  try {
    // Add delay before each download to respect rate limits
    await sleep(REQUEST_DELAY_MS);

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      if ((response.status === 429 || response.status >= 500) && retries < MAX_RETRIES) {
        const delay = REQUEST_DELAY_MS * (retries + 1) * 3;
        console.log(`[GalleryBuilder] Rate limited, waiting ${delay}ms before retry ${retries + 1}/${MAX_RETRIES}...`);
        await sleep(delay);
        return downloadImage(url, localPath, retries + 1);
      }
      return { size: 0, success: false, error: `HTTP ${response.status}` };
    }

    const contentLength = Number(response.headers.get('content-length'));
    if (contentLength > MAX_FILE_BYTES) {
      return { size: contentLength, success: false, error: 'File too large' };
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    if (buffer.length > MAX_FILE_BYTES) {
      return { size: buffer.length, success: false, error: 'File too large' };
    }

    await writeFile(localPath, buffer);
    return { size: buffer.length, success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { size: 0, success: false, error: errorMsg };
  }
}

async function verifyGpsWithExif(localPath: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const gps = await exifr.gps(localPath);
    if (!gps || !Number.isFinite(gps.latitude) || !Number.isFinite(gps.longitude)) {
      return null;
    }
    return { lat: gps.latitude, lon: gps.longitude };
  } catch {
    return null;
  }
}

// Create demo manifest with known landmarks for testing when API is unavailable
function createDemoManifest(): GalleryManifest {
  const demoImages: GalleryImage[] = [
    {
      id: 'demo_0001',
      source: 'demo',
      filename: 'eiffel_tower.jpg',
      url: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg',
      local_path: path.join(IMAGES_DIR, 'eiffel_tower.jpg'),
      coordinates: { lat: 48.8584, lon: 2.2945 },
      accuracy_radius: 50,
      image_info: { width: 1920, height: 2880, size_bytes: 0, mime_type: 'image/jpeg' },
      metadata: {
        title: 'Eiffel Tower',
        description: 'Eiffel Tower in Paris, France',
        categories: ['landmark', 'paris', 'france'],
      },
    },
    {
      id: 'demo_0002',
      source: 'demo',
      filename: 'statue_of_liberty.jpg',
      url: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Lady_Liberty_under_a_blue_sky_%28cropped%29.jpg',
      local_path: path.join(IMAGES_DIR, 'statue_of_liberty.jpg'),
      coordinates: { lat: 40.6892, lon: -74.0445 },
      accuracy_radius: 50,
      image_info: { width: 2000, height: 3000, size_bytes: 0, mime_type: 'image/jpeg' },
      metadata: {
        title: 'Statue of Liberty',
        description: 'Statue of Liberty in New York Harbor',
        categories: ['landmark', 'new_york', 'usa'],
      },
    },
    {
      id: 'demo_0003',
      source: 'demo',
      filename: 'colosseum.jpg',
      url: 'https://upload.wikimedia.org/wikipedia/commons/d/de/Colosseo_2020.jpg',
      local_path: path.join(IMAGES_DIR, 'colosseum.jpg'),
      coordinates: { lat: 41.8902, lon: 12.4922 },
      accuracy_radius: 50,
      image_info: { width: 3000, height: 2000, size_bytes: 0, mime_type: 'image/jpeg' },
      metadata: {
        title: 'Colosseum',
        description: 'The Colosseum in Rome, Italy',
        categories: ['landmark', 'rome', 'italy'],
      },
    },
    {
      id: 'demo_0004',
      source: 'demo',
      filename: 'sydney_opera_house.jpg',
      url: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Sydney_Opera_House_Sails.jpg',
      local_path: path.join(IMAGES_DIR, 'sydney_opera_house.jpg'),
      coordinates: { lat: -33.8568, lon: 151.2153 },
      accuracy_radius: 50,
      image_info: { width: 3000, height: 2000, size_bytes: 0, mime_type: 'image/jpeg' },
      metadata: {
        title: 'Sydney Opera House',
        description: 'Sydney Opera House, Australia',
        categories: ['landmark', 'sydney', 'australia'],
      },
    },
    {
      id: 'demo_0005',
      source: 'demo',
      filename: 'taj_mahal.jpg',
      url: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Taj_Mahal_%28Edited%29.jpeg',
      local_path: path.join(IMAGES_DIR, 'taj_mahal.jpg'),
      coordinates: { lat: 27.1751, lon: 78.0421 },
      accuracy_radius: 50,
      image_info: { width: 3000, height: 2000, size_bytes: 0, mime_type: 'image/jpeg' },
      metadata: {
        title: 'Taj Mahal',
        description: 'Taj Mahal in Agra, India',
        categories: ['landmark', 'agra', 'india'],
      },
    },
  ];

  return {
    images: demoImages,
    stats: calculateStats(demoImages),
    created_at: new Date().toISOString(),
  };
}

async function buildGalleryFromWikimedia(targetCount: number): Promise<GalleryManifest> {
  const images: GalleryImage[] = [];
  const seenFilenames = new Set<string>();
  let continueToken: string | undefined;
  let attempts = 0;
  const maxAttempts = targetCount * 30;

  console.log(`[GalleryBuilder] Starting Wikimedia gallery build (target: ${targetCount} images)`);
  console.log(`[GalleryBuilder] Rate limit: ${REQUEST_DELAY_MS}ms between requests\n`);

  await ensureDirectory(IMAGES_DIR);

  while (images.length < targetCount && attempts < maxAttempts) {
    try {
      if (attempts % 50 === 0) {
        console.log(`[GalleryBuilder] Fetching batch (have ${images.length}/${targetCount}, scanned ${attempts})...`);
      }
      
      const data = await fetchWikimediaImages(continueToken);
      const apiImages = data.query?.allimages;
      
      if (!apiImages || apiImages.length === 0) {
        console.warn('[GalleryBuilder] No more images from API');
        break;
      }

      for (const apiImage of apiImages) {
        if (images.length >= targetCount) break;
        attempts++;

        const width = apiImage.width ?? 0;
        const height = apiImage.height ?? 0;
        if (width < MIN_WIDTH || height < MIN_HEIGHT) continue;

        const sizeBytes = apiImage.size ?? 0;
        if (sizeBytes > MAX_FILE_BYTES) continue;

        const gpsFromMetadata = extractGpsFromExtmetadata(apiImage.extmetadata);
        if (!gpsFromMetadata) continue;

        const filename = apiImage.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        if (seenFilenames.has(filename)) continue;
        seenFilenames.add(filename);

        const localPath = path.join(IMAGES_DIR, filename);

        console.log(`[GalleryBuilder] Found GPS: ${apiImage.name} (${gpsFromMetadata.lat.toFixed(4)}, ${gpsFromMetadata.lon.toFixed(4)})`);
        
        const downloadResult = await downloadImage(apiImage.url, localPath);
        if (!downloadResult.success) {
          console.log(`[GalleryBuilder] Download failed${downloadResult.error ? `: ${downloadResult.error}` : ''}, skipping`);
          continue;
        }

        const gpsFromExif = await verifyGpsWithExif(localPath);
        if (!gpsFromExif) {
          console.log(`[GalleryBuilder] EXIF verification failed, skipping`);
          continue;
        }

        const coordinates = gpsFromExif;
        const categoriesStr = apiImage.extmetadata?.Categories?.value ?? '';
        const categories = categoriesStr.split('|').map(c => c.trim()).filter(c => c.length > 0);

        let description = apiImage.extmetadata?.ImageDescription?.value;
        if (description && description.startsWith('{')) {
          description = undefined;
        }

        const galleryImage: GalleryImage = {
          id: `wikimedia_${String(images.length + 1).padStart(4, '0')}`,
          source: 'wikimedia_commons',
          filename,
          url: apiImage.url,
          local_path: localPath,
          coordinates,
          accuracy_radius: 30,
          image_info: {
            width,
            height,
            size_bytes: downloadResult.size,
            mime_type: apiImage.mime ?? 'unknown',
          },
          metadata: {
            title: apiImage.name,
            description,
            artist: apiImage.extmetadata?.Artist?.value,
            capture_date: apiImage.extmetadata?.DateTimeOriginal?.value,
            categories,
          },
        };

        images.push(galleryImage);
        console.log(`[GalleryBuilder] ✓ Added ${apiImage.name} (${images.length}/${targetCount})`);
      }

      continueToken = data.continue?.aicontinue;
      if (!continueToken) {
        console.log('[GalleryBuilder] No more results from API');
        break;
      }
    } catch (error) {
      console.error('[GalleryBuilder] Error during fetch:', error);
      await sleep(REQUEST_DELAY_MS * 3);
    }
  }

  if (images.length < targetCount) {
    console.warn(`[GalleryBuilder] Warning: Only found ${images.length} images with GPS data (target was ${targetCount})`);
  }

  return {
    images,
    stats: calculateStats(images),
    created_at: new Date().toISOString(),
  };
}

function calculateStats(images: GalleryImage[]): GalleryManifest['stats'] {
  const byContinent: Record<string, number> = {};
  const byCountry: Record<string, number> = {};
  const bySceneType = {
    urban: 0,
    rural: 0,
    landmark: 0,
    nature: 0,
    unknown: 0,
  };

  for (const image of images) {
    const continent = getContinentFromCoordinates(image.coordinates.lat, image.coordinates.lon);
    byContinent[continent] = (byContinent[continent] ?? 0) + 1;

    const country = estimateCountryFromCoordinates(image.coordinates.lat, image.coordinates.lon);
    byCountry[country] = (byCountry[country] ?? 0) + 1;

    const sceneType = classifySceneType(
      image.metadata.title,
      image.metadata.description,
      image.metadata.categories
    );
    bySceneType[sceneType as keyof typeof bySceneType]++;
  }

  return {
    total: images.length,
    by_continent: byContinent,
    by_country_estimate: byCountry,
    by_scene_type: bySceneType,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const count = parseCount(args);
  const demo = isDemoMode(args);

  console.log('[GalleryBuilder] Building validation gallery for GeoWraith\n');

  let manifest: GalleryManifest;

  if (demo) {
    console.log('[GalleryBuilder] Creating DEMO gallery with known landmarks');
    manifest = createDemoManifest();
    console.log(`[GalleryBuilder] Created ${manifest.images.length} demo entries\n`);
    console.log('NOTE: Demo mode creates metadata entries without downloading images.');
    console.log('Images will be downloaded on-demand during validation benchmark.\n');
  } else {
    console.log(`[GalleryBuilder] Target count: ${count}`);
    console.log(`[GalleryBuilder] Output directory: ${CACHE_DIR}\n`);
    manifest = await buildGalleryFromWikimedia(count);
  }

  // Write manifest
  await ensureDirectory(CACHE_DIR);
  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log('\n========================================');
  console.log('[GalleryBuilder] Gallery build complete!');
  console.log('========================================');
  console.log(`Images: ${manifest.images.length}`);
  console.log(`Manifest: ${MANIFEST_PATH}`);
  console.log('\nGeographic distribution:');
  console.log(`  By continent: ${JSON.stringify(manifest.stats.by_continent)}`);
  console.log(`  By scene type: ${JSON.stringify(manifest.stats.by_scene_type)}`);
  
  if (!demo && manifest.images.length < count) {
    console.log('\nTIP: Wikimedia Commons has strict rate limiting.');
    console.log('Consider using --demo mode for quick testing:');
    console.log('  npm run build:gallery -- --demo');
  }
}

main().catch((error) => {
  console.error('[GalleryBuilder] Fatal error:', error);
  process.exit(1);
});
