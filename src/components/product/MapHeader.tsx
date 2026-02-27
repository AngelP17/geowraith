/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Map as MapIcon, Mountain, Navigation, Satellite } from 'lucide-react';
import type { PredictResponse } from '../../lib/api';
import { STYLE_CONFIG, type MapStyle } from './mapStyles';

interface MapHeaderProps {
  result: PredictResponse | null;
  targetVisible: boolean;
  hiddenTarget: boolean;
  activeStyle: MapStyle;
  onSelectStyle: (style: MapStyle) => void;
}

const STYLE_ICONS: Record<MapStyle, React.ReactNode> = {
  standard: <MapIcon className="w-3.5 h-3.5" />,
  satellite: <Satellite className="w-3.5 h-3.5" />,
  terrain: <Mountain className="w-3.5 h-3.5" />,
};

export const MapHeader: React.FC<MapHeaderProps> = ({
  result,
  targetVisible,
  hiddenTarget,
  activeStyle,
  onSelectStyle,
}) => {
  const focusText = hiddenTarget
    ? 'Target hidden in operator-safe mode'
    : targetVisible && result
      ? `${result.location.lat.toFixed(4)}, ${result.location.lon.toFixed(4)}`
      : 'No target selected';

  return (
    <div className="relative z-20 flex flex-col gap-3 px-4 py-3 border-b border-white/[0.08] bg-[#0c0c0f] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] border border-white/12">
          <Navigation className="w-4 h-4 text-amber-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-mono text-white/70 uppercase tracking-wider">Map Focus</p>
          <p className={`truncate text-[10px] font-mono ${hiddenTarget ? 'text-amber-300/80' : 'text-white/40'}`}>
            {focusText}
          </p>
        </div>
      </div>

      <div className="grid w-full min-w-0 grid-cols-3 gap-1.5 sm:w-auto sm:min-w-[300px] sm:gap-2">
        {(Object.keys(STYLE_CONFIG) as MapStyle[]).map((style) => {
          const active = activeStyle === style;

          return (
            <button
              key={style}
              onClick={() => onSelectStyle(style)}
              className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 transition-colors sm:px-3 ${
                active
                  ? 'border-amber-500/40 bg-amber-500/12 text-amber-300'
                  : 'border-white/[0.08] bg-white/[0.03] text-white/55 hover:border-white/15 hover:text-white/80'
              }`}
            >
              <span className={active ? 'text-amber-300' : 'text-white/40'}>
                {STYLE_ICONS[style]}
              </span>
              <span className="truncate text-[10px] font-mono uppercase tracking-wider sm:text-[11px]">
                {STYLE_CONFIG[style].shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
