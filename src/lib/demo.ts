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
    confidence_tier: 'high',
    elapsed_ms: 84,
    notes: 'Demo result (downtown core).',
    scene_context: {
      scene_type: 'urban',
      cohort_hint: 'generic_scene',
      confidence_calibration: 'Urban environments may have moderate precision due to repetitive architecture.'
    },
    diagnostics: {
      embedding_source: 'geoclip',
      reference_index_source: 'model',
      reference_image_anchors: 45
    }
  },
  harbor: {
    request_id: 'demo-harbor-002',
    status: 'ok',
    mode: 'fast',
    location: { lat: 37.808, lon: -122.4177, radius_m: 60 },
    confidence: 0.88,
    confidence_tier: 'medium',
    elapsed_ms: 62,
    notes: 'Demo result (harbor district).',
    scene_context: {
      scene_type: 'urban',
      cohort_hint: 'generic_scene',
      confidence_calibration: 'Urban environments may have moderate precision due to repetitive architecture.'
    },
    diagnostics: {
      embedding_source: 'geoclip',
      reference_index_source: 'cache',
      reference_image_anchors: 32
    }
  },
  industrial: {
    request_id: 'demo-industrial-003',
    status: 'ok',
    mode: 'accurate',
    location: { lat: 40.7128, lon: -74.006, radius_m: 75 },
    confidence: 0.84,
    confidence_tier: 'medium',
    elapsed_ms: 96,
    notes: 'Demo result (industrial zone).',
    scene_context: {
      scene_type: 'urban',
      cohort_hint: 'generic_scene',
      confidence_calibration: 'Urban environments may have moderate precision due to repetitive architecture.'
    },
    diagnostics: {
      embedding_source: 'geoclip',
      reference_index_source: 'model',
      reference_image_anchors: 28
    }
  },
  ridge: {
    request_id: 'demo-ridge-004',
    status: 'ok',
    mode: 'accurate',
    location: { lat: 39.7392, lon: -104.9903, radius_m: 110 },
    confidence: 0.79,
    confidence_tier: 'medium',
    elapsed_ms: 102,
    notes: 'Demo result (mountain ridge).',
    scene_context: {
      scene_type: 'nature',
      cohort_hint: 'generic_scene',
      confidence_calibration: 'Natural terrain typically has wider uncertainty due to fewer distinctive features.'
    },
    diagnostics: {
      embedding_source: 'geoclip',
      reference_index_source: 'model',
      reference_image_anchors: 15
    }
  },
  coastal: {
    request_id: 'demo-coastal-005',
    status: 'ok',
    mode: 'fast',
    location: { lat: 32.7157, lon: -117.1611, radius_m: 58 },
    confidence: 0.87,
    confidence_tier: 'medium',
    elapsed_ms: 71,
    notes: 'Demo result (coastal highway).',
    scene_context: {
      scene_type: 'nature',
      cohort_hint: 'generic_scene',
      confidence_calibration: 'Natural terrain typically has wider uncertainty due to fewer distinctive features.'
    },
    diagnostics: {
      embedding_source: 'geoclip',
      reference_index_source: 'cache',
      reference_image_anchors: 22
    }
  },
  campus: {
    request_id: 'demo-campus-006',
    status: 'ok',
    mode: 'fast',
    location: { lat: 42.3601, lon: -71.0589, radius_m: 50 },
    confidence: 0.9,
    confidence_tier: 'high',
    elapsed_ms: 69,
    notes: 'Demo result (campus quadrant).',
    scene_context: {
      scene_type: 'urban',
      cohort_hint: 'generic_scene',
      confidence_calibration: 'Urban environments may have moderate precision due to repetitive architecture.'
    },
    diagnostics: {
      embedding_source: 'geoclip',
      reference_index_source: 'model',
      reference_image_anchors: 38
    }
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
