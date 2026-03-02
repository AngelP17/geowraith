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
export type HealthServiceStatus = 'healthy' | 'warming' | 'not_ready';

export interface ApiHealthResponse {
  status: 'ok' | 'unhealthy';
  service: string;
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    hnsw_index: {
      status: HealthServiceStatus;
      vectors: number;
      catalog: string;
    };
    ollama: {
      status: 'optional' | 'disabled' | 'healthy' | 'unhealthy';
    };
    memory: {
      used_mb: number;
      total_mb: number;
      system_mb: number;
      usage_percent: number;
    };
  };
  features: {
    verifier_enabled: boolean;
    intelligence_brief_enabled: boolean;
    anomaly_detection_enabled: boolean;
  };
}

export interface ApiReadinessResponse {
  ready: boolean;
  timestamp?: string;
  reason?: string;
}

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
    // Verifier diagnostics
    verifier_invoked?: boolean;
    verifier_stage?: 'rule-based' | 'clip' | 'llm' | 'none';
    verifier_reasoning?: string;
    verifier_override?: boolean;
  };
  // Intelligence brief from LLM
  intelligence_brief?: {
    brief: string;
    generated_at: string;
    model: string;
  };
  // Anomaly alert for hotspots
  anomaly_alert?: {
    message: string;
    level: 'low' | 'medium' | 'high';
    signals_count: number;
  };
}

interface ErrorResponse {
  error?: string;
  message?: string;
  reason?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080';

async function fetchWithTimeout(
  path: string,
  timeoutMs: number,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: init?.signal ?? controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson<T>(path: string, timeoutMs: number): Promise<T> {
  const res = await fetchWithTimeout(path, timeoutMs);

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const err = (await res.json()) as ErrorResponse;
      if (err?.message) message = err.message;
      if (err?.reason) message = err.reason;
    } catch {
      // Ignore JSON parse errors.
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

export async function checkApiHealth(timeoutMs = 1200): Promise<boolean> {
  try {
    const res = await fetchWithTimeout('/health', timeoutMs);
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchApiHealth(timeoutMs = 1200): Promise<ApiHealthResponse> {
  return fetchJson<ApiHealthResponse>('/health', timeoutMs);
}

export async function fetchApiReadiness(timeoutMs = 1800): Promise<ApiReadinessResponse> {
  return fetchJson<ApiReadinessResponse>('/ready', timeoutMs);
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
