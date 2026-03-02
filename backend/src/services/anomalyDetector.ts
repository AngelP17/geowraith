/**
 * Anomaly Detection Service
 * Detects hotspots near predicted locations using NASA FIRMS, ACLED, etc.
 * 
 * API Integrations:
 * - NASA FIRMS (Fire Information for Resource Management System): https://firms.modaps.eosdis.nasa.gov/
 * - ACLED (Armed Conflict Location & Event Data): https://acleddata.com/
 * 
 * Fallback: Hardcoded hotspot data for demo/offline mode
 */

import { config } from '../config.js';

export interface Hotspot {
  type: 'fire' | 'protest' | 'conflict' | 'military';
  lat: number;
  lon: number;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  description?: string;
  source?: string;
}

export interface AnomalyResult {
  hasAnomaly: boolean;
  signals: Hotspot[];
  message?: string;
  dataSource: 'live' | 'cached' | 'fallback' | 'disabled';
}

interface Location {
  lat: number;
  lon: number;
}

// Cache for API responses to respect rate limits
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const apiCache = new Map<string, CacheEntry<Hotspot[]>>();

// NASA FIRMS API configuration
const FIRMS_CONFIG = {
  get apiKey() { return process.env.NASA_FIRMS_API_KEY; },
  baseUrl: 'https://firms.modaps.eosdis.nasa.gov/api/area/csv',
  // Map source parameter to dataset
  datasets: {
    viirs: 'VIIRS_NOAA20_NRT',  // VIIRS NOAA-20 Near Real Time
    modis: 'MODIS_NRT',          // MODIS Near Real Time
    landset: 'LANDSAT_NRT',      // Landsat Near Real Time
  },
  // Rate limit: 10 requests per minute for free tier (5000 req/10min actual)
  rateLimitMs: 6000,
  lastRequestTime: 0,
};

// ACLED API configuration
const ACLED_CONFIG = {
  apiKey: process.env.ACLED_API_KEY,
  email: process.env.ACLED_EMAIL,
  baseUrl: 'https://api.acleddata.com/acled/read',
  // Rate limit: 1 request per 3 seconds for free tier
  rateLimitMs: 3100,
  lastRequestTime: 0,
};

/**
 * Calculate distance between two coordinates using Haversine formula.
 */
function haversineDistance(loc1: Location, loc2: Location): number {
  const R = 6371; // Earth radius in km
  const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const dLon = ((loc2.lon - loc1.lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.lat * Math.PI) / 180) *
      Math.cos((loc2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get cached data if valid, otherwise return null.
 */
function getCachedData<T>(key: string): T | null {
  const entry = apiCache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > entry.ttlMs) {
    apiCache.delete(key);
    return null;
  }
  return entry.data as T;
}

/**
 * Store data in cache.
 */
function setCachedData<T>(key: string, data: T, ttlMinutes: number): void {
  apiCache.set(key, {
    data: data as unknown as Hotspot[],
    timestamp: Date.now(),
    ttlMs: ttlMinutes * 60 * 1000,
  });
}

/**
 * Rate limit helper - waits if necessary before making request.
 */
async function rateLimit(config: { lastRequestTime: number; rateLimitMs: number }): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - config.lastRequestTime;
  if (timeSinceLastRequest < config.rateLimitMs) {
    await new Promise(resolve => setTimeout(resolve, config.rateLimitMs - timeSinceLastRequest));
  }
  config.lastRequestTime = Date.now();
}

/**
 * Parse FIRMS CSV response to hotspots.
 */
function parseFirmsCsv(csvText: string): Hotspot[] {
  const hotspots: Hotspot[] = [];
  const lines = csvText.trim().split('\n');
  
  if (lines.length < 2) return hotspots;
  
  // Header: latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,confidence,version,bright_ti5,frp,daynight
  const headers = lines[0].split(',');
  const latIdx = headers.indexOf('latitude');
  const lonIdx = headers.indexOf('longitude');
  const dateIdx = headers.indexOf('acq_date');
  const confIdx = headers.indexOf('confidence');
  const frpIdx = headers.indexOf('frp'); // Fire Radiative Power
  
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 3) continue;
    
    const lat = parseFloat(cols[latIdx]);
    const lon = parseFloat(cols[lonIdx]);
    const confidence = cols[confIdx] || 'n';
    const frp = parseFloat(cols[frpIdx]) || 0;
    
    // Map confidence to severity
    let severity: 'low' | 'medium' | 'high' = 'low';
    if (confidence === 'h' || frp > 50) severity = 'high';
    else if (confidence === 'n' || frp > 10) severity = 'medium';
    
    hotspots.push({
      type: 'fire',
      lat,
      lon,
      timestamp: new Date(cols[dateIdx] || Date.now()),
      severity,
      description: `Fire detected (FRP: ${frp.toFixed(1)} MW, confidence: ${confidence})`,
      source: 'NASA FIRMS',
    });
  }
  
  return hotspots;
}

