/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Zap, Target, X, Scan, CheckCircle2, Crosshair, AlertTriangle } from 'lucide-react';
import { Mode, AnalysisPhase } from './types';
import { ScanningOverlay } from './ScanningOverlay';

interface ImageUploadPanelProps {
  file: File | null;
  previewUrl: string | null;
  mode: Mode;
  dataSource: 'demo' | 'live';
  phase: AnalysisPhase;
  errorMsg: string;
  warningMsg: string;
  scanProgress: number;
  onFileSelect: (file: File) => void;
  onModeChange: (mode: Mode) => void;
  onDataSourceChange: (value: 'demo' | 'live') => void;
  onAnalyze: () => void;
  onClear: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

const modeConfig = {
  fast: {
    label: 'TACTICAL SCAN',
    subtitle: 'Rapid triangulation using visual landmarks',
    icon: <Zap className="w-4 h-4" />,
  },
  accurate: {
    label: 'PRECISION LOCK',
    subtitle: 'Multi-factor analysis with hloc refinement',
    icon: <Target className="w-4 h-4" />,
  },
};

export const ImageUploadPanel: React.FC<ImageUploadPanelProps> = ({
  file,
  previewUrl,
  mode,
  dataSource,
  phase,
  errorMsg,
  warningMsg,
  scanProgress,
  onFileSelect,
  onModeChange,
  onDataSourceChange,
  onAnalyze,
  onClear,
  onDragOver,
  onDrop,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAnalyzing = phase === 'uploading' || phase === 'scanning' || phase === 'processing';
  const isLiveDisabled = dataSource === 'live' && !file;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) onFileSelect(selected);
  };

  return (
    <div className="relative rounded-2xl border border-white/[0.08] bg-[#0a0a0c] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-mono text-white/30 ml-2">INPUT.PANEL</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
            {file ? file.name.slice(0, 30) + (file.name.length > 30 ? '...' : '') : 'No file selected'}
          </span>
          {file && (
            <button
              onClick={onClear}
              className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div onDragOver={onDragOver} onDrop={onDrop} className="relative aspect-video bg-[#070708]">
        <AnimatePresence mode="wait">
          {!previewUrl ? (
            <motion.label
              key="dropzone"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              htmlFor="geowraith-upload"
              className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group"
            >
              <input ref={fileInputRef} id="geowraith-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <motion.div whileHover={{ scale: 1.05 }} className="relative mb-6">
                <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full" />
                <div className="relative w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center group-hover:border-amber-500/30 group-hover:bg-amber-500/5 transition-all duration-300">
                  <Upload className="w-8 h-8 text-white/40 group-hover:text-amber-400 transition-colors" />
                </div>
              </motion.div>
              <p className="text-white/60 font-medium mb-2">Drop image or click to upload</p>
              <p className="text-white/30 text-sm">JPEG, PNG, WebP · Max 10MB</p>
              <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-white/10 rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-white/10 rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-white/10 rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-white/10 rounded-br-lg" />
            </motion.label>
          ) : (
            <motion.div key="preview" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
              <img src={previewUrl} alt="Analysis target" className="w-full h-full object-contain bg-black" />
              <AnimatePresence>
                {isAnalyzing && <ScanningOverlay phase={phase as Exclude<AnalysisPhase, 'idle' | 'complete' | 'error'>} progress={scanProgress} />}
              </AnimatePresence>
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="px-2 py-1 rounded bg-black/60 backdrop-blur text-[10px] font-mono text-white/60">
                  {file && `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 border-t border-white/[0.06]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-xs font-mono text-white/40 uppercase tracking-wider">Data Source</p>
            <p className="text-[11px] text-white/30">Demo works offline · Live requires API running</p>
          </div>
          <div className="flex items-center gap-2">
            {(['demo', 'live'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onDataSourceChange(value)}
                className={`px-3 py-2 rounded-lg border text-[11px] font-mono uppercase tracking-wider transition-colors ${
                  dataSource === value
                    ? 'border-amber-400/60 bg-amber-500/10 text-amber-300'
                    : 'border-white/10 text-white/40 hover:text-white/60 hover:border-white/20'
                }`}
              >
                {value === 'demo' ? 'Demo' : 'Live API'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(modeConfig) as Mode[]).map((m) => {
            const config = modeConfig[m];
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => onModeChange(m)}
                disabled={isAnalyzing}
                className={`relative p-4 rounded-xl border text-left transition-all duration-300 ${
                  active ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-xs font-mono tracking-wider ${active ? 'text-amber-400' : 'text-white/40'}`}>{config.label}</span>
                  <span className={active ? 'text-amber-400' : 'text-white/20'}>{config.icon}</span>
                </div>
                <p className="text-[11px] text-white/30 leading-relaxed">{config.subtitle}</p>
                {active && <motion.div layoutId="modeIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500" />}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {phase === 'error' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-200">{errorMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {warningMsg && phase !== 'error' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-100">{warningMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || isLiveDisabled}
          className="w-full mt-4 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold text-sm hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 group"
        >
          {isAnalyzing ? (
            <><Scan className="w-4 h-4 animate-pulse" />Analyzing...</>
          ) : phase === 'complete' ? (
            <><CheckCircle2 className="w-4 h-4" />Analysis Complete</>
          ) : dataSource === 'demo' && !file ? (
            <><Crosshair className="w-4 h-4 group-hover:scale-110 transition-transform" />Run Demo</>
          ) : (
            <><Crosshair className="w-4 h-4 group-hover:scale-110 transition-transform" />Begin Analysis</>
          )}
        </button>
      </div>
    </div>
  );
};
