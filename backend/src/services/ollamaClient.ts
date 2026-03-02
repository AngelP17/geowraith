/**
 * Ollama API client with circuit breaker pattern for LLM verification.
 * Handles Qwen 3.5 model communication with graceful degradation.
 */

import { config } from '../config.js';

interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[]; // Base64-encoded images for vision models
}

interface OllamaRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  format?: 'json';
  options?: {
    temperature?: number;
    num_predict?: number;
    num_ctx?: number;
  };
}

interface OllamaResponse {
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

class OllamaClient {
  private endpoint: string;
  private model: string;
  private timeout: number;
  private circuitBreaker: CircuitBreakerState;
  private readonly maxFailures = 3;
  private readonly resetTimeoutMs = 5 * 60 * 1000; // 5 minutes

  constructor(
    endpoint: string = config.ollamaEndpoint,
    model: string = config.verifierModel,
    timeout: number = config.verifierTimeout
  ) {
    this.endpoint = endpoint;
    this.model = model;
    this.timeout = timeout;
    this.circuitBreaker = { failures: 0, lastFailure: 0, isOpen: false };
  }

  /** Check if circuit breaker allows requests */
  private canMakeRequest(): boolean {
    if (!this.circuitBreaker.isOpen) return true;

    // Check if reset timeout has passed
    const timeSinceFailure = Date.now() - this.circuitBreaker.lastFailure;
    if (timeSinceFailure > this.resetTimeoutMs) {
      this.circuitBreaker.isOpen = false;
      this.circuitBreaker.failures = 0;
      return true;
    }

    return false;
  }

  /** Record a failure and potentially open circuit */
  private recordFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = Date.now();

    if (this.circuitBreaker.failures >= this.maxFailures) {
      this.circuitBreaker.isOpen = true;
      console.warn('[OllamaClient] Circuit breaker opened after', this.maxFailures, 'failures');
    }
  }

  /** Record a success and reset circuit */
  private recordSuccess(): void {
    if (this.circuitBreaker.failures > 0) {
      this.circuitBreaker.failures = 0;
      this.circuitBreaker.isOpen = false;
    }
  }

  /**
   * Check if Ollama is healthy and model is available.
   */
  async healthCheck(): Promise<{
    available: boolean;
    model?: string;
    error?: string;
  }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.endpoint}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return { available: false, error: `HTTP ${response.status}` };
      }

      const data = (await response.json()) as { models?: Array<{ name: string }> };
      const hasModel = data.models?.some((m) => m.name.includes(this.model)) ?? false;

      return {
        available: hasModel,
        model: this.model,
        error: hasModel ? undefined : `Model ${this.model} not found`,
      };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /**
   * Send chat completion request to Ollama.
   */
  async chat(
    messages: OllamaMessage[],
    options: { format?: 'json'; temperature?: number; numPredict?: number; numCtx?: number } = {}
  ): Promise<string> {
    if (!this.canMakeRequest()) {
      throw new Error('Circuit breaker is open - Ollama temporarily unavailable');
    }

    const requestBody: OllamaRequest = {
      model: this.model,
      messages,
      stream: false,
      format: options.format,
      options: {
        temperature: options.temperature ?? 0.3,
        num_predict: options.numPredict ?? 512,
        num_ctx: options.numCtx ?? 8192, // 8K context max for M4 24GB
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.endpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama HTTP ${response.status}: ${await response.text()}`);
      }

      const data = (await response.json()) as OllamaResponse;
      this.recordSuccess();
      return data.message.content;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Generate intelligence brief for a location.
   */
  async generateIntelligenceBrief(
    lat: number,
    lon: number,
    imageBase64: string
  ): Promise<string> {
    const prompt = `You are a geospatial intelligence analyst. Based on this image and location (${lat.toFixed(4)}, ${lon.toFixed(4)}), provide a 3-sentence brief covering:

1. Nearby infrastructure (military bases, airports, ports, data centers within 50km)
2. Recent notable events or hotspots in this region
3. Geographic or strategic significance

Be factual and concise. Use public knowledge only.`;

    const content = await this.chat(
      [
        {
          role: 'user',
          content: prompt,
          images: [imageBase64],
        },
      ],
      { temperature: 0.3, numPredict: 256 }
    );

    return content.trim();
  }

  /**
   * Verify prediction candidates using visual analysis.
   */
  async verifyPrediction(
    imageBase64: string,
    candidates: Array<{ label: string; lat: number; lon: number }>
  ): Promise<{
    bestIndex: number;
    confidence: number;
    reasoning: string;
  }> {
    const prompt = `You are an expert visual geolocator. Analyze this image and these candidate locations.

Candidates:
${candidates.map((c, i) => `${i}. ${c.label} (${c.lat.toFixed(4)}, ${c.lon.toFixed(4)})`).join('\n')}

Use visible cues: architecture, vegetation, climate, signs, cultural context, lighting angle.

Respond with VALID JSON ONLY:
{
  "bestIndex": <0-${candidates.length - 1}>,
  "confidence": <0-100>,
  "reasoning": "<short explanation>",
  "finalLat": <number>,
  "finalLon": <number>
}`;

    const content = await this.chat(
      [
        {
          role: 'user',
          content: prompt,
          images: [imageBase64],
        },
      ],
      { format: 'json', temperature: 0.2, numPredict: 256 }
    );

    try {
      const parsed = JSON.parse(content);
      return {
        bestIndex: parsed.bestIndex ?? 0,
        confidence: parsed.confidence ?? 50,
        reasoning: parsed.reasoning ?? 'No reasoning provided',
      };
    } catch {
      // Fallback if JSON parsing fails
      return {
        bestIndex: 0,
        confidence: 50,
        reasoning: 'Failed to parse LLM response',
      };
    }
  }
}

// Singleton instance
export const ollamaClient = new OllamaClient();
export { OllamaClient };