/**
 * Fetch recent fire data from NASA FIRMS API.
 * Falls back to cached or hardcoded data on failure.
 * 
 * API Docs: https://firms.modaps.eosdis.nasa.gov/api/
 */
async function fetchRecentFires(location: Location, radiusKm: number): Promise<Hotspot[]> {
  const cacheKey = `fires:${location.lat.toFixed(2)}:${location.lon.toFixed(2)}:${Math.round(radiusKm)}`;
  
  // Check cache first
  const cached = getCachedData<Hotspot[]>(cacheKey);
  if (cached) {
    console.log('[AnomalyDetector] Using cached FIRMS data');
    return cached;
  }
  
  // If no API key, skip to fallback
  if (!FIRMS_CONFIG.apiKey) {
    console.log('[AnomalyDetector] NASA FIRMS API key not configured, using fallback data');
    return fetchFallbackFires(location, radiusKm);
  }
  
  try {
    // Rate limit before request
    await rateLimit(FIRMS_CONFIG);
    
    // Calculate bounding box (approximate for radius)
    // FIRMS API expects: west,south,east,north (minLon,minLat,maxLon,maxLat)
    const latDelta = radiusKm / 111;
    const lonDelta = radiusKm / (111 * Math.cos((location.lat * Math.PI) / 180));
    
    const minLat = Math.max(-90, location.lat - latDelta);
    const maxLat = Math.min(90, location.lat + latDelta);
    const minLon = location.lon - lonDelta;
    const maxLon = location.lon + lonDelta;
    
    const bbox = `${minLon},${minLat},${maxLon},${maxLat}`;
    const days = 5; // Last 5 days (max allowed for free tier)
    
    const url = `${FIRMS_CONFIG.baseUrl}/${FIRMS_CONFIG.apiKey}/${FIRMS_CONFIG.datasets.viirs}/${bbox}/${days}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'text/csv' },
    });
    
    if (!response.ok) {
      throw new Error(`FIRMS API error: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    const hotspots = parseFirmsCsv(csvText);
    
    // Cache successful response for 15 minutes
    setCachedData(cacheKey, hotspots, 15);
    
    console.log(`[AnomalyDetector] FIRMS API returned ${hotspots.length} fire detections`);
    return hotspots;
    
  } catch (error) {
    console.error('[AnomalyDetector] FIRMS API failed:', error instanceof Error ? error.message : error);
    console.log('[AnomalyDetector] Falling back to hardcoded fire data');
    return fetchFallbackFires(location, radiusKm);
  }
}

/**
 * Fallback fire data when API is unavailable.
 */
function fetchFallbackFires(location: Location, radiusKm: number): Hotspot[] {
  const hotspots: Hotspot[] = [];
  
  // Known fire-prone regions (simplified for demo/offline mode)
  const fireRegions = [
    { lat: -34.0, lon: 18.5, region: 'Cape Town', severity: 'medium' as const },
    { lat: -22.9, lon: -43.2, region: 'Rio de Janeiro', severity: 'low' as const },
    { lat: 31.6, lon: -7.9, region: 'Marrakech', severity: 'low' as const },
    { lat: 37.8, lon: -122.4, region: 'San Francisco Bay Area', severity: 'high' as const },
    { lat: -33.9, lon: 151.2, region: 'Sydney', severity: 'medium' as const },
    { lat: 35.7, lon: -97.5, region: 'Oklahoma', severity: 'medium' as const },
    { lat: 48.9, lon: 2.3, region: 'Paris', severity: 'low' as const },
  ];
  
  for (const region of fireRegions) {
    const distance = haversineDistance(location, region);
    if (distance <= radiusKm) {
      hotspots.push({
        type: 'fire',
        lat: region.lat,
        lon: region.lon,
        timestamp: new Date(),
        severity: region.severity,
        description: `Fire activity near ${region.region} (fallback data)`,
        source: 'fallback',
      });
    }
  }
  
  return hotspots;
}

/**
 * Parse ACLED API response to hotspots.
 */
