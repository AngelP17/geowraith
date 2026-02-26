import type { CityBatchResult, CityImage } from './types.js';
import { sleep, withRetry } from './retry.js';

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  src?: {
    original?: string;
    large2x?: string;
    large?: string;
    medium?: string;
    small?: string;
  };
  photographer?: string;
  photographer_url?: string;
  alt?: string;
}

interface PexelsSearchResponse {
  total_results?: number;
  page?: number;
  per_page?: number;
  photos?: PexelsPhoto[];
  next_page?: string;
}

const PEXELS_API_BASE = 'https://api.pexels.com/v1';
const PEXELS_RATE_LIMIT_MS = 200;

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

let lastRequestAt = 0;

async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const waitMs = PEXELS_RATE_LIMIT_MS - (now - lastRequestAt);
  if (waitMs > 0) {
    await sleep(waitMs);
  }
  lastRequestAt = Date.now();
}

const knownCityCoordinates: Record<string, { lat: number; lon: number }> = {
  'new york': { lat: 40.7128, lon: -74.006 },
  'los angeles': { lat: 34.0522, lon: -118.2437 },
  'london': { lat: 51.5074, lon: -0.1278 },
  'paris': { lat: 48.8566, lon: 2.3522 },
  'tokyo': { lat: 35.6762, lon: 139.6503 },
  'sydney': { lat: -33.8688, lon: 151.2093 },
  'rome': { lat: 41.9028, lon: 12.4964 },
  'barcelona': { lat: 41.3851, lon: 2.1734 },
  'berlin': { lat: 52.52, lon: 13.405 },
  'amsterdam': { lat: 52.3676, lon: 4.9041 },
  'dubai': { lat: 25.2048, lon: 55.2708 },
  'singapore': { lat: 1.3521, lon: 103.8198 },
  'hong kong': { lat: 22.3193, lon: 114.1694 },
  'mumbai': { lat: 19.076, lon: 72.8777 },
  'sao paulo': { lat: -23.5505, lon: -46.6333 },
  'mexico city': { lat: 19.4326, lon: -99.1332 },
  'cairo': { lat: 30.0444, lon: 31.2357 },
  'moscow': { lat: 55.7558, lon: 37.6173 },
  'istanbul': { lat: 41.0082, lon: 28.9784 },
  'capetown': { lat: -33.9249, lon: 18.4241 },
  'buenos aires': { lat: -34.6037, lon: -58.3816 },
  'toronto': { lat: 43.6532, lon: -79.3832 },
  'vancouver': { lat: 49.2827, lon: -123.1207 },
  'seattle': { lat: 47.6062, lon: -122.3321 },
  'chicago': { lat: 41.8781, lon: -87.6298 },
  'san francisco': { lat: 37.7749, lon: -122.4194 },
  'boston': { lat: 42.3601, lon: -71.0589 },
  'atlanta': { lat: 33.749, lon: -84.388 },
  'miami': { lat: 25.7617, lon: -80.1918 },
  'denver': { lat: 39.7392, lon: -104.9903 },
  'lisbon': { lat: 38.7223, lon: -9.1393 },
  'madrid': { lat: 40.4168, lon: -3.7038 },
  'munich': { lat: 48.1351, lon: 11.582 },
  'vienna': { lat: 48.2082, lon: 16.3738 },
  'prague': { lat: 50.0755, lon: 14.4378 },
  'athens': { lat: 37.9838, lon: 23.7275 },
  'stockholm': { lat: 59.3293, lon: 18.0686 },
  'oslo': { lat: 59.9139, lon: 10.7522 },
  'copenhagen': { lat: 55.6761, lon: 12.5683 },
  'dublin': { lat: 53.3498, lon: -6.2603 },
  'brussels': { lat: 50.8503, lon: 4.3517 },
  'zurich': { lat: 47.3769, lon: 8.5417 },
  'milan': { lat: 45.4642, lon: 9.19 },
  'florence': { lat: 43.7696, lon: 11.2558 },
  'venice': { lat: 45.4408, lon: 12.3155 },
  'warsaw': { lat: 52.2297, lon: 21.0122 },
  'budapest': { lat: 47.4979, lon: 19.0402 },
  'beijing': { lat: 39.9042, lon: 116.4074 },
  'shanghai': { lat: 31.2304, lon: 121.4737 },
  'seoul': { lat: 37.5665, lon: 126.978 },
  'bangkok': { lat: 13.7563, lon: 100.5018 },
  'kuala lumpur': { lat: 3.139, lon: 101.6869 },
  'jakarta': { lat: -6.2088, lon: 106.8456 },
  'manila': { lat: 14.5995, lon: 120.9842 },
  'taipei': { lat: 25.033, lon: 121.5654 },
  'delhi': { lat: 28.7041, lon: 77.1025 },
  'bangalore': { lat: 12.9716, lon: 77.5946 },
  'johannesburg': { lat: -26.2041, lon: 28.0473 },
  'nairobi': { lat: -1.2921, lon: 36.8219 },
  'lagos': { lat: 6.5244, lon: 3.3792 },
  'casablanca': { lat: 33.5731, lon: -7.5898 },
  'auckland': { lat: -36.8485, lon: 174.7633 },
  'melbourne': { lat: -37.8136, lon: 144.9631 },
};

