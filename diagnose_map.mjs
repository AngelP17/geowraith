#!/usr/bin/env node
/**
 * Comprehensive map diagnostic
 */

import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();

  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === 'error') {
      console.log(`[ERROR] ${msg.text()}`);
    }
  });

  console.log('Loading page...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

  // Scroll to product
  const product = page.locator('#product').first();
  if (await product.count() > 0) {
    await product.scrollIntoViewIfNeeded();
  }

  // Wait for map to initialize
  await page.waitForTimeout(6000);

  // Comprehensive diagnostics
  const diagnostics = await page.evaluate(() => {
    const results = {
      canvas: null,
      overlays: [],
      mapContainer: null,
      computedStyles: null,
      tiles: null,
      maplibreState: null
    };

    // 1. Check canvas
    const canvas = document.querySelector('canvas.maplibregl-canvas');
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const style = window.getComputedStyle(canvas);
      results.canvas = {
        exists: true,
        dimensions: `${canvas.width}x${canvas.height}`,
        boundingRect: `${rect.width}x${rect.height}`,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        zIndex: style.zIndex,
        position: style.position
      };
    }

    // 2. Check overlays
    const overlaySelectors = [
      '[class*="absolute"][class*="inset-0"]',
      '[class*="z-20"]',
      '[class*="z-30"]'
    ];
    overlaySelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        results.overlays.push({
          selector,
          className: el.className,
          text: el.textContent?.substring(0, 50),
          dimensions: `${rect.width}x${rect.height}`,
          zIndex: style.zIndex,
          display: style.display,
          opacity: style.opacity
        });
      });
    });

    // 3. Check map container
    const mapContainer = document.querySelector('[class*="aspect-[16/10]"]');
    if (mapContainer) {
      const rect = mapContainer.getBoundingClientRect();
      results.mapContainer = {
        dimensions: `${rect.width}x${rect.height}`,
        childCount: mapContainer.children.length
      };
    }

    // 4. Check if MapLibre is loaded
    results.maplibreState = {
      globalLoaded: typeof window.maplibregl !== 'undefined',
      version: window.maplibregl?.version || null
    };

    return results;
  });

  // Print results
  console.log('\n' + '='.repeat(80));
  console.log('MAP DIAGNOSTICS');
  console.log('='.repeat(80));

  console.log('\n1. CANVAS:');
  console.log(JSON.stringify(diagnostics.canvas, null, 2));

  console.log('\n2. OVERLAYS (' + diagnostics.overlays.length + ' found):');
  diagnostics.overlays.forEach((overlay, i) => {
    console.log(`\n  Overlay #${i + 1}:`);
    console.log(`    Class: ${overlay.className.substring(0, 80)}`);
    console.log(`    Size: ${overlay.dimensions}`);
    console.log(`    Z-Index: ${overlay.zIndex}`);
    console.log(`    Opacity: ${overlay.opacity}`);
    if (overlay.text) {
      console.log(`    Text: ${overlay.text}`);
    }
  });

  console.log('\n3. MAP CONTAINER:');
  console.log(JSON.stringify(diagnostics.mapContainer, null, 2));

  console.log('\n4. MAPLIBRE STATE:');
  console.log(JSON.stringify(diagnostics.maplibreState, null, 2));

  console.log('\n5. CONSOLE MESSAGES:');
  const errors = consoleMessages.filter(m => m.type === 'error');
  const warnings = consoleMessages.filter(m => m.type === 'warning');
  console.log(`  Errors: ${errors.length}`);
  console.log(`  Warnings: ${warnings.length}`);
  if (errors.length > 0) {
    console.log('\n  Error messages:');
    errors.forEach(e => console.log(`    - ${e.text}`));
  }

  // Take screenshot
  await page.screenshot({ path: '/tmp/geowraith_diagnostic.png', fullPage: false });
  console.log('\n6. Screenshot saved to: /tmp/geowraith_diagnostic.png');

  console.log('\n' + '='.repeat(80));

  await page.waitForTimeout(2000);
  await browser.close();
})();
