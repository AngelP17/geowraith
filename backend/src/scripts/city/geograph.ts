import type { CityBatchResult, CityImage } from './types.js';
import { sleep, withRetry } from './retry.js';

interface GeographImage {
  id?: string;
  title?: string;
  description?: string;
  thumb?: string;
  url?: string;
  lat?: number;
  lon?: number;
  user?: string;
  created?: string;
}

interface GeographSyndicatorResponse {
  channel?: {
    item?: GeographImage[];
  };
}

const GEOGRAPH_API_BASE = 'https://api.geograph.org.uk/syndicator.php';
const GEOGRAPH_RATE_LIMIT_MS = 1000;
let lastRequestAt = 0;

const UK_CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'london': { lat: 51.5074, lon: -0.1278 },
  'manchester': { lat: 53.4808, lon: -2.2426 },
  'birmingham': { lat: 52.4862, lon: -1.8904 },
  'leeds': { lat: 53.8008, lon: -1.5491 },
  'glasgow': { lat: 55.8642, lon: -4.2518 },
  'liverpool': { lat: 53.4084, lon: -2.9916 },
  'bristol': { lat: 51.4545, lon: -2.5879 },
  'edinburgh': { lat: 55.9533, lon: -3.1883 },
  'cardiff': { lat: 51.4816, lon: -3.1791 },
  'belfast': { lat: 54.5973, lon: -5.9301 },
  'nottingham': { lat: 52.9548, lon: -1.1581 },
  'sheffield': { lat: 53.3811, lon: -1.4701 },
  'brighton': { lat: 50.8225, lon: -0.1372 },
  'leicester': { lat: 52.6369, lon: -1.1398 },
  'oxford': { lat: 51.7548, lon: -1.2544 },
  'cambridge': { lat: 52.2053, lon: 0.1218 },
  'york': { lat: 53.9600, lon: -1.0800 },
  'bath': { lat: 51.3751, lon: -2.3617 },
  'exeter': { lat: 50.7184, lon: -3.5339 },
  'plymouth': { lat: 50.3755, lon: -4.1427 },
  'portsmouth': { lat: 50.8198, lon: -1.0879 },
  'southampton': { lat: 50.9097, lon: -1.4044 },
  'newcastle': { lat: 54.9783, lon: -1.6178 },
  'norwich': { lat: 52.6309, lon: 1.2974 },
  'canterbury': { lat: 51.2802, lon: 1.0789 },
  'cheltenham': { lat: 51.8967, lon: -2.0785 },
  'worcester': { lat: 52.1920, lon: -2.2200 },
  'stoke-on-trent': { lat: 53.0027, lon: -2.1794 },
  'coventry': { lat: 52.4068, lon: -1.5197 },
  'wolverhampton': { lat: 52.5913, lon: -2.1100 },
  'derby': { lat: 52.9225, lon: -1.4746 },
};

async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const waitMs = GEOGRAPH_RATE_LIMIT_MS - (now - lastRequestAt);
  if (waitMs > 0) {
    await sleep(waitMs);
  }
  lastRequestAt = Date.now();
}

function computeBBox(lat: number, lon: number, radiusKm: number): [number, number, number, number] {
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  return [lat - latDelta, lon - lonDelta, lat + latDelta, lon + lonDelta];
}

export async function fetchGeographImages(
  location: string,
  limit: number,
  timeoutMs: number
): Promise<CityBatchResult> {
  const normalized = location.toLowerCase().trim();
  const center = UK_CITY_COORDINATES[normalized];

  if (!center) {
    return { images: [] };
  }

  return withRetry(async () => {
    await enforceRateLimit();
    const bbox = computeBBox(center.lat, center.lon, 15);
    const params = new URLSearchParams({
      key: 'geowraith',
      format: 'geophotos',
      limit: String(Math.min(limit, 50)),
      bbox: bbox.join(','),
    });

    const url = `${GEOGRAPH_API_BASE}?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GeoWraith City Scraper (research project; contact: geowraith@example.com)',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Geograph HTTP ${response.status}`);
    }

    const payload = await response.json() as GeographSyndicatorResponse;
    const items = payload.channel?.item ?? [];
    const images: CityImage[] = [];

    for (const item of items) {
      const urlValue = item.thumb || item.url;
      if (!urlValue) {
        continue;
      }

      images.push({
        title: item.title || item.description || location,
        url: urlValue,
        width: 0,
        height: 0,
        size: 0,
        source: 'geograph',
      });

      if (images.length >= limit) {
        break;
      }
    }

    return { images };
  }, 'Geograph fetch', { maxRetries: 2, baseDelayMs: 1500 });
}

export async function fetchGeographByCoordinates(
  lat: number,
  lon: number,
  limit: number,
  radiusKm: number,
  timeoutMs: number
): Promise<CityBatchResult> {
  return withRetry(async () => {
    await enforceRateLimit();
    const bbox = computeBBox(lat, lon, radiusKm);
    const params = new URLSearchParams({
      key: 'geowraith',
      format: 'geophotos',
      limit: String(Math.min(limit, 50)),
      bbox: bbox.join(','),
    });

    const url = `${GEOGRAPH_API_BASE}?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GeoWraith City Scraper (research project; contact: geowraith@example.com)',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Geograph HTTP ${response.status}`);
    }

    const payload = await response.json() as GeographSyndicatorResponse;
    const items = payload.channel?.item ?? [];
    const images: CityImage[] = [];

    for (const item of items) {
      const urlValue = item.thumb || item.url;
      if (!urlValue) {
        continue;
      }

      images.push({
        title: item.title || item.description || `Geograph image`,
        url: urlValue,
        width: 0,
        height: 0,
        size: 0,
        source: 'geograph',
      });

      if (images.length >= limit) {
        break;
      }
    }

    return { images };
  }, 'Geograph coordinates fetch', { maxRetries: 2, baseDelayMs: 1500 });
}
