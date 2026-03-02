/**
 * In-memory metrics store for Prometheus-style monitoring.
 * Tracks predictions, verifier invocations, and accuracy over time.
 */

interface MetricsSnapshot {
  predictions: number;
  verifierInvocations: number;
  verifierOverrides: number;
  lastAccuracy: number;
  latencySum: number;
  latencyCount: number;
  errors: number;
  timestamp: Date;
}

class MetricsStore {
  private metrics: MetricsSnapshot;
  private history: MetricsSnapshot[] = [];
  private readonly maxHistory = 1000;

  constructor() {
    this.metrics = this.createEmptySnapshot();
  }

  private createEmptySnapshot(): MetricsSnapshot {
    return {
      predictions: 0,
      verifierInvocations: 0,
      verifierOverrides: 0,
      lastAccuracy: 0,
      latencySum: 0,
      latencyCount: 0,
      errors: 0,
      timestamp: new Date(),
    };
  }

  /** Record a prediction request */
  recordPrediction(latencyMs: number): void {
    this.metrics.predictions++;
    this.metrics.latencySum += latencyMs;
    this.metrics.latencyCount++;
  }

  /** Record verifier invocation */
  recordVerifierInvocation(didOverride: boolean): void {
    this.metrics.verifierInvocations++;
    if (didOverride) {
      this.metrics.verifierOverrides++;
    }
  }

  /** Record error */
  recordError(): void {
    this.metrics.errors++;
  }

  /** Update accuracy score */
  setAccuracy(accuracy: number): void {
    this.metrics.lastAccuracy = accuracy;
  }

  /** Get current metrics */
  getMetrics(): MetricsSnapshot {
    return { ...this.metrics, timestamp: new Date() };
  }

  /** Get Prometheus-formatted metrics */
  getPrometheusMetrics(): string {
    const m = this.metrics;
    const avgLatency = m.latencyCount > 0 ? m.latencySum / m.latencyCount : 0;

    return `
# HELP geowraith_predictions_total Total prediction requests
# TYPE geowraith_predictions_total counter
geowraith_predictions_total ${m.predictions}

# HELP geowraith_verifier_invocations_total Verifier invocations
# TYPE geowraith_verifier_invocations_total counter
geowraith_verifier_invocations_total ${m.verifierInvocations}

# HELP geowraith_verifier_overrides_total Verifier overrides
# TYPE geowraith_verifier_overrides_total counter
geowraith_verifier_overrides_total ${m.verifierOverrides}

# HELP geowraith_accuracy_score Current validation accuracy (0-1)
# TYPE geowraith_accuracy_score gauge
geowraith_accuracy_score ${m.lastAccuracy}

# HELP geowraith_latency_average Average prediction latency in ms
# TYPE geowraith_latency_average gauge
geowraith_latency_average ${avgLatency.toFixed(2)}

# HELP geowraith_errors_total Total errors
# TYPE geowraith_errors_total counter
geowraith_errors_total ${m.errors}
`.trim();
  }

  /** Archive current metrics to history */
  archive(): void {
    this.history.push({ ...this.metrics, timestamp: new Date() });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /** Get historical metrics */
  getHistory(): MetricsSnapshot[] {
    return [...this.history];
  }

  /** Reset all metrics */
  reset(): void {
    this.archive();
    this.metrics = this.createEmptySnapshot();
  }
}

// Singleton instance
export const metricsStore = new MetricsStore();
