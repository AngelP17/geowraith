/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Map as MapIcon, Mountain, Navigation, Satellite } from 'lucide-react';
import type { PredictResponse } from '../../lib/api';
import { STYLE_CONFIG, type MapStyle } from './mapStyles';

interface MapHeaderProps {
  result: PredictResponse | null;
  activeStyle: MapStyle;
  showStyleMenu: boolean;
  onToggleMenu: () => void;
  onSelectStyle: (style: MapStyle) => void;
}

const STYLE_ICONS: Record<MapStyle, React.ReactNode> = {
  standard: <MapIcon className="w-3.5 h-3.5" />,
  satellite: <Satellite className="w-3.5 h-3.5" />,
  terrain: <Mountain className="w-3.5 h-3.5" />,
};

export const MapHeader: React.FC<MapHeaderProps> = ({
  result,
  activeStyle,
  showStyleMenu,
  onToggleMenu,
  onSelectStyle,
}) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.05] border border-white/10">
          <Navigation className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <p className="text-xs font-mono text-white/60 uppercase tracking-wider">Tactical Map</p>
          <p className="text-[10px] font-mono text-white/30">
            {result ? `${result.location.lat.toFixed(4)}, ${result.location.lon.toFixed(4)}` : 'No target selected'}
          </p>
        </div>
      </div>

      <div className="relative">
        <button
          onClick={onToggleMenu}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] transition-colors"
        >
          <Layers className="w-3.5 h-3.5 text-white/60" />
          <span className="text-xs font-mono text-white/60">{STYLE_CONFIG[activeStyle].label}</span>
        </button>

        <AnimatePresence>
          {showStyleMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-2 w-56 rounded-xl bg-[#0f0f11] border border-white/[0.08] shadow-2xl overflow-hidden"
            >
              {(Object.keys(STYLE_CONFIG) as MapStyle[]).map((style) => (
                <button
                  key={style}
                  onClick={() => onSelectStyle(style)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeStyle === style ? 'bg-amber-500/10' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <span className={activeStyle === style ? 'text-amber-400' : 'text-white/40'}>
                    {STYLE_ICONS[style]}
                  </span>
                  <div>
                    <p className={`text-xs font-mono uppercase tracking-wider ${activeStyle === style ? 'text-amber-400' : 'text-white/60'}`}>
                      {STYLE_CONFIG[style].label}
                    </p>
                    <p className="text-[10px] text-white/30">{STYLE_CONFIG[style].description}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
