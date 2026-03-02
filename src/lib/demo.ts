import type { PredictResponse } from './api';
import type { Mode } from '../components/product/types';

export type DemoKey =
  | 'downtown'
  | 'harbor'
  | 'industrial'
  | 'ridge'
  | 'coastal'
  | 'campus';

export interface DemoScenario {
  id: DemoKey;
  title: string;
  description: string;
  imageSrc: string;
  defaultMode: Mode;
  featureHighlights: string[];
  result: PredictResponse;
}

export const DEFAULT_DEMO_SCENARIO: DemoKey = 'industrial';

export const demoScenarios: DemoScenario[] = [
  {
    id: 'industrial',
    title: 'Industrial Signal Stack',
    description: 'Full hybrid path with verifier diagnostics, anomaly overlay, and intelligence brief.',
    imageSrc: '/demo/industrial-zone.svg',
    defaultMode: 'accurate',
    featureHighlights: ['Verifier', 'Anomaly Layers', 'Intelligence Brief', 'Shareable Report'],
    result: {
      request_id: 'demo-industrial-003',
      status: 'ok',
      mode: 'accurate',
      location: { lat: 40.7128, lon: -74.006, radius_m: 75 },
      confidence: 0.84,
      confidence_tier: 'medium',
      elapsed_ms: 96,
      notes: 'Verifier adjusted the initial district-level guess using streetscape evidence.',
      scene_context: {
        scene_type: 'urban',
        cohort_hint: 'generic_scene',
        confidence_calibration:
          'Dense industrial zones can alias visually; verifier review improves district selection.',
      },
      diagnostics: {
        embedding_source: 'geoclip',
        reference_index_source: 'model',
        reference_image_anchors: 28,
        verifier_invoked: true,
        verifier_stage: 'llm',
        verifier_reasoning: 'Street furniture and signage aligned with the corridor cluster.',
        verifier_override: true,
      },
      intelligence_brief: {
        brief:
          'Industrial corridor with strong freight, port, and utility signatures. Prioritize rail, warehouse, and waterfront context for follow-up verification.',
        generated_at: '2026-03-02T17:30:00.000Z',
        model: 'qwen3.5:32b',
      },
      anomaly_alert: {
        message: '3 nearby industrial risk signals intersect the current radius.',
        level: 'medium',
        signals_count: 3,
      },
    },
  },
  {
    id: 'downtown',
    title: 'Downtown EXIF Lock',
    description: 'Embedded GPS survives universal image conversion and drives an exact center fix.',
    imageSrc: '/demo/downtown-core.svg',
    defaultMode: 'accurate',
    featureHighlights: ['EXIF GPS', 'High Confidence', 'Report Export'],
    result: {
      request_id: 'demo-downtown-001',
      status: 'ok',
      mode: 'accurate',
      location: { lat: 34.0522, lon: -118.2437, radius_m: 45 },
      confidence: 0.92,
      confidence_tier: 'high',
      elapsed_ms: 84,
      notes: 'Embedded EXIF GPS was preserved during normalization and used as the primary center point.',
      scene_context: {
        scene_type: 'urban',
        cohort_hint: 'generic_scene',
        confidence_calibration:
          'Urban environments may have moderate precision variance, but embedded GPS materially improves certainty.',
      },
      diagnostics: {
        embedding_source: 'geoclip',
        reference_index_source: 'model',
        reference_image_anchors: 45,
      },
    },
  },
  {
    id: 'harbor',
    title: 'Harbor OSV Sweep',
    description: 'Street-scene enrichment tightens a corridor match along the waterfront approach.',
    imageSrc: '/demo/harbor-district.svg',
    defaultMode: 'fast',
    featureHighlights: ['OSV Corpus', 'Street View Match', 'Mission Replay'],
    result: {
      request_id: 'demo-harbor-002',
      status: 'ok',
      mode: 'fast',
      location: { lat: 37.808, lon: -122.4177, radius_m: 60 },
      confidence: 0.88,
      confidence_tier: 'medium',
      elapsed_ms: 62,
      notes: 'OSV-enriched reference vectors narrowed the harbor corridor to the waterfront ramp.',
      scene_context: {
        scene_type: 'urban',
        cohort_hint: 'generic_scene',
        confidence_calibration:
          'Street-aligned imagery benefits from denser reference coverage around repetitive waterfront geometry.',
      },
      diagnostics: {
        embedding_source: 'geoclip',
        reference_index_source: 'cache',
        reference_image_anchors: 32,
      },
    },
  },
  {
    id: 'ridge',
    title: 'Mountain Ridge Hold',
    description: 'Low-confidence terrain case that keeps operator-safe withholding visible on the demo route.',
    imageSrc: '/demo/mountain-ridge.svg',
    defaultMode: 'accurate',
    featureHighlights: ['Operator Safe Mode', 'Withheld Output', 'Terrain Uncertainty'],
    result: {
      request_id: 'demo-ridge-004',
      status: 'low_confidence',
      mode: 'accurate',
      location: { lat: 39.7392, lon: -104.9903, radius_m: 1100 },
      location_visibility: 'withheld',
      location_reason: 'insufficient_landmarks',
      confidence: 0.49,
      confidence_tier: 'low',
      elapsed_ms: 102,
      notes: 'Natural terrain is too ambiguous for an operator-safe release without more landmarks.',
      scene_context: {
        scene_type: 'nature',
        cohort_hint: 'generic_scene',
        confidence_calibration:
          'Natural terrain typically has wider uncertainty because ridge lines and trail cuts repeat across regions.',
      },
      diagnostics: {
        embedding_source: 'geoclip',
        reference_index_source: 'model',
        reference_image_anchors: 15,
      },
    },
  },
  {
    id: 'coastal',
    title: 'Coastal Brief',
    description: 'Nature-heavy scene with a generated intelligence brief layered onto the result.',
    imageSrc: '/demo/coastal-highway.svg',
    defaultMode: 'fast',
    featureHighlights: ['Intelligence Brief', 'Nature Scene', 'Replay Mode'],
    result: {
      request_id: 'demo-coastal-005',
      status: 'ok',
      mode: 'fast',
      location: { lat: 32.7157, lon: -117.1611, radius_m: 58 },
      confidence: 0.87,
      confidence_tier: 'medium',
      elapsed_ms: 71,
      notes: 'Coastal roadway geometry and marine horizon cues produce a stable corridor estimate.',
      scene_context: {
        scene_type: 'nature',
        cohort_hint: 'generic_scene',
        confidence_calibration:
          'Natural coastline cues are strong here, but repeating cliff and highway geometry widens the final radius.',
      },
      diagnostics: {
        embedding_source: 'geoclip',
        reference_index_source: 'cache',
        reference_image_anchors: 22,
      },
      intelligence_brief: {
        brief:
          'Likely coastal arterial with exposed marine edge, shallow grade, and open western horizon. Prioritize bridge spans, guardrail style, and bluff vegetation for confirmation.',
        generated_at: '2026-03-02T17:34:00.000Z',
        model: 'qwen3.5:32b',
      },
    },
  },
  {
    id: 'campus',
    title: 'Campus Grid',
    description: 'Clean urban replay with high confidence and shareable reporting ready by default.',
    imageSrc: '/demo/campus-quadrant.svg',
    defaultMode: 'fast',
    featureHighlights: ['Shareable Report', 'High Confidence', 'Fast Scan'],
    result: {
      request_id: 'demo-campus-006',
      status: 'ok',
      mode: 'fast',
      location: { lat: 42.3601, lon: -71.0589, radius_m: 50 },
      confidence: 0.9,
      confidence_tier: 'high',
      elapsed_ms: 69,
      notes: 'Symmetric pathways and institutional architecture produce a stable quadrant lock.',
      scene_context: {
        scene_type: 'urban',
        cohort_hint: 'generic_scene',
        confidence_calibration:
          'Institutional campuses remain moderately repetitive, but distinct walkway geometry supports a high-confidence result.',
      },
      diagnostics: {
        embedding_source: 'geoclip',
        reference_index_source: 'model',
        reference_image_anchors: 38,
        verifier_invoked: true,
        verifier_stage: 'rule-based',
        verifier_reasoning: 'Campus axis lines align with the retrieved reference cohort.',
        verifier_override: false,
      },
      intelligence_brief: {
        brief:
          'Institutional quad with organized footpaths, low vehicular density, and academic building cadence. Cross-check clock towers, banners, and paving geometry for confirmation.',
        generated_at: '2026-03-02T17:38:00.000Z',
        model: 'qwen3.5:32b',
      },
    },
  },
];

