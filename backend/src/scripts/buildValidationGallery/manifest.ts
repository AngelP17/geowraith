/**
 * Manifest creation and statistics calculation.
 */

import { writeFile } from 'node:fs/promises';
import type { GalleryImage, GalleryManifest } from './types.js';
import { IMAGES_DIR, MANIFEST_PATH } from './config.js';
import {
  getContinentFromCoordinates,
  estimateCountryFromCoordinates,
  classifySceneType,
  ensureDirectory,
} from './utils.js';
import path from 'node:path';

/**
 * Calculate statistics for a set of gallery images.
 */
export function calculateStats(images: GalleryImage[]): GalleryManifest['stats'] {
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

/**
 * Create a demo manifest with known landmarks for testing.
 */
export function createDemoManifest(): GalleryManifest {
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

/**
 * Save a manifest to disk.
 */
export async function saveManifest(manifest: GalleryManifest): Promise<void> {
  await ensureDirectory(path.dirname(MANIFEST_PATH));
  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

export { MANIFEST_PATH };
