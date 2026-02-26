import express, { type Request, type Response, type NextFunction } from 'express';
import { config } from './config.js';
import { toErrorResponse } from './errors.js';
import type { PredictRequest } from './types.js';
import { runPredictPipeline } from './services/predictPipeline.js';

/** Create and configure the GeoWraith backend Express application. */
export function createApp() {
  const app = express();
  app.use(express.json({ limit: `${Math.ceil(config.maxImageBytes / (1024 * 1024))}mb` }));
  const endpoints = ['/health', '/api/predict'];
  if (config.sfmEnabled) {
    endpoints.push('/api/predict/sfm');
  }

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'geowraith-backend',
      version: '0.2.0',
      offline_mode: config.offlineMode,
      sfm_enabled: config.sfmEnabled,
      engine: 'local-visual-signal-v1',
    });
  });

  app.get('/', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'geowraith-backend',
      message: 'GeoWraith backend is running',
      endpoints,
    });
  });

  app.post('/api/predict', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await runPredictPipeline(req.body as PredictRequest);
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/predict/sfm', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!config.sfmEnabled) {
        res.status(503).json({
          error: 'feature_disabled',
          message: 'SfM endpoint is temporarily disabled and scheduled as a future feature update.',
        });
        return;
      }

      const { image_base64, coarse_location, radius_meters = 1000, max_references = 50 } = req.body;
      
      if (!image_base64 || !coarse_location) {
        res.status(400).json({
          error: 'invalid_input',
          message: 'Required: image_base64, coarse_location',
        });
        return;
      }

      const imageBuffer = Buffer.from(image_base64, 'base64');
      const { runSfMPipeline } = await import('./sfm/pipeline.js');
      const result = await runSfMPipeline(imageBuffer, {
        coarseLocation: coarse_location,
        radiusMeters: radius_meters,
        maxReferences: max_references,
      });

      res.json({
        success: result.success,
        location: result.location,
        confidence: result.confidence,
        processing_time_ms: result.processingTimeMs,
        error: result.error,
      });
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const { statusCode, body } = toErrorResponse(error);
    if (statusCode >= 500) {
      // eslint-disable-next-line no-console
      console.error('[geowraith-backend] request failed', error);
    } else {
      // eslint-disable-next-line no-console
      console.warn(`[geowraith-backend] request rejected: ${body.error} - ${body.message}`);
    }
    res.status(statusCode).json(body);
  });

  return app;
}
