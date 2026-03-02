import { Router } from 'express';
import os from 'os';
import { metricsStore } from '../services/metricsStore.js';
import { getHNSWIndexHealth, getHNSWIndexSnapshot } from '../services/geoclipIndex.js';
import { config } from '../config.js';

export const healthRouter = Router();

/**
 * Basic health check endpoint.
 * Returns 200 if all core services are operational.
 */
healthRouter.get('/health', async (_req, res) => {
  try {
    const hnswSnapshot = getHNSWIndexSnapshot();

    const checks = {
      status: 'ok',
      service: 'geowraith-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '0.2.0',
      services: {
        hnsw_index: hnswSnapshot.ready
          ? { status: 'healthy', vectors: hnswSnapshot.vectorCount, catalog: hnswSnapshot.catalog }
          : {
              status: hnswSnapshot.pending ? 'warming' : 'not_ready',
              vectors: hnswSnapshot.vectorCount,
              catalog: hnswSnapshot.catalog,
            },
        ollama: {
          status: config.verifierEnabled ? 'optional' : 'disabled',
        },
        memory: {
          used_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total_mb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          system_mb: Math.round(os.totalmem() / 1024 / 1024),
          usage_percent: Math.round((process.memoryUsage().heapUsed / os.totalmem()) * 100),
        },
      },
      features: {
        verifier_enabled: config.verifierEnabled,
        intelligence_brief_enabled: config.enableIntelligenceBrief,
        anomaly_detection_enabled: config.enableAnomalyDetection,
      },
    };

    res.status(200).json(checks);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed',
    });
  }
});

/**
 * Prometheus-style metrics endpoint.
 * Returns counters and gauges for monitoring systems.
 */
healthRouter.get('/metrics', (_req, res) => {
  const metrics = metricsStore.getPrometheusMetrics();
  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(metrics);
});

/**
 * Readiness check for Kubernetes-style deployments.
 * Verifies all required dependencies are ready.
 */
healthRouter.get('/ready', async (_req, res) => {
  try {
    const hnswHealth = await getHNSWIndexHealth();

    if (!hnswHealth.healthy) {
      res.status(503).json({
        ready: false,
        reason: 'HNSW index not loaded',
      });
      return;
    }

    res.json({
      ready: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      reason: error instanceof Error ? error.message : 'Readiness check failed',
    });
  }
});

/**
 * Liveness check for Kubernetes-style deployments.
 * Simple check that process is running.
 */
healthRouter.get('/live', (_req, res) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
