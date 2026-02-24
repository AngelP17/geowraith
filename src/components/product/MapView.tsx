/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { PredictResponse } from '../../lib/api';
import { MapControls } from './MapControls';
import { MapHeader } from './MapHeader';
import { satelliteStyle, standardStyle, type MapStyle } from './mapStyles';
import type { ViewState } from './types';
interface MapViewProps {
  result: PredictResponse | null;
}
function hasValidLocation(location: { lat: number; lon: number } | null | undefined): location is {
  lat: number;
  lon: number;
} {
  if (!location) return false;
  return Number.isFinite(location.lat) && Number.isFinite(location.lon);
}
export const MapView: React.FC<MapViewProps> = ({ result }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const [activeStyle, setActiveStyle] = useState<MapStyle>('standard');
  const [is3D, setIs3D] = useState(false);
  const is3DRef = useRef(false);
  const baseStyleRef = useRef<'standard' | 'satellite'>('standard');
  const [viewState, setViewState] = useState<ViewState>({ zoom: 2, pitch: 0, bearing: 0 });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const lastLocationRef = useRef<{ lat: number; lon: number } | null>(null);
  const tileWatchdogRef = useRef<number | null>(null);
  const mapStatusLabel =
    mapError && mapError.toLowerCase().includes('tile') ? 'Map Data Unavailable' : 'Map Engine Unavailable';
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
  const apply3D = useCallback(
    (enable: boolean) => {
      if (!map.current) return;
      if (enable) {
        map.current.easeTo({ pitch: 60, bearing: 0, duration: 1000 });
      } else {
        map.current.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
      }
      is3DRef.current = enable;
      setIs3D(enable);
    },
    []
  );
  const clearTileWatchdog = useCallback(() => {
    if (typeof window === 'undefined' || tileWatchdogRef.current === null) return;
    window.clearTimeout(tileWatchdogRef.current);
    tileWatchdogRef.current = null;
  }, []);
  const scheduleTileWatchdog = useCallback(() => {
    if (typeof window === 'undefined') return;
    clearTileWatchdog();
    tileWatchdogRef.current = window.setTimeout(() => {
      if (!map.current) return;
      if (map.current.areTilesLoaded()) return;
      setMapError(
        'Map tiles failed to load. Check network access and disable blockers for tile providers.'
      );
      // eslint-disable-next-line no-console
      console.warn('[MapView] tiles did not load within watchdog window');
    }, 4500);
  }, [clearTileWatchdog]);
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
      map.current.addControl(
        new maplibregl.NavigationControl({ visualizePitch: true, showZoom: true, showCompass: true }),
        'bottom-right'
      );
      map.current.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');
      map.current.on('load', () => {
        setMapError(null);
        setMapLoaded(true);
        scheduleTileWatchdog();
      });
      map.current.on('move', () => {
        if (!map.current) return;
        setViewState({
          zoom: map.current.getZoom(),
          pitch: map.current.getPitch(),
          bearing: map.current.getBearing(),
        });
      });
      map.current.on('style.load', () => {
        setMapError(null);
        scheduleTileWatchdog();
      });
      map.current.on('idle', () => {
        clearTileWatchdog();
      });
      map.current.on('error', (event) => {
        const message =
          event.error instanceof Error ? event.error.message : 'Unknown map runtime error';
        const normalized = message.toLowerCase();
        if (
          normalized.includes('failed to load') ||
          normalized.includes('tile') ||
          normalized.includes('source')
        ) {
          setMapError('Map source failed to load. Try Standard mode or check network access.');
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
      map.current?.remove();
      map.current = null;
    };
  }, [detectWebGLSupport, clearTileWatchdog, scheduleTileWatchdog, result]);
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
        duration: 2000,
        essential: true,
      });
    },
    []
  );
  useEffect(() => {
    if (!map.current || !mapLoaded || !hasValidLocation(result?.location)) return;
    if (!map.current.isStyleLoaded()) {
      const handleStyle = () => {
        if (hasValidLocation(result.location)) updateMarkerAndFly(result.location);
      };
      map.current.once('style.load', handleStyle);
      return;
    }
    updateMarkerAndFly(result.location);
  }, [result, mapLoaded, updateMarkerAndFly]);
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const baseStyle = activeStyle === 'satellite' ? 'satellite' : 'standard';
    const nextIs3D = activeStyle === 'terrain';
    if (baseStyleRef.current === baseStyle) {
      apply3D(nextIs3D);
      return;
    }
    const styleSpec = baseStyle === 'satellite' ? satelliteStyle : standardStyle;
    map.current.setStyle(styleSpec);
    baseStyleRef.current = baseStyle;
    map.current.once('style.load', () => {
      const last = lastLocationRef.current;
      if (last) updateMarkerAndFly(last);
      apply3D(nextIs3D);
    });
  }, [activeStyle, mapLoaded, apply3D, updateMarkerAndFly]);
  const handleZoomIn = useCallback(() => map.current?.zoomIn(), []);
  const handleZoomOut = useCallback(() => map.current?.zoomOut(), []);
  const handleResetView = useCallback(() => {
    if (!map.current || !hasValidLocation(result?.location)) return;
    map.current.flyTo({
      center: [result.location.lon, result.location.lat],
      zoom: 16,
      pitch: is3DRef.current ? 60 : 0,
      bearing: 0,
      duration: 1500,
    });
  }, [result]);
  const toggle3D = useCallback(() => {
    if (!map.current) return;
    if (is3D) {
      setActiveStyle('standard');
      apply3D(false);
    } else {
      setActiveStyle('terrain');
      apply3D(true);
    }
  }, [is3D, apply3D]);
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
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className="max-w-sm text-center">
              <p className="text-xs font-mono text-amber-300/90 uppercase tracking-wider">{mapStatusLabel}</p>
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
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onToggle3D={toggle3D}
      />
    </div>
  );
};
