/**
 * Mapillary API integration for street-level reference imagery.
 * Docs: https://www.mapillary.com/developer/api-documentation
 */

import type { ReferenceImage } from './types.js';
import { withRetry, sleep } from '../scripts/city/retry.js';

const MAPILLARY_ACCESS_TOKEN = process.env.MAPILLARY_ACCESS_TOKEN;
const MAPILLARY_GRAPH_API = 'https://graph.mapillary.com';

// Rate limiting: 60,000 images/hour = ~16.7 images/second
const MAPILLARY_RATE_LIMIT_MS = 60;

interface MapillaryImage {
  id: string;
  thumb_256_url?: string;
  thumb_1024_url?: string;
  thumb_2048_url?: string;
  captured_at?: string;
  geometry?: {
    coordinates: [number, number];
  };
  compass_angle?: number;
  sequence?: string;
}

interface MapillaryDetection {
  image: { id: string };
  geometry: { coordinates: [number, number] };
}

/**
 * Retrieve street-level images near a GPS coordinate.
 */
export async function retrieveMapillaryImages(
  lat: number,
  lon: number,
  radiusMeters: number,
  maxImages: number
): Promise<ReferenceImage[]> {
  if (!MAPILLARY_ACCESS_TOKEN) {
    console.warn('[Mapillary] MAPILLARY_ACCESS_TOKEN is not configured; skipping reference retrieval');
    return [];
  }

  const images: ReferenceImage[] = [];
  
  try {
    // Step 1: Query images within bounding box
    const bbox = calculateBoundingBox(lat, lon, radiusMeters);
    const imageIds = await queryImagesInBBox(bbox, maxImages * 2);
    
    // Step 2: Get detailed metadata for each image
    for (const id of imageIds.slice(0, maxImages)) {
      try {
        const image = await getImageDetails(id);
        if (image && image.thumb_1024_url && image.geometry) {
          images.push({
            id: `mapillary_${image.id}`,
            url: image.thumb_1024_url,
            coordinates: {
              lat: image.geometry.coordinates[1],
              lon: image.geometry.coordinates[0],
            },
          });
        }
      } catch (error) {
        console.warn(`[Mapillary] Failed to get details for ${id}:`, error);
      }
      
      await sleep(MAPILLARY_RATE_LIMIT_MS);
    }
    
    return images;
  } catch (error) {
    console.error('[Mapillary] API error:', error);
    return [];
  }
};

/**
 * Query images within a bounding box using the graph API.
 */
async function queryImagesInBBox(
  bbox: [number, number, number, number],
  limit: number
): Promise<string[]> {
  if (!MAPILLARY_ACCESS_TOKEN) {
    throw new Error('MAPILLARY_ACCESS_TOKEN is not configured');
  }

  return withRetry(async () => {
    const url = new URL(`${MAPILLARY_GRAPH_API}/images`);
    url.searchParams.set('access_token', MAPILLARY_ACCESS_TOKEN);
    url.searchParams.set('bbox', bbox.join(','));
    url.searchParams.set('limit', String(Math.min(limit, 200)));
    url.searchParams.set('fields', 'id');
    
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${MAPILLARY_ACCESS_TOKEN}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Mapillary API error: ${response.status}`);
    }
    
    const data = await response.json() as { data?: Array<{ id: string }> };
    return (data.data || []).map(img => img.id);
  }, 'Mapillary bbox query', { maxRetries: 3, baseDelayMs: 1000 });
};

/**
 * Get detailed image metadata.
 */
async function getImageDetails(imageId: string): Promise<MapillaryImage | null> {
  if (!MAPILLARY_ACCESS_TOKEN) {
    throw new Error('MAPILLARY_ACCESS_TOKEN is not configured');
  }

  return withRetry(async () => {
    const url = new URL(`${MAPILLARY_GRAPH_API}/${imageId}`);
    url.searchParams.set('access_token', MAPILLARY_ACCESS_TOKEN);
    url.searchParams.set('fields', 
      'thumb_256_url,thumb_1024_url,thumb_2048_url,' +
      'captured_at,geometry,compass_angle,sequence'
    );
    
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Authorization': `OAuth ${MAPILLARY_ACCESS_TOKEN}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Mapillary API error: ${response.status}`);
    }
    
    return await response.json() as MapillaryImage;
  }, `Mapillary image details ${imageId}`, { maxRetries: 2, baseDelayMs: 500 });
};

/**
 * Calculate bounding box from center point and radius.
 */
function calculateBoundingBox(
  lat: number,
  lon: number,
  radiusMeters: number
): [number, number, number, number] {
  // Earth's radius in meters
  const R = 6371000;
  
  // Convert radius to degrees (approximate)
  const latDelta = (radiusMeters / R) * (180 / Math.PI);
  const lonDelta = (radiusMeters / (R * Math.cos(lat * Math.PI / 180))) * (180 / Math.PI);
  
  return [
    lon - lonDelta, // minX
    lat - latDelta, // minY
    lon + lonDelta, // maxX
    lat + latDelta, // maxY
  ];
}

/**
 * Download image from Mapillary.
 */
export async function downloadMapillaryImage(url: string): Promise<Buffer> {
  if (!MAPILLARY_ACCESS_TOKEN) {
    throw new Error('MAPILLARY_ACCESS_TOKEN is not configured');
  }

  return withRetry(async () => {
    // Try with Authorization header first
    let response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${MAPILLARY_ACCESS_TOKEN}`,
      },
    });
    
    // If that fails, try with access_token query param
    if (!response.ok && response.status === 401) {
      const urlWithToken = new URL(url);
      urlWithToken.searchParams.set('access_token', MAPILLARY_ACCESS_TOKEN);
      response = await fetch(urlWithToken.toString());
    }
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }
    
    return Buffer.from(await response.arrayBuffer());
  }, 'Mapillary image download', { maxRetries: 3, baseDelayMs: 1000 });
}
