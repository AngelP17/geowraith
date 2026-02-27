#!/usr/bin/env node
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Loading page with cache bypass...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

  // Hard refresh
  await page.reload({ waitUntil: 'networkidle' });

  // Scroll to product
  const product = page.locator('#product').first();
  if (await product.count() > 0) {
    await product.scrollIntoViewIfNeeded();
  }

  await page.waitForTimeout(5000);

  // Check map
  const mapInfo = await page.evaluate(() => {
    const mapDiv = document.querySelector('.maplibregl-map');
    const canvas = document.querySelector('canvas.maplibregl-canvas');
    const container = document.querySelector('[class*="h-[500px]"], [class*="aspect-[16/10]"]');

    return {
      container: container ? {
        className: container.className,
        dimensions: `${container.getBoundingClientRect().width}x${container.getBoundingClientRect().height}`
      } : null,
      mapDiv: mapDiv ? `${mapDiv.getBoundingClientRect().width}x${mapDiv.getBoundingClientRect().height}` : null,
      canvas: canvas ? `${canvas.width}x${canvas.height}` : null
    };
  });

  console.log('\nMAP INFO AFTER REFRESH:');
  console.log(JSON.stringify(mapInfo, null, 2));

  await page.screenshot({ path: '/tmp/geowraith_after_fix.png' });
  console.log('\nScreenshot: /tmp/geowraith_after_fix.png');

  await page.waitForTimeout(2000);
  await browser.close();
})();
