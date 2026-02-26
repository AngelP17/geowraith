/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Target, Clock, Copy, CheckCircle2, AlertTriangle, Cpu, Database } from 'lucide-react';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { Mode, AnalysisPhase } from './types';
import type { PredictResponse } from '../../lib/api';
import { formatCoords } from './utils';
import { MapView } from './MapView';

interface ResultsPanelProps {
  mode: Mode;
  phase: AnalysisPhase;
  result: PredictResponse | null;
  copied: boolean;
  onCopy: () => void;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ mode, phase, result, copied, onCopy }) => {
  const isAnalyzing = phase === 'uploading' || phase === 'scanning' || phase === 'processing';

  const statusText = {
    idle: 'AWAITING INPUT',
    uploading: 'PROCESSING',
    scanning: 'PROCESSING',
    processing: 'PROCESSING',
    complete: 'ANALYSIS COMPLETE',
    error: 'ERROR',
  }[phase];

  const statusColor = {
    idle: 'text-white/30',
    uploading: 'text-amber-400',
    scanning: 'text-amber-400',
    processing: 'text-amber-400',
    complete: 'text-emerald-400',
    error: 'text-red-400',
  }[phase];

  // Determine if any fallback modes are active
  const hasFallback = result && (
    result.diagnostics?.embedding_source === 'fallback' ||
    result.diagnostics?.reference_index_source === 'fallback'
  );

  const isLowConfidence = result?.status === 'low_confidence';

  // Get model status display
  const getModelStatus = () => {
    if (!result?.diagnostics) return { text: 'Unknown', color: 'text-white/40', icon: null };
    
    const { embedding_source, reference_index_source } = result.diagnostics;
    
    if (embedding_source === 'geoclip' && reference_index_source === 'model') {
      return { 
        text: 'GeoCLIP Active', 
        color: 'text-emerald-400',
        icon: <Cpu className="w-3 h-3 text-emerald-400" />
      };
    }
    if (embedding_source === 'geoclip' && reference_index_source === 'cache') {
      return { 
        text: 'GeoCLIP (Cached)', 
        color: 'text-amber-400',
        icon: <Database className="w-3 h-3 text-amber-400" />
      };
    }
    return { 
      text: 'Fallback Mode', 
      color: 'text-red-400',
      icon: <AlertTriangle className="w-3 h-3 text-red-400" />
    };
  };

  const modelStatus = getModelStatus();

  return (
    <div className="h-full rounded-2xl border border-white/[0.08] bg-[#0a0a0c] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className="text-xs font-mono text-white/30 uppercase tracking-wider">Results Terminal</span>
        </div>
        <span className="text-[10px] font-mono text-white/20">{result?.request_id?.slice(0, 8) || 'IDLE'}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-4">
          {/* Status */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-white/40 uppercase tracking-wider">System Status</span>
              <span className={`text-xs font-mono ${statusColor}`}>{statusText}</span>
            </div>
          </div>

          {/* Fallback Warning */}
          <AnimatePresence>
            {hasFallback && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-red-400">Accuracy Degraded</p>
                    <p className="text-[10px] font-mono text-white/60">
                      {result?.diagnostics?.embedding_source === 'fallback' && 'GeoCLIP model unavailable. Using color histogram fallback.'}
                      {result?.diagnostics?.reference_index_source === 'fallback' && ' Reference vectors using fallback mode.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Low Confidence Warning */}
          <AnimatePresence>
            {isLowConfidence && !hasFallback && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-amber-400">Low Confidence Prediction</p>
                    <p className="text-[10px] font-mono text-white/60">
                      {result?.notes || 'The model is uncertain about this location. Try an image with clearer landmarks.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Coordinates */}
          <div className={`p-4 rounded-xl border transition-all duration-500 ${result ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/[0.02] border-white/[0.06]'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className={`w-4 h-4 ${result ? 'text-amber-400' : 'text-white/20'}`} />
                <span className="text-xs font-mono text-white/40 uppercase tracking-wider">Coordinates</span>
              </div>
              {result && (
                <button onClick={onCopy} className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div key="coords" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <p className="text-2xl font-mono text-white tracking-tight">{formatCoords(result.location.lat, result.location.lon)}</p>
                  <p className="text-xs font-mono text-white/40 mt-1">±{Math.round(result.location.radius_m)}m accuracy radius</p>
                </motion.div>
              ) : (
                <motion.p key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-white/20 font-mono">--° --' --.&quot; N, --° --' --.&quot; E</motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Confidence Indicator */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <ConfidenceIndicator 
                  confidence={result.confidence} 
                  tier={result.confidence_tier || 'medium'} 
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-3.5 h-3.5 text-white/20" />
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Confidence Score</span>
              </div>
              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div key="conf" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-1">
                    <span className={`text-2xl font-mono ${isLowConfidence ? 'text-amber-400' : 'text-white'}`}>{Math.round(result.confidence * 100)}</span>
                    <span className="text-sm font-mono text-white/40 mb-1">%</span>
                  </motion.div>
                ) : (
                  <span className="text-xl font-mono text-white/20">--%</span>
                )}
              </AnimatePresence>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3.5 h-3.5 text-white/20" />
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Elapsed</span>
              </div>
              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div key="time" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-1">
                    <span className="text-2xl font-mono text-white">{result.elapsed_ms}</span>
                    <span className="text-sm font-mono text-white/40 mb-1">ms</span>
                  </motion.div>
                ) : (
                  <span className="text-xl font-mono text-white/20">--ms</span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Diagnostics */}
          <AnimatePresence>
            {result?.diagnostics && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-white/30 uppercase">Model Status</span>
                  <div className="flex items-center gap-1.5">
                    {modelStatus.icon}
                    <span className={`text-xs font-mono ${modelStatus.color}`}>{modelStatus.text}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-white/30 uppercase">Image Embedding</span>
                  <span className={`text-xs font-mono ${result.diagnostics.embedding_source === 'geoclip' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.diagnostics.embedding_source === 'geoclip' ? 'GeoCLIP' : 'Fallback'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-white/30 uppercase">Reference Index</span>
                  <span className={`text-xs font-mono ${
                    result.diagnostics.reference_index_source === 'model' ? 'text-emerald-400' :
                    result.diagnostics.reference_index_source === 'cache' ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {result.diagnostics.reference_index_source === 'model' ? 'Model (HNSW)' :
                     result.diagnostics.reference_index_source === 'cache' ? 'Cached' : 'Fallback'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Metadata */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/30 uppercase">Analysis Mode</span>
              <span className="text-xs font-mono text-white/60">{mode.toUpperCase()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/30 uppercase">Request ID</span>
              <span className="text-xs font-mono text-white/60">{result?.request_id?.slice(0, 16) || 'PENDING'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/30 uppercase">Pipeline Version</span>
              <span className="text-xs font-mono text-white/60">v2.2.0</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/30 uppercase">Map View</span>
              <span className="text-[10px] font-mono text-white/40">Standard · Satellite · 3D</span>
            </div>
            <MapView result={result} />
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 text-[10px] font-mono text-white/30">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
          Local inference active · Zero external transmission
        </div>
      </div>
    </div>
  );
};
