/**
 * SmartBlend Gallery - Landmark data
 */

import type { LandmarkSource } from './types.js';

export const OUTPUT_DIR = '.cache/smartblend_gallery';
export const IMAGES_SUBDIR = 'images';
export const CSV_FILENAME = 'metadata.csv';
export const MANIFEST_FILENAME = 'manifest.json';

export const USER_AGENT = 'GeoWraith/0.2.0 (SmartBlend validation)';
export const REQUEST_TIMEOUT_MS = 15000;
export const MAX_RETRIES = 3;

export const LANDMARKS: LandmarkSource[] = [
  {
    id: 'landmark_001',
    filename: 'eiffel_tower.jpg',
    label: 'Eiffel Tower, Paris, France',
    lat: 48.8584,
    lon: 2.2945,
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg/640px-Tour_Eiffel_Wikimedia_Commons.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/6/6d/Tour_Eiffel_Wikimedia_Commons.jpg',
    ],
  },
  {
    id: 'landmark_002',
    filename: 'statue_of_liberty.jpg',
    label: 'Statue of Liberty, New York, USA',
    lat: 40.6892,
    lon: -74.0445,
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Lady_Liberty_under_a_blue_sky_%28cropped%29.jpg/640px-Lady_Liberty_under_a_blue_sky_%28cropped%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/3/3d/Statue_of_Liberty%2C_NY.jpg',
    ],
  },
  {
    id: 'landmark_003',
    filename: 'taj_mahal.jpg',
    label: 'Taj Mahal, Agra, India',
    lat: 27.1751,
    lon: 78.0421,
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Taj_Mahal_%28Edited%29.jpeg/640px-Taj_Mahal_%28Edited%29.jpeg',
      'https://upload.wikimedia.org/wikipedia/commons/1/1d/Taj_Mahal_%28Edited%29.jpeg',
    ],
  },
  {
    id: 'landmark_004',
    filename: 'colosseum.jpg',
    label: 'Colosseum, Rome, Italy',
    lat: 41.8902,
    lon: 12.4922,
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/640px-Colosseo_2020.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/d/de/Colosseo_2020.jpg',
    ],
  },
  {
    id: 'landmark_005',
    filename: 'golden_gate_bridge.jpg',
    label: 'Golden Gate Bridge, San Francisco, USA',
    lat: 37.8199,
    lon: -122.4783,
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/GoldenGateBridge-001.jpg/640px-GoldenGateBridge-001.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/0/0c/GoldenGateBridge-001.jpg',
    ],
  },
  {
    id: 'landmark_006',
    filename: 'big_ben.jpg',
    label: 'Big Ben, London, UK',
    lat: 51.4994,
    lon: -0.1245,
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Clock_Tower_-_Palace_of_Westminster%2C_London_-_May_2007.jpg/640px-Clock_Tower_-_Palace_of_Westminster%2C_London_-_May_2007.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/9/93/Clock_Tower_-_Palace_of_Westminster%2C_London_-_May_2007.jpg',
    ],
  },
  {
    id: 'landmark_007',
    filename: 'sydney_opera_house.jpg',
    label: 'Sydney Opera House, Australia',
    lat: -33.8568,
    lon: 151.2153,
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Sydney_Opera_House_Sails.jpg/640px-Sydney_Opera_House_Sails.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/4/40/Sydney_Opera_House_Sails.jpg',
    ],
  },
  {
    id: 'landmark_008',
    filename: 'mount_fuji.jpg',
    label: 'Mount Fuji, Japan',
    lat: 35.3606,
    lon: 138.7274,
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/080103_hakkai_fuji.jpg/640px-080103_hakkai_fuji.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/1/1b/080103_hakkai_fuji.jpg',
    ],
  },
  {
    id: 'landmark_009',
    filename: 'christ_redeemer.jpg',
    label: 'Christ the Redeemer, Rio de Janeiro, Brazil',
    lat: -22.9519,
    lon: -43.2105,
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Aerial_view_of_the_Statue_of_Christ_the_Redeemer.jpg/640px-Aerial_view_of_the_Statue_of_Christ_the_Redeemer.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/e/e7/Aerial_view_of_the_Statue_of_Christ_the_Redeemer.jpg',
    ],
  },
];
