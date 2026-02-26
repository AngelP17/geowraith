import type { CityBatchResult, CityImage } from './types.js';
import { sleep, withRetry } from './retry.js';

interface UnsplashPhoto {
  id: string;
  urls?: {
    raw?: string;
    full?: string;
    regular?: string;
    small?: string;
    thumb?: string;
  };
  width?: number;
  height?: number;
  description?: string;
  alt_description?: string;
  user?: {
    name?: string;
    username?: string;
  };
  location?: {
    position?: {
      latitude?: number;
      longitude?: number;
    };
    name?: string;
  };
}

interface UnsplashSearchResponse {
  results?: UnsplashPhoto[];
  total?: number;
  total_pages?: number;
}

const UNSPLASH_API_BASE = 'https://api.unsplash.com';
const UNSPLASH_RATE_LIMIT_MS = 100;
let lastRequestAt = 0;

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

function computeBBox(lat: number, lon: number, radiusKm: number): [number, number, number, number] {
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  return [lat - latDelta, lon - lonDelta, lat + latDelta, lon + lonDelta];
}

async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const waitMs = UNSPLASH_RATE_LIMIT_MS - (now - lastRequestAt);
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
  'cape town': { lat: -33.9249, lon: 18.4241 },
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
  'saint petersburg': { lat: 59.9311, lon: 30.3609 },
  'beijing': { lat: 39.9042, lon: 116.4074 },
  'shanghai': { lat: 31.2304, lon: 121.4737 },
  'seoul': { lat: 37.5665, lon: 126.978 },
  'bangkok': { lat: 13.7563, lon: 100.5018 },
  'kuala lumpur': { lat: 3.139, lon: 101.6869 },
  'jakarta': { lat: -6.2088, lon: 106.8456 },
  'manila': { lat: 14.5995, lon: 120.9842 },
  'taipei': { lat: 25.033, lon: 121.5654 },
  'ho chi minh city': { lat: 10.8231, lon: 106.6297 },
  'hanoi': { lat: 21.0278, lon: 105.8342 },
  'delhi': { lat: 28.7041, lon: 77.1025 },
  'bangalore': { lat: 12.9716, lon: 77.5946 },
  'chennai': { lat: 13.0827, lon: 80.2707 },
  'kolkata': { lat: 22.5726, lon: 88.3639 },
  'guangzhou': { lat: 23.1291, lon: 113.2644 },
  'shenzhen': { lat: 22.5431, lon: 114.0579 },
  'chengdu': { lat: 30.5728, lon: 104.0668 },
  'beirut': { lat: 33.8938, lon: 35.5018 },
  'tel aviv': { lat: 32.0853, lon: 34.7818 },
  'johannesburg': { lat: -26.2041, lon: 28.0473 },
  'nairobi': { lat: -1.2921, lon: 36.8219 },
  'lagos': { lat: 6.5244, lon: 3.3792 },
  'casablanca': { lat: 33.5731, lon: -7.5898 },
  'reykjavik': { lat: 64.1466, lon: -21.9426 },
  'helsinki': { lat: 60.1699, lon: 24.9384 },
  'auckland': { lat: -36.8485, lon: 174.7633 },
  'melbourne': { lat: -37.8136, lon: 144.9631 },
  'brisbane': { lat: -27.4698, lon: 153.0251 },
  'perth': { lat: -31.9505, lon: 115.8605 },
};

function resolveCityCoordinates(cityName: string): { lat: number; lon: number } | null {
  const normalized = cityName.toLowerCase().trim();
  return knownCityCoordinates[normalized] || null;
}

export async function fetchUnsplashImages(
  cityName: string,
  limit: number,
  timeoutMs: number
): Promise<CityBatchResult> {
  if (!UNSPLASH_ACCESS_KEY) {
    return { images: [] };
  }

  const center = resolveCityCoordinates(cityName);
  if (!center) {
    return { images: [] };
  }

  return withRetry(async () => {
    await enforceRateLimit();
    const bbox = computeBBox(center.lat, center.lon, 15);
    const url = new URL(`${UNSPLASH_API_BASE}/photos/random`);
    url.searchParams.set('count', String(Math.min(limit, 30)));
    url.searchParams.set('client_id', UNSPLASH_ACCESS_KEY);
    url.searchParams.set('orientation', 'landscape');

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GeoWraith City Scraper',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Unsplash HTTP ${response.status}`);
    }

    const payload = await response.json() as UnsplashPhoto[];
    const images: CityImage[] = [];

    for (const photo of payload) {
      const urlValue = photo.urls?.regular || photo.urls?.small;
      if (!urlValue) {
        continue;
      }

      images.push({
        title: photo.description || photo.alt_description || cityName,
        url: urlValue,
        width: photo.width || 0,
        height: photo.height || 0,
        size: 0,
        source: 'unsplash',
      });

      if (images.length >= limit) {
        break;
      }
    }

    return { images };
  }, 'Unsplash fetch', { maxRetries: 2, baseDelayMs: 1000 });
}

export async function fetchUnsplashSearch(
  query: string,
  limit: number,
  timeoutMs: number,
  page = 1
): Promise<CityBatchResult> {
  if (!UNSPLASH_ACCESS_KEY) {
    return { images: [] };
  }

  return withRetry(async () => {
    await enforceRateLimit();
    const url = new URL(`${UNSPLASH_API_BASE}/search/photos`);
    url.searchParams.set('query', query);
    url.searchParams.set('per_page', String(Math.min(limit, 30)));
    url.searchParams.set('page', String(page));
    url.searchParams.set('client_id', UNSPLASH_ACCESS_KEY);
    url.searchParams.set('orientation', 'landscape');

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GeoWraith City Scraper',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Unsplash HTTP ${response.status}`);
    }

    const payload = await response.json() as UnsplashSearchResponse;
    const images: CityImage[] = [];

    for (const photo of payload.results ?? []) {
      const urlValue = photo.urls?.regular || photo.urls?.small;
      if (!urlValue) {
        continue;
      }

      const title = photo.location?.name || photo.description || photo.alt_description || query;

      images.push({
        title,
        url: urlValue,
        width: photo.width || 0,
        height: photo.height || 0,
        size: 0,
        source: 'unsplash',
      });

      if (images.length >= limit) {
        break;
      }
    }

    return {
      images,
      continueToken: payload.total_pages && page < payload.total_pages ? String(page + 1) : undefined,
    };
  }, 'Unsplash search', { maxRetries: 2, baseDelayMs: 1000 });
}
