import type { CityBatchResult, CityImage } from './types.js';
import { withRetry, sleep } from './retry.js';

interface FlickrFeedResponse {
  items?: Array<{
    title?: string;
    media?: {
      m?: string;
    };
  }>;
}

const FLICKR_RATE_LIMIT_MS = 600;
let lastFlickrRequest = 0;

async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastFlickrRequest;
  if (elapsed < FLICKR_RATE_LIMIT_MS) {
    await sleep(FLICKR_RATE_LIMIT_MS - elapsed);
  }
  lastFlickrRequest = Date.now();
}

export async function fetchFlickrImages(
  query: string,
  limit: number,
  timeoutMs: number
): Promise<CityBatchResult> {
  return withRetry(async () => {
    await enforceRateLimit();
    const url = buildFlickrFeedUrl(query);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GeoWraith City Scraper (research project; contact: geowraith@example.com)',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Flickr feed HTTP ${response.status}`);
    }

    const payload = await response.json() as FlickrFeedResponse;
    const images: CityImage[] = [];

    for (const item of payload.items ?? []) {
      const rawUrl = item.media?.m;
      if (!rawUrl || !isLikelyImageUrl(rawUrl)) {
        continue;
      }

      images.push({
        title: item.title?.trim() || query,
        url: toLargeFlickrUrl(rawUrl),
        width: 0,
        height: 0,
        size: 0,
        source: 'flickr',
      });

      if (images.length >= limit) {
        break;
      }
    }

    return { images };
  }, 'Flickr feed fetch', { maxRetries: 3, baseDelayMs: 1000 });
}

function buildFlickrFeedUrl(query: string): string {
  const tags = query
    .split(/\s+/)
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .join(',');

  const params = new URLSearchParams({
    format: 'json',
    nojsoncallback: '1',
    tagmode: 'all',
    tags: tags || query.toLowerCase(),
  });

  return `https://www.flickr.com/services/feeds/photos_public.gne?${params.toString()}`;
}

function toLargeFlickrUrl(url: string): string {
  return url.includes('_m.') ? url.replace('_m.', '_b.') : url;
}

function isLikelyImageUrl(url: string): boolean {
  const lowered = url.toLowerCase();
  return (
    lowered.includes('live.staticflickr.com') &&
    (lowered.endsWith('.jpg') || lowered.endsWith('.jpeg') || lowered.endsWith('.png') || lowered.endsWith('.webp'))
  );
}
