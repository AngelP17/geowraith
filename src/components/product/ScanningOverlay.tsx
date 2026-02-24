/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Radar } from 'lucide-react';
import { AnalysisPhase, phaseMessages, RADAR_SWEEP_DURATION } from './types';

interface ScanningOverlayProps {
  phase: Exclude<AnalysisPhase, 'idle' | 'complete' | 'error'>;
  progress: number;
}

export const ScanningOverlay: React.FC<ScanningOverlayProps> = ({ phase, progress }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
  >
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative w-48 h-48">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: RADAR_SWEEP_DURATION, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-24 bg-gradient-to-b from-amber-500/80 to-transparent rounded-full" />
        </motion.div>
        <div className="absolute inset-0 rounded-full border border-amber-500/20" />
        <div className="absolute inset-4 rounded-full border border-amber-500/10" />
        <div className="absolute inset-8 rounded-full border border-amber-500/10" />
        <Radar className="absolute inset-0 m-auto w-8 h-8 text-amber-500" />
      </div>
    </div>
    <div className="absolute bottom-8 left-8 right-8">
      <div className="flex items-center justify-between text-xs font-mono text-white/60 mb-2">
        <span>{phaseMessages[phase]}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  </motion.div>
);
