#!/usr/bin/env node
/**
 * Check console errors on GeoWraith map
 */

import { chromium } from 'playwright';

const consoleMessages = [];
const consoleErrors = [];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Listen to console events
  page.on('console', msg => {
    const entry = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    };
    consoleMessages.push(entry);

    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleErrors.push(entry);
      console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
      if (msg.location()) {
        console.log(`  Location: ${JSON.stringify(msg.location())}`);
      }
    }
  });

  // Listen to page errors
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
    consoleErrors.push({
      type: 'page_error',
      text: error.message,
      stack: error.stack
    });
  });

  console.log('Navigating to http://localhost:3001...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 30000 });

  console.log('Waiting for page to settle...');
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: '/tmp/geowraith_map_check.png', fullPage: true });
  console.log('Screenshot saved to: /tmp/geowraith_map_check.png');

  // Check map elements
  const mapContainers = await page.locator('div[ref], .maplibre-map, .mapboxgl-map').count();
  console.log(`\nFound ${mapContainers} map containers`);

  const canvas = await page.locator('canvas.maplibregl-canvas, canvas.mapboxgl-canvas').count();
  console.log(`Found ${canvas} MapLibre canvas elements`);

  // Check if tiles are being requested
  const tileImages = await page.locator('img[src*="tile.openstreetmap"], img[src*="arcgisonline"]').count();
  console.log(`Found ${tileImages} tile images`);

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Total console messages: ${consoleMessages.length}`);
  console.log(`Total errors/warnings: ${consoleErrors.length}`);

  if (consoleErrors.length > 0) {
    console.log('\n=== CONSOLE ERRORS & WARNINGS ===');
    consoleErrors.forEach(err => {
      console.log(`\n[${err.type.toUpperCase()}]`);
      console.log(`  ${err.text}`);
      if (err.location) {
        console.log(`  Location: ${JSON.stringify(err.location)}`);
      }
      if (err.stack) {
        console.log(`  Stack: ${err.stack}`);
      }
    });
  } else {
    console.log('\n✓ No console errors or warnings detected');
  }

  await browser.close();
})();
