import express, { type Request, type Response, type NextFunction } from 'express';
import { config } from './config.js';
import { toErrorResponse } from './errors.js';
import type { PredictRequest } from './types.js';
import { runPredictPipeline } from './services/predictPipeline.js';

/** Create and configure the GeoWraith backend Express application. */
export function createApp() {
  const app = express();
  app.use(express.json({ limit: `${Math.ceil(config.maxImageBytes / (1024 * 1024))}mb` }));

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
      engine: 'local-visual-signal-v1',
    });
  });

  app.get('/', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'geowraith-backend',
      message: 'GeoWraith backend is running',
      endpoints: ['/health', '/api/predict'],
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
