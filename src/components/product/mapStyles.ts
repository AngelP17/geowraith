/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { StyleSpecification } from 'maplibre-gl';

export type MapStyle = 'standard' | 'satellite' | 'terrain';
export type BaseMapStyle = 'standard' | 'satellite' | 'offline' | 'fallback';

const ESRI_SATELLITE_TILES = [
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
];

const DIRECT_OSM_TILES = ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'];

const CACHED_OSM_TILES = ['cached://{z}/{x}/{y}'];

export const STYLE_CONFIG: Record<MapStyle, { label: string; shortLabel: string; description: string }> = {
  standard: {
    label: 'STANDARD',
    shortLabel: 'Standard',
    description: 'OpenStreetMap street base',
  },
  satellite: {
    label: 'SATELLITE',
    shortLabel: 'Satellite',
    description: 'High-resolution satellite imagery',
  },
  terrain: {
    label: '3D PERSPECTIVE',
    shortLabel: '3D',
    description: '3D perspective view with elevated pitch',
  },
};

export const standardStyle: StyleSpecification = {
  version: 8,
  sources: {
    streets: {
      type: 'raster',
      tiles: DIRECT_OSM_TILES,
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'street-base',
      type: 'raster',
      source: 'streets',
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
