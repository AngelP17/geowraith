import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { GalleryManifest } from '../benchmarks/validationBenchmark/types.js';
import type { ReferenceVectorRecord } from '../types.js';

interface HoldoutImageSeed {
  sourcePath: string;
  filename: string;
  title: string;
  lat: number;
  lon: number;
  continent: string;
}

const HOLDOUT_IMAGES: HoldoutImageSeed[] = [
  {
    sourcePath: '.cache/ultra_densified_final/marrakech_openverse_0.jpg',
    filename: 'holdout_marrakech_medina.jpg',
    title: 'Marrakech Medina, Morocco',
    lat: 31.6295,
    lon: -7.9811,
    continent: 'Africa',
  },
  {
    sourcePath: '.cache/ultra_densified_final/copacabana_openverse_100.jpg',
    filename: 'holdout_copacabana_beach.jpg',
    title: 'Copacabana Beach, Rio de Janeiro, Brazil',
    lat: -22.9719,
    lon: -43.1823,
    continent: 'South America',
  },
  {
    sourcePath: '.cache/api_images_extra/banff_pexels_90.jpg',
    filename: 'holdout_banff.jpg',
    title: 'Banff National Park, Canada',
    lat: 51.4968,
    lon: -115.9281,
    continent: 'North America',
  },
  {
    sourcePath: '.cache/api_images_extra/table_mountain_pexels_210.jpg',
    filename: 'holdout_table_mountain.jpg',
    title: 'Table Mountain, South Africa',
    lat: -33.9628,
    lon: 18.4098,
    continent: 'Africa',
  },
  {
    sourcePath: '.cache/api_images_extra/great_barrier_reef_pexels_240.jpg',
    filename: 'holdout_great_barrier_reef.jpg',
    title: 'Great Barrier Reef, Australia',
    lat: -18.2871,
    lon: 147.6992,
    continent: 'Oceania',
  },
  {
    sourcePath: '.cache/api_images_extra/milford_sound_pexels_30.jpg',
    filename: 'holdout_milford_sound.jpg',
    title: 'Milford Sound, New Zealand',
    lat: -44.6414,
    lon: 167.8974,
    continent: 'Oceania',
  },
  {
    sourcePath: '.cache/api_images_extra/tower_bridge_pexels_182.jpg',
    filename: 'holdout_tower_bridge.jpg',
    title: 'Tower Bridge, London, UK',
    lat: 51.5055,
    lon: -0.0754,
    continent: 'Europe',
  },
  {
    sourcePath: '.cache/api_images_extra/moai_pexels_120.jpg',
    filename: 'holdout_moai.jpg',
    title: 'Moai Statues, Easter Island',
    lat: -27.1258,
    lon: -109.2774,
    continent: 'Oceania',
  },
  {
    sourcePath: '.cache/boost_failing_landmarks/acropolis_openverse_866.jpg',
    filename: 'holdout_acropolis.jpg',
    title: 'Acropolis, Athens, Greece',
    lat: 37.9715,
    lon: 23.7267,
    continent: 'Europe',
  },
  {
    sourcePath: '.cache/boost_failing_landmarks/petra_openverse_158.jpg',
    filename: 'holdout_petra.jpg',
    title: 'Petra, Jordan',
    lat: 30.3285,
    lon: 35.4444,
    continent: 'Asia',
  },
  {
    sourcePath: '.cache/ultra_densified_final/perito_moreno_pexels_84.jpg',
    filename: 'holdout_perito_moreno.jpg',
    title: 'Perito Moreno Glacier, Argentina',
    lat: -50.4957,
    lon: -73.1376,
    continent: 'South America',
  },
];

const OUTPUT_DIR = path.resolve(process.cwd(), '.cache/holdout_gallery');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');
const MANIFEST_FILE = path.join(OUTPUT_DIR, 'manifest.json');
const MERGED_VECTORS_FILE = path.resolve(
  process.cwd(),
  '.cache/geoclip/referenceImageVectors.merged_v1.json',
);

async function getImageInfo(imagePath: string): Promise<{
  width: number;
  height: number;
  size_bytes: number;
  mime_type: string;
}> {
  const sharp = (await import('sharp')).default;
  const metadata = await sharp(imagePath).metadata();
  const buffer = await readFile(imagePath);
  return {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    size_bytes: buffer.length,
    mime_type: metadata.format ? `image/${metadata.format}` : 'image/unknown',
  };
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  if (dryRun) {
    console.log('[HoldoutGallery] Dry run:');
    for (const image of HOLDOUT_IMAGES) {
      console.log(`- ${image.filename}: ${image.sourcePath}`);
    }
    return;
  }

  console.log('[HoldoutGallery] Building holdout gallery');
  await mkdir(IMAGES_DIR, { recursive: true });
  const mergedRaw = await readFile(MERGED_VECTORS_FILE, 'utf8');
  const mergedPayload = JSON.parse(mergedRaw) as { vectors?: ReferenceVectorRecord[] };
  const indexedIds = new Set((mergedPayload.vectors ?? []).map((vector) => vector.id));

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

  for (let i = 0; i < HOLDOUT_IMAGES.length; i += 1) {
    const image = HOLDOUT_IMAGES[i]!;
    const imagePath = path.join(IMAGES_DIR, image.filename);
    console.log(`[${i + 1}/${HOLDOUT_IMAGES.length}] ${image.title}`);
    const sourcePath = path.resolve(process.cwd(), image.sourcePath);
    const sourceStem = path.parse(sourcePath).name;
    const possibleOverlapIds = [
      sourceStem,
      `api_images_${sourceStem}`,
      `api_images_extra_${sourceStem}`,
      `refined_${sourceStem}`,
    ];
    if (possibleOverlapIds.some((id) => indexedIds.has(id))) {
      throw new Error(
        `Refusing to use ${sourceStem} for holdout because it already exists in the active corpus.`,
      );
    }

    await copyFile(sourcePath, imagePath);
    const info = await getImageInfo(imagePath);
    manifest.images.push({
      id: `holdout_${String(i + 1).padStart(4, '0')}`,
      source: 'local-holdout',
      filename: image.filename,
      url: '',
      local_path: imagePath,
      coordinates: { lat: image.lat, lon: image.lon },
      accuracy_radius: 30,
      image_info: info,
      metadata: {
        title: image.title,
        categories: ['holdout', 'landmark'],
      },
    });

    manifest.stats.total += 1;
    manifest.stats.by_continent[image.continent] =
      (manifest.stats.by_continent[image.continent] ?? 0) + 1;
    manifest.stats.by_scene_type.landmark += 1;
  }

  await writeFile(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(
    `[HoldoutGallery] Wrote ${manifest.stats.total} images to ${MANIFEST_FILE}`,
  );
  console.log(
    '[HoldoutGallery] This seed set is intentionally separate from validation and ' +
      'is checked against the active merged corpus before writing.',
  );
}

main().catch((error) => {
  console.error('[HoldoutGallery] Fatal error:', error);
  process.exit(1);
});