function resolveCityCoordinates(cityName: string): { lat: number; lon: number } | null {
  const normalized = cityName.toLowerCase().trim();
  return knownCityCoordinates[normalized] || null;
}

export async function fetchPexelsImages(
  query: string,
  limit: number,
  timeoutMs: number,
  page = 1
): Promise<CityBatchResult> {
  if (!PEXELS_API_KEY) {
    return { images: [] };
  }

  return withRetry(async () => {
    await enforceRateLimit();
    const url = new URL(`${PEXELS_API_BASE}/search`);
    url.searchParams.set('query', query);
    url.searchParams.set('per_page', String(Math.min(limit, 80)));
    url.searchParams.set('page', String(page));
    url.searchParams.set('orientation', 'landscape');

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': PEXELS_API_KEY,
        'Accept': 'application/json',
        'User-Agent': 'GeoWraith City Scraper',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Pexels HTTP ${response.status}`);
    }

    const payload = await response.json() as PexelsSearchResponse;
    const images: CityImage[] = [];

    for (const photo of payload.photos ?? []) {
      const urlValue = photo.src?.large || photo.src?.medium || photo.src?.original;
      if (!urlValue) {
        continue;
      }

      images.push({
        title: photo.alt || query,
        url: urlValue,
        width: photo.width || 0,
        height: photo.height || 0,
        size: 0,
        source: 'pexels',
      });

      if (images.length >= limit) {
        break;
      }
    }

    return {
      images,
      continueToken: payload.next_page ? String(page + 1) : undefined,
    };
  }, 'Pexels fetch', { maxRetries: 2, baseDelayMs: 1000 });
}

export async function fetchPexelsCurated(
  limit: number,
  timeoutMs: number,
  page = 1
): Promise<CityBatchResult> {
  if (!PEXELS_API_KEY) {
    return { images: [] };
  }

  return withRetry(async () => {
    await enforceRateLimit();
    const url = new URL(`${PEXELS_API_BASE}/curated`);
    url.searchParams.set('per_page', String(Math.min(limit, 80)));
    url.searchParams.set('page', String(page));

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': PEXELS_API_KEY,
        'Accept': 'application/json',
        'User-Agent': 'GeoWraith City Scraper',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Pexels HTTP ${response.status}`);
    }

    const payload = await response.json() as PexelsSearchResponse;
    const images: CityImage[] = [];

    for (const photo of payload.photos ?? []) {
      const urlValue = photo.src?.large || photo.src?.medium || photo.src?.original;
      if (!urlValue) {
        continue;
      }

      images.push({
        title: photo.alt || 'Pexels curated',
        url: urlValue,
        width: photo.width || 0,
        height: photo.height || 0,
        size: 0,
        source: 'pexels',
      });

      if (images.length >= limit) {
        break;
      }
    }

    return {
      images,
      continueToken: payload.next_page ? String(page + 1) : undefined,
    };
  }, 'Pexels curated fetch', { maxRetries: 2, baseDelayMs: 1000 });
}
