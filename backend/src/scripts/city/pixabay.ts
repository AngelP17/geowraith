import type { CityBatchResult, CityImage } from './types.js';
import { sleep, withRetry } from './retry.js';

interface PixabayImage {
  id: number;
  pageURL?: string;
  type?: string;
  tags?: string;
  previewURL?: string;
  previewWidth?: number;
  previewHeight?: number;
  webformatURL?: string;
  webformatWidth?: number;
  webformatHeight?: number;
  largeImageURL?: string;
  fullHDURL?: string;
  imageURL?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageSize?: number;
  views?: number;
  downloads?: number;
  likes?: number;
  comments?: number;
  user?: string;
  userImageURL?: string;
}

interface PixabaySearchResponse {
  total?: number;
  totalHits?: number;
  hits?: PixabayImage[];
}

const PIXABAY_API_BASE = 'https://pixabay.com/api';
const PIXABAY_RATE_LIMIT_MS = 300;

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

let lastRequestAt = 0;

async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const waitMs = PIXABAY_RATE_LIMIT_MS - (now - lastRequestAt);
  if (waitMs > 0) {
    await sleep(waitMs);
  }
  lastRequestAt = Date.now();
}

export async function fetchPixabayImages(
  query: string,
  limit: number,
  timeoutMs: number,
  page = 1
): Promise<CityBatchResult> {
  if (!PIXABAY_API_KEY) {
    return { images: [] };
  }

  return withRetry(async () => {
    await enforceRateLimit();
    const url = new URL(PIXABAY_API_BASE);
    url.searchParams.set('key', PIXABAY_API_KEY);
    url.searchParams.set('q', encodeURIComponent(query));
    url.searchParams.set('per_page', String(Math.min(limit, 200)));
    url.searchParams.set('page', String(page));
    url.searchParams.set('orientation', 'horizontal');
    url.searchParams.set('safesearch', 'true');
    url.searchParams.set('order', 'popular');

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GeoWraith City Scraper',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Pixabay HTTP ${response.status}`);
    }

    const payload = await response.json() as PixabaySearchResponse;
    const images: CityImage[] = [];

    for (const img of payload.hits ?? []) {
      const urlValue = img.largeImageURL || img.webformatURL || img.previewURL;
      if (!urlValue) {
        continue;
      }

      images.push({
        title: img.tags || query,
        url: urlValue,
        width: img.imageWidth || img.webformatWidth || 0,
        height: img.imageHeight || img.webformatHeight || 0,
        size: img.imageSize || 0,
        source: 'pixabay',
      });

      if (images.length >= limit) {
        break;
      }
    }

    return {
      images,
      continueToken: payload.hits && payload.hits.length === 200 ? String(page + 1) : undefined,
    };
  }, 'Pixabay fetch', { maxRetries: 2, baseDelayMs: 1000 });
}

export async function fetchPixabayEditorsChoice(
  limit: number,
  timeoutMs: number,
  page = 1
): Promise<CityBatchResult> {
  if (!PIXABAY_API_KEY) {
    return { images: [] };
  }

  return withRetry(async () => {
    await enforceRateLimit();
    const url = new URL(PIXABAY_API_BASE);
    url.searchParams.set('key', PIXABAY_API_KEY);
    url.searchParams.set('editors_choice', 'true');
    url.searchParams.set('per_page', String(Math.min(limit, 200)));
    url.searchParams.set('page', String(page));
    url.searchParams.set('orientation', 'horizontal');

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GeoWraith City Scraper',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Pixabay HTTP ${response.status}`);
    }

    const payload = await response.json() as PixabaySearchResponse;
    const images: CityImage[] = [];

    for (const img of payload.hits ?? []) {
      const urlValue = img.largeImageURL || img.webformatURL || img.previewURL;
      if (!urlValue) {
        continue;
      }

      images.push({
        title: img.tags || 'Pixabay editors choice',
        url: urlValue,
        width: img.imageWidth || img.webformatWidth || 0,
        height: img.imageHeight || img.webformatHeight || 0,
        size: img.imageSize || 0,
        source: 'pixabay',
      });

      if (images.length >= limit) {
        break;
      }
    }

    return {
      images,
      continueToken: payload.hits && payload.hits.length === 200 ? String(page + 1) : undefined,
    };
  }, 'Pixabay editors choice fetch', { maxRetries: 2, baseDelayMs: 1000 });
}

export async function fetchPixabayByCategory(
  category: string,
  limit: number,
  timeoutMs: number,
  page = 1
): Promise<CityBatchResult> {
  if (!PIXABAY_API_KEY) {
    return { images: [] };
  }

  return withRetry(async () => {
    await enforceRateLimit();
    const url = new URL(PIXABAY_API_BASE);
    url.searchParams.set('key', PIXABAY_API_KEY);
    url.searchParams.set('category', category);
    url.searchParams.set('per_page', String(Math.min(limit, 200)));
    url.searchParams.set('page', String(page));
    url.searchParams.set('orientation', 'horizontal');

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GeoWraith City Scraper',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Pixabay HTTP ${response.status}`);
    }

    const payload = await response.json() as PixabaySearchResponse;
    const images: CityImage[] = [];

    for (const img of payload.hits ?? []) {
      const urlValue = img.largeImageURL || img.webformatURL || img.previewURL;
      if (!urlValue) {
        continue;
      }

      images.push({
        title: img.tags || category,
        url: urlValue,
        width: img.imageWidth || img.webformatWidth || 0,
        height: img.imageHeight || img.webformatHeight || 0,
        size: img.imageSize || 0,
        source: 'pixabay',
      });

      if (images.length >= limit) {
        break;
      }
    }

    return {
      images,
      continueToken: payload.hits && payload.hits.length === 200 ? String(page + 1) : undefined,
    };
  }, 'Pixabay category fetch', { maxRetries: 2, baseDelayMs: 1000 });
}