const demoScenarioMap = Object.fromEntries(
  demoScenarios.map((scenario) => [scenario.id, scenario])
) as Record<DemoKey, DemoScenario>;

function normalizeMode(mode?: string | null): Mode | undefined {
  return mode === 'fast' || mode === 'accurate' ? mode : undefined;
}

export function getDemoScenario(id?: string | null): DemoScenario {
  if (id && id in demoScenarioMap) {
    return demoScenarioMap[id as DemoKey];
  }
  return demoScenarioMap[DEFAULT_DEMO_SCENARIO];
}

export function getDemoResult(key?: string | null, mode?: Mode): PredictResponse {
  const scenario = getDemoScenario(key);
  return {
    ...scenario.result,
    mode: mode ?? scenario.defaultMode,
  };
}

export function parseDemoSearch(search: string): {
  scenarioId: DemoKey;
  mode?: Mode;
} {
  const params = new URLSearchParams(search);
  return {
    scenarioId: getDemoScenario(params.get('scenario')).id,
    mode: normalizeMode(params.get('mode')),
  };
}

export function buildDemoUrl(scenarioId: DemoKey, mode?: Mode): string {
  const params = new URLSearchParams({ scenario: scenarioId });
  if (mode) {
    params.set('mode', mode);
  }
  return `/demo?${params.toString()}`;
}
