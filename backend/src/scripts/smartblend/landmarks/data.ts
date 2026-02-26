/**
 * SmartBlend landmark database entries.
 * Combined export from regional data files.
 */

import type { LandmarkSource } from './types.js';
import { EUROPEAN_LANDMARKS } from './data/europe.js';
import { AMERICAS_LANDMARKS } from './data/americas.js';
import { ASIAN_LANDMARKS } from './data/asia.js';
import { OTHER_LANDMARKS } from './data/other.js';

export const SMART_BLEND_DATABASE: LandmarkSource[] = [
  ...EUROPEAN_LANDMARKS,
  ...AMERICAS_LANDMARKS,
  ...ASIAN_LANDMARKS,
  ...OTHER_LANDMARKS,
];
