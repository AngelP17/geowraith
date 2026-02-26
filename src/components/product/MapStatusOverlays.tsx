import React from 'react';
import { motion } from 'motion/react';
import type { TileCacheStats } from '../../lib/tileCache';

interface MapStatusOverlaysProps {
  isOffline: boolean;
  cacheStats: TileCacheStats | null;
  mapWarning: string | null;
  mapError: string | null;
  mapLoaded: boolean;
}

export const MapStatusOverlays: React.FC<MapStatusOverlaysProps> = ({
  isOffline,
  cacheStats,
  mapWarning,
  mapError,
  mapLoaded,
}) => {
  return (
    <>
      {isOffline && (
        <div className="absolute left-3 top-16 z-20 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
          <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
            Offline Mode · {cacheStats ? `${cacheStats.count} tiles cached` : 'Using cached tiles'}
          </p>
        </div>
      )}

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
    </>
  );
};
