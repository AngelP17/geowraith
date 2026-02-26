/**
 * Curated list of public domain landmark images with accurate coordinates
 */

import type { SourcedImage } from './types.js';

// Europe - Landmarks
const EUROPE_IMAGES: SourcedImage[] = [
  {
    id: 'eu_001', filename: 'brandenburg_gate.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Brandenburger_Tor_abends.jpg/640px-Brandenburger_Tor_abends.jpg',
    lat: 52.5163, lon: 13.3777, label: 'Brandenburg Gate, Berlin', country: 'Germany', continent: 'Europe', category: 'landmark'
  },
  {
    id: 'eu_002', filename: 'neuschwanstein.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Neuschwanstein_Castle.jpg/640px-Neuschwanstein_Castle.jpg',
    lat: 47.5576, lon: 10.7498, label: 'Neuschwanstein Castle, Bavaria', country: 'Germany', continent: 'Europe', category: 'landmark'
  },
  {
    id: 'eu_003', filename: 'versailles.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Palace_of_Versailles.jpg/640px-Palace_of_Versailles.jpg',
    lat: 48.8049, lon: 2.1204, label: 'Palace of Versailles', country: 'France', continent: 'Europe', category: 'landmark'
  },
  {
    id: 'eu_004', filename: 'mont_saint_michel.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Mont-Saint-Michel.jpg/640px-Mont-Saint-Michel.jpg',
    lat: 48.6361, lon: -1.5115, label: 'Mont Saint-Michel', country: 'France', continent: 'Europe', category: 'landmark'
  },
  {
    id: 'eu_005', filename: 'santorini.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Santorini_Greece.jpg/640px-Santorini_Greece.jpg',
    lat: 36.3932, lon: 25.4615, label: 'Santorini, Greece', country: 'Greece', continent: 'Europe', category: 'coastal'
  },
  {
    id: 'eu_006', filename: 'acropolis.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Acropolis_of_Athens.jpg/640px-Acropolis_of_Athens.jpg',
    lat: 37.9715, lon: 23.7257, label: 'Acropolis, Athens', country: 'Greece', continent: 'Europe', category: 'landmark'
  },
  {
    id: 'eu_007', filename: 'sagrada_familia.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Sagrada_Familia_01.jpg/640px-Sagrada_Familia_01.jpg',
    lat: 41.4036, lon: 2.1744, label: 'Sagrada Familia, Barcelona', country: 'Spain', continent: 'Europe', category: 'landmark'
  },
  {
    id: 'eu_008', filename: 'alhambra.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Alhambra_Granada.jpg/640px-Alhambra_Granada.jpg',
    lat: 37.1760, lon: -3.5881, label: 'Alhambra, Granada', country: 'Spain', continent: 'Europe', category: 'landmark'
  },
  {
    id: 'eu_009', filename: 'stonehenge.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Stonehenge.jpg/640px-Stonehenge.jpg',
    lat: 51.1788, lon: -1.8262, label: 'Stonehenge, England', country: 'UK', continent: 'Europe', category: 'landmark'
  },
  {
    id: 'eu_010', filename: 'tower_bridge.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Tower_Bridge_London.jpg/640px-Tower_Bridge_London.jpg',
    lat: 51.5055, lon: -0.0754, label: 'Tower Bridge, London', country: 'UK', continent: 'Europe', category: 'landmark'
  },
  {
    id: 'eu_011', filename: 'venice.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Venice_Grand_Canal.jpg/640px-Venice_Grand_Canal.jpg',
    lat: 45.4408, lon: 12.3155, label: 'Venice Grand Canal', country: 'Italy', continent: 'Europe', category: 'urban'
  },
  {
    id: 'eu_012', filename: 'matterhorn.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Matterhorn.jpg/640px-Matterhorn.jpg',
    lat: 45.9766, lon: 7.6585, label: 'Matterhorn, Switzerland', country: 'Switzerland', continent: 'Europe', category: 'nature'
  },
];

