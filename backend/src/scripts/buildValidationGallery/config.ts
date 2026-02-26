/**
 * Configuration constants for the validation gallery builder.
 */

import path from 'node:path';

// API Configuration
export const WIKIMEDIA_API = 'https://commons.wikimedia.org/w/api.php';
export const USER_AGENT = 'GeoWraith/0.2.0 (validation gallery builder; research project)';

// Rate limiting
export const REQUEST_DELAY_MS = 2000; // 2 seconds between requests (Wikimedia is strict)
export const MAX_RETRIES = 3;

// Image size constraints
export const MIN_WIDTH = 800;
export const MIN_HEIGHT = 600;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const DEFAULT_TARGET_COUNT = 100;

// Directory paths
export const CACHE_DIR = path.resolve(process.cwd(), '.cache/validation_gallery');
export const IMAGES_DIR = path.join(CACHE_DIR, 'images');
export const MANIFEST_PATH = path.join(CACHE_DIR, 'manifest.json');
