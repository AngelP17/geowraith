import type { CityBatchResult, CityImage } from './types.js';
import { withRetry, sleep } from './retry.js';

interface WikimediaResponse {
  query?: {
    pages?: Record<string, {
      title?: string;
      imageinfo?: Array<{
        thumburl?: string;
        url?: string;
        thumbwidth?: number;
        thumbheight?: number;
        width?: number;
        height?: number;
        size?: number;
        mime?: string;
      }>;
    }>;
  };
  continue?: {
    gcmcontinue?: string;
    gsroffset?: number;
  };
  error?: unknown;
}

// Rate limiting: 1 request per 2 seconds for Wikimedia
const WIKIMEDIA_RATE_LIMIT_MS = 2000;
let lastWikimediaRequest = 0;

async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastWikimediaRequest;
  if (timeSinceLastRequest < WIKIMEDIA_RATE_LIMIT_MS) {
    const delay = WIKIMEDIA_RATE_LIMIT_MS - timeSinceLastRequest;
    await sleep(delay);
  }
  lastWikimediaRequest = Date.now();
}

export async function fetchWikimediaImages(
  category: string,
  limit: number,
  timeoutMs: number,
  cmcontinue?: string
): Promise<CityBatchResult> {
  return withRetry(async () => {
    await enforceRateLimit();
    const url = buildWikimediaUrl(category, limit, cmcontinue);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GeoWraith City Scraper (research project; contact: geowraith@example.com)',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Wikimedia HTTP ${response.status}`);
    }

    const payload = await response.json() as WikimediaResponse;
    if (payload.error) {
      throw new Error('Wikimedia API returned error');
    }

    const pages = payload.query?.pages ?? {};
    const images: CityImage[] = [];

    for (const pageId of Object.keys(pages)) {
      const page = pages[pageId];
      const info = page?.imageinfo?.[0];
      if (!info) {
        continue;
      }
      if (!isLikelyImage(page?.title, info.mime)) {
        continue;
      }
      const url = info.thumburl || info.url;
      if (!url) {
        continue;
      }
      images.push({
        title: page?.title ?? category,
        url,
        width: info.thumbwidth ?? info.width ?? 0,
        height: info.thumbheight ?? info.height ?? 0,
        size: info.size ?? 0,
        source: 'wikimedia',
      });
    }

    return {
      images,
      continueToken: payload.continue?.gcmcontinue,
    };
  }, 'Wikimedia category fetch', { maxRetries: 3, baseDelayMs: 2000 });
}

function buildWikimediaUrl(category: string, limit: number, cmcontinue?: string): string {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'categorymembers',
    gcmtitle: `Category:${category}`,
    gcmtype: 'file',
    gcmlimit: String(Math.min(limit, 500)),
    prop: 'imageinfo',
    iiprop: 'url|size|mime',
    iiurlwidth: '800',
    format: 'json',
    origin: '*',
  });
  if (cmcontinue) {
    params.set('gcmcontinue', cmcontinue);
  }
  return `https://commons.wikimedia.org/w/api.php?${params.toString()}`;
}

export async function fetchWikimediaSearchImages(
  query: string,
  limit: number,
  timeoutMs: number,
  gsroffset?: number
): Promise<CityBatchResult> {
  return withRetry(async () => {
    await enforceRateLimit();
    const url = buildWikimediaSearchUrl(query, limit, gsroffset);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GeoWraith City Scraper (research project; contact: geowraith@example.com)',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Wikimedia search HTTP ${response.status}`);
    }

    const payload = await response.json() as WikimediaResponse;
    if (payload.error) {
      throw new Error('Wikimedia search API returned error');
    }

    const pages = payload.query?.pages ?? {};
    const images: CityImage[] = [];

    for (const pageId of Object.keys(pages)) {
      const page = pages[pageId];
      const info = page?.imageinfo?.[0];
      if (!info) {
        continue;
      }
      if (!isLikelyImage(page?.title, info.mime)) {
        continue;
      }
      const url = info.thumburl || info.url;
      if (!url) {
        continue;
      }
      images.push({
        title: page?.title ?? query,
        url,
        width: info.thumbwidth ?? info.width ?? 0,
        height: info.thumbheight ?? info.height ?? 0,
        size: info.size ?? 0,
        source: 'wikimedia_search',
      });
    }

    const nextOffset = payload.continue?.gsroffset;

    return {
      images,
      continueToken: Number.isFinite(nextOffset) ? String(nextOffset) : undefined,
    };
  }, 'Wikimedia search fetch', { maxRetries: 3, baseDelayMs: 2000 });
}

