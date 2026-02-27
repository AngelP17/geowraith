#!/usr/bin/env node
/**
 * Test map mode switching
 */

import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();

  let clickCount = 0;
  page.on('console', msg => {
    if (msg.text().includes('activeStyle') || msg.text().includes('mode')) {
      console.log(`[CONSOLE] ${msg.text()}`);
    }
  });

  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

  // Scroll to product and run demo
  const product = page.locator('#product').first();
  if (await product.count() > 0) {
    await product.scrollIntoViewIfNeeded();
  }

  const runDemoBtn = page.locator('button:has-text("Run Demo")').first();
  if (await runDemoBtn.count() > 0) {
    console.log('Clicking "Run Demo"...');
    await runDemoBtn.click();
    await page.waitForTimeout(3000);
  }

  // Test clicking mode buttons
  const modes = ['Standard', 'Satellite', '3D'];

  for (const mode of modes) {
    console.log(`\nTesting ${mode} mode...`);

    const button = page.locator(`button:has-text("${mode}")`).first();

    if (await button.count() > 0) {
      // Check if button is disabled or has no click handler
      const isDisabled = await button.isDisabled();
      console.log(`  Button disabled: ${isDisabled}`);

      // Click the button
      await button.click();
      clickCount++;
      console.log(`  Clicked ${mode} button`);

      // Wait for map to update
      await page.waitForTimeout(2000);

      // Check current active style
      const activeInfo = await page.evaluate(() => {
        const activeBtn = document.querySelector('button[class*="border-amber-500"]');
        return activeBtn?.textContent?.trim() || 'unknown';
      });
      console.log(`  Active mode: ${activeInfo}`);
    } else {
      console.log(`  ⚠ ${mode} button not found`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Total clicks: ${clickCount}`);
  console.log('Test complete. Check if map mode changed visually.');

  await page.waitForTimeout(3000);
  await browser.close();
})();