// Asia - Landmarks
const ASIA_IMAGES: SourcedImage[] = [
  {
    id: 'as_001', filename: 'great_wall.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Great_Wall_of_China.jpg/640px-Great_Wall_of_China.jpg',
    lat: 40.4319, lon: 116.5704, label: 'Great Wall of China', country: 'China', continent: 'Asia', category: 'landmark'
  },
  {
    id: 'as_002', filename: 'forbidden_city.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Forbidden_City_Beijing.jpg/640px-Forbidden_City_Beijing.jpg',
    lat: 39.9163, lon: 116.3972, label: 'Forbidden City, Beijing', country: 'China', continent: 'Asia', category: 'landmark'
  },
  {
    id: 'as_003', filename: 'fushimi_inari.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Fushimi_Inari_Taisha.jpg/640px-Fushimi_Inari_Taisha.jpg',
    lat: 34.9671, lon: 135.7727, label: 'Fushimi Inari, Kyoto', country: 'Japan', continent: 'Asia', category: 'landmark'
  },
  {
    id: 'as_004', filename: 'angkor_wat.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Angkor_Wat.jpg/640px-Angkor_Wat.jpg',
    lat: 13.4125, lon: 103.8670, label: 'Angkor Wat, Cambodia', country: 'Cambodia', continent: 'Asia', category: 'landmark'
  },
  {
    id: 'as_005', filename: 'petra.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Al_Khazneh.jpg/640px-Al_Khazneh.jpg',
    lat: 30.3285, lon: 35.4444, label: 'Petra, Jordan', country: 'Jordan', continent: 'Asia', category: 'landmark'
  },
  {
    id: 'as_006', filename: 'burj_khalifa.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Burj_Khalifa.jpg/640px-Burj_Khalifa.jpg',
    lat: 25.1972, lon: 55.2744, label: 'Burj Khalifa, Dubai', country: 'UAE', continent: 'Asia', category: 'landmark'
  },
  {
    id: 'as_007', filename: 'marina_bay.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Marina_Bay_Sands.jpg/640px-Marina_Bay_Sands.jpg',
    lat: 1.2834, lon: 103.8607, label: 'Marina Bay Sands, Singapore', country: 'Singapore', continent: 'Asia', category: 'landmark'
  },
  {
    id: 'as_008', filename: 'ha_long_bay.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Ha_Long_Bay.jpg/640px-Ha_Long_Bay.jpg',
    lat: 20.9101, lon: 107.1839, label: 'Ha Long Bay, Vietnam', country: 'Vietnam', continent: 'Asia', category: 'nature'
  },
];

// North America
const NORTH_AMERICA_IMAGES: SourcedImage[] = [
  {
    id: 'na_001', filename: 'grand_canyon.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Grand_Canyon.jpg/640px-Grand_Canyon.jpg',
    lat: 36.1069, lon: -112.1129, label: 'Grand Canyon', country: 'USA', continent: 'North America', category: 'nature'
  },
  {
    id: 'na_002', filename: 'times_square.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Times_Square.jpg/640px-Times_Square.jpg',
    lat: 40.7580, lon: -73.9855, label: 'Times Square, NYC', country: 'USA', continent: 'North America', category: 'urban'
  },
  {
    id: 'na_003', filename: 'white_house.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/White_House.jpg/640px-White_House.jpg',
    lat: 38.8977, lon: -77.0365, label: 'White House, Washington DC', country: 'USA', continent: 'North America', category: 'landmark'
  },
  {
    id: 'na_004', filename: 'niagara_falls.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Niagara_Falls.jpg/640px-Niagara_Falls.jpg',
    lat: 43.0962, lon: -79.0377, label: 'Niagara Falls', country: 'USA/Canada', continent: 'North America', category: 'nature'
  },
  {
    id: 'na_005', filename: 'chichen_itza.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Chichen_Itza.jpg/640px-Chichen_Itza.jpg',
    lat: 20.6843, lon: -88.5678, label: 'Chichen Itza, Mexico', country: 'Mexico', continent: 'North America', category: 'landmark'
  },
  {
    id: 'na_006', filename: 'cn_tower.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/CN_Tower_Toronto.jpg/640px-CN_Tower_Toronto.jpg',
    lat: 43.6426, lon: -79.3871, label: 'CN Tower, Toronto', country: 'Canada', continent: 'North America', category: 'landmark'
  },
  {
    id: 'na_007', filename: 'banff.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Banff_National_Park.jpg/640px-Banff_National_Park.jpg',
    lat: 51.4968, lon: -115.9281, label: 'Banff National Park', country: 'Canada', continent: 'North America', category: 'nature'
  },
];

