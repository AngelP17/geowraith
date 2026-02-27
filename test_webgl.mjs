#!/usr/bin/env node
/**
 * Test WebGL support in both headless and headful modes
 */

import { chromium } from 'playwright';

async function testWebGL(headless) {
  const browser = await chromium.launch({ headless, args: headless ? ['--use-gl=angle'] : [] });
  const page = await browser.newPage();

  await page.goto('http://localhost:3001');
  await page.waitForTimeout(2000);

  // Scroll to product section
  const productSection = page.locator('#product').first();
  if (await productSection.count() > 0) {
    await productSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
  }

  // Check WebGL support
  const webglInfo = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    const hasWebGLContext = Boolean(window.WebGLRenderingContext);
    const webgl2 = canvas.getContext('webgl2');
    const webgl = canvas.getContext('webgl');
    const experimental = canvas.getContext('experimental-webgl');

    return {
      hasWebGLContext,
      hasWebGL2: Boolean(webgl2),
      hasWebGL: Boolean(webgl),
      hasExperimental: Boolean(experimental),
      detected: Boolean(hasWebGLContext && (webgl2 || webgl || experimental))
    };
  });

  // Check map error
  const mapError = await page.locator('text=WebGL is unavailable').count();
  const hasCanvas = await page.locator('canvas.maplibregl-canvas').count();

  console.log(`\n${headless ? 'HEADLESS' : 'HEADFUL'} MODE:`);
  console.log(`  WebGLRenderingContext: ${webglInfo.hasWebGLContext}`);
  console.log(`  WebGL2 context: ${webglInfo.hasWebGL2}`);
  console.log(`  WebGL context: ${webglInfo.hasWebGL}`);
  console.log(`  Experimental WebGL: ${webglInfo.hasExperimental}`);
  console.log(`  Detection result: ${webglInfo.detected ? '✓ SUPPORTED' : '✗ NOT SUPPORTED'}`);
  console.log(`  Map error shown: ${mapError > 0 ? 'YES' : 'NO'}`);
  console.log(`  MapLibre canvas: ${hasCanvas > 0 ? 'YES' : 'NO'}`);

  await browser.close();
  return webglInfo;
}

(async () => {
  console.log('Testing WebGL support...\n');

  const headlessResult = await testWebGL(true);
  const headfulResult = await testWebGL(false);

  console.log('\n' + '='.repeat(60));
  if (headlessResult.detected && headfulResult.detected) {
    console.log('✓ WebGL works in both modes');
  } else if (!headlessResult.detected && headfulResult.detected) {
    console.log('⚠ WebGL only works in headful mode (Playwright issue)');
  } else if (!headlessResult.detected && !headfulResult.detected) {
    console.log('✗ WebGL not supported in either mode (real browser issue)');
  }
})();
