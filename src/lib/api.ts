export interface PredictRequest {
  image_base64?: string;
  image_url?: string;
  options?: {
    mode?: 'fast' | 'accurate';
  };
}

export type ConfidenceTier = 'high' | 'medium' | 'low';

export interface PredictResponse {
  request_id: string;
  status: 'ok' | 'low_confidence';
  mode: 'fast' | 'accurate';
  location: {
    lat: number;
    lon: number;
    radius_m: number;
  };
  confidence: number;
  confidence_tier?: ConfidenceTier;
  elapsed_ms: number;
  notes?: string;
  diagnostics?: {
    embedding_source: 'geoclip' | 'fallback';
    reference_index_source: 'model' | 'cache' | 'fallback' | 'unknown';
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
  const res = await fetch(`${API_BASE}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

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
