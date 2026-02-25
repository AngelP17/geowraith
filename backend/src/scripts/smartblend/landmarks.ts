/**
 * SmartBlend landmark database and types.
 */

export interface LandmarkSource {
  id: string;
  filename: string;
  label: string;
  lat: number;
  lon: number;
  continent: string;
  country: string;
  /**
   * Direct URLs are unverified for license and should only be used
   * when allowUnverified is enabled.
   */
  urls: string[];
}

export const SMART_BLEND_DATABASE: LandmarkSource[] = [
  {
    id: 'blend_001', filename: 'eiffel_tower.jpg', label: 'Eiffel Tower, Paris',
    lat: 48.8584, lon: 2.2945, continent: 'Europe', country: 'France',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg/640px-Tour_Eiffel_Wikimedia_Commons.jpg',
    ]
  },
  {
    id: 'blend_002', filename: 'statue_of_liberty.jpg', label: 'Statue of Liberty, NYC',
    lat: 40.6892, lon: -74.0445, continent: 'North America', country: 'USA',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Lady_Liberty_under_a_blue_sky_%28cropped%29.jpg/640px-Lady_Liberty_under_a_blue_sky_%28cropped%29.jpg',
    ]
  },
  {
    id: 'blend_003', filename: 'taj_mahal.jpg', label: 'Taj Mahal, Agra',
    lat: 27.1751, lon: 78.0421, continent: 'Asia', country: 'India',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Taj_Mahal_%28Edited%29.jpeg/640px-Taj_Mahal_%28Edited%29.jpeg',
    ]
  },
  {
    id: 'blend_004', filename: 'colosseum.jpg', label: 'Colosseum, Rome',
    lat: 41.8902, lon: 12.4922, continent: 'Europe', country: 'Italy',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/640px-Colosseo_2020.jpg',
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
    id: 'blend_006', filename: 'big_ben.jpg', label: 'Big Ben, London',
    lat: 51.5007, lon: -0.1246, continent: 'Europe', country: 'UK',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Clock_Tower_-_Palace_of_Westminster%2C_London_-_May_2007.jpg/640px-Clock_Tower_-_Palace_of_Westminster%2C_London_-_May_2007.jpg',
    ]
  },
  {
    id: 'blend_007', filename: 'sydney_opera_house.jpg', label: 'Sydney Opera House',
    lat: -33.8568, lon: 151.2153, continent: 'Oceania', country: 'Australia',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Sydney_Opera_House_Sails.jpg/640px-Sydney_Opera_House_Sails.jpg',
    ]
  },
  {
    id: 'blend_008', filename: 'great_wall.jpg', label: 'Great Wall of China',
    lat: 40.4319, lon: 116.5704, continent: 'Asia', country: 'China',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Great_Wall_of_China.jpg/640px-Great_Wall_of_China.jpg',
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
    id: 'blend_010', filename: 'pyramids_giza.jpg', label: 'Pyramids of Giza',
    lat: 29.9792, lon: 31.1342, continent: 'Africa', country: 'Egypt',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/All_Gizah_Pyramids.jpg/640px-All_Gizah_Pyramids.jpg',
    ]
  },
  {
    id: 'blend_011', filename: 'santorini.jpg', label: 'Santorini, Greece',
    lat: 36.3932, lon: 25.4615, continent: 'Europe', country: 'Greece',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Santorini_Greece.jpg/640px-Santorini_Greece.jpg',
    ]
  },
  {
    id: 'blend_012', filename: 'petra.jpg', label: 'Petra, Jordan',
    lat: 30.3285, lon: 35.4444, continent: 'Asia', country: 'Jordan',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Al_Khazneh.jpg/640px-Al_Khazneh.jpg',
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
    id: 'blend_014', filename: 'burj_khalifa.jpg', label: 'Burj Khalifa, Dubai',
    lat: 25.1972, lon: 55.2744, continent: 'Asia', country: 'UAE',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Burj_Khalifa.jpg/640px-Burj_Khalifa.jpg',
    ]
  },
  {
    id: 'blend_015', filename: 'mount_fuji.jpg', label: 'Mount Fuji, Japan',
    lat: 35.3606, lon: 138.7274, continent: 'Asia', country: 'Japan',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/080103_hakkai_fuji.jpg/640px-080103_hakkai_fuji.jpg',
    ]
  },
  {
    id: 'blend_016', filename: 'brandenburg_gate.jpg', label: 'Brandenburg Gate, Berlin',
    lat: 52.5163, lon: 13.3777, continent: 'Europe', country: 'Germany',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Brandenburger_Tor_abends.jpg/640px-Brandenburger_Tor_abends.jpg',
    ]
  },
  {
    id: 'blend_017', filename: 'acropolis.jpg', label: 'Acropolis, Athens',
    lat: 37.9715, lon: 23.7267, continent: 'Europe', country: 'Greece',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Acropolis_of_Athens.jpg/640px-Acropolis_of_Athens.jpg',
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
    id: 'blend_019', filename: 'neuschwanstein.jpg', label: 'Neuschwanstein Castle, Germany',
    lat: 47.5575, lon: 10.7498, continent: 'Europe', country: 'Germany',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Schloss_Neuschwanstein_2013.jpg/640px-Schloss_Neuschwanstein_2013.jpg',
    ]
  },
  {
    id: 'blend_020', filename: 'stonehenge.jpg', label: 'Stonehenge, UK',
    lat: 51.1788, lon: -1.8262, continent: 'Europe', country: 'UK',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Stonehenge2007_07_30.jpg/640px-Stonehenge2007_07_30.jpg',
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
    id: 'blend_022', filename: 'venice_canals.jpg', label: 'Venice Canals, Italy',
    lat: 45.4408, lon: 12.3155, continent: 'Europe', country: 'Italy',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Venice_Canal.jpg/640px-Venice_Canal.jpg',
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
    id: 'blend_025', filename: 'angkor_wat.jpg', label: 'Angkor Wat, Cambodia',
    lat: 13.4125, lon: 103.8670, continent: 'Asia', country: 'Cambodia',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Angkor_Wat.jpg/640px-Angkor_Wat.jpg',
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
    id: 'blend_027', filename: 'louvre.jpg', label: 'Louvre Museum, Paris',
    lat: 48.8606, lon: 2.3376, continent: 'Europe', country: 'France',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Louvre_Museum_Wikimedia_Commons.jpg/640px-Louvre_Museum_Wikimedia_Commons.jpg',
    ]
  },
  {
    id: 'blend_028', filename: 'sagrada_familia.jpg', label: 'Sagrada Familia, Barcelona',
    lat: 41.4036, lon: 2.1744, continent: 'Europe', country: 'Spain',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Sagrada_Familia_2021.jpg/640px-Sagrada_Familia_2021.jpg',
    ]
  },
  {
    id: 'blend_029', filename: 'hagia_sophia.jpg', label: 'Hagia Sophia, Istanbul',
    lat: 41.0082, lon: 28.9784, continent: 'Europe', country: 'Turkey',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Hagia_Sophia_2013.jpg/640px-Hagia_Sophia_2013.jpg',
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
    id: 'blend_031', filename: 'matterhorn.jpg', label: 'Matterhorn, Switzerland',
    lat: 45.9766, lon: 7.6585, continent: 'Europe', country: 'Switzerland',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Matterhorn_from_Domh%C3%BCtte_-_2.jpg/640px-Matterhorn_from_Domh%C3%BCtte_-_2.jpg',
    ]
  },
  {
    id: 'blend_032', filename: 'notre_dame.jpg', label: 'Notre-Dame, Paris',
    lat: 48.8530, lon: 2.3499, continent: 'Europe', country: 'France',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Notre-Dame_de_Paris_2013.jpg/640px-Notre-Dame_de_Paris_2013.jpg',
    ]
  },
  {
    id: 'blend_033', filename: 'terracotta_army.jpg', label: 'Terracotta Army, China',
    lat: 34.3841, lon: 109.2785, continent: 'Asia', country: 'China',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Terracotta_Army.jpg/640px-Terracotta_Army.jpg',
    ]
  },
  {
    id: 'blend_034', filename: 'mount_rushmore.jpg', label: 'Mount Rushmore, USA',
    lat: 43.8791, lon: -103.4591, continent: 'North America', country: 'USA',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Mount_Rushmore.jpg/640px-Mount_Rushmore.jpg',
    ]
  },
  {
    id: 'blend_035', filename: 'uluru.jpg', label: 'Uluru, Australia',
    lat: -25.3444, lon: 131.0369, continent: 'Oceania', country: 'Australia',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Uluru_Australia.jpg/640px-Uluru_Australia.jpg',
    ]
  },
];
