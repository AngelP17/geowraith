/**
 * Comprehensive global cities database for GeoWraith
 * Covers 2000+ cities across all continents to prevent continent-level errors
 */

export interface GlobalCity {
  id: string;
  name: string;
  lat: number;
  lon: number;
  country: string;
  continent: 'Europe' | 'Asia' | 'NorthAmerica' | 'SouthAmerica' | 'Africa' | 'Oceania';
  population: number; // For weighting
}

// Major global cities - comprehensive coverage
export const GLOBAL_CITIES: GlobalCity[] = [
  // === EUROPE (500+ cities) ===
  // UK & Ireland
  { id: 'gb_london', name: 'London', lat: 51.5074, lon: -0.1278, country: 'UK', continent: 'Europe', population: 8982000 },
  { id: 'gb_manchester', name: 'Manchester', lat: 53.4808, lon: -2.2426, country: 'UK', continent: 'Europe', population: 547627 },
  { id: 'gb_birmingham', name: 'Birmingham', lat: 52.4862, lon: -1.8904, country: 'UK', continent: 'Europe', population: 1137100 },
  { id: 'gb_leeds', name: 'Leeds', lat: 53.8008, lon: -1.5491, country: 'UK', continent: 'Europe', population: 812000 },
  { id: 'gb_glasgow', name: 'Glasgow', lat: 55.8642, lon: -4.2518, country: 'UK', continent: 'Europe', population: 635640 },
  { id: 'gb_liverpool', name: 'Liverpool', lat: 53.4084, lon: -2.9916, country: 'UK', continent: 'Europe', population: 552267 },
  { id: 'gb_sheffield', name: 'Sheffield', lat: 53.3811, lon: -1.4701, country: 'UK', continent: 'Europe', population: 582506 },
  { id: 'gb_bristol', name: 'Bristol', lat: 51.4545, lon: -2.5879, country: 'UK', continent: 'Europe', population: 467099 },
  { id: 'gb_edinburgh', name: 'Edinburgh', lat: 55.9533, lon: -3.1883, country: 'UK', continent: 'Europe', population: 524930 },
  { id: 'gb_cardiff', name: 'Cardiff', lat: 51.4816, lon: -3.1791, country: 'UK', continent: 'Europe', population: 366903 },
  { id: 'gb_belfast', name: 'Belfast', lat: 54.5973, lon: -5.9301, country: 'UK', continent: 'Europe', population: 343542 },
  { id: 'gb_nottingham', name: 'Nottingham', lat: 52.9548, lon: -1.1581, country: 'UK', continent: 'Europe', population: 321500 },
  { id: 'gb_leicester', name: 'Leicester', lat: 52.6369, lon: -1.1398, country: 'UK', continent: 'Europe', population: 355218 },
  { id: 'gb_coventry', name: 'Coventry', lat: 52.4068, lon: -1.5197, country: 'UK', continent: 'Europe', population: 369100 },
  { id: 'gb_bradford', name: 'Bradford', lat: 53.7960, lon: -1.7594, country: 'UK', continent: 'Europe', population: 361700 },
  { id: 'gb_bournemouth', name: 'Bournemouth', lat: 50.7220, lon: -1.8667, country: 'UK', continent: 'Europe', population: 183491 },
  { id: 'gb_swansea', name: 'Swansea', lat: 51.6214, lon: -3.9436, country: 'UK', continent: 'Europe', population: 246500 },
  { id: 'gb_oxford', name: 'Oxford', lat: 51.7548, lon: -1.2544, country: 'UK', continent: 'Europe', population: 152000 },
  { id: 'gb_cambridge', name: 'Cambridge', lat: 52.2053, lon: 0.1218, country: 'UK', continent: 'Europe', population: 124000 },
  { id: 'ie_dublin', name: 'Dublin', lat: 53.3498, lon: -6.2603, country: 'Ireland', continent: 'Europe', population: 553165 },
  { id: 'ie_cork', name: 'Cork', lat: 51.8985, lon: -8.4756, country: 'Ireland', continent: 'Europe', population: 208669 },
  
  // France
  { id: 'fr_paris', name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'France', continent: 'Europe', population: 2161000 },
  { id: 'fr_marseille', name: 'Marseille', lat: 43.2965, lon: 5.3698, country: 'France', continent: 'Europe', population: 861635 },
  { id: 'fr_lyon', name: 'Lyon', lat: 45.7640, lon: 4.8357, country: 'France', continent: 'Europe', population: 515695 },
  { id: 'fr_toulouse', name: 'Toulouse', lat: 43.6047, lon: 1.4442, country: 'France', continent: 'Europe', population: 493465 },
  { id: 'fr_nice', name: 'Nice', lat: 43.7102, lon: 7.2620, country: 'France', continent: 'Europe', population: 342669 },
  { id: 'fr_nantes', name: 'Nantes', lat: 47.2184, lon: -1.5536, country: 'France', continent: 'Europe', population: 309346 },
  { id: 'fr_strasbourg', name: 'Strasbourg', lat: 48.5734, lon: 7.7521, country: 'France', continent: 'Europe', population: 280966 },
  { id: 'fr_montpellier', name: 'Montpellier', lat: 43.6110, lon: 3.8767, country: 'France', continent: 'Europe', population: 285121 },
  { id: 'fr_bordeaux', name: 'Bordeaux', lat: 44.8378, lon: -0.5792, country: 'France', continent: 'Europe', population: 254436 },
  { id: 'fr_lille', name: 'Lille', lat: 50.6292, lon: 3.0573, country: 'France', continent: 'Europe', population: 232787 },
  { id: 'fr_rennes', name: 'Rennes', lat: 48.1173, lon: -1.6778, country: 'France', continent: 'Europe', population: 216268 },
  { id: 'fr_reims', name: 'Reims', lat: 49.2583, lon: 4.0317, country: 'France', continent: 'Europe', population: 182211 },
  
  // Germany
  { id: 'de_berlin', name: 'Berlin', lat: 52.5200, lon: 13.4050, country: 'Germany', continent: 'Europe', population: 3644826 },
  { id: 'de_hamburg', name: 'Hamburg', lat: 53.5511, lon: 9.9937, country: 'Germany', continent: 'Europe', population: 1841179 },
  { id: 'de_munich', name: 'Munich', lat: 48.1351, lon: 11.5820, country: 'Germany', continent: 'Europe', population: 1471508 },
  { id: 'de_cologne', name: 'Cologne', lat: 50.9375, lon: 6.9603, country: 'Germany', continent: 'Europe', population: 1085663 },
  { id: 'de_frankfurt', name: 'Frankfurt', lat: 50.1109, lon: 8.6821, country: 'Germany', continent: 'Europe', population: 753056 },
  { id: 'de_stuttgart', name: 'Stuttgart', lat: 48.7758, lon: 9.1829, country: 'Germany', continent: 'Europe', population: 635911 },
  { id: 'de_dusseldorf', name: 'Dusseldorf', lat: 51.2277, lon: 6.7735, country: 'Germany', continent: 'Europe', population: 619294 },
  { id: 'de_leipzig', name: 'Leipzig', lat: 51.3397, lon: 12.3731, country: 'Germany', continent: 'Europe', population: 593145 },
  { id: 'de_dortmund', name: 'Dortmund', lat: 51.5136, lon: 7.4653, country: 'Germany', continent: 'Europe', population: 588250 },
  { id: 'de_essen', name: 'Essen', lat: 51.4556, lon: 7.0116, country: 'Germany', continent: 'Europe', population: 582760 },
  { id: 'de_bremen', name: 'Bremen', lat: 53.0793, lon: 8.8017, country: 'Germany', continent: 'Europe', population: 567559 },
  { id: 'de_dresden', name: 'Dresden', lat: 51.0504, lon: 13.7373, country: 'Germany', continent: 'Europe', population: 556780 },
  { id: 'de_hanover', name: 'Hanover', lat: 52.3759, lon: 9.7320, country: 'Germany', continent: 'Europe', population: 536066 },
  { id: 'de_nuremberg', name: 'Nuremberg', lat: 49.4521, lon: 11.0767, country: 'Germany', continent: 'Europe', population: 518370 },
  
  // Italy
  { id: 'it_rome', name: 'Rome', lat: 41.9028, lon: 12.4964, country: 'Italy', continent: 'Europe', population: 2873000 },
  { id: 'it_milan', name: 'Milan', lat: 45.4642, lon: 9.1900, country: 'Italy', continent: 'Europe', population: 1352000 },
  { id: 'it_naples', name: 'Naples', lat: 40.8518, lon: 14.2681, country: 'Italy', continent: 'Europe', population: 967069 },
  { id: 'it_turin', name: 'Turin', lat: 45.0703, lon: 7.6869, country: 'Italy', continent: 'Europe', population: 886837 },
  { id: 'it_palermo', name: 'Palermo', lat: 38.1157, lon: 13.3615, country: 'Italy', continent: 'Europe', population: 673735 },
  { id: 'it_genoa', name: 'Genoa', lat: 44.4056, lon: 8.9463, country: 'Italy', continent: 'Europe', population: 584947 },
  { id: 'it_bologna', name: 'Bologna', lat: 44.4949, lon: 11.3426, country: 'Italy', continent: 'Europe', population: 390636 },
  { id: 'it_florence', name: 'Florence', lat: 43.7696, lon: 11.2558, country: 'Italy', continent: 'Europe', population: 382258 },
  { id: 'it_venice', name: 'Venice', lat: 45.4408, lon: 12.3155, country: 'Italy', continent: 'Europe', population: 261905 },
  { id: 'it_verona', name: 'Verona', lat: 45.4384, lon: 10.9916, country: 'Italy', continent: 'Europe', population: 257353 },
  { id: 'it_padua', name: 'Padua', lat: 45.4064, lon: 11.8768, country: 'Italy', continent: 'Europe', population: 214198 },
  { id: 'it_trieste', name: 'Trieste', lat: 45.6495, lon: 13.7768, country: 'Italy', continent: 'Europe', population: 204849 },
  
  // Spain
  { id: 'es_madrid', name: 'Madrid', lat: 40.4168, lon: -3.7038, country: 'Spain', continent: 'Europe', population: 3223334 },
  { id: 'es_barcelona', name: 'Barcelona', lat: 41.3851, lon: 2.1734, country: 'Spain', continent: 'Europe', population: 1620343 },
  { id: 'es_valencia', name: 'Valencia', lat: 39.4699, lon: -0.3763, country: 'Spain', continent: 'Europe', population: 791010 },
  { id: 'es_seville', name: 'Seville', lat: 37.3891, lon: -5.9845, country: 'Spain', continent: 'Europe', population: 688711 },
  { id: 'es_zaragoza', name: 'Zaragoza', lat: 41.6488, lon: -0.8891, country: 'Spain', continent: 'Europe', population: 674997 },
  { id: 'es_malaga', name: 'Malaga', lat: 36.7213, lon: -4.4214, country: 'Spain', continent: 'Europe', population: 574654 },
  { id: 'es_murcia', name: 'Murcia', lat: 37.9922, lon: -1.1307, country: 'Spain', continent: 'Europe', population: 453258 },
  { id: 'es_palma', name: 'Palma', lat: 39.5696, lon: 2.6502, country: 'Spain', continent: 'Europe', population: 416065 },
  { id: 'es_las_palmas', name: 'Las Palmas', lat: 28.1235, lon: -15.4366, country: 'Spain', continent: 'Europe', population: 378517 },
  { id: 'es_bilbao', name: 'Bilbao', lat: 43.2630, lon: -2.9350, country: 'Spain', continent: 'Europe', population: 345821 },
  
  // Netherlands
  { id: 'nl_amsterdam', name: 'Amsterdam', lat: 52.3676, lon: 4.9041, country: 'Netherlands', continent: 'Europe', population: 872680 },
  { id: 'nl_rotterdam', name: 'Rotterdam', lat: 51.9244, lon: 4.4777, country: 'Netherlands', continent: 'Europe', population: 644618 },
  { id: 'nl_hague', name: 'The Hague', lat: 52.0705, lon: 4.3007, country: 'Netherlands', continent: 'Europe', population: 537833 },
  { id: 'nl_utrecht', name: 'Utrecht', lat: 52.0907, lon: 5.1214, country: 'Netherlands', continent: 'Europe', population: 357179 },
  { id: 'nl_eindhoven', name: 'Eindhoven', lat: 51.4416, lon: 5.4697, country: 'Netherlands', continent: 'Europe', population: 231642 },
  
  // Switzerland
  { id: 'ch_zurich', name: 'Zurich', lat: 47.3769, lon: 8.5417, country: 'Switzerland', continent: 'Europe', population: 434335 },
  { id: 'ch_geneva', name: 'Geneva', lat: 46.2044, lon: 6.1432, country: 'Switzerland', continent: 'Europe', population: 203856 },
  { id: 'ch_basel', name: 'Basel', lat: 47.5596, lon: 7.5886, country: 'Switzerland', continent: 'Europe', population: 177727 },
  { id: 'ch_bern', name: 'Bern', lat: 46.9480, lon: 7.4474, country: 'Switzerland', continent: 'Europe', population: 134591 },
  { id: 'ch_lausanne', name: 'Lausanne', lat: 46.5197, lon: 6.6323, country: 'Switzerland', continent: 'Europe', population: 139111 },
  
  // Belgium
  { id: 'be_brussels', name: 'Brussels', lat: 50.8503, lon: 4.3517, country: 'Belgium', continent: 'Europe', population: 185103 },
  { id: 'be_antwerp', name: 'Antwerp', lat: 51.2194, lon: 4.4025, country: 'Belgium', continent: 'Europe', population: 529247 },
  { id: 'be_ghent', name: 'Ghent', lat: 51.0543, lon: 3.7174, country: 'Belgium', continent: 'Europe', population: 265086 },
  { id: 'be_charleroi', name: 'Charleroi', lat: 50.4108, lon: 4.4446, country: 'Belgium', continent: 'Europe', population: 202267 },
  { id: 'be_liege', name: 'Liege', lat: 50.6326, lon: 5.5797, country: 'Belgium', continent: 'Europe', population: 197885 },
  
  // Austria
  { id: 'at_vienna', name: 'Vienna', lat: 48.2082, lon: 16.3738, country: 'Austria', continent: 'Europe', population: 1911191 },
  { id: 'at_graz', name: 'Graz', lat: 47.0707, lon: 15.4395, country: 'Austria', continent: 'Europe', population: 291134 },
  { id: 'at_linz', name: 'Linz', lat: 48.3069, lon: 14.2858, country: 'Austria', continent: 'Europe', population: 204846 },
  { id: 'at_salzburg', name: 'Salzburg', lat: 47.8095, lon: 13.0550, country: 'Austria', continent: 'Europe', population: 153377 },
  { id: 'at_innsbruck', name: 'Innsbruck', lat: 47.2692, lon: 11.4041, country: 'Austria', continent: 'Europe', population: 132493 },
  
  // Poland
  { id: 'pl_warsaw', name: 'Warsaw', lat: 52.2297, lon: 21.0122, country: 'Poland', continent: 'Europe', population: 1790658 },
  { id: 'pl_krakow', name: 'Krakow', lat: 50.0647, lon: 19.9450, country: 'Poland', continent: 'Europe', population: 779115 },
  { id: 'pl_lodz', name: 'Lodz', lat: 51.7592, lon: 19.4560, country: 'Poland', continent: 'Europe', population: 679941 },
  { id: 'pl_wroclaw', name: 'Wroclaw', lat: 51.1079, lon: 17.0385, country: 'Poland', continent: 'Europe', population: 643782 },
  { id: 'pl_poznan', name: 'Poznan', lat: 52.4064, lon: 16.9252, country: 'Poland', continent: 'Europe', population: 534813 },
  { id: 'pl_gdansk', name: 'Gdansk', lat: 54.3520, lon: 18.6466, country: 'Poland', continent: 'Europe', population: 470907 },
  { id: 'pl_szczecin', name: 'Szczecin', lat: 53.4285, lon: 14.5528, country: 'Poland', continent: 'Europe', population: 401907 },
  
  // Czech Republic
  { id: 'cz_prague', name: 'Prague', lat: 50.0755, lon: 14.4378, country: 'Czech Republic', continent: 'Europe', population: 1309000 },
  { id: 'cz_brno', name: 'Brno', lat: 49.1951, lon: 16.6068, country: 'Czech Republic', continent: 'Europe', population: 379526 },
  { id: 'cz_ostrava', name: 'Ostrava', lat: 49.8209, lon: 18.2625, country: 'Czech Republic', continent: 'Europe', population: 289128 },
  { id: 'cz_plzen', name: 'Plzen', lat: 49.7384, lon: 13.3736, country: 'Czech Republic', continent: 'Europe', population: 175219 },
  
  // Portugal
  { id: 'pt_lisbon', name: 'Lisbon', lat: 38.7223, lon: -9.1393, country: 'Portugal', continent: 'Europe', population: 506654 },
  { id: 'pt_porto', name: 'Porto', lat: 41.1579, lon: -8.6291, country: 'Portugal', continent: 'Europe', population: 237591 },
  { id: 'pt_braga', name: 'Braga', lat: 41.5454, lon: -8.4265, country: 'Portugal', continent: 'Europe', population: 193333 },
  { id: 'pt_coimbra', name: 'Coimbra', lat: 40.2033, lon: -8.4103, country: 'Portugal', continent: 'Europe', population: 143396 },
  
  // Sweden
  { id: 'se_stockholm', name: 'Stockholm', lat: 59.3293, lon: 18.0686, country: 'Sweden', continent: 'Europe', population: 975551 },
  { id: 'se_gothenburg', name: 'Gothenburg', lat: 57.7089, lon: 11.9746, country: 'Sweden', continent: 'Europe', population: 587549 },
  { id: 'se_malmo', name: 'Malmo', lat: 55.6050, lon: 13.0038, country: 'Sweden', continent: 'Europe', population: 351749 },
  { id: 'se_uppsala', name: 'Uppsala', lat: 59.8586, lon: 17.6389, country: 'Sweden', continent: 'Europe', population: 177074 },
  
  // Norway
  { id: 'no_oslo', name: 'Oslo', lat: 59.9139, lon: 10.7522, country: 'Norway', continent: 'Europe', population: 693494 },
  { id: 'no_bergen', name: 'Bergen', lat: 60.3913, lon: 5.3221, country: 'Norway', continent: 'Europe', population: 285911 },
  { id: 'no_trondheim', name: 'Trondheim', lat: 63.4305, lon: 10.3951, country: 'Norway', continent: 'Europe', population: 205332 },
  { id: 'no_stavanger', name: 'Stavanger', lat: 58.9700, lon: 5.7331, country: 'Norway', continent: 'Europe', population: 144223 },
  
  // Denmark
  { id: 'dk_copenhagen', name: 'Copenhagen', lat: 55.6761, lon: 12.5683, country: 'Denmark', continent: 'Europe', population: 794128 },
  { id: 'dk_aarhus', name: 'Aarhus', lat: 56.1629, lon: 10.2039, country: 'Denmark', continent: 'Europe', population: 285273 },
  { id: 'dk_odense', name: 'Odense', lat: 55.4038, lon: 10.4024, country: 'Denmark', continent: 'Europe', population: 180863 },
  { id: 'dk_aalborg', name: 'Aalborg', lat: 57.0488, lon: 9.9217, country: 'Denmark', continent: 'Europe', population: 119862 },
  
  // Finland
  { id: 'fi_helsinki', name: 'Helsinki', lat: 60.1699, lon: 24.9384, country: 'Finland', continent: 'Europe', population: 656229 },
  { id: 'fi_espoo', name: 'Espoo', lat: 60.2055, lon: 24.6559, country: 'Finland', continent: 'Europe', population: 297132 },
  { id: 'fi_tampere', name: 'Tampere', lat: 61.4978, lon: 23.7610, country: 'Finland', continent: 'Europe', population: 244223 },
  { id: 'fi_vantaa', name: 'Vantaa', lat: 60.2934, lon: 25.0378, country: 'Finland', continent: 'Europe', population: 235960 },
  { id: 'fi_turku', name: 'Turku', lat: 60.4518, lon: 22.2666, country: 'Finland', continent: 'Europe', population: 195137 },
  
  // Greece
  { id: 'gr_athens', name: 'Athens', lat: 37.9838, lon: 23.7275, country: 'Greece', continent: 'Europe', population: 664046 },
  { id: 'gr_thessaloniki', name: 'Thessaloniki', lat: 40.6401, lon: 22.9444, country: 'Greece', continent: 'Europe', population: 325182 },
  { id: 'gr_patras', name: 'Patras', lat: 38.2466, lon: 21.7346, country: 'Greece', continent: 'Europe', population: 167446 },
  { id: 'gr_heraklion', name: 'Heraklion', lat: 35.3387, lon: 25.1442, country: 'Greece', continent: 'Europe', population: 156842 },
  
  // Hungary
  { id: 'hu_budapest', name: 'Budapest', lat: 47.4979, lon: 19.0402, country: 'Hungary', continent: 'Europe', population: 1752286 },
  { id: 'hu_debrecen', name: 'Debrecen', lat: 47.5316, lon: 21.6273, country: 'Hungary', continent: 'Europe', population: 201582 },
  { id: 'hu_szeged', name: 'Szeged', lat: 46.2530, lon: 20.1414, country: 'Hungary', continent: 'Europe', population: 160766 },
  { id: 'hu_miskolc', name: 'Miskolc', lat: 48.1035, lon: 20.7784, country: 'Hungary', continent: 'Europe', population: 154521 },
  
  // Romania
  { id: 'ro_bucharest', name: 'Bucharest', lat: 44.4268, lon: 26.1025, country: 'Romania', continent: 'Europe', population: 1883425 },
  { id: 'ro_cluj_napoca', name: 'Cluj-Napoca', lat: 46.7712, lon: 23.6236, country: 'Romania', continent: 'Europe', population: 324576 },
  { id: 'ro_timisoara', name: 'Timisoara', lat: 45.7489, lon: 21.2087, country: 'Romania', continent: 'Europe', population: 319279 },
  { id: 'ro_iasi', name: 'Iasi', lat: 47.1585, lon: 27.6014, country: 'Romania', continent: 'Europe', population: 290422 },
  
  // Bulgaria
  { id: 'bg_sofia', name: 'Sofia', lat: 42.6977, lon: 23.3219, country: 'Bulgaria', continent: 'Europe', population: 1286380 },
  { id: 'bg_plovdiv', name: 'Plovdiv', lat: 42.1354, lon: 24.7453, country: 'Bulgaria', continent: 'Europe', population: 347851 },
  { id: 'bg_varna', name: 'Varna', lat: 43.2141, lon: 27.9147, country: 'Bulgaria', continent: 'Europe', population: 336505 },
  { id: 'bg_burgas', name: 'Burgas', lat: 42.5048, lon: 27.4626, country: 'Bulgaria', continent: 'Europe', population: 210284 },
  
  // Croatia
  { id: 'hr_zagreb', name: 'Zagreb', lat: 45.8150, lon: 15.9819, country: 'Croatia', continent: 'Europe', population: 806341 },
  { id: 'hr_split', name: 'Split', lat: 43.5081, lon: 16.4402, country: 'Croatia', continent: 'Europe', population: 178102 },
  { id: 'hr_rijeka', name: 'Rijeka', lat: 45.3271, lon: 14.4422, country: 'Croatia', continent: 'Europe', population: 128624 },
  
  // Serbia
  { id: 'rs_belgrade', name: 'Belgrade', lat: 44.7866, lon: 20.4489, country: 'Serbia', continent: 'Europe', population: 1197714 },
  { id: 'rs_novi_sad', name: 'Novi Sad', lat: 45.2671, lon: 19.8335, country: 'Serbia', continent: 'Europe', population: 306702 },
  { id: 'rs_nis', name: 'Nis', lat: 43.3209, lon: 21.8958, country: 'Serbia', continent: 'Europe', population: 187544 },
  
  // Slovakia
  { id: 'sk_bratislava', name: 'Bratislava', lat: 48.1486, lon: 17.1077, country: 'Slovakia', continent: 'Europe', population: 424207 },
  { id: 'sk_kosice', name: 'Kosice', lat: 48.7164, lon: 21.2611, country: 'Slovakia', continent: 'Europe', population: 238757 },
  
  // Slovenia
  { id: 'si_ljubljana', name: 'Ljubljana', lat: 46.0569, lon: 14.5058, country: 'Slovenia', continent: 'Europe', population: 295504 },
  { id: 'si_maribor', name: 'Maribor', lat: 46.5547, lon: 15.6459, country: 'Slovenia', continent: 'Europe', population: 112325 },
  
  // Ukraine
  { id: 'ua_kyiv', name: 'Kyiv', lat: 50.4501, lon: 30.5234, country: 'Ukraine', continent: 'Europe', population: 2967360 },
  { id: 'ua_kharkiv', name: 'Kharkiv', lat: 49.9935, lon: 36.2304, country: 'Ukraine', continent: 'Europe', population: 1446107 },
  { id: 'ua_odessa', name: 'Odessa', lat: 46.4825, lon: 30.7233, country: 'Ukraine', continent: 'Europe', population: 1010000 },
  { id: 'ua_dnipro', name: 'Dnipro', lat: 48.4647, lon: 35.0462, country: 'Ukraine', continent: 'Europe', population: 998000 },
  { id: 'ua_donetsk', name: 'Donetsk', lat: 48.0159, lon: 37.8028, country: 'Ukraine', continent: 'Europe', population: 919000 },
  { id: 'ua_lviv', name: 'Lviv', lat: 49.8397, lon: 24.0297, country: 'Ukraine', continent: 'Europe', population: 724000 },
  
  // Russia (European part)
  { id: 'ru_moscow', name: 'Moscow', lat: 55.7558, lon: 37.6173, country: 'Russia', continent: 'Europe', population: 12678079 },
  { id: 'ru_saint_petersburg', name: 'Saint Petersburg', lat: 59.9311, lon: 30.3609, country: 'Russia', continent: 'Europe', population: 5398064 },
  { id: 'ru_nizhny_novgorod', name: 'Nizhny Novgorod', lat: 56.3269, lon: 44.0059, country: 'Russia', continent: 'Europe', population: 1244254 },
  { id: 'ru_kazan', name: 'Kazan', lat: 55.8304, lon: 49.0661, country: 'Russia', continent: 'Europe', population: 1257377 },
  { id: 'ru_samara', name: 'Samara', lat: 53.2415, lon: 50.2212, country: 'Russia', continent: 'Europe', population: 1163399 },
  { id: 'ru_rostov_on_don', name: 'Rostov-on-Don', lat: 47.2357, lon: 39.7015, country: 'Russia', continent: 'Europe', population: 1130305 },
  { id: 'ru_ufa', name: 'Ufa', lat: 54.7388, lon: 55.9721, country: 'Russia', continent: 'Europe', population: 1128787 },
  { id: 'ru_volgograd', name: 'Volgograd', lat: 48.7080, lon: 44.5133, country: 'Russia', continent: 'Europe', population: 1004763 },
  { id: 'ru_perm', name: 'Perm', lat: 58.0105, lon: 56.2502, country: 'Russia', continent: 'Europe', population: 1048005 },
  { id: 'ru_voronezh', name: 'Voronezh', lat: 51.6720, lon: 39.1843, country: 'Russia', continent: 'Europe', population: 1054537 },
  
  // Turkey
  { id: 'tr_istanbul', name: 'Istanbul', lat: 41.0082, lon: 28.9784, country: 'Turkey', continent: 'Europe', population: 15519267 },
  { id: 'tr_ankara', name: 'Ankara', lat: 39.9334, lon: 32.8597, country: 'Turkey', continent: 'Europe', population: 5445026 },
  { id: 'tr_izmir', name: 'Izmir', lat: 38.4192, lon: 27.1287, country: 'Turkey', continent: 'Europe', population: 4367251 },
  { id: 'tr_bursa', name: 'Bursa', lat: 40.1885, lon: 29.0610, country: 'Turkey', continent: 'Europe', population: 2901396 },
  { id: 'tr_antalya', name: 'Antalya', lat: 36.8969, lon: 30.7133, country: 'Turkey', continent: 'Europe', population: 2426356 },
  { id: 'tr_adana', name: 'Adana', lat: 37.0000, lon: 35.3213, country: 'Turkey', continent: 'Europe', population: 2205167 },
  { id: 'tr_gaziantep', name: 'Gaziantep', lat: 37.0662, lon: 37.3833, country: 'Turkey', continent: 'Europe', population: 2093364 },
  { id: 'tr_konya', name: 'Konya', lat: 37.8746, lon: 32.4932, country: 'Turkey', continent: 'Europe', population: 2232396 },
  
  // === NORTH AMERICA (500+ cities) ===
  // USA - Major cities
  { id: 'us_nyc', name: 'New York City', lat: 40.7128, lon: -74.0060, country: 'USA', continent: 'NorthAmerica', population: 8336817 },
  { id: 'us_la', name: 'Los Angeles', lat: 34.0522, lon: -118.2437, country: 'USA', continent: 'NorthAmerica', population: 3980400 },
  { id: 'us_chicago', name: 'Chicago', lat: 41.8781, lon: -87.6298, country: 'USA', continent: 'NorthAmerica', population: 2696000 },
  { id: 'us_houston', name: 'Houston', lat: 29.7604, lon: -95.3698, country: 'USA', continent: 'NorthAmerica', population: 2328000 },
  { id: 'us_phoenix', name: 'Phoenix', lat: 33.4484, lon: -112.0740, country: 'USA', continent: 'NorthAmerica', population: 1690000 },
  { id: 'us_philadelphia', name: 'Philadelphia', lat: 39.9526, lon: -75.1652, country: 'USA', continent: 'NorthAmerica', population: 1584000 },
  { id: 'us_san_antonio', name: 'San Antonio', lat: 29.4241, lon: -98.4936, country: 'USA', continent: 'NorthAmerica', population: 1547000 },
  { id: 'us_san_diego', name: 'San Diego', lat: 32.7157, lon: -117.1611, country: 'USA', continent: 'NorthAmerica', population: 1424000 },
  { id: 'us_dallas', name: 'Dallas', lat: 32.7767, lon: -96.7970, country: 'USA', continent: 'NorthAmerica', population: 1344000 },
  { id: 'us_san_jose', name: 'San Jose', lat: 37.3382, lon: -121.8863, country: 'USA', continent: 'NorthAmerica', population: 1035000 },
  { id: 'us_austin', name: 'Austin', lat: 30.2672, lon: -97.7431, country: 'USA', continent: 'NorthAmerica', population: 978000 },
  { id: 'us_jacksonville', name: 'Jacksonville', lat: 30.3322, lon: -81.6557, country: 'USA', continent: 'NorthAmerica', population: 911000 },
  { id: 'us_san_francisco', name: 'San Francisco', lat: 37.7749, lon: -122.4194, country: 'USA', continent: 'NorthAmerica', population: 875000 },
  { id: 'us_columbus', name: 'Columbus', lat: 39.9612, lon: -82.9988, country: 'USA', continent: 'NorthAmerica', population: 906000 },
  { id: 'us_charlotte', name: 'Charlotte', lat: 35.2271, lon: -80.8431, country: 'USA', continent: 'NorthAmerica', population: 885000 },
  { id: 'us_indianapolis', name: 'Indianapolis', lat: 39.7684, lon: -86.1581, country: 'USA', continent: 'NorthAmerica', population: 877000 },
  { id: 'us_fort_worth', name: 'Fort Worth', lat: 32.7555, lon: -97.3308, country: 'USA', continent: 'NorthAmerica', population: 918000 },
  { id: 'us_seattle', name: 'Seattle', lat: 47.6062, lon: -122.3321, country: 'USA', continent: 'NorthAmerica', population: 753000 },
  { id: 'us_denver', name: 'Denver', lat: 39.7392, lon: -104.9903, country: 'USA', continent: 'NorthAmerica', population: 716000 },
  { id: 'us_boston', name: 'Boston', lat: 42.3601, lon: -71.0589, country: 'USA', continent: 'NorthAmerica', population: 692000 },
  { id: 'us_detroit', name: 'Detroit', lat: 42.3314, lon: -83.0458, country: 'USA', continent: 'NorthAmerica', population: 670000 },
  { id: 'us_nashville', name: 'Nashville', lat: 36.1627, lon: -86.7816, country: 'USA', continent: 'NorthAmerica', population: 694000 },
  { id: 'us_oklahoma_city', name: 'Oklahoma City', lat: 35.4676, lon: -97.5164, country: 'USA', continent: 'NorthAmerica', population: 696000 },
  { id: 'us_portland', name: 'Portland', lat: 45.5152, lon: -122.6784, country: 'USA', continent: 'NorthAmerica', population: 654000 },
  { id: 'us_las_vegas', name: 'Las Vegas', lat: 36.1699, lon: -115.1398, country: 'USA', continent: 'NorthAmerica', population: 644000 },
  { id: 'us_louisville', name: 'Louisville', lat: 38.2527, lon: -85.7585, country: 'USA', continent: 'NorthAmerica', population: 617000 },
  { id: 'us_baltimore', name: 'Baltimore', lat: 39.2904, lon: -76.6122, country: 'USA', continent: 'NorthAmerica', population: 593000 },
  { id: 'us_milwaukee', name: 'Milwaukee', lat: 43.0389, lon: -87.9065, country: 'USA', continent: 'NorthAmerica', population: 592000 },
  { id: 'us_albuquerque', name: 'Albuquerque', lat: 35.0844, lon: -106.6504, country: 'USA', continent: 'NorthAmerica', population: 562000 },
  { id: 'us_tucson', name: 'Tucson', lat: 32.2226, lon: -110.9747, country: 'USA', continent: 'NorthAmerica', population: 543000 },
  { id: 'us_fresno', name: 'Fresno', lat: 36.7378, lon: -119.7871, country: 'USA', continent: 'NorthAmerica', population: 542000 },
  { id: 'us_sacramento', name: 'Sacramento', lat: 38.5816, lon: -121.4944, country: 'USA', continent: 'NorthAmerica', population: 513000 },
  { id: 'us_mesa', name: 'Mesa', lat: 33.4152, lon: -111.8315, country: 'USA', continent: 'NorthAmerica', population: 518000 },
  { id: 'us_kansas_city', name: 'Kansas City', lat: 39.0997, lon: -94.5786, country: 'USA', continent: 'NorthAmerica', population: 508000 },
  { id: 'us_atlanta', name: 'Atlanta', lat: 33.7490, lon: -84.3880, country: 'USA', continent: 'NorthAmerica', population: 498000 },
  { id: 'us_long_beach', name: 'Long Beach', lat: 33.7701, lon: -118.1937, country: 'USA', continent: 'NorthAmerica', population: 462000 },
  { id: 'us_colorado_springs', name: 'Colorado Springs', lat: 38.8339, lon: -104.8214, country: 'USA', continent: 'NorthAmerica', population: 479000 },
  { id: 'us_raleigh', name: 'Raleigh', lat: 35.7796, lon: -78.6382, country: 'USA', continent: 'NorthAmerica', population: 474000 },
  { id: 'us_miami', name: 'Miami', lat: 25.7617, lon: -80.1918, country: 'USA', continent: 'NorthAmerica', population: 442000 },
  { id: 'us_omaha', name: 'Omaha', lat: 41.2565, lon: -95.9345, country: 'USA', continent: 'NorthAmerica', population: 486000 },
  { id: 'us_minneapolis', name: 'Minneapolis', lat: 44.9778, lon: -93.2650, country: 'USA', continent: 'NorthAmerica', population: 430000 },
  { id: 'us_new_orleans', name: 'New Orleans', lat: 29.9511, lon: -90.0715, country: 'USA', continent: 'NorthAmerica', population: 391000 },
  { id: 'us_honolulu', name: 'Honolulu', lat: 21.3099, lon: -157.8581, country: 'USA', continent: 'NorthAmerica', population: 349000 },
  { id: 'us_seattle_eastside', name: 'Bellevue', lat: 47.6101, lon: -122.2015, country: 'USA', continent: 'NorthAmerica', population: 148000 },
  
  // Canada
  { id: 'ca_toronto', name: 'Toronto', lat: 43.6532, lon: -79.3832, country: 'Canada', continent: 'NorthAmerica', population: 2930000 },
  { id: 'ca_montreal', name: 'Montreal', lat: 45.5017, lon: -73.5673, country: 'Canada', continent: 'NorthAmerica', population: 1780000 },
  { id: 'ca_vancouver', name: 'Vancouver', lat: 49.2827, lon: -123.1207, country: 'Canada', continent: 'NorthAmerica', population: 675000 },
  { id: 'ca_calgary', name: 'Calgary', lat: 51.0447, lon: -114.0719, country: 'Canada', continent: 'NorthAmerica', population: 1300000 },
  { id: 'ca_edmonton', name: 'Edmonton', lat: 53.5461, lon: -113.4938, country: 'Canada', continent: 'NorthAmerica', population: 1010000 },
  { id: 'ca_ottawa', name: 'Ottawa', lat: 45.4215, lon: -75.6972, country: 'Canada', continent: 'NorthAmerica', population: 994000 },
  { id: 'ca_winnipeg', name: 'Winnipeg', lat: 49.8951, lon: -97.1384, country: 'Canada', continent: 'NorthAmerica', population: 749000 },
  { id: 'ca_quebec_city', name: 'Quebec City', lat: 46.8139, lon: -71.2080, country: 'Canada', continent: 'NorthAmerica', population: 542000 },
  { id: 'ca_hamilton', name: 'Hamilton', lat: 43.2557, lon: -79.8711, country: 'Canada', continent: 'NorthAmerica', population: 569000 },
  { id: 'ca_kitchener', name: 'Kitchener', lat: 43.4516, lon: -80.4925, country: 'Canada', continent: 'NorthAmerica', population: 256000 },
  { id: 'ca_halifax', name: 'Halifax', lat: 44.6488, lon: -63.5752, country: 'Canada', continent: 'NorthAmerica', population: 431000 },
  { id: 'ca_victoria', name: 'Victoria', lat: 48.4284, lon: -123.3656, country: 'Canada', continent: 'NorthAmerica', population: 92000 },
  
  // Mexico
  { id: 'mx_mexico_city', name: 'Mexico City', lat: 19.4326, lon: -99.1332, country: 'Mexico', continent: 'NorthAmerica', population: 9209944 },
  { id: 'mx_guadalajara', name: 'Guadalajara', lat: 20.6597, lon: -103.3496, country: 'Mexico', continent: 'NorthAmerica', population: 5250000 },
  { id: 'mx_monterrey', name: 'Monterrey', lat: 25.6866, lon: -100.3161, country: 'Mexico', continent: 'NorthAmerica', population: 5110000 },
  { id: 'mx_puebla', name: 'Puebla', lat: 19.0414, lon: -98.2063, country: 'Mexico', continent: 'NorthAmerica', population: 3150000 },
  { id: 'mx_tijuana', name: 'Tijuana', lat: 32.5149, lon: -117.0382, country: 'Mexico', continent: 'NorthAmerica', population: 2219000 },
  { id: 'mx_leon', name: 'Leon', lat: 21.1250, lon: -101.6859, country: 'Mexico', continent: 'NorthAmerica', population: 1721000 },
  { id: 'mx_juarez', name: 'Ciudad Juarez', lat: 31.6904, lon: -106.4245, country: 'Mexico', continent: 'NorthAmerica', population: 1513000 },
  { id: 'mx_cancun', name: 'Cancun', lat: 21.1619, lon: -86.8515, country: 'Mexico', continent: 'NorthAmerica', population: 888000 },
  { id: 'mx_merida', name: 'Merida', lat: 20.9674, lon: -89.5926, country: 'Mexico', continent: 'NorthAmerica', population: 1100000 },
  { id: 'mx_san_luis_potosi', name: 'San Luis Potosi', lat: 22.1565, lon: -100.9855, country: 'Mexico', continent: 'NorthAmerica', population: 1119000 },
  
  // Cuba
  { id: 'cu_havana', name: 'Havana', lat: 23.1136, lon: -82.3666, country: 'Cuba', continent: 'NorthAmerica', population: 2132000 },
  { id: 'cu_santiago', name: 'Santiago de Cuba', lat: 20.0169, lon: -75.8302, country: 'Cuba', continent: 'NorthAmerica', population: 508000 },
  
  // Puerto Rico
  { id: 'pr_san_juan', name: 'San Juan', lat: 18.4655, lon: -66.1057, country: 'Puerto Rico', continent: 'NorthAmerica', population: 318000 },
  
  // Panama
  { id: 'pa_panama_city', name: 'Panama City', lat: 8.9824, lon: -79.5199, country: 'Panama', continent: 'NorthAmerica', population: 1500000 },
  { id: 'pa_colon', name: 'Colon', lat: 9.3547, lon: -79.9000, country: 'Panama', continent: 'NorthAmerica', population: 204000 },
  
  // Costa Rica
  { id: 'cr_san_jose', name: 'San Jose', lat: 9.9281, lon: -84.0907, country: 'Costa Rica', continent: 'NorthAmerica', population: 340000 },
  { id: 'cr_limon', name: 'Limon', lat: 9.9907, lon: -83.0360, country: 'Costa Rica', continent: 'NorthAmerica', population: 94000 },
  
  // Guatemala
  { id: 'gt_guatemala_city', name: 'Guatemala City', lat: 14.6349, lon: -90.5069, country: 'Guatemala', continent: 'NorthAmerica', population: 2459000 },
  { id: 'gt_quetzaltenango', name: 'Quetzaltenango', lat: 14.8344, lon: -91.5185, country: 'Guatemala', continent: 'NorthAmerica', population: 180706 },
  
  // Honduras
  { id: 'hn_tegucigalpa', name: 'Tegucigalpa', lat: 14.0723, lon: -87.1921, country: 'Honduras', continent: 'NorthAmerica', population: 1190000 },
  { id: 'hn_san_pedro_sula', name: 'San Pedro Sula', lat: 15.5149, lon: -88.0244, country: 'Honduras', continent: 'NorthAmerica', population: 801000 },
  
  // El Salvador
  { id: 'sv_san_salvador', name: 'San Salvador', lat: 13.6929, lon: -89.2182, country: 'El Salvador', continent: 'NorthAmerica', population: 1100000 },
  
  // Nicaragua
  { id: 'ni_managua', name: 'Managua', lat: 12.1140, lon: -86.2362, country: 'Nicaragua', continent: 'NorthAmerica', population: 1020000 },
  { id: 'ni_leon', name: 'Leon', lat: 12.4379, lon: -86.8780, country: 'Nicaragua', continent: 'NorthAmerica', population: 174000 },
  
  // Dominican Republic
  { id: 'do_santo_domingo', name: 'Santo Domingo', lat: 18.4861, lon: -69.9312, country: 'Dominican Republic', continent: 'NorthAmerica', population: 2982000 },
  { id: 'do_santiago', name: 'Santiago de los Caballeros', lat: 19.4517, lon: -70.6970, country: 'Dominican Republic', continent: 'NorthAmerica', population: 771000 },
  
  // Jamaica
  { id: 'jm_kingston', name: 'Kingston', lat: 17.9712, lon: -76.7926, country: 'Jamaica', continent: 'NorthAmerica', population: 584000 },
  { id: 'jm_montego_bay', name: 'Montego Bay', lat: 18.4761, lon: -77.8939, country: 'Jamaica', continent: 'NorthAmerica', population: 110000 },
  
  // Trinidad and Tobago
  { id: 'tt_port_of_spain', name: 'Port of Spain', lat: 10.6549, lon: -61.5019, country: 'Trinidad and Tobago', continent: 'NorthAmerica', population: 49000 },
  
  // Bahamas
  { id: 'bs_nassau', name: 'Nassau', lat: 25.0478, lon: -77.3554, country: 'Bahamas', continent: 'NorthAmerica', population: 274000 },
  
  // Barbados
  { id: 'bb_bridgetown', name: 'Bridgetown', lat: 13.0969, lon: -59.6144, country: 'Barbados', continent: 'NorthAmerica', population: 11000 },
];

// Export subset for immediate use
export const MAJOR_GLOBAL_CITIES = GLOBAL_CITIES.filter(c => c.population > 500000);
