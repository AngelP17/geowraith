import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer, type Server } from 'node:http';
import { after, before, test } from 'node:test';
import { createApp } from './app.js';

const ONE_PIXEL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO8B9RkAAAAASUVORK5CYII=';

let server: Server;
let baseUrl = '';

before(async () => {
  const app = createApp();
  server = createServer(app);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Unable to resolve test server address');
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
});

test('GET /health returns backend status', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  const data = (await response.json()) as { status: string; service: string };
  assert.equal(data.status, 'ok');
  assert.equal(data.service, 'geowraith-backend');
});

test('GET / returns service metadata', async () => {
  const response = await fetch(`${baseUrl}/`);
  assert.equal(response.status, 200);
  const data = (await response.json()) as { status: string; service: string };
  assert.equal(data.status, 'ok');
  assert.equal(data.service, 'geowraith-backend');
});

test('POST /api/predict rejects missing input', async () => {
  const response = await fetch(`${baseUrl}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(response.status, 400);
  const data = (await response.json()) as { error: string };
  assert.equal(data.error, 'missing_input');
});

test('POST /api/predict rejects invalid base64 input', async () => {
  const response = await fetch(`${baseUrl}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_base64: '@@@bad@@@' }),
  });
  assert.equal(response.status, 400);
  const data = (await response.json()) as { error: string };
  assert.equal(data.error, 'invalid_input');
});

test('POST /api/predict returns prediction payload for valid image', async () => {
  const response = await fetch(`${baseUrl}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_base64: ONE_PIXEL_PNG_BASE64,
      options: { mode: 'accurate' },
    }),
  });
  assert.equal(response.status, 200);

  const data = (await response.json()) as {
    status: string;
    confidence: number;
    confidence_tier: 'high' | 'medium' | 'low';
    location: { lat: number; lon: number; radius_m: number };
  };

  // Status can be 'ok' or 'low_confidence' depending on match quality
  assert.ok(data.status === 'ok' || data.status === 'low_confidence', `unexpected status: ${data.status}`);
  assert.equal(typeof data.location.lat, 'number');
  assert.equal(typeof data.location.lon, 'number');
  assert.equal(typeof data.location.radius_m, 'number');
  assert.ok(data.confidence >= 0 && data.confidence <= 1);
  assert.ok(
    ['high', 'medium', 'low'].includes(data.confidence_tier),
    `unexpected confidence_tier: ${data.confidence_tier}`
  );
});
