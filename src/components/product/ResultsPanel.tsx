import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Target, Clock, Copy, CheckCircle2, AlertTriangle, Cpu, Database } from 'lucide-react';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { SceneContextBadge } from './SceneContextBadge';
import { Mode, AnalysisPhase, DisplayMode } from './types';
import type { PredictResponse } from '../../lib/api';
import { formatCoords } from './utils';
import { MapView } from './MapView';

interface ResultsPanelProps {
  mode: Mode;
  phase: AnalysisPhase;
  displayMode: DisplayMode;
  result: PredictResponse | null;
  copied: boolean;
  onCopy: () => void;
  onToggleDisplayMode: () => void;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ mode, phase, displayMode, result, copied, onCopy, onToggleDisplayMode }) => {
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

  const hasFallback = result && (
    result.diagnostics?.embedding_source === 'fallback' ||
    result.diagnostics?.reference_index_source === 'fallback'
  );
  const hasClip = result && (
    result.diagnostics?.embedding_source === 'clip' ||
    result.diagnostics?.reference_index_source === 'clip'
  );

  const isLowConfidence = result?.status === 'low_confidence';
  const isLocationWithheld = Boolean(
    result && (result.location_visibility === 'withheld' || result.status === 'low_confidence')
  );
  const isWithheldInReviewMode = displayMode === 'review' && isLocationWithheld;
  const canDisplayLocation = Boolean(result && (!isLocationWithheld || isWithheldInReviewMode));

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
    if (embedding_source === 'clip' || reference_index_source === 'clip') {
      return {
        text: 'CLIP Mode',
        color: 'text-amber-400',
        icon: <Cpu className="w-3 h-3 text-amber-400" />
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
        <button
          onClick={onToggleDisplayMode}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono transition-colors ${
            displayMode === 'review'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}
        >
          {displayMode === 'review' ? 'REVIEW' : 'SAFE'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-white/40 uppercase tracking-wider">System Status</span>
              <span className={`text-xs font-mono ${statusColor}`}>{statusText}</span>
            </div>
          </div>

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

          <AnimatePresence>
            {hasClip && !hasFallback && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-amber-400">CLIP Fallback Active</p>
                    <p className="text-[10px] font-mono text-white/60">
                      GeoCLIP ONNX is unavailable. Running CLIP city matching with wider uncertainty.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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

          <div className={`p-4 rounded-xl border transition-all duration-500 ${result ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/[0.02] border-white/[0.06]'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className={`w-4 h-4 ${result ? 'text-amber-400' : 'text-white/20'}`} />
                <span className="text-xs font-mono text-white/40 uppercase tracking-wider">Coordinates</span>
              </div>
              {canDisplayLocation && (
                <button onClick={onCopy} className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
            <AnimatePresence mode="wait">
              {canDisplayLocation && result ? (
                <motion.div key="coords" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  {isWithheldInReviewMode && (
                    <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded bg-amber-500/20 border border-amber-500/30">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px] font-mono text-amber-400 uppercase tracking-tight">Review Mode — Unverified</span>
                    </div>
                  )}
                  <p className="text-2xl font-mono text-white tracking-tight">{formatCoords(result.location.lat, result.location.lon)}</p>
                  <p className="text-xs font-mono text-white/40 mt-1">±{Math.round(result.location.radius_m)}m accuracy radius</p>
                  {isWithheldInReviewMode && result.location_reason && (
                    <p className="text-[10px] font-mono text-amber-400/60 mt-1">
                      Reason: {result.location_reason.replace(/_/g, ' ')}
                    </p>
                  )}
                </motion.div>
              ) : result ? (
                <motion.div key="withheld" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <p className="text-sm font-mono text-amber-400 tracking-tight uppercase">Location Withheld</p>
                  <p className="text-xs font-mono text-white/40 mt-1">
                    Confidence is below the actionable threshold. Upload a clearer landmark image.
                  </p>
                </motion.div>
              ) : (
                <motion.p key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-white/20 font-mono">--° --' --.&quot; N, --° --' --.&quot; E</motion.p>
              )}
            </AnimatePresence>
          </div>

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

          <AnimatePresence>
            {result?.scene_context && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: 0.1 }}
              >
                <SceneContextBadge
                  sceneType={result.scene_context.scene_type}
                  cohortHint={result.scene_context.cohort_hint}
                  confidenceCalibration={result.scene_context.confidence_calibration}
                />
              </motion.div>
            )}
          </AnimatePresence>

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
                  <span className={`text-xs font-mono ${
                    result.diagnostics.embedding_source === 'geoclip' ? 'text-emerald-400' :
                    result.diagnostics.embedding_source === 'clip' ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {result.diagnostics.embedding_source === 'geoclip' ? 'GeoCLIP' :
                     result.diagnostics.embedding_source === 'clip' ? 'CLIP' : 'Fallback'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-white/30 uppercase">Reference Index</span>
                  <span className={`text-xs font-mono ${
                    result.diagnostics.reference_index_source === 'model' ? 'text-emerald-400' :
                    result.diagnostics.reference_index_source === 'clip' ? 'text-amber-400' :
                    result.diagnostics.reference_index_source === 'cache' ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {result.diagnostics.reference_index_source === 'model' ? 'Model (HNSW)' :
                     result.diagnostics.reference_index_source === 'cache' ? 'Cached (HNSW)' :
                     result.diagnostics.reference_index_source === 'clip' ? 'CLIP Cities' :
                     result.diagnostics.reference_index_source === 'unknown' ? 'Unknown' : 'Fallback'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-white/30 uppercase">Image Anchors</span>
                  <span className="text-xs font-mono text-white/60">
                    {result.diagnostics.reference_image_anchors ?? 0}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/30 uppercase">Analysis Mode</span>
              <span className="text-xs font-mono text-white/60">{mode.toUpperCase()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/30 uppercase">Display Mode</span>
              <span className={`text-xs font-mono ${displayMode === 'review' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {displayMode === 'review' ? 'REVIEW' : 'OPERATOR SAFE'}
              </span>
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
            <MapView result={result} displayMode={displayMode} />
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
