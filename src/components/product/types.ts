/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PredictResponse } from '../../lib/api';

export type Mode = 'fast' | 'accurate';
export type AnalysisPhase = 'idle' | 'uploading' | 'scanning' | 'processing' | 'complete' | 'error';

export interface AnalysisState {
  phase: AnalysisPhase;
  errorMsg: string;
  result: PredictResponse | null;
  scanProgress: number;
}

export interface ViewState {
  zoom: number;
  pitch: number;
  bearing: number;
}

export interface ModeConfig {
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}

export const SCAN_LINES = 12;
export const RADAR_SWEEP_DURATION = 2;

export const phaseMessages: Record<Exclude<AnalysisPhase, 'idle' | 'complete' | 'error'>, string> = {
  uploading: 'Ingesting imagery...',
  scanning: 'Detecting visual landmarks...',
  processing: 'Triangulating coordinates...',
};
