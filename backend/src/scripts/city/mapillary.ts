import { WORLD_CITIES } from '../../data/worldCities.js';
import type { CityBatchResult, CityImage } from './types.js';
import { sleep, withRetry } from './retry.js';

interface MapillaryItem {
  id?: string;
  thumb_1024_url?: string;
  thumb_2048_url?: string;
  geometry?: {
    coordinates?: [number, number];
  };
}

interface MapillaryResponse {
  data?: MapillaryItem[];
}

const MAPILLARY_TOKEN = process.env.MAPILLARY_ACCESS_TOKEN;
const MAPILLARY_RATE_LIMIT_MS = 200;
const MAPILLARY_RADIUS_M = 8_000;
const MAPILLARY_API_BASE = 'https://graph.mapillary.com/images';

let lastRequestAt = 0;

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveCityCenter(cityName: string): { lat: number; lon: number } | null {
  const normalized = normalizeText(cityName);
  if (!normalized) return null;

  const direct = WORLD_CITIES.find((city) => normalizeText(city.name).startsWith(normalized));
  if (direct) {
    return { lat: direct.lat, lon: direct.lon };
  }

  const includes = WORLD_CITIES.find((city) => normalizeText(city.name).includes(normalized));
  if (includes) {
    return { lat: includes.lat, lon: includes.lon };
  }

  return null;
}

function computeBBox(lat: number, lon: number, radiusMeters: number): [number, number, number, number] {
  const earthRadius = 6_371_000;
  const latDelta = (radiusMeters / earthRadius) * (180 / Math.PI);
  const lonDelta = (radiusMeters / (earthRadius * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
  return [lon - lonDelta, lat - latDelta, lon + lonDelta, lat + latDelta];
}

async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const waitMs = MAPILLARY_RATE_LIMIT_MS - (now - lastRequestAt);
  if (waitMs > 0) {
    await sleep(waitMs);
  }
  lastRequestAt = Date.now();
}

export async function fetchMapillaryImages(
  cityName: string,
  limit: number,
  timeoutMs: number
): Promise<CityBatchResult> {
  if (!MAPILLARY_TOKEN) {
    return { images: [] };
  }
  const center = resolveCityCenter(cityName);
  if (!center) {
    return { images: [] };
  }

  return withRetry(async () => {
    await enforceRateLimit();
    const bbox = computeBBox(center.lat, center.lon, MAPILLARY_RADIUS_M);
    const url = new URL(MAPILLARY_API_BASE);
    url.searchParams.set('bbox', bbox.join(','));
    url.searchParams.set('fields', 'id,thumb_1024_url,thumb_2048_url,geometry');
    url.searchParams.set('limit', String(Math.min(limit, 100)));
    url.searchParams.set('access_token', MAPILLARY_TOKEN);

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Authorization': `OAuth ${MAPILLARY_TOKEN}`,
        'User-Agent': 'GeoWraith City Scraper (research project; contact: geowraith@example.com)',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      throw new Error(`Mapillary HTTP ${response.status}`);
    }

    const payload = await response.json() as MapillaryResponse;
    const images: CityImage[] = [];
    for (const item of payload.data ?? []) {
      const urlValue = item.thumb_2048_url || item.thumb_1024_url;
      if (!urlValue) {
        continue;
      }
      images.push({
        title: `${cityName} street view`,
        url: urlValue,
        width: 0,
        height: 0,
        size: 0,
        source: 'mapillary',
      });
      if (images.length >= limit) {
        break;
      }
    }
    return { images };
  }, 'Mapillary fetch', { maxRetries: 2, baseDelayMs: 1000 });
}
