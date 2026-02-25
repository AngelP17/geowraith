/**
 * Openverse image lookup for SmartBlend.
 */

export interface OpenverseOptions {
  licenses: string[];
  pageSize: number;
  timeoutMs: number;
}

export interface OpenverseCandidate {
  url: string;
  license: string;
  source: string;
}

interface OpenverseResponse {
  results?: Array<{
    url?: string;
    license?: string;
    source?: string;
  }>;
}

/**
 * Fetch a single Openverse candidate image for a query.
 */
export async function fetchOpenverseCandidate(
  query: string,
  options: OpenverseOptions
): Promise<OpenverseCandidate | null> {
  const params = new URLSearchParams({
    q: query,
    page_size: String(options.pageSize),
    license: options.licenses.join(','),
    license_type: 'all',
    mature: 'false',
  });

  const url = `https://api.openverse.engineering/v1/images?${params.toString()}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'GeoWraith/0.2.0 (smart blend validation)' },
    signal: AbortSignal.timeout(options.timeoutMs),
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json() as OpenverseResponse;
  const results = payload.results ?? [];

  for (const item of results) {
    const license = item.license ?? '';
    if (!item.url) {
      continue;
    }
    if (options.licenses.length > 0 && !options.licenses.includes(license)) {
      continue;
    }
    return {
      url: item.url,
      license,
      source: item.source ?? 'openverse',
    };
  }

  return null;
}
