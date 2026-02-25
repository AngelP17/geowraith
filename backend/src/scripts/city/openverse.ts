import type { CityBatchResult, CityImage } from './types.js';

interface OpenverseResponse {
  results?: Array<{
    url?: string;
    license?: string;
    source?: string;
    title?: string;
    width?: number;
    height?: number;
    filesize?: number;
  }>;
  next?: string | null;
}

export async function fetchOpenverseImages(
  cityName: string,
  limit: number,
  licenses: string[],
  timeoutMs: number,
  nextUrl?: string
): Promise<CityBatchResult> {
  const url = nextUrl ?? buildOpenverseUrl(cityName, limit, licenses);
  const response = await fetch(url, {
    headers: { 'User-Agent': 'GeoWraith City Scraper (research project)' },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Openverse HTTP ${response.status}`);
  }

  const payload = await response.json() as OpenverseResponse;
  const results = payload.results ?? [];
  const images: CityImage[] = [];

  for (const item of results) {
    if (!item.url) {
      continue;
    }
    const license = item.license ?? '';
    if (licenses.length > 0 && !licenses.includes(license)) {
      continue;
    }
    images.push({
      title: item.title ?? cityName,
      url: item.url,
      width: item.width ?? 0,
      height: item.height ?? 0,
      size: item.filesize ?? 0,
      source: `openverse:${license || 'unknown'}`,
    });
  }

  return { images, continueToken: payload.next ?? undefined };
}

function buildOpenverseUrl(cityName: string, limit: number, licenses: string[]): string {
  const params = new URLSearchParams({
    q: cityName,
    page_size: String(Math.min(limit, 200)),
    license: licenses.join(','),
    license_type: 'all',
    mature: 'false',
  });
  return `https://api.openverse.engineering/v1/images?${params.toString()}`;
}
