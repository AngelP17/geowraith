import { createApp } from './app.js';
import { config } from './config.js';
import { warmupCLIP } from './services/clipExtractor.js';
import { warmupReferenceIndex } from './services/geoclipIndex.js';

async function startServer() {
  try {
    await warmupCLIP();
    await warmupReferenceIndex();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[GeoCLIP] Warmup failed, service will use fallback embedding path:', error);
  }

  const app = createApp();
  app.listen(config.apiPort, () => {
    // eslint-disable-next-line no-console
    console.log(`GeoWraith API listening on http://localhost:${config.apiPort}`);
  });
}

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start GeoWraith API', error);
  process.exit(1);
});
