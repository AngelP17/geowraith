/**
 * Offline Map Protocol - Custom MapLibre protocol for cached tiles
 * 
 * Registers a 'cached://' protocol that:
 * 1. Checks local IndexedDB cache first
 * 2. Falls back to network if not cached
 * 3. Stores network responses in cache for future offline use
 */

import maplibregl from 'maplibre-gl';
import { getTileCache } from './tileCache';

// OSM tile URLs (same as mapStyles.ts)
const OSM_TILES = [
  'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
];

interface ProtocolParams {
  url: string;
}

let protocolRegistered = false;

function parseTileUrl(url: string): { z: number; x: number; y: number } | null {
  // URL format: cached://{z}/{x}/{y}
  const match = url.match(/^cached:\/\/(\d+)\/(\d+)\/(\d+)$/);
  if (!match) return null;
  return {
    z: parseInt(match[1], 10),
    x: parseInt(match[2], 10),
    y: parseInt(match[3], 10),
  };
}

function getOSMUrl(z: number, x: number, y: number): string {
  // Rotate through subdomains for load balancing
  const subdomain = OSM_TILES[(x + y) % OSM_TILES.length];
  return subdomain.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
}

/**
 * Register the cached:// protocol with MapLibre
 */
export function registerCachedProtocol(): void {
  if (protocolRegistered) {
    return;
  }

  const cache = getTileCache();

  maplibregl.addProtocol('cached', (params: ProtocolParams, abortController: AbortController) => {
    const tile = parseTileUrl(params.url);
    if (!tile) {
      return Promise.resolve({ data: null, cacheControl: undefined, expires: null });
    }

    const { z, x, y } = tile;

    return new Promise((resolve) => {
      // Check abort signal
      if (abortController.signal.aborted) {
        resolve({ data: null, cacheControl: undefined, expires: null });
        return;
      }

      // Try cache first
      cache.get(z, x, y).then((cached) => {
        if (cached) {
          // Return cached tile
          cached.arrayBuffer().then((buffer) => {
            resolve({ data: buffer, cacheControl: 'max-age=31536000', expires: null });
          });
          return;
        }

        // Fetch from network
        const url = getOSMUrl(z, x, y);
        fetch(url, {
          headers: {
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          },
          signal: abortController.signal,
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            return response.blob();
          })
          .then((blob) => {
            // Cache for next time
            cache.set(z, x, y, blob).catch((error) => {
              // eslint-disable-next-line no-console
              console.warn('[offlineProtocol] failed to cache tile', { z, x, y, error });
            });

            // Return to MapLibre
            blob.arrayBuffer().then((buffer) => {
              resolve({ data: buffer, cacheControl: 'max-age=86400', expires: null });
            });
          })
          .catch((error) => {
            // eslint-disable-next-line no-console
            console.warn('[offlineProtocol] failed to fetch tile from network', { z, x, y, error });
            // Return empty on error
            resolve({ data: null, cacheControl: undefined, expires: null });
          });
      });
    });
  });

  protocolRegistered = true;
}

/**
 * Unregister the cached:// protocol
 */
export function unregisterCachedProtocol(): void {
  if (!protocolRegistered) {
    return;
  }

  try {
    maplibregl.removeProtocol('cached');
    protocolRegistered = false;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[offlineProtocol] failed to unregister cached protocol', error);
  }
}

/**
 * Pre-cache tiles for a given bounding box and zoom range
 */
export async function preCacheTiles(
  minZoom: number,
  maxZoom: number,
  bounds: { north: number; south: number; east: number; west: number }
): Promise<{ cached: number; failed: number }> {
  const cache = getTileCache();
  let cached = 0;
  let failed = 0;

  for (let z = minZoom; z <= maxZoom; z++) {
    // Convert lat/lon bounds to tile coordinates
    const minTile = latLonToTile(bounds.north, bounds.west, z);
    const maxTile = latLonToTile(bounds.south, bounds.east, z);

    for (let x = minTile.x; x <= maxTile.x; x++) {
      for (let y = minTile.y; y <= maxTile.y; y++) {
        // Check if already cached
        const exists = await cache.has(z, x, y);
        if (exists) {
          cached++;
          continue;
        }

        // Fetch and cache
        try {
          const url = getOSMUrl(z, x, y);
          const response = await fetch(url);
          if (response.ok) {
            const blob = await response.blob();
            await cache.set(z, x, y, blob);
            cached++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }

        // Small delay to be polite to tile server
        await new Promise((r) => setTimeout(r, 50));
      }
    }
  }

  return { cached, failed };
}

function latLonToTile(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y };
}
