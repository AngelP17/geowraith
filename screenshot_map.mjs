#!/usr/bin/env node
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Scroll to product
  const product = page.locator('#product').first();
  if (await product.count() > 0) {
    await product.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);
  }

  // Take full screenshot
  await page.screenshot({ path: '/tmp/geowraith_full_map.png', fullPage: false });

  // Check map state
  const canvas = await page.locator('canvas.maplibregl-canvas').count();
  const tiles = await page.evaluate(() => {
    const canvas = document.querySelector('canvas.maplibregl-canvas');
    if (!canvas) return { exists: false };

    // Check if canvas has been drawn to
    const ctx = canvas.getContext('2d');
    const imageData = ctx?.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100));
    const data = imageData?.data || [];

    // Check if there's any non-black pixels
    let nonBlack = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] !== 0 || data[i+1] !== 0 || data[i+2] !== 0) {
        nonBlack++;
      }
    }

    return {
      exists: true,
      dimensions: `${canvas.width}x${canvas.height}`,
      hasNonBlackPixels: nonBlack > 10,
      nonBlackPixelCount: nonBlack
    };
  });

  console.log('Canvas:', canvas > 0 ? 'EXISTS' : 'MISSING');
  console.log('Tile data:', JSON.stringify(tiles, null, 2));
  console.log('\nScreenshot saved to: /tmp/geowraith_full_map.png');

  await page.waitForTimeout(2000);
  await browser.close();
})();
