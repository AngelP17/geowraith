/**
 * Americas landmark data (North and South America).
 */

import type { LandmarkSource } from '../types.js';

export const AMERICAS_LANDMARKS: LandmarkSource[] = [
  {
    id: 'blend_002', filename: 'statue_of_liberty.jpg', label: 'Statue of Liberty, NYC',
    lat: 40.6892, lon: -74.0445, continent: 'North America', country: 'USA',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Lady_Liberty_under_a_blue_sky_%28cropped%29.jpg/640px-Lady_Liberty_under_a_blue_sky_%28cropped%29.jpg',
    ]
  },
  {
    id: 'blend_005', filename: 'golden_gate_bridge.jpg', label: 'Golden Gate Bridge, SF',
    lat: 37.8199, lon: -122.4783, continent: 'North America', country: 'USA',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/GoldenGateBridge-001.jpg/640px-GoldenGateBridge-001.jpg',
    ]
  },
  {
    id: 'blend_009', filename: 'machu_picchu.jpg', label: 'Machu Picchu, Peru',
    lat: -13.1631, lon: -72.5450, continent: 'South America', country: 'Peru',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Machu_Picchu.jpg/640px-Machu_Picchu.jpg',
    ]
  },
  {
    id: 'blend_013', filename: 'christ_redeemer.jpg', label: 'Christ the Redeemer, Rio',
    lat: -22.9519, lon: -43.2105, continent: 'South America', country: 'Brazil',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Christ_the_Redeemer.jpg/640px-Christ_the_Redeemer.jpg',
    ]
  },
  {
    id: 'blend_018', filename: 'liberty_memorial.jpg', label: 'Liberty Memorial, Kansas City',
    lat: 39.0811, lon: -94.5860, continent: 'North America', country: 'USA',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Liberty_Memorial_Tower.jpg/480px-Liberty_Memorial_Tower.jpg',
    ]
  },
  {
    id: 'blend_021', filename: 'grand_canyon.jpg', label: 'Grand Canyon, USA',
    lat: 36.1069, lon: -112.1129, continent: 'North America', country: 'USA',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Grand_Canyon_view_from_Pima_Point_2010.jpg/640px-Grand_Canyon_view_from_Pima_Point_2010.jpg',
    ]
  },
  {
    id: 'blend_023', filename: 'niagara_falls.jpg', label: 'Niagara Falls, Canada/USA',
    lat: 43.0962, lon: -79.0377, continent: 'North America', country: 'Canada/USA',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Niagara_Falls_2010.jpg/640px-Niagara_Falls_2010.jpg',
    ]
  },
  {
    id: 'blend_024', filename: 'chichen_itza.jpg', label: 'Chichen Itza, Mexico',
    lat: 20.6843, lon: -88.5678, continent: 'North America', country: 'Mexico',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Chichen_Itza_2010.jpg/640px-Chichen_Itza_2010.jpg',
    ]
  },
  {
    id: 'blend_026', filename: 'times_square.jpg', label: 'Times Square, NYC',
    lat: 40.7580, lon: -73.9855, continent: 'North America', country: 'USA',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/New_york_times_square-terabass.jpg/640px-New_york_times_square-terabass.jpg',
    ]
  },
  {
    id: 'blend_030', filename: 'moai_statues.jpg', label: 'Moai Statues, Easter Island',
    lat: -27.1258, lon: -109.2774, continent: 'South America', country: 'Chile',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Moai_Rano_Raraku.jpg/640px-Moai_Rano_Raraku.jpg',
    ]
  },
  {
    id: 'blend_034', filename: 'mount_rushmore.jpg', label: 'Mount Rushmore, USA',
    lat: 43.8791, lon: -103.4591, continent: 'North America', country: 'USA',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Mount_Rushmore.jpg/640px-Mount_Rushmore.jpg',
    ]
  },
  // South America (expand coverage)
  {
    id: 'blend_041', filename: 'iguazu_falls.jpg', label: 'Iguazu Falls, Argentina/Brazil',
    lat: -25.6953, lon: -54.4367, continent: 'South America', country: 'Argentina/Brazil',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Iguazu_Falls.jpg/640px-Iguazu_Falls.jpg',
    ]
  },
  {
    id: 'blend_042', filename: 'uyuni_salt_flats.jpg', label: 'Salar de Uyuni, Bolivia',
    lat: -20.1338, lon: -67.4891, continent: 'South America', country: 'Bolivia',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Salar_de_Uyuni.jpg/640px-Salar_de_Uyuni.jpg',
    ]
  },
  {
    id: 'blend_043', filename: 'perito_moreno.jpg', label: 'Perito Moreno Glacier, Argentina',
    lat: -50.4957, lon: -73.1376, continent: 'South America', country: 'Argentina',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Perito_Moreno_Glacier.jpg/640px-Perito_Moreno_Glacier.jpg',
    ]
  },
  // Phase 4 Expansion - Additional Americas Landmarks
  {
    id: 'blend_066', filename: 'white_house.jpg', label: 'White House, Washington DC',
    lat: 38.8977, lon: -77.0365, continent: 'North America', country: 'USA',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/White_House_North.jpg/640px-White_House_North.jpg',
    ]
  },
  {
    id: 'blend_067', filename: 'capitol_hill.jpg', label: 'US Capitol, Washington DC',
    lat: 38.8899, lon: -77.0091, continent: 'North America', country: 'USA',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/US_Capitol_Building.jpg/640px-US_Capitol_Building.jpg',
    ]
  },
  {
    id: 'blend_068', filename: 'lincoln_memorial.jpg', label: 'Lincoln Memorial, Washington DC',
    lat: 38.8893, lon: -77.0502, continent: 'North America', country: 'USA',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Lincoln_Memorial_Washington_DC.jpg/640px-Lincoln_Memorial_Washington_DC.jpg',
    ]
  },
  {
    id: 'blend_069', filename: 'hollywood_sign.jpg', label: 'Hollywood Sign, Los Angeles',
    lat: 34.1341, lon: -118.3215, continent: 'North America', country: 'USA',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Hollywood_Sign.jpg/640px-Hollywood_Sign.jpg',
    ]
  },
  {
    id: 'blend_070', filename: 'yellowstone.jpg', label: 'Yellowstone National Park, USA',
    lat: 44.4280, lon: -110.5885, continent: 'North America', country: 'USA',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Yellowstone_Old_Faithful.jpg/640px-Yellowstone_Old_Faithful.jpg',
    ]
  },
  {
    id: 'blend_071', filename: 'yosemite.jpg', label: 'Yosemite National Park, USA',
    lat: 37.8651, lon: -119.5383, continent: 'North America', country: 'USA',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Yosemite_Valley.jpg/640px-Yosemite_Valley.jpg',
    ]
  },
  {
    id: 'blend_072', filename: 'cn_tower.jpg', label: 'CN Tower, Toronto',
    lat: 43.6426, lon: -79.3871, continent: 'North America', country: 'Canada',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/CN_Tower_Toronto.jpg/640px-CN_Tower_Toronto.jpg',
    ]
  },
  {
    id: 'blend_073', filename: 'banff.jpg', label: 'Banff National Park, Canada',
    lat: 51.4968, lon: -115.9281, continent: 'North America', country: 'Canada',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Banff_National_Park.jpg/640px-Banff_National_Park.jpg',
    ]
  },
  {
    id: 'blend_074', filename: 'chichen_itza.jpg', label: 'Chichen Itza, Mexico',
    lat: 20.6843, lon: -88.5678, continent: 'North America', country: 'Mexico',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Chichen_Itza_2010.jpg/640px-Chichen_Itza_2010.jpg',
    ]
  },
  {
    id: 'blend_075', filename: 'teotihuacan.jpg', label: 'Teotihuacan, Mexico',
    lat: 19.6925, lon: -98.8438, continent: 'North America', country: 'Mexico',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Teotihuacan_Pyramids.jpg/640px-Teotihuacan_Pyramids.jpg',
    ]
  },
  {
    id: 'blend_076', filename: 'copacabana.jpg', label: 'Copacabana Beach, Rio',
    lat: -22.9719, lon: -43.1823, continent: 'South America', country: 'Brazil',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Copacabana_Beach.jpg/640px-Copacabana_Beach.jpg',
    ]
  },
  {
    id: 'blend_077', filename: 'sugarloaf.jpg', label: 'Sugarloaf Mountain, Rio',
    lat: -22.9493, lon: -43.1546, continent: 'South America', country: 'Brazil',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Sugarloaf_Mountain.jpg/640px-Sugarloaf_Mountain.jpg',
    ]
  },
  {
    id: 'blend_078', filename: 'galapagos.jpg', label: 'Galapagos Islands, Ecuador',
    lat: -0.9538, lon: -90.9656, continent: 'South America', country: 'Ecuador',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Galapagos_Islands.jpg/640px-Galapagos_Islands.jpg',
    ]
  },
];
