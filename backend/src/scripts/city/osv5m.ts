import type { CityBatchResult, CityImage } from './types.js';
import { sleep, withRetry } from './retry.js';

interface OSV5MImage {
  id: string;
  thumb_256_url?: string;
  thumb_512_url?: string;
  thumb_1024_url?: string;
  geometry?: {
    coordinates?: [number, number];
  };
}

interface OSV5MResponse {
  data?: OSV5MImage[];
}

const OSV5M_API_BASE = 'https://graph.mapillary.com/images';
const OSV5M_RATE_LIMIT_MS = 200;
const OSV5M_RADIUS_M = 15_000;

let lastRequestAt = 0;

function computeBBox(lat: number, lon: number, radiusMeters: number): [number, number, number, number] {
  const earthRadius = 6_371_000;
  const latDelta = (radiusMeters / earthRadius) * (180 / Math.PI);
  const lonDelta = (radiusMeters / (earthRadius * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
  return [lon - lonDelta, lat - latDelta, lon + lonDelta, lat + latDelta];
}

async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const waitMs = OSV5M_RATE_LIMIT_MS - (now - lastRequestAt);
  if (waitMs > 0) {
    await sleep(waitMs);
  }
  lastRequestAt = Date.now();
}

function resolveCoordinates(location: string): { lat: number; lon: number } | null {
  const knownLocations: Record<string, { lat: number; lon: number }> = {
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
  };

  const normalized = location.toLowerCase().trim();
  return knownLocations[normalized] || null;
}

export async function fetchOSV5MImages(
  location: string,
  limit: number,
  timeoutMs: number
): Promise<CityBatchResult> {
  const center = resolveCoordinates(location);
  if (!center) {
    return { images: [] };
  }

  return withRetry(async () => {
    await enforceRateLimit();
    const bbox = computeBBox(center.lat, center.lon, OSV5M_RADIUS_M);
    const url = new URL(OSV5M_API_BASE);
    url.searchParams.set('bbox', bbox.join(','));
    url.searchParams.set('fields', 'id,thumb_256_url,thumb_512_url,thumb_1024_url,geometry');
    url.searchParams.set('limit', String(Math.min(limit, 100)));

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GeoWraith City Scraper (research project; contact: geowraith@example.com)',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`OSV-5M HTTP ${response.status}`);
    }

    const payload = await response.json() as OSV5MResponse;
    const images: CityImage[] = [];

    for (const item of payload.data ?? []) {
      const urlValue = item.thumb_1024_url || item.thumb_512_url || item.thumb_256_url;
      if (!urlValue) {
        continue;
      }

      images.push({
        title: `${location} street view`,
        url: urlValue,
        width: 0,
        height: 0,
        size: 0,
        source: 'osv5m',
      });

      if (images.length >= limit) {
        break;
      }
    }

    return { images };
  }, 'OSV-5M fetch', { maxRetries: 2, baseDelayMs: 1000 });
}

export async function fetchOSV5MByCoordinates(
  lat: number,
  lon: number,
  limit: number,
  radiusMeters: number,
  timeoutMs: number
): Promise<CityBatchResult> {
  return withRetry(async () => {
    await enforceRateLimit();
    const bbox = computeBBox(lat, lon, radiusMeters);
    const url = new URL(OSV5M_API_BASE);
    url.searchParams.set('bbox', bbox.join(','));
    url.searchParams.set('fields', 'id,thumb_256_url,thumb_512_url,thumb_1024_url,geometry');
    url.searchParams.set('limit', String(Math.min(limit, 100)));

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GeoWraith City Scraper (research project; contact: geowraith@example.com)',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`OSV-5M HTTP ${response.status}`);
    }

    const payload = await response.json() as OSV5MResponse;
    const images: CityImage[] = [];

    for (const item of payload.data ?? []) {
      const urlValue = item.thumb_1024_url || item.thumb_512_url || item.thumb_256_url;
      if (!urlValue) {
        continue;
      }

      images.push({
        title: `OSV-5M image ${item.id}`,
        url: urlValue,
        width: 0,
        height: 0,
        size: 0,
        source: 'osv5m',
      });

      if (images.length >= limit) {
        break;
      }
    }

    return { images };
  }, 'OSV-5M coordinates fetch', { maxRetries: 2, baseDelayMs: 1000 });
}
