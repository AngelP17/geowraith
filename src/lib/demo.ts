import type { PredictResponse } from './api';
import type { Mode } from '../components/product/types';

export type DemoKey =
  | 'downtown'
  | 'harbor'
  | 'industrial'
  | 'ridge'
  | 'coastal'
  | 'campus';

const demoResults: Record<DemoKey, PredictResponse> = {
  downtown: {
    request_id: 'demo-downtown-001',
    status: 'ok',
    mode: 'accurate',
    location: { lat: 34.0522, lon: -118.2437, radius_m: 45 },
    confidence: 0.92,
    elapsed_ms: 84,
    notes: 'Demo result (downtown core).',
  },
  harbor: {
    request_id: 'demo-harbor-002',
    status: 'ok',
    mode: 'fast',
    location: { lat: 37.808, lon: -122.4177, radius_m: 60 },
    confidence: 0.88,
    elapsed_ms: 62,
    notes: 'Demo result (harbor district).',
  },
  industrial: {
    request_id: 'demo-industrial-003',
    status: 'ok',
    mode: 'accurate',
    location: { lat: 40.7128, lon: -74.006, radius_m: 75 },
    confidence: 0.84,
    elapsed_ms: 96,
    notes: 'Demo result (industrial zone).',
  },
  ridge: {
    request_id: 'demo-ridge-004',
    status: 'ok',
    mode: 'accurate',
    location: { lat: 39.7392, lon: -104.9903, radius_m: 110 },
    confidence: 0.79,
    elapsed_ms: 102,
    notes: 'Demo result (mountain ridge).',
  },
  coastal: {
    request_id: 'demo-coastal-005',
    status: 'ok',
    mode: 'fast',
    location: { lat: 32.7157, lon: -117.1611, radius_m: 58 },
    confidence: 0.87,
    elapsed_ms: 71,
    notes: 'Demo result (coastal highway).',
  },
  campus: {
    request_id: 'demo-campus-006',
    status: 'ok',
    mode: 'fast',
    location: { lat: 42.3601, lon: -71.0589, radius_m: 50 },
    confidence: 0.9,
    elapsed_ms: 69,
    notes: 'Demo result (campus quadrant).',
  },
};

export const getDemoResult = (key?: DemoKey): PredictResponse => {
  if (key && demoResults[key]) return demoResults[key];
  const keys = Object.keys(demoResults) as DemoKey[];
  return demoResults[keys[Math.floor(Math.random() * keys.length)]];
};

export const dispatchDemo = (key?: DemoKey, mode?: Mode) => {
  const detail = { result: getDemoResult(key), mode };
  window.dispatchEvent(new CustomEvent('geowraith:demo', { detail }));
};
