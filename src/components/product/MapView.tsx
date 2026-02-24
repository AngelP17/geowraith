import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { PredictResponse } from '../../lib/api';
import { MapControls } from './MapControls';
import { MapHeader } from './MapHeader';
import { fallbackStyle, satelliteStyle, standardStyle, type BaseMapStyle, type MapStyle } from './mapStyles';
import type { ViewState } from './types';
interface MapViewProps { result: PredictResponse | null; }
function hasValidLocation(location: { lat: number; lon: number } | null | undefined): location is {
  lat: number;
  lon: number;
} {
  return Boolean(location && Number.isFinite(location.lat) && Number.isFinite(location.lon));
}
export const MapView: React.FC<MapViewProps> = ({ result }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const tileWatchdogRef = useRef<number | null>(null);
  const lastLocationRef = useRef<{ lat: number; lon: number } | null>(null);
  const baseStyleRef = useRef<BaseMapStyle>('standard');
  const styleSwitchInFlightRef = useRef(false);
  const queuedStyleRef = useRef<{ baseStyle: 'standard' | 'satellite'; nextIs3D: boolean } | null>(null);
  const is3DRef = useRef(false);
  const [activeStyle, setActiveStyle] = useState<MapStyle>('standard');
  const [is3D, setIs3D] = useState(false);
  const [viewState, setViewState] = useState<ViewState>({ zoom: 2, pitch: 0, bearing: 0 });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapWarning, setMapWarning] = useState<string | null>(null);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const detectWebGLSupport = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') ||
          canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl'))
    );
  }, []);
  const clearTileWatchdog = useCallback(() => {
    if (typeof window === 'undefined' || tileWatchdogRef.current === null) return;
    window.clearTimeout(tileWatchdogRef.current);
    tileWatchdogRef.current = null;
  }, []);
  const apply3D = useCallback((enable: boolean) => {
    if (!map.current) return;
    map.current.easeTo({ pitch: enable ? 60 : 0, bearing: 0, duration: 900 });
    is3DRef.current = enable;
    setIs3D(enable);
  }, []);
  const updateMarkerAndFly = useCallback(
    (location: { lat: number; lon: number }) => {
      if (!map.current) return;
      if (!hasValidLocation(location)) {
        setMapError('Invalid coordinates returned by inference. Unable to render map target.');
        return;
      }
      lastLocationRef.current = location;
      if (!marker.current) {
        const el = document.createElement('div');
        el.className = 'relative';
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 bg-amber-500/30 rounded-full animate-ping"></div>
            <div class="absolute w-4 h-4 bg-amber-500/50 rounded-full animate-pulse"></div>
            <div class="relative w-3 h-3 bg-amber-400 rounded-full border-2 border-white shadow-lg"></div>
          </div>
        `;
        // CRITICAL: Set coordinates BEFORE adding to map to prevent undefined.lng error
        marker.current = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([location.lon, location.lat])
          .addTo(map.current);
      } else {
        marker.current.setLngLat([location.lon, location.lat]);
      }
      map.current.resize();
      map.current.flyTo({
        center: [location.lon, location.lat],
        zoom: 16,
        pitch: is3DRef.current ? 60 : 0,
        bearing: 0,
        duration: 1800,
        essential: true,
      });
    },
    []
  );
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
    clearTileWatchdog();
    tileWatchdogRef.current = window.setTimeout(() => {
      if (!map.current || map.current.areTilesLoaded()) return;
      setMapWarning('Tile provider timeout. Using local fallback basemap.');
      activateFallbackStyle();
      // eslint-disable-next-line no-console
      console.warn('[MapView] tiles did not load within watchdog window');
    }, 5000);
  }, [activateFallbackStyle, clearTileWatchdog]);
  const runBaseStyleSwitch = useCallback(
    (baseStyle: 'standard' | 'satellite', nextIs3D: boolean) => {
      if (!map.current) return;
      styleSwitchInFlightRef.current = true;
      marker.current?.remove();
      marker.current = null;
      const styleSpec = baseStyle === 'satellite' ? satelliteStyle : standardStyle;
      map.current.setStyle(styleSpec);
      baseStyleRef.current = baseStyle;
      map.current.once('style.load', () => {
        styleSwitchInFlightRef.current = false;
        scheduleTileWatchdog();
        const last = lastLocationRef.current;
        if (last) updateMarkerAndFly(last);
        apply3D(nextIs3D);
        const queued = queuedStyleRef.current;
        queuedStyleRef.current = null;
        if (!queued) return;
        if (queued.baseStyle !== baseStyle) {
          runBaseStyleSwitch(queued.baseStyle, queued.nextIs3D);
        } else {
          apply3D(queued.nextIs3D);
        }
      });
    },
    [apply3D, scheduleTileWatchdog, updateMarkerAndFly]
  );
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    if (!detectWebGLSupport()) {
      setMapError('WebGL is unavailable in this environment. Map preview is disabled.');
      return;
    }
    const initialCoords = hasValidLocation(result?.location) ? result.location : { lat: 20, lon: 0 };
    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: standardStyle,
        center: [initialCoords.lon, initialCoords.lat],
        zoom: result ? 14 : 2,
        pitch: 0,
        bearing: 0,
        attributionControl: { compact: true },
        maxPitch: 85,
      });
      map.current.on('load', () => {
        setMapLoaded(true);
        setMapError(null);
        setMapWarning(null);
        scheduleTileWatchdog();
      });
      map.current.on('style.load', () => scheduleTileWatchdog());
      map.current.on('idle', clearTileWatchdog);
      map.current.on('move', () => {
        if (!map.current) return;
        setViewState({
          zoom: map.current.getZoom(),
          pitch: map.current.getPitch(),
          bearing: map.current.getBearing(),
        });
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
      return;
    }
    return () => {
      clearTileWatchdog();
      marker.current?.remove();
      marker.current = null;
      map.current?.remove();
      map.current = null;
    };
  }, [clearTileWatchdog, detectWebGLSupport, result, scheduleTileWatchdog]);
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
    const baseStyle: 'standard' | 'satellite' = activeStyle === 'satellite' ? 'satellite' : 'standard';
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
  }, [activeStyle, apply3D, mapLoaded, runBaseStyleSwitch]);
  return (
    <div className="relative rounded-2xl border border-white/[0.08] bg-[#0a0a0c] overflow-hidden">
      <MapHeader
        result={result}
        activeStyle={activeStyle}
        showStyleMenu={showStyleMenu}
        onToggleMenu={() => setShowStyleMenu((prev) => !prev)}
        onSelectStyle={(style) => {
          setActiveStyle(style);
          setShowStyleMenu(false);
        }}
      />
      <div ref={mapContainer} className="w-full aspect-[16/10] bg-[#050505]">
        {mapWarning && !mapError && (
          <div className="absolute left-3 right-3 top-16 z-20 rounded-lg border border-amber-500/30 bg-black/65 px-3 py-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-amber-300">{mapWarning}</p>
          </div>
        )}
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className="max-w-sm text-center">
              <p className="text-xs font-mono text-amber-300/90 uppercase tracking-wider">Map Engine Unavailable</p>
              <p className="mt-2 text-sm text-white/60">{mapError}</p>
            </div>
          </div>
        )}
        {!mapLoaded && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-400 rounded-full"
              />
              <p className="text-xs font-mono text-white/40">Initializing map engine...</p>
            </div>
          </div>
        )}
      </div>
      <MapControls
        result={result}
        is3D={is3D}
        viewState={viewState}
        onZoomIn={() => map.current?.zoomIn()}
        onZoomOut={() => map.current?.zoomOut()}
        onResetView={() => {
          if (!map.current || !hasValidLocation(result?.location)) return;
          map.current.flyTo({
            center: [result.location.lon, result.location.lat],
            zoom: 16,
            pitch: is3DRef.current ? 60 : 0,
            bearing: 0,
            duration: 1500,
          });
        }}
        onToggle3D={() => {
          if (!map.current) return;
          if (is3D) {
            setActiveStyle('standard');
            apply3D(false);
            return;
          }
          setActiveStyle('terrain');
          apply3D(true);
        }}
      />
    </div>
  );
};
