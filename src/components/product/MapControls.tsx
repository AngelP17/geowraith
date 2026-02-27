/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Maximize2, Minus, Plus } from 'lucide-react';
import type { PredictResponse } from '../../lib/api';

interface MapControlsProps {
  hasTarget: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  hasTarget,
  onZoomIn,
  onZoomOut,
  onResetView,
}) => {
  return (
    <>
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
        <button
          onClick={onZoomIn}
          aria-label="Zoom in"
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-black/70 backdrop-blur-md border border-white/15 text-white/70 hover:text-white hover:bg-black/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          aria-label="Zoom out"
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-black/70 backdrop-blur-md border border-white/15 text-white/70 hover:text-white hover:bg-black/90 transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        <button
          onClick={onResetView}
          disabled={!hasTarget}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/70 backdrop-blur-md border border-white/15 text-white/70 hover:text-white hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="text-xs font-mono">Reset View</span>
        </button>
      </div>
    </>
  );
};
