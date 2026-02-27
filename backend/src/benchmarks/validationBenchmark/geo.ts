/**
 * Geographical utilities for validation benchmark.
 */

import type { GalleryImage } from './types.js';

// Scene classification patterns
const LANDMARK_PATTERNS = /landmark|monument|church|temple|castle|palace|museum|tower|bridge|statue/;
const NATURE_PATTERNS = /nature|forest|mountain|lake|river|ocean|beach|park|wildlife|national park/;
const URBAN_PATTERNS = /city|urban|street|building|downtown|skyline|architecture/;
const RURAL_PATTERNS = /countryside|village|rural|farm|field|country/;

// Cohort classification patterns
const GENERIC_SCENE_HINTS = /(beach|coast|coastal|reef|mountain|point|medina|crater|sound|glacier|falls|national park|bay|alps|canyon|uyuni)/;
const ICONIC_LANDMARK_HINTS = /(tower|bridge|cathedral|temple|castle|palace|mosque|pyramids|colosseum|acropolis|opera house|statue|capitol|white house|forbidden city|stonehenge|museum)/;

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

  if (LANDMARK_PATTERNS.test(text)) {
    return 'landmark';
  }
  if (NATURE_PATTERNS.test(text)) {
    return 'nature';
  }
  if (URBAN_PATTERNS.test(text)) {
    return 'urban';
  }
  if (RURAL_PATTERNS.test(text)) {
    return 'rural';
  }
  return 'unknown';
}

export function extractLocationMetadata(image: GalleryImage): {
  continent: string;
  sceneType: string;
  cohort: 'iconic_landmark' | 'generic_scene';
} {
  const sceneType = classifySceneType(image.metadata.title, image.metadata.categories);
  return {
    continent: getContinentFromCoordinates(image.coordinates.lat, image.coordinates.lon),
    sceneType,
    cohort: classifyValidationCohort(image.metadata.title, image.metadata.categories, sceneType),
  };
}

/**
 * Split validation images into a stable benchmark cohort model:
 * - iconic_landmark: distinctive, identity-rich landmark views
 * - generic_scene: nature/coastal/ambiguous scenes where visual similarity can cross regions
 */
export function classifyValidationCohort(
  title: string,
  categories: string[] = [],
  sceneType?: string
): 'iconic_landmark' | 'generic_scene' {
  const text = `${title} ${categories.join(' ')}`.toLowerCase();
  const resolvedSceneType = sceneType ?? classifySceneType(title, categories);

  if (resolvedSceneType === 'nature' || GENERIC_SCENE_HINTS.test(text)) {
    return 'generic_scene';
  }

  if (resolvedSceneType === 'landmark' || ICONIC_LANDMARK_HINTS.test(text)) {
    return 'iconic_landmark';
  }

  return 'generic_scene';
}
