/**
 * Retry utilities for city scraper with exponential backoff.
 */

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
};

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponential = config.baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  return Math.min(exponential + jitter, config.maxDelayMs);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  operationName: string,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === fullConfig.maxRetries) {
        break;
      }

      const delay = calculateDelay(attempt, fullConfig);
      console.log(`  ⚠️ ${operationName} failed (attempt ${attempt + 1}/${fullConfig.maxRetries + 1}): ${lastError.message}`);
      console.log(`     Retrying in ${Math.round(delay / 1000)}s...`);
      await sleep(delay);
    }
  }

  throw new Error(`${operationName} failed after ${fullConfig.maxRetries + 1} attempts: ${lastError?.message}`);
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
      return true;
    }
    // HTTP errors that are retryable
    if (message.includes('http 429') || message.includes('http 503') || message.includes('http 502')) {
      return true;
    }
    // Rate limit errors
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return true;
    }
  }
  return false;
}
