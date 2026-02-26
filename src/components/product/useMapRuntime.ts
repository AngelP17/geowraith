import { useCallback, useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from 'react';
import maplibregl from 'maplibre-gl';
import type { PredictResponse } from '../../lib/api';
import { registerCachedProtocol, unregisterCachedProtocol } from '../../lib/offlineProtocol';
import { getTileCache, type TileCacheStats } from '../../lib/tileCache';
import { fallbackStyle, offlineStyle, satelliteStyle, standardStyle, type BaseMapStyle, type MapStyle } from './mapStyles';
import type { ViewState } from './types';
const DEFAULT_CENTER = { lat: 20, lon: 0 };
function hasValidLocation(location: { lat: number; lon: number } | null | undefined): location is { lat: number; lon: number } {
  return Boolean(location && Number.isFinite(location.lat) && Number.isFinite(location.lon));
}
function resolveStyle(baseStyle: BaseMapStyle) {
  switch (baseStyle) {
    case 'satellite':
      return satelliteStyle;
    case 'offline':
      return offlineStyle;
    case 'fallback':
      return fallbackStyle;
    default:
      return standardStyle;
  }
}
interface UseMapRuntimeResult {
  mapContainer: RefObject<HTMLDivElement | null>;
  activeStyle: MapStyle;
  setActiveStyle: Dispatch<SetStateAction<MapStyle>>;
  showStyleMenu: boolean;
  setShowStyleMenu: Dispatch<SetStateAction<boolean>>;
  is3D: boolean;
  viewState: ViewState;
  mapLoaded: boolean;
  mapError: string | null;
  mapWarning: string | null;
  isOffline: boolean;
  cacheStats: TileCacheStats | null;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onToggle3D: () => void;
}
export function useMapRuntime(result: PredictResponse | null): UseMapRuntimeResult {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const tileWatchdogRef = useRef<number | null>(null);
  const lastLocationRef = useRef<{ lat: number; lon: number } | null>(null);
  const baseStyleRef = useRef<BaseMapStyle>('standard');
  const styleSwitchInFlightRef = useRef(false);
  const queuedStyleRef = useRef<{ baseStyle: BaseMapStyle; nextIs3D: boolean } | null>(null);
  const is3DRef = useRef(false);
  const [activeStyle, setActiveStyle] = useState<MapStyle>('standard');
  const [is3D, setIs3D] = useState(false);
  const [viewState, setViewState] = useState<ViewState>({ zoom: 2, pitch: 0, bearing: 0 });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapWarning, setMapWarning] = useState<string | null>(null);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [cacheStats, setCacheStats] = useState<TileCacheStats | null>(null);
  const detectWebGLSupport = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  }, []);
  const clearTileWatchdog = useCallback(() => {
    if (typeof window === 'undefined' || tileWatchdogRef.current === null) return;
    window.clearTimeout(tileWatchdogRef.current);
    tileWatchdogRef.current = null;
  }, []);
  const loadCacheStats = useCallback(() => {
    getTileCache().getStats().then(setCacheStats).catch((error) => {
      // eslint-disable-next-line no-console
      console.warn('[MapView] failed to read tile cache stats', error);
    });
  }, []);
  const apply3D = useCallback((enable: boolean) => {
    if (!map.current) return;
    map.current.easeTo({ pitch: enable ? 60 : 0, bearing: 0, duration: 900 });
    is3DRef.current = enable;
    setIs3D(enable);
  }, []);
  const updateMarkerAndFly = useCallback((location: { lat: number; lon: number }) => {
    if (!map.current) return;
    if (!hasValidLocation(location)) {
      setMapError('Invalid coordinates returned by inference. Unable to render map target.');
      return;
    }
    lastLocationRef.current = location;
    if (!marker.current) {
      const el = document.createElement('div');
      el.className = 'relative';
      el.innerHTML = '<div class="relative flex items-center justify-center"><div class="absolute w-8 h-8 bg-amber-500/30 rounded-full animate-ping"></div><div class="absolute w-4 h-4 bg-amber-500/50 rounded-full animate-pulse"></div><div class="relative w-3 h-3 bg-amber-400 rounded-full border-2 border-white shadow-lg"></div></div>';
      marker.current = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([location.lon, location.lat]).addTo(map.current);
    } else {
      marker.current.setLngLat([location.lon, location.lat]);
    }
    map.current.resize();
    map.current.flyTo({ center: [location.lon, location.lat], zoom: 16, pitch: is3DRef.current ? 60 : 0, bearing: 0, duration: 1800, essential: true });
  }, []);
  const activateFallbackStyle = useCallback(() => {
    if (!map.current || baseStyleRef.current === 'fallback') return;
    marker.current?.remove();
    marker.current = null;
    map.current.setStyle(fallbackStyle);
    baseStyleRef.current = 'fallback';
    map.current.once('style.load', () => {
      const last = lastLocationRef.current;
      if (last) updateMarkerAndFly(last);
      apply3D(is3DRef.current);
    });
  }, [apply3D, updateMarkerAndFly]);
  const scheduleTileWatchdog = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (baseStyleRef.current !== 'standard' && baseStyleRef.current !== 'satellite') {
      clearTileWatchdog();
      return;
    }
    clearTileWatchdog();
    tileWatchdogRef.current = window.setTimeout(() => {
      if (!map.current || map.current.areTilesLoaded()) return;
      setMapWarning('Tile provider timeout. Using local fallback basemap.');
      activateFallbackStyle();
      // eslint-disable-next-line no-console
      console.warn('[MapView] tiles did not load within watchdog window');
    }, 5000);
  }, [activateFallbackStyle, clearTileWatchdog]);
  const runBaseStyleSwitch = useCallback((baseStyle: BaseMapStyle, nextIs3D: boolean) => {
    if (!map.current) return;
    styleSwitchInFlightRef.current = true;
    marker.current?.remove();
    marker.current = null;
    map.current.setStyle(resolveStyle(baseStyle));
    baseStyleRef.current = baseStyle;
    map.current.once('style.load', () => {
      styleSwitchInFlightRef.current = false;
      if (baseStyle === 'standard' || baseStyle === 'satellite') scheduleTileWatchdog();
      else clearTileWatchdog();
      const last = lastLocationRef.current;
      if (last) updateMarkerAndFly(last);
      apply3D(nextIs3D);
      const queued = queuedStyleRef.current;
      queuedStyleRef.current = null;
      if (!queued) return;
      if (queued.baseStyle !== baseStyle) runBaseStyleSwitch(queued.baseStyle, queued.nextIs3D);
      else apply3D(queued.nextIs3D);
    });
  }, [apply3D, clearTileWatchdog, scheduleTileWatchdog, updateMarkerAndFly]);
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    if (!detectWebGLSupport()) {
      setMapError('WebGL is unavailable in this environment. Map preview is disabled.');
      return;
    }
    registerCachedProtocol();
    const initialOffline = !navigator.onLine;
    setIsOffline(initialOffline);
    if (initialOffline) {
      baseStyleRef.current = 'offline';
      setMapWarning('Offline mode active. Rendering cached map tiles when available.');
    }
    const handleOnline = () => {
      setIsOffline(false);
      setMapWarning(null);
      loadCacheStats();
    };
    const handleOffline = () => {
      setIsOffline(true);
      setMapWarning('Offline mode active. Rendering cached map tiles when available.');
      loadCacheStats();
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    loadCacheStats();
    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: resolveStyle(initialOffline ? 'offline' : 'standard'),
        center: [DEFAULT_CENTER.lon, DEFAULT_CENTER.lat],
        zoom: 2,
        pitch: 0,
        bearing: 0,
        attributionControl: { compact: true },
        maxPitch: 85,
      });
      map.current.on('load', () => {
        setMapLoaded(true);
        setMapError(null);
        if (!initialOffline) setMapWarning(null);
        scheduleTileWatchdog();
      });
      map.current.on('style.load', () => scheduleTileWatchdog());
      map.current.on('idle', clearTileWatchdog);
      map.current.on('move', () => {
        if (!map.current) return;
        setViewState({ zoom: map.current.getZoom(), pitch: map.current.getPitch(), bearing: map.current.getBearing() });
      });
      map.current.on('error', (event) => {
        const message = event.error instanceof Error ? event.error.message : 'Unknown map runtime error';
        const normalized = message.toLowerCase();
        if (normalized.includes('tile') || normalized.includes('source') || normalized.includes('failed to load')) {
          setMapWarning('Map source warning detected. Falling back if tiles remain unavailable.');
        }
        // eslint-disable-next-line no-console
        console.warn('[MapView] runtime map error', event.error);
      });
    } catch (error) {
      setMapError('Unable to initialize map engine in this environment.');
      // eslint-disable-next-line no-console
      console.warn('[MapView] map initialization failed', error);
      map.current = null;
    }
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTileWatchdog();
      marker.current?.remove();
      marker.current = null;
      map.current?.remove();
      map.current = null;
      setMapLoaded(false);
      unregisterCachedProtocol();
    };
  }, [clearTileWatchdog, detectWebGLSupport, loadCacheStats, scheduleTileWatchdog]);
  useEffect(() => {
    if (!map.current || !mapLoaded || !hasValidLocation(result?.location)) return;
    if (!map.current.isStyleLoaded()) {
      map.current.once('style.load', () => {
        if (hasValidLocation(result.location)) updateMarkerAndFly(result.location);
      });
      return;
    }
    updateMarkerAndFly(result.location);
  }, [mapLoaded, result, updateMarkerAndFly]);
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    if (hasValidLocation(result?.location)) return;
    marker.current?.remove();
    marker.current = null;
    lastLocationRef.current = null;
  }, [mapLoaded, result]);
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const baseStyle: BaseMapStyle = isOffline ? 'offline' : activeStyle === 'satellite' ? 'satellite' : 'standard';
    const nextIs3D = activeStyle === 'terrain';
    if (styleSwitchInFlightRef.current) {
      queuedStyleRef.current = { baseStyle, nextIs3D };
      return;
    }
    if (baseStyleRef.current === baseStyle) {
      apply3D(nextIs3D);
      return;
    }
    runBaseStyleSwitch(baseStyle, nextIs3D);
  }, [activeStyle, apply3D, isOffline, mapLoaded, runBaseStyleSwitch]);
  const onResetView = useCallback(() => {
    if (!map.current || !hasValidLocation(result?.location)) return;
    map.current.flyTo({ center: [result.location.lon, result.location.lat], zoom: 16, pitch: is3DRef.current ? 60 : 0, bearing: 0, duration: 1500 });
  }, [result]);
  const onToggle3D = useCallback(() => {
    if (!map.current) return;
    if (is3D) {
      setActiveStyle('standard');
      apply3D(false);
      return;
    }
    setActiveStyle('terrain');
    apply3D(true);
  }, [apply3D, is3D]);
  return {
    mapContainer,
    activeStyle,
    setActiveStyle,
    showStyleMenu,
    setShowStyleMenu,
    is3D,
    viewState,
    mapLoaded,
    mapError,
    mapWarning,
    isOffline,
    cacheStats,
    onZoomIn: () => map.current?.zoomIn(),
    onZoomOut: () => map.current?.zoomOut(),
    onResetView,
    onToggle3D,
  };
}