function parseAcledResponse(data: unknown): Hotspot[] {
  const hotspots: Hotspot[] = [];
  
  if (!data || typeof data !== 'object' || !('data' in data)) {
    return hotspots;
  }
  
  const events = (data as { data: unknown[] }).data;
  if (!Array.isArray(events)) return hotspots;
  
  for (const event of events) {
    if (typeof event !== 'object' || event === null) continue;
    
    const e = event as Record<string, unknown>;
    const lat = parseFloat(e.latitude as string);
    const lon = parseFloat(e.longitude as string);
    
    if (isNaN(lat) || isNaN(lon)) continue;
    
    // Map event type to severity
    const eventType = (e.event_type as string || '').toLowerCase();
    const subEventType = (e.sub_event_type as string || '').toLowerCase();
    
    let severity: 'low' | 'medium' | 'high' = 'low';
    let type: Hotspot['type'] = 'protest';
    
    if (eventType.includes('violence') || eventType.includes('battle')) {
      severity = 'high';
      type = 'conflict';
    } else if (subEventType.includes('arrest') || subEventType.includes('force')) {
      severity = 'medium';
    }
    
    const description = e.notes as string || `${eventType} - ${subEventType}`;
    
    hotspots.push({
      type,
      lat,
      lon,
      timestamp: new Date(e.event_date as string || Date.now()),
      severity,
      description: description.substring(0, 200),
      source: 'ACLED',
    });
  }
  
  return hotspots;
}

/**
 * Fetch recent conflict/protest data from ACLED API.
 * Falls back to cached or hardcoded data on failure.
 * 
 * API Docs: https://acleddata.com/acled-datanexusbulk-data-portal/
 */
