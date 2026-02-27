export interface PredictRequest {
  image_base64?: string;
  image_url?: string;
  options?: {
    mode?: 'fast' | 'accurate';
  };
}

export type ConfidenceTier = 'high' | 'medium' | 'low';
export type SceneType = 'landmark' | 'nature' | 'urban' | 'rural' | 'unknown';
export type CohortHint = 'iconic_landmark' | 'generic_scene';

export interface PredictResponse {
  request_id: string;
  status: 'ok' | 'low_confidence';
  mode: 'fast' | 'accurate';
  location: {
    lat: number;
    lon: number;
    radius_m: number;
  };
  location_visibility?: 'visible' | 'withheld';
  location_reason?: string;
  confidence: number;
  confidence_tier?: ConfidenceTier;
  scene_context?: {
    scene_type: SceneType;
    cohort_hint: CohortHint;
    confidence_calibration: string;
  };
  elapsed_ms: number;
  notes?: string;
  diagnostics?: {
    embedding_source: 'geoclip' | 'clip' | 'fallback';
    reference_index_source: 'model' | 'cache' | 'clip' | 'fallback' | 'unknown';
    reference_image_anchors?: number;
  };
}

interface ErrorResponse {
  error?: string;
  message?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080';

export async function checkApiHealth(timeoutMs = 1200): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function predictImage(
  payload: PredictRequest,
  signal?: AbortSignal
): Promise<PredictResponse> {
  let res: Response;

  try {
    res = await fetch(`${API_BASE}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }

    throw new Error(
      `Live API unavailable at ${API_BASE}. Start both services with "npm run start" or run "cd backend && npm run dev".`
    );
  }

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const err = (await res.json()) as ErrorResponse;
      if (err?.message) message = err.message;
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(message);
  }

  return (await res.json()) as PredictResponse;
}
