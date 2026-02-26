/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { StyleSpecification } from 'maplibre-gl';

export type MapStyle = 'standard' | 'satellite' | 'terrain';
export type BaseMapStyle = 'standard' | 'satellite' | 'offline' | 'fallback';

const OSM_TILES = [
  'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
];

const ESRI_SATELLITE_TILES = [
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
];

export const STYLE_CONFIG: Record<MapStyle, { label: string; description: string }> = {
  standard: {
    label: 'STANDARD',
    description: 'OpenStreetMap raster base map',
  },
  satellite: {
    label: 'SATELLITE',
    description: 'High-resolution satellite imagery',
  },
  terrain: {
    label: '3D PERSPECTIVE',
    description: '3D perspective view with elevated pitch',
  },
};

export const standardStyle: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: OSM_TILES,
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-base',
      type: 'raster',
      source: 'osm',
    },
  ],
};

export const satelliteStyle: StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: ESRI_SATELLITE_TILES,
      tileSize: 256,
      attribution: 'Tiles © Esri',
    },
  },
  layers: [
    {
      id: 'satellite-base',
      type: 'raster',
      source: 'satellite',
    },
  ],
};

export const fallbackStyle: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: 'fallback-background',
      type: 'background',
      paint: {
        'background-color': '#0d1117',
      },
    },
  ],
};

export const offlineStyle: StyleSpecification = {
  version: 8,
  sources: {
    offline: {
      type: 'raster',
      tiles: ['cached://{z}/{x}/{y}'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors (cached)',
    },
  },
  layers: [
    {
      id: 'offline-base',
      type: 'raster',
      source: 'offline',
    },
  ],
};
