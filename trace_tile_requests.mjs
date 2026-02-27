#!/usr/bin/env node
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const tileRequests = [];
  const allRequests = [];

  page.on('request', request => {
    const url = request.url();
    allRequests.push(url);

    if (url.includes('tile.openstreetmap') ||
        url.includes('arcgisonline') ||
        url.includes('cached://')) {
      console.log(`[TILE REQUEST] ${url}`);
      tileRequests.push(url);
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('tile.openstreetmap') || url.includes('arcgisonline')) {
      console.log(`[TILE RESPONSE] ${response.status()} ${url}`);
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  console.log('Loading page and monitoring network requests...\n');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

  // Scroll to product
  const product = page.locator('#product').first();
  if (await product.count() > 0) {
    await product.scrollIntoViewIfNeeded();
    console.log('Scrolled to product section\n');
  }

  // Wait for map to initialize
  await page.waitForTimeout(5000);

  // Check map state
  const mapState = await page.evaluate(() => {
    const canvas = document.querySelector('canvas.maplibregl-canvas');
    return {
      canvasExists: Boolean(canvas),
      canvasDimensions: canvas ? `${canvas.width}x${canvas.height}` : null,
      maplibreLoaded: typeof window.maplibregl !== 'undefined'
    };
  });

  console.log('\n' + '='.repeat(70));
  console.log('MAP STATE:');
  console.log(`  Canvas exists: ${mapState.canvasExists}`);
  console.log(`  Canvas dimensions: ${mapState.canvasDimensions}`);
  console.log(`  MapLibre loaded: ${mapState.maplibreLoaded}`);

  console.log('\nNETWORK REQUESTS:');
  console.log(`  Total requests: ${allRequests.length}`);
  console.log(`  Tile requests: ${tileRequests.length}`);

  if (tileRequests.length > 0) {
    console.log('\n  Tile URLs requested:');
    tileRequests.forEach(url => console.log(`    - ${url}`));
  } else {
    console.log('\n  ✗ NO TILE REQUESTS MADE');
  }

  // Take screenshot
  await page.screenshot({ path: '/tmp/geowraith_tile_trace.png' });
  console.log('\nScreenshot saved to: /tmp/geowraith_tile_trace.png');

  await page.waitForTimeout(2000);
  await browser.close();
})();
