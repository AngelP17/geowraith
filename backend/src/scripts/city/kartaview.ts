import type { CityBatchResult, CityImage } from './types.js';
import { sleep, withRetry } from './retry.js';

interface KartaViewImage {
  id?: number;
  panorama_id?: string;
  thumbnail?: string;
  image?: string;
  lat?: number;
  lng?: number;
  heading?: number;
  capture_date?: string;
  country?: string;
  city?: string;
}

interface KartaViewResponse {
  data?: KartaViewImage[];
  next_page_token?: string;
}

const KARTAVIEW_API_BASE = 'https://kartaview.org/api/v1';
const KARTAVIEW_RATE_LIMIT_MS = 500;
const KARTAVIEW_RADIUS_M = 10_000;

let lastRequestAt = 0;

function computeBBox(lat: number, lon: number, radiusMeters: number): [number, number, number, number] {
  const earthRadius = 6_371_000;
  const latDelta = (radiusMeters / earthRadius) * (180 / Math.PI);
  const lonDelta = (radiusMeters / (earthRadius * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
  return [lon - lonDelta, lat - latDelta, lon + lonDelta, lat + latDelta];
}

async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const waitMs = KARTAVIEW_RATE_LIMIT_MS - (now - lastRequestAt);
  if (waitMs > 0) {
    await sleep(waitMs);
  }
  lastRequestAt = Date.now();
}

const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'new york': { lat: 40.7128, lon: -74.006 },
  'los angeles': { lat: 34.0522, lon: -118.2437 },
  'london': { lat: 51.5074, lon: -0.1278 },
  'paris': { lat: 48.8566, lon: 2.3522 },
  'berlin': { lat: 52.52, lon: 13.405 },
  'tokyo': { lat: 35.6762, lon: 139.6503 },
  'sydney': { lat: -33.8688, lon: 151.2093 },
  'amsterdam': { lat: 52.3676, lon: 4.9041 },
  'barcelona': { lat: 41.3851, lon: 2.1734 },
  'rome': { lat: 41.9028, lon: 12.4964 },
  'madrid': { lat: 40.4168, lon: -3.7038 },
  'munich': { lat: 48.1351, lon: 11.582 },
  'milan': { lat: 45.4642, lon: 9.19 },
  'vienna': { lat: 48.2082, lon: 16.3738 },
  'prague': { lat: 50.0755, lon: 14.4378 },
  'stockholm': { lat: 59.3293, lon: 18.0686 },
  'copenhagen': { lat: 55.6761, lon: 12.5683 },
  'oslo': { lat: 59.9139, lon: 10.7522 },
  'helsinki': { lat: 60.1699, lon: 24.9384 },
  'dublin': { lat: 53.3498, lon: -6.2603 },
  'lisbon': { lat: 38.7223, lon: -9.1393 },
  'athens': { lat: 37.9838, lon: 23.7275 },
  'warsaw': { lat: 52.2297, lon: 21.0122 },
  'budapest': { lat: 47.4979, lon: 19.0402 },
  'moscow': { lat: 55.7558, lon: 37.6173 },
  'istanbul': { lat: 41.0082, lon: 28.9784 },
  'seoul': { lat: 37.5665, lon: 126.978 },
  'beijing': { lat: 39.9042, lon: 116.4074 },
  'shanghai': { lat: 31.2304, lon: 121.4737 },
  'singapore': { lat: 1.3521, lon: 103.8198 },
  'hong kong': { lat: 22.3193, lon: 114.1694 },
  'dubai': { lat: 25.2048, lon: 55.2708 },
  'bangkok': { lat: 13.7563, lon: 100.5018 },
  'mumbai': { lat: 19.076, lon: 72.8777 },
  'delhi': { lat: 28.7041, lon: 77.1025 },
  'toronto': { lat: 43.6532, lon: -79.3832 },
  'vancouver': { lat: 49.2827, lon: -123.1207 },
  'san francisco': { lat: 37.7749, lon: -122.4194 },
  'seattle': { lat: 47.6062, lon: -122.3321 },
  'chicago': { lat: 41.8781, lon: -87.6298 },
  'boston': { lat: 42.3601, lon: -71.0589 },
  'miami': { lat: 25.7617, lon: -80.1918 },
  'denver': { lat: 39.7392, lon: -104.9903 },
  'phoenix': { lat: 33.4484, lon: -112.074 },
  'atlanta': { lat: 33.749, lon: -84.388 },
};

function resolveCityCoordinates(cityName: string): { lat: number; lon: number } | null {
  const normalized = cityName.toLowerCase().trim();
  return CITY_COORDINATES[normalized] || null;
}

export async function fetchKartaViewImages(
  cityName: string,
  limit: number,
  timeoutMs: number
): Promise<CityBatchResult> {
  const center = resolveCityCoordinates(cityName);
  if (!center) {
    return { images: [] };
  }

  return withRetry(async () => {
    await enforceRateLimit();
    const bbox = computeBBox(center.lat, center.lon, KARTAVIEW_RADIUS_M);
    const url = new URL(`${KARTAVIEW_API_BASE}/sequences`);
    url.searchParams.set('bbox', bbox.join(','));
    url.searchParams.set('limit', String(Math.min(limit, 100)));

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GeoWraith City Scraper (research project; contact: geowraith@example.com)',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`KartaView HTTP ${response.status}`);
    }

    const payload = await response.json() as KartaViewResponse;
    const images: CityImage[] = [];

    for (const item of payload.data ?? []) {
      const urlValue = item.thumbnail || item.image;
      if (!urlValue) {
        continue;
      }

      const title = item.city || item.country || cityName;

      images.push({
        title,
        url: urlValue,
        width: 0,
        height: 0,
        size: 0,
        source: 'kartaview',
      });

      if (images.length >= limit) {
        break;
      }
    }

    return { images };
  }, 'KartaView fetch', { maxRetries: 2, baseDelayMs: 1000 });
}

export async function fetchKartaViewByCoordinates(
  lat: number,
  lon: number,
  limit: number,
  radiusMeters: number,
  timeoutMs: number
): Promise<CityBatchResult> {
  return withRetry(async () => {
    await enforceRateLimit();
    const bbox = computeBBox(lat, lon, radiusMeters);
    const url = new URL(`${KARTAVIEW_API_BASE}/sequences`);
    url.searchParams.set('bbox', bbox.join(','));
    url.searchParams.set('limit', String(Math.min(limit, 100)));

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GeoWraith City Scraper (research project; contact: geowraith@example.com)',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`KartaView HTTP ${response.status}`);
    }

    const payload = await response.json() as KartaViewResponse;
    const images: CityImage[] = [];

    for (const item of payload.data ?? []) {
      const urlValue = item.thumbnail || item.image;
      if (!urlValue) {
        continue;
      }

      images.push({
        title: item.city || `KartaView image ${item.id}`,
        url: urlValue,
        width: 0,
        height: 0,
        size: 0,
        source: 'kartaview',
      });

      if (images.length >= limit) {
        break;
      }
    }

    return { images };
  }, 'KartaView coordinates fetch', { maxRetries: 2, baseDelayMs: 1000 });
}
