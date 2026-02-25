import type { CityBatchResult, CityImage } from './types.js';

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

export async function fetchWikimediaImages(
  category: string,
  limit: number,
  timeoutMs: number,
  cmcontinue?: string
): Promise<CityBatchResult> {
  const url = buildWikimediaUrl(category, limit, cmcontinue);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'GeoWraith City Scraper (research project)',
      'Accept': 'application/json',
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
  const url = buildWikimediaSearchUrl(query, limit, gsroffset);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'GeoWraith City Scraper (research project)',
      'Accept': 'application/json',
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