// South America
const SOUTH_AMERICA_IMAGES: SourcedImage[] = [
  {
    id: 'sa_001', filename: 'machu_picchu.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Machu_Picchu.jpg/640px-Machu_Picchu.jpg',
    lat: -13.1631, lon: -72.5450, label: 'Machu Picchu, Peru', country: 'Peru', continent: 'South America', category: 'landmark'
  },
  {
    id: 'sa_002', filename: 'iguazu_falls.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Iguazu_Falls.jpg/640px-Iguazu_Falls.jpg',
    lat: -25.6953, lon: -54.4367, label: 'Iguazu Falls', country: 'Argentina/Brazil', continent: 'South America', category: 'nature'
  },
  {
    id: 'sa_003', filename: 'christ_redeemer.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Christ_the_Redeemer.jpg/640px-Christ_the_Redeemer.jpg',
    lat: -22.9519, lon: -43.2105, label: 'Christ the Redeemer, Rio', country: 'Brazil', continent: 'South America', category: 'landmark'
  },
  {
    id: 'sa_004', filename: 'salar_uyuni.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Salar_de_Uyuni.jpg/640px-Salar_de_Uyuni.jpg',
    lat: -20.1338, lon: -67.4891, label: 'Salar de Uyuni, Bolivia', country: 'Bolivia', continent: 'South America', category: 'nature'
  },
];

// Africa
const AFRICA_IMAGES: SourcedImage[] = [
  {
    id: 'af_001', filename: 'pyramids_giza.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/All_Gizah_Pyramids.jpg/640px-All_Gizah_Pyramids.jpg',
    lat: 29.9792, lon: 31.1342, label: 'Pyramids of Giza, Egypt', country: 'Egypt', continent: 'Africa', category: 'landmark'
  },
  {
    id: 'af_002', filename: 'victoria_falls.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Victoria_Falls.jpg/640px-Victoria_Falls.jpg',
    lat: -17.9243, lon: 25.8572, label: 'Victoria Falls', country: 'Zimbabwe/Zambia', continent: 'Africa', category: 'nature'
  },
  {
    id: 'af_003', filename: 'table_mountain.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Table_Mountain.jpg/640px-Table_Mountain.jpg',
    lat: -33.9628, lon: 18.4098, label: 'Table Mountain, Cape Town', country: 'South Africa', continent: 'Africa', category: 'nature'
  },
  {
    id: 'af_004', filename: 'serengeti.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Serengeti.jpg/640px-Serengeti.jpg',
    lat: -2.1540, lon: 34.6857, label: 'Serengeti National Park', country: 'Tanzania', continent: 'Africa', category: 'nature'
  },
];

// Oceania
const OCEANIA_IMAGES: SourcedImage[] = [
  {
    id: 'oc_001', filename: 'sydney_opera_house.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Sydney_Opera_House_Sails.jpg/640px-Sydney_Opera_House_Sails.jpg',
    lat: -33.8568, lon: 151.2153, label: 'Sydney Opera House', country: 'Australia', continent: 'Oceania', category: 'landmark'
  },
  {
    id: 'oc_002', filename: 'great_barrier_reef.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Great_Barrier_Reef.jpg/640px-Great_Barrier_Reef.jpg',
    lat: -18.2871, lon: 147.6992, label: 'Great Barrier Reef', country: 'Australia', continent: 'Oceania', category: 'nature'
  },
  {
    id: 'oc_003', filename: 'milford_sound.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Milford_Sound.jpg/640px-Milford_Sound.jpg',
    lat: -44.6167, lon: 167.8667, label: 'Milford Sound, NZ', country: 'New Zealand', continent: 'Oceania', category: 'nature'
  },
  {
    id: 'oc_004', filename: 'uluru.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Uluru.jpg/640px-Uluru.jpg',
    lat: -25.3444, lon: 131.0369, label: 'Uluru, Australia', country: 'Australia', continent: 'Oceania', category: 'nature'
  },
  {
    id: 'oc_005', filename: 'bora_bora.jpg', source: 'wikimedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Bora_Bora.jpg/640px-Bora_Bora.jpg',
    lat: -16.5004, lon: -151.7415, label: 'Bora Bora, French Polynesia', country: 'French Polynesia', continent: 'Oceania', category: 'coastal'
  },
];

// Combined array of all public domain images
export const PUBLIC_DOMAIN_IMAGES: SourcedImage[] = [
  ...EUROPE_IMAGES,
  ...ASIA_IMAGES,
  ...NORTH_AMERICA_IMAGES,
  ...SOUTH_AMERICA_IMAGES,
  ...AFRICA_IMAGES,
  ...OCEANIA_IMAGES,
];

export const TOTAL_IMAGE_COUNT = PUBLIC_DOMAIN_IMAGES.length;
