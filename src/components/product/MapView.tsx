import React from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { PredictResponse } from '../../lib/api';
import { MapControls } from './MapControls';
import { MapHeader } from './MapHeader';
import { MapStatusOverlays } from './MapStatusOverlays';
import { useMapRuntime } from './useMapRuntime';

interface MapViewProps {
  result: PredictResponse | null;
}

export const MapView: React.FC<MapViewProps> = ({ result }) => {
  const {
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
    onZoomIn,
    onZoomOut,
    onResetView,
    onToggle3D,
  } = useMapRuntime(result);

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
        <MapStatusOverlays
          isOffline={isOffline}
          cacheStats={cacheStats}
          mapWarning={mapWarning}
          mapError={mapError}
          mapLoaded={mapLoaded}
        />
      </div>

      <MapControls
        result={result}
        is3D={is3D}
        viewState={viewState}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onResetView={onResetView}
        onToggle3D={onToggle3D}
      />
    </div>
  );
};
