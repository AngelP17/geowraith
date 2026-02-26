/**
 * Geographical utilities for validation benchmark.
 */

import type { GalleryImage } from './types.js';

export function getContinentFromCoordinates(lat: number, lon: number): string {
  if (lat > 35 && lon > -10 && lon < 40) return 'Europe';
  if (lat > 10 && lon > 25 && lon < 140) return 'Asia';
  if (lat > -35 && lon > -20 && lon < 55) return 'Africa';
  if (lat > 15 && lon > -170 && lon < -50) return 'North America';
  if (lat < 15 && lat > -60 && lon > -90 && lon < -30) return 'South America';
  if (lat < -10 && lon > 110 && lon < 180) return 'Oceania';
  if (lat < -60) return 'Antarctica';
  return 'Unknown';
}

export function classifySceneType(title: string, categories: string[] = []): string {
  const text = `${title} ${categories.join(' ')}`.toLowerCase();

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

export function extractLocationMetadata(image: GalleryImage): {
  continent: string;
  sceneType: string;
} {
  return {
    continent: getContinentFromCoordinates(image.coordinates.lat, image.coordinates.lon),
    sceneType: classifySceneType(image.metadata.title, image.metadata.categories),
  };
}
