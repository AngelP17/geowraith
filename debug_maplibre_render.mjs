#!/usr/bin/env node
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

  // Scroll to product
  const product = page.locator('#product').first();
  if (await product.count() > 0) {
    await product.scrollIntoViewIfNeeded();
  }

  // Wait longer for tiles to render
  await page.waitForTimeout(8000);

  // Debug MapLibre state
  const mapDebug = await page.evaluate(() => {
    const canvas = document.querySelector('canvas.maplibregl-canvas');
    if (!canvas) return { error: 'No canvas found' };

    // Try to access MapLibre map instance
    const container = canvas.closest('.maplibregl-map, [class*="maplibre"]');

    // Check canvas rendering
    const ctx = canvas.getContext('2d');
    const sample = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data;

    // Check for error overlays
    const errorOverlay = document.querySelector('[class*="bg-[#050505]/70"]');
    const errorText = errorOverlay?.textContent || null;

    // Check canvas styles
    const computedStyle = window.getComputedStyle(canvas);

    return {
      canvasExists: true,
      canvasDimensions: `${canvas.width}x${canvas.height}`,
      canvasVisible: computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden',
      canvasOpacity: computedStyle.opacity,
      centerPixel: Array.from(sample),
      errorOverlay: Boolean(errorOverlay),
      errorText,
      containerClasses: container?.className || null
    };
  });

  console.log('\n' + '='.repeat(70));
  console.log('MAPLIBRE RENDER DEBUG:');
  console.log(JSON.stringify(mapDebug, null, 2));

  // Take final screenshot
  await page.screenshot({ path: '/tmp/geowraith_render_debug.png', fullPage: false });
  console.log('\nScreenshot: /tmp/geowraith_render_debug.png');

  await page.waitForTimeout(2000);
  await browser.close();
})();
