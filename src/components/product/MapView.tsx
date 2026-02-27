import React from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { PredictResponse } from '../../lib/api';
import type { DisplayMode } from './types';
import { MapControls } from './MapControls';
import { MapHeader } from './MapHeader';
import { MapStatusOverlays } from './MapStatusOverlays';
import { useMapRuntime } from './useMapRuntime';

interface MapViewProps {
  result: PredictResponse | null;
  displayMode?: DisplayMode;
}

export const MapView: React.FC<MapViewProps> = ({
  result,
  displayMode = 'operator-safe',
}) => {
  const isWithheldResult = Boolean(
    result && (result.location_visibility === 'withheld' || result.status === 'low_confidence')
  );
  const hiddenTargetInSafeMode = Boolean(
    result && isWithheldResult && displayMode !== 'review'
  );
  const visibleResult = hiddenTargetInSafeMode ? null : result;
  const {
    mapContainer,
    activeStyle,
    setActiveStyle,
    viewState,
    mapLoaded,
    mapError,
    mapWarning,
    isOffline,
    cacheStats,
    onZoomIn,
    onZoomOut,
    onResetView,
  } = useMapRuntime(visibleResult, hiddenTargetInSafeMode);

  return (
    <div className="relative rounded-2xl border border-white/[0.08] bg-[#0a0a0c] overflow-hidden">
      <MapHeader
        result={result}
        targetVisible={!hiddenTargetInSafeMode}
        hiddenTarget={hiddenTargetInSafeMode}
        activeStyle={activeStyle}
        onSelectStyle={setActiveStyle}
      />

      <div className="relative w-full h-[500px] bg-[#050505]">
        <div ref={mapContainer} className="w-full h-full bg-[#050505]" />
        <MapStatusOverlays
          isOffline={isOffline}
          cacheStats={cacheStats}
          mapWarning={mapWarning}
          mapError={mapError}
          mapLoaded={mapLoaded}
          hiddenTarget={hiddenTargetInSafeMode}
        />

        <MapControls
          hasTarget={!hiddenTargetInSafeMode && Boolean(result)}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onResetView={onResetView}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 px-4 py-3 border-t border-white/[0.08] bg-[#0d0d10]">
        <div className="rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2">
          <p className="text-[10px] font-mono text-white/35 uppercase tracking-wider">Zoom</p>
          <p className="text-sm font-mono text-white/80">{viewState.zoom.toFixed(1)}</p>
        </div>
        <div className="rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2">
          <p className="text-[10px] font-mono text-white/35 uppercase tracking-wider">Pitch</p>
          <p className="text-sm font-mono text-white/80">{Math.round(viewState.pitch)}°</p>
        </div>
        <div className="rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2">
          <p className="text-[10px] font-mono text-white/35 uppercase tracking-wider">Bearing</p>
          <p className="text-sm font-mono text-white/80">{Math.round(viewState.bearing)}°</p>
        </div>
      </div>
    </div>
  );
};