async function fetchRecentConflicts(location: Location, radiusKm: number): Promise<Hotspot[]> {
  const cacheKey = `conflicts:${location.lat.toFixed(2)}:${location.lon.toFixed(2)}:${Math.round(radiusKm)}`;
  
  // Check cache first
  const cached = getCachedData<Hotspot[]>(cacheKey);
  if (cached) {
    console.log('[AnomalyDetector] Using cached ACLED data');
    return cached;
  }
  
  // If no API credentials, skip to fallback
  if (!ACLED_CONFIG.apiKey || !ACLED_CONFIG.email) {
    console.log('[AnomalyDetector] ACLED API credentials not configured, using fallback data');
    return fetchFallbackConflicts(location, radiusKm);
  }
  
  try {
    // Rate limit before request
    await rateLimit(ACLED_CONFIG);
    
    // Calculate date range (last 30 days)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Calculate bounding box
    const latDelta = radiusKm / 111;
    const lonDelta = radiusKm / (111 * Math.cos(location.lat * Math.PI / 180));
    
    const params = new URLSearchParams({
      key: ACLED_CONFIG.apiKey,
      email: ACLED_CONFIG.email,
      start_date: startDate,
      end_date: endDate,
      bbox: `${location.lon - lonDelta}|${location.lat - latDelta}|${location.lon + lonDelta}|${location.lat + latDelta}`,
      limit: '100',
    });
    
    const response = await fetch(`${ACLED_CONFIG.baseUrl}?${params.toString()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`ACLED API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const hotspots = parseAcledResponse(data);
    
    // Cache successful response for 1 hour (ACLED updates daily)
    setCachedData(cacheKey, hotspots, 60);
    
    console.log(`[AnomalyDetector] ACLED API returned ${hotspots.length} conflict events`);
    return hotspots;
    
  } catch (error) {
    console.error('[AnomalyDetector] ACLED API failed:', error instanceof Error ? error.message : error);
    console.log('[AnomalyDetector] Falling back to hardcoded conflict data');
    return fetchFallbackConflicts(location, radiusKm);
  }
}

/**
 * Fallback conflict data when API is unavailable.
 */
function fetchFallbackConflicts(location: Location, radiusKm: number): Hotspot[] {
  const hotspots: Hotspot[] = [];
  
  // Known conflict zones (simplified for demo/offline mode)
  const conflictZones = [
    { lat: 31.6, lon: -7.9, region: 'Morocco', severity: 'low' as const },
    { lat: 50.4, lon: 30.5, region: 'Ukraine', severity: 'high' as const },
    { lat: 33.9, lon: 35.5, region: 'Lebanon', severity: 'high' as const },
    { lat: 31.5, lon: 34.5, region: 'Gaza', severity: 'high' as const },
    { lat: 15.0, lon: 30.0, region: 'Sudan', severity: 'high' as const },
    { lat: 19.4, lon: -72.3, region: 'Haiti', severity: 'medium' as const },
    { lat: 6.5, lon: 20.0, region: 'CAR', severity: 'medium' as const },
  ];
  
  for (const zone of conflictZones) {
    const distance = haversineDistance(location, zone);
    if (distance <= radiusKm) {
      hotspots.push({
        type: 'conflict',
        lat: zone.lat,
        lon: zone.lon,
        timestamp: new Date(),
        severity: zone.severity,
        description: `Political activity in ${zone.region} (fallback data)`,
        source: 'fallback',
      });
    }
  }
  
  return hotspots;
}

/**
 * Military facility database (sourced from public sources).
 * In production, this could be replaced with a GeoJSON feed.
 */
const MILITARY_BASES = [
  { lat: -34.0, lon: 18.5, name: 'Ysterplaat AFB', country: 'South Africa' },
  { lat: -22.9, lon: -43.2, name: 'Rio Naval Base', country: 'Brazil' },
  { lat: 38.9, lon: -77.0, name: 'The Pentagon', country: 'USA' },
  { lat: 51.5, lon: -0.4, name: 'British MOD', country: 'UK' },
  { lat: 48.9, lon: 2.4, name: 'French Defence Ministry', country: 'France' },
  { lat: 35.7, lon: 139.7, name: 'Ichigaya Base', country: 'Japan' },
  { lat: 55.8, lon: 37.6, name: 'Russian MoD', country: 'Russia' },
  { lat: 39.9, lon: 116.4, name: 'Chinese MoD', country: 'China' },
  { lat: 28.6, lon: 77.2, name: 'Indian MoD', country: 'India' },
];

/**
 * Fetch military activity data.
 * Currently uses static database - could be replaced with live intel feeds.
 */
async function fetchMilitaryActivity(location: Location, radiusKm: number): Promise<Hotspot[]> {
  const hotspots: Hotspot[] = [];
  
  for (const base of MILITARY_BASES) {
    const distance = haversineDistance(location, base);
    if (distance <= radiusKm) {
      hotspots.push({
        type: 'military',
        lat: base.lat,
        lon: base.lon,
        timestamp: new Date(),
        severity: 'low',
        description: `Military facility: ${base.name}, ${base.country}`,
        source: 'database',
      });
    }
  }
  
  return hotspots;
}

/**
 * Detect anomalies near a predicted location.
 * Aggregates signals from multiple sources with live API priority.
 * 
 * Data Source Priority:
 * 1. Live APIs (FIRMS, ACLED) - if configured
 * 2. Cached data - if available and not expired
 * 3. Fallback hardcoded data - for demo/offline mode
 * 
 * @param location - Predicted lat/lon
 * @param radiusKm - Search radius (default 50km)
 * @returns Anomaly detection result with data source indicator
 */
export async function detectNearbyAnomalies(
  location: Location,
  radiusKm: number = 50
): Promise<AnomalyResult> {
  if (!config.enableAnomalyDetection) {
    return { hasAnomaly: false, signals: [], dataSource: 'disabled' };
  }
  
  try {
    // Fetch signals from multiple sources in parallel
    const [fires, conflicts, military] = await Promise.all([
      fetchRecentFires(location, radiusKm),
      fetchRecentConflicts(location, radiusKm),
      fetchMilitaryActivity(location, radiusKm),
    ]);
    
    const allSignals = [...fires, ...conflicts, ...military];
    
    // Determine data source quality
    let dataSource: AnomalyResult['dataSource'] = 'fallback';
    const hasLiveData = allSignals.some(s => s.source === 'NASA FIRMS' || s.source === 'ACLED');
    const hasCachedData = allSignals.some(s => s.source === 'cached');
    
    if (hasLiveData) dataSource = 'live';
    else if (hasCachedData) dataSource = 'cached';
    
    // Determine severity based on signal count and types
    const highSeverityCount = allSignals.filter((s) => s.severity === 'high').length;
    
    // Alert threshold: 3+ signals or 1+ high severity
    const hasAnomaly = allSignals.length >= 3 || highSeverityCount >= 1;
    
    let message: string | undefined;
    if (hasAnomaly) {
      if (highSeverityCount > 0) {
        message = `⚠️ High-activity zone — ${highSeverityCount} critical signal(s) detected within ${radiusKm}km`;
      } else if (allSignals.length >= 5) {
        message = `⚠️ High-activity zone — ${allSignals.length} signals detected in last 24h within ${radiusKm}km`;
      } else {
        message = `ℹ️ Activity detected — ${allSignals.length} signal(s) within ${radiusKm}km`;
      }
    }
    
    return {
      hasAnomaly,
      signals: allSignals,
      message,
      dataSource,
    };
  } catch (error) {
    console.error('[AnomalyDetector] Detection failed:', error);
    return { hasAnomaly: false, signals: [], dataSource: 'disabled' };
  }
}

/**
 * Get anomaly alert level for UI display.
 */
export function getAlertLevel(signals: Hotspot[]): 'none' | 'low' | 'medium' | 'high' {
  if (signals.length === 0) return 'none';
  
  const hasHigh = signals.some((s) => s.severity === 'high');
  if (hasHigh) return 'high';
  
  const hasMedium = signals.some((s) => s.severity === 'medium');
  if (hasMedium || signals.length >= 5) return 'medium';
  
  return 'low';
}

/**
 * Clear all API caches (useful for testing or when API keys change).
 */
export function clearAnomalyCache(): void {
  apiCache.clear();
  console.log('[AnomalyDetector] API cache cleared');
}

/**
 * Get cache statistics for monitoring.
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: apiCache.size,
    keys: Array.from(apiCache.keys()),
  };
}
