/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Maximize2, Minus, Mountain, Plus } from 'lucide-react';
import type { PredictResponse } from '../../lib/api';
import type { ViewState } from './types';

interface MapControlsProps {
  result: PredictResponse | null;
  is3D: boolean;
  viewState: ViewState;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onToggle3D: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  result,
  is3D,
  viewState,
  onZoomIn,
  onZoomOut,
  onResetView,
  onToggle3D,
}) => {
  return (
    <>
      <div className="absolute bottom-4 left-4 flex flex-col gap-2">
        <button
          onClick={onZoomIn}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-black/60 backdrop-blur border border-white/10 text-white/60 hover:text-white hover:bg-black/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-black/60 backdrop-blur border border-white/10 text-white/60 hover:text-white hover:bg-black/80 transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <button
          onClick={onResetView}
          disabled={!result}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/60 backdrop-blur border border-white/10 text-white/60 hover:text-white hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="text-xs font-mono">Reset View</span>
        </button>
        <button
          onClick={onToggle3D}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur border transition-colors ${
            is3D
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
              : 'bg-black/60 border-white/10 text-white/60 hover:text-white hover:bg-black/80'
          }`}
        >
          <Mountain className="w-3.5 h-3.5" />
          <span className="text-xs font-mono">{is3D ? '3D ON' : '3D OFF'}</span>
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-2 rounded-lg bg-black/60 backdrop-blur border border-white/10">
        <span className="text-[10px] font-mono text-white/40">
          ZOOM: <span className="text-white/60">{viewState.zoom.toFixed(1)}</span>
        </span>
        <span className="text-[10px] font-mono text-white/20">|</span>
        <span className="text-[10px] font-mono text-white/40">
          PITCH: <span className="text-white/60">{Math.round(viewState.pitch)}°</span>
        </span>
        <span className="text-[10px] font-mono text-white/20">|</span>
        <span className="text-[10px] font-mono text-white/40">
          BEARING: <span className="text-white/60">{Math.round(viewState.bearing)}°</span>
        </span>
      </div>
    </>
  );
};
