import type { CityBatchResult, CityImage } from './types.js';
import { withRetry, sleep } from './retry.js';

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

// Rate limiting: Openverse allows 100 requests/minute = 1 per 600ms
const OPENVENSE_RATE_LIMIT_MS = 600;
let lastOpenverseRequest = 0;

async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastOpenverseRequest;
  if (timeSinceLastRequest < OPENVENSE_RATE_LIMIT_MS) {
    const delay = OPENVENSE_RATE_LIMIT_MS - timeSinceLastRequest;
    await sleep(delay);
  }
  lastOpenverseRequest = Date.now();
}

export async function fetchOpenverseImages(
  cityName: string,
  limit: number,
  licenses: string[],
  timeoutMs: number,
  nextUrl?: string
): Promise<CityBatchResult> {
  return withRetry(async () => {
    await enforceRateLimit();
    const url = nextUrl ?? buildOpenverseUrl(cityName, limit, licenses);
    const response = await fetch(url, {
      headers: { 
        'User-Agent': 'GeoWraith City Scraper (research project; contact: geowraith@example.com)',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'unknown');
      throw new Error(`Openverse HTTP ${response.status}: ${errorBody.slice(0, 200)}`);
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
  }, 'Openverse fetch', { maxRetries: 3, baseDelayMs: 1000 });
}

function buildOpenverseUrl(cityName: string, limit: number, licenses: string[]): string {
  const params = new URLSearchParams({
    q: cityName,
    page_size: String(Math.min(limit, 200)),
    license: licenses.join(','),
    license_type: 'all',
    mature: 'false',
  });
  return `https://api.openverse.org/v1/images?${params.toString()}`;
}
