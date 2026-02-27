#!/usr/bin/env node
/**
 * Scroll to Product UI and inspect map
 */

import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log(`[ERROR] ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push(error.message);
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  console.log('Loading page...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Find and scroll to Product UI section
  console.log('\nLooking for Product UI section...');
  const productSection = page.locator('#product, section:has-text("Try It Live")').first();

  if (await productSection.count() > 0) {
    console.log('✓ Found Product UI section, scrolling into view...');
    await productSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
  }

  // Take screenshot of product section
  await page.screenshot({ path: '/tmp/geowraith_product_section.png', fullPage: false });
  console.log('Screenshot saved to: /tmp/geowraith_product_section.png');

  // Check for map elements
  const mapContainer = await page.locator('div[class*="aspect-[16/10]"]').first();
  const hasMapContainer = await mapContainer.count() > 0;
  console.log(`\nMap container (aspect-16/10): ${hasMapContainer ? 'Found' : 'Not found'}`);

  if (hasMapContainer) {
    // Get bounding box
    const box = await mapContainer.boundingBox();
    console.log(`Map container dimensions: ${box ? `${box.width}x${box.height}` : 'invisible'}`);

    // Check for canvas inside
    const canvas = await mapContainer.locator('canvas').count();
    console.log(`Canvas elements inside map container: ${canvas}`);

    // Check for the specific black background div
    const blackDiv = await mapContainer.locator('div[class*="050505"]').count();
    console.log(`Black background divs: ${blackDiv}`);

    // Get the HTML
    const html = await mapContainer.innerHTML();
    console.log(`\nMap container HTML (first 1000 chars):\n${html.substring(0, 1000)}`);
  }

  // Check if MapLibre loaded
  const hasMapLibreGlobal = await page.evaluate(() => {
    return typeof window.maplibregl !== 'undefined';
  });
  console.log(`\nMapLibre GL loaded globally: ${hasMapLibreGlobal}`);

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Total console errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('\nErrors:');
    consoleErrors.forEach(err => console.log(`  - ${err}`));
  }

  await browser.close();
})();
