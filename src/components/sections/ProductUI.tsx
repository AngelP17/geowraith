/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Satellite } from 'lucide-react';
import { checkApiHealth, predictImage, type PredictResponse } from '../../lib/api';
import {
  BackgroundGrid,
  ImageUploadPanel,
  ResultsPanel,
  readFileAsDataUrl,
} from '../product';
import type { Mode, AnalysisPhase, DisplayMode } from '../product';
import { getDemoResult } from '../../lib/demo';

function getErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'Request cancelled.';
  }

  if (error instanceof TypeError && error.message.toLowerCase().includes('fetch')) {
    return 'Live API unavailable on http://localhost:8080. Start both services with "npm run start".';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Live inference request failed.';
}

export const ProductUI: React.FC = () => {
  const [liveApiStatus, setLiveApiStatus] = useState<'checking' | 'online' | 'offline'>('offline');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('accurate');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('operator-safe');
  const [dataSource, setDataSource] = useState<'demo' | 'live'>('demo');
  const [phase, setPhase] = useState<AnalysisPhase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [warningMsg, setWarningMsg] = useState('');
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (phase === 'scanning' || phase === 'processing') {
      const interval = setInterval(() => {
        setScanProgress((prev) => {
          const next = prev + Math.random() * 15;
          return next >= 100 ? 100 : next;
        });
      }, 200);
      return () => clearInterval(interval);
    }
    setScanProgress(0);
  }, [phase]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type.startsWith('image/')) {
      processFile(dropped);
    } else {
      setErrorMsg('Please upload a valid image file (JPEG, PNG, WebP)');
      setPhase('error');
    }
  }, []);

  const processFile = (selected: File) => {
    if (selected.size > 10 * 1024 * 1024) {
      setErrorMsg('File size exceeds 10MB limit');
      setPhase('error');
      return;
    }
    setFile(selected);
    setPhase('idle');
    setErrorMsg('');
    setWarningMsg('');
    const url = URL.createObjectURL(selected);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  };

  const clearAll = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFile(null);
    setPhase('idle');
    setErrorMsg('');
    setWarningMsg('');
    setResult(null);
    abortRef.current?.abort();
  };

  const applyDemoResult = (demo: PredictResponse, demoMode?: Mode) => {
    setResult({ ...demo, mode: demoMode ?? demo.mode });
    setDataSource('demo');
    setPhase('complete');
    setErrorMsg('');
    setWarningMsg('Demo data active. Start the backend for live results.');
  };

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ result: PredictResponse; mode?: Mode }>;
      if (customEvent.detail?.result) {
        applyDemoResult(customEvent.detail.result, customEvent.detail.mode);
      }
    };
    window.addEventListener('geowraith:demo', handler);
    return () => window.removeEventListener('geowraith:demo', handler);
  }, []);

  const refreshLiveApiHealth = useCallback(async () => {
    setLiveApiStatus('checking');
    const healthy = await checkApiHealth();
    setLiveApiStatus(healthy ? 'online' : 'offline');
    return healthy;
  }, []);

  useEffect(() => {
    if (dataSource !== 'live') return;

    void refreshLiveApiHealth();

    const interval = window.setInterval(() => {
      void refreshLiveApiHealth();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [dataSource, refreshLiveApiHealth]);

  const handleDataSourceChange = useCallback((value: 'demo' | 'live') => {
    setDataSource(value);
    setErrorMsg('');

    if (value === 'demo') {
      setLiveApiStatus('offline');
      if (!result) {
        setWarningMsg('');
      }
      return;
    }

    setWarningMsg('Checking Live API connection...');
    setLiveApiStatus('checking');

    void checkApiHealth().then((healthy) => {
      setLiveApiStatus(healthy ? 'online' : 'offline');
      setWarningMsg(
        healthy
          ? 'Live API connected. Ready for local inference.'
          : 'Live API unavailable on http://localhost:8080. Start both services with "npm run start".'
      );
    });
  }, [result]);

  const handleAnalyze = async () => {
    if (dataSource === 'demo') {
      applyDemoResult(getDemoResult(), mode);
      return;
    }

    if (liveApiStatus !== 'online') {
      setErrorMsg('Live API unavailable on http://localhost:8080. Start both services with "npm run start".');
      setPhase('error');
      return;
    }

    if (!file) {
      setErrorMsg('Upload an image to begin analysis');
      setPhase('error');
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase('uploading');
    await new Promise((r) => setTimeout(r, 400));
    setPhase('scanning');
    await new Promise((r) => setTimeout(r, 800));
    setPhase('processing');

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const base64 = dataUrl.split(',')[1] ?? '';
      const res = await predictImage(
        { image_base64: base64, options: { mode } },
        controller.signal
      );
      setResult(res);
      if (res.status === 'low_confidence') {
        setWarningMsg(res.notes ?? 'Low-confidence prediction. Try another image or landmarks.');
      } else {
        setWarningMsg('');
      }
      setPhase('complete');
      setErrorMsg('');
    } catch (err) {
      if (controller.signal.aborted) {
        return;
      }
      setResult(null);
      setWarningMsg('');
      setErrorMsg(getErrorMessage(err));
      setPhase('error');
    }
  };

  const copyCoords = () => {
    if (!result) return;
    const text = `${result.location.lat.toFixed(6)}, ${result.location.lon.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="product" className="relative w-full py-24 md:py-32 bg-[#030305] overflow-hidden">
      <BackgroundGrid />

      <div className="relative z-10 w-full px-5 md:px-[120px]">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/[0.03] border border-white/10">
                <Satellite className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-xs font-mono tracking-[0.3em] text-white/40 uppercase">Analysis Console</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold text-white tracking-tight"
            >
              Geospatial
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
                {' '}Intelligence{' '}
              </span>
              Console
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-white/40 text-base md:text-lg max-w-2xl"
            >
              Upload imagery for instant geolocation analysis. Local-first processing ensures zero data transmission to external servers.
            </motion.p>
          </div>

          {/* Console Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-7"
            >
              <ImageUploadPanel
                file={file}
                previewUrl={previewUrl}
                mode={mode}
                dataSource={dataSource}
                liveApiStatus={liveApiStatus}
                phase={phase}
                errorMsg={errorMsg}
                warningMsg={warningMsg}
                scanProgress={scanProgress}
                onFileSelect={processFile}
                onModeChange={setMode}
                onDataSourceChange={handleDataSourceChange}
                onAnalyze={handleAnalyze}
                onClear={clearAll}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-5"
            >
              <ResultsPanel
                mode={mode}
                displayMode={displayMode}
                phase={phase}
                result={result}
                copied={copied}
                onCopy={copyCoords}
                onToggleDisplayMode={() => setDisplayMode((prev) => (prev === 'operator-safe' ? 'review' : 'operator-safe'))}
              />
            </motion.div>
          </div>

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-white/30"
          >
            <div className="flex items-center gap-4">
              <span className="font-mono">API: /api/predict</span>
              <span className="font-mono">PIPELINE: local-v2.2</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Supports: JPEG, PNG, WebP</span>
              <span>Max: 10MB</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
