#!/usr/bin/env node
/**
 * Inspect the actual DOM structure of the map
 */

import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  console.log('Loading page...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Check if ProductUI section exists
  const productSection = await page.locator('#product').count();
  console.log(`Product section: ${productSection > 0 ? 'Found' : 'Not found'}`);

  // Look for divs with specific background color (from MapView.tsx:52)
  const blackBgDivs = await page.locator('div[class*="050505"]').count();
  console.log(`Divs with #050505 background: ${blackBgDivs}`);

  // Check for aspect ratio container (from MapView.tsx:51)
  const aspectRatioDivs = await page.locator('div[class*="aspect-"]').count();
  console.log(`Divs with aspect-ratio: ${aspectRatioDivs}`);

  // Check for MapLibre-specific elements
  const maplibreCanvas = await page.locator('canvas').count();
  console.log(`Total canvas elements: ${maplibreCanvas}`);

  // Get HTML of the map area if it exists
  const mapArea = page.locator('div').filter({ hasText: 'MAP VIEW' }).first();
  const mapAreaExists = await mapArea.count() > 0;

  if (mapAreaExists) {
    console.log('\n✓ Found MAP VIEW section');

    // Get the parent container
    const container = await page.locator('div.relative.rounded-2xl').first();
    const containerHTML = await container.innerHTML().catch(() => '[Could not get HTML]');
    console.log('\nMap container structure (first 500 chars):');
    console.log(containerHTML.substring(0, 500));
  } else {
    console.log('\n✗ MAP VIEW section not found');
  }

  // Check if map container ref exists
  const allDivs = await page.locator('div').all();
  console.log(`\nTotal div elements on page: ${allDivs.length}`);

  // Check for MapLibre CSS
  const maplibreStyles = await page.locator('link[href*="maplibre"], style').count();
  console.log(`MapLibre stylesheets: ${maplibreStyles}`);

  await browser.close();
})();