function buildWikimediaSearchUrl(query: string, limit: number, gsroffset?: number): string {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: String(Math.min(limit, 50)),
    prop: 'imageinfo',
    iiprop: 'url|size|mime',
    iiurlwidth: '800',
    format: 'json',
    origin: '*',
  });
  if (gsroffset && Number.isFinite(gsroffset)) {
    params.set('gsroffset', String(gsroffset));
  }
  return `https://commons.wikimedia.org/w/api.php?${params.toString()}`;
}

function isLikelyImage(title?: string, mime?: string): boolean {
  if (mime) {
    if (!mime.startsWith('image/')) {
      return false;
    }
    if (mime === 'image/svg+xml') {
      return false;
    }
    return true;
  }
  if (!title) {
    return true;
  }
  const lowered = title.toLowerCase();
  return lowered.endsWith('.jpg') || lowered.endsWith('.jpeg') || lowered.endsWith('.png') || lowered.endsWith('.webp');
}

function computeBBox(lat: number, lon: number, radiusKm: number): [number, number, number, number] {
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  return [lat - latDelta, lon - lonDelta, lat + latDelta, lon + lonDelta];
}

export async function fetchWikimediaByCoordinates(
  lat: number,
  lon: number,
  limit: number,
  timeoutMs: number,
  radiusKm = 10
): Promise<CityBatchResult> {
  return withRetry(async () => {
    await enforceRateLimit();
    const bbox = computeBBox(lat, lon, radiusKm);
    const url = buildWikimediaCoordinatesUrl(bbox, limit);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GeoWraith City Scraper (research project; contact: geowraith@example.com)',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Wikimedia coordinates HTTP ${response.status}`);
    }

    const payload = await response.json() as WikimediaResponse;
    if (payload.error) {
      throw new Error('Wikimedia coordinates API returned error');
    }

    const pages = payload.query?.pages ?? {};
    const images: CityImage[] = [];

    for (const pageId of Object.keys(pages)) {
      const page = pages[pageId];
      const info = page?.imageinfo?.[0];
      if (!info) {
        continue;
      }
      if (!isLikelyImage(page?.title, info.mime)) {
        continue;
      }
      const urlValue = info.thumburl || info.url;
      if (!urlValue) {
        continue;
      }
      images.push({
        title: page?.title ?? 'Wikimedia image',
        url: urlValue,
        width: info.thumbwidth ?? info.width ?? 0,
        height: info.thumbheight ?? info.height ?? 0,
        size: info.size ?? 0,
        source: 'wikimedia_coords',
      });
    }

    return { images };
  }, 'Wikimedia coordinates fetch', { maxRetries: 3, baseDelayMs: 2000 });
}

function buildWikimediaCoordinatesUrl(bbox: [number, number, number, number], limit: number): string {
  const [minLat, minLon, maxLat, maxLon] = bbox;
  const params = new URLSearchParams({
    action: 'query',
    generator: 'geosearch',
    ggscoord: `${(minLat + maxLat) / 2}|${(minLon + maxLon) / 2}`,
    ggsradius: String(Math.round(((maxLat - minLat) * 111000) / 2)),
    ggslimit: String(Math.min(limit, 500)),
    prop: 'imageinfo',
    iiprop: 'url|size|mime',
    iiurlwidth: '800',
    format: 'json',
    origin: '*',
  });
  return `https://commons.wikimedia.org/w/api.php?${params.toString()}`;
}
