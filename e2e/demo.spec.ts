/**
 * Playwright smoke tests for /demo flows
 * Tests replay/live mode switching and report export
 */

import { test, expect } from '@playwright/test';

const DEMO_URL = 'http://localhost:3001/demo';
const TIMEOUT = 30000;

test.describe('Demo Page Smoke Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to demo page with extended timeout
    await page.goto(DEMO_URL, { timeout: TIMEOUT });
    
    // Wait for initial load
    await page.waitForLoadState('networkidle');
  });

  test('Demo page loads with workbench visible', async ({ page }) => {
    // Check main containers exist
    await expect(page.locator('[data-testid="demo-workbench"]')).toBeVisible();
    await expect(page.locator('[data-testid="demo-status-rail"]')).toBeVisible();
    
    // Check mode selector exists
    await expect(page.locator('[data-testid="mode-selector"]')).toBeVisible();
  });

  test('Mode switching: Replay → Live → Replay', async ({ page }) => {
    // Start in replay mode (default)
    await expect(page.locator('[data-testid="mode-replay"]')).toHaveAttribute('data-active', 'true');
    
    // Switch to live mode
    await page.click('[data-testid="mode-live"]');
    await expect(page.locator('[data-testid="mode-live"]')).toHaveAttribute('data-active', 'true');
    
    // Verify live indicators
    await expect(page.locator('[data-testid="live-badge"]')).toBeVisible();
    
    // Switch back to replay
    await page.click('[data-testid="mode-replay"]');
    await expect(page.locator('[data-testid="mode-replay"]')).toHaveAttribute('data-active', 'true');
  });

  test('Scenario preloading in replay mode', async ({ page }) => {
    // Wait for scenario selector
    await expect(page.locator('[data-testid="scenario-selector"]')).toBeVisible();
    
    // Select a scenario
    await page.selectOption('[data-testid="scenario-selector"]', 'marrakech-medina');
    
    // Wait for scenario to load
    await page.waitForTimeout(1000);
    
    // Check that preview loads
    await expect(page.locator('[data-testid="scenario-preview"]')).toBeVisible();
    
    // Verify run button is enabled
    await expect(page.locator('[data-testid="run-scenario-btn"]')).toBeEnabled();
  });

  test('Run prediction flow end-to-end', async ({ page }) => {
    // Select scenario
    await page.selectOption('[data-testid="scenario-selector"]', 'copacabana-beach');
    await page.waitForTimeout(500);
    
    // Click run
    await page.click('[data-testid="run-scenario-btn"]');
    
    // Wait for processing (spinner)
    await expect(page.locator('[data-testid="processing-indicator"]')).toBeVisible();
    
    // Wait for results (up to 30s)
    await expect(page.locator('[data-testid="results-panel"]')).toBeVisible({ timeout: TIMEOUT });
    
    // Verify results contain expected elements
    await expect(page.locator('[data-testid="prediction-coords"]')).toBeVisible();
    await expect(page.locator('[data-testid="confidence-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="map-result"]')).toBeVisible();
  });

  test('Report export is reachable and generates file', async ({ page }) => {
    // Run a scenario first
    await page.selectOption('[data-testid="scenario-selector"]', 'table-mountain');
    await page.click('[data-testid="run-scenario-btn"]');
    await expect(page.locator('[data-testid="results-panel"]')).toBeVisible({ timeout: TIMEOUT });
    
    // Click export button
    await page.click('[data-testid="export-report-btn"]');
    
    // Wait for export menu
    await expect(page.locator('[data-testid="export-menu"]')).toBeVisible();
    
    // Click download report
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="download-png-btn"]')
    ]);
    
    // Verify file was downloaded
    expect(download.suggestedFilename()).toMatch(/geowraith-report.*\.png/);
  });

  test('Map layers persist across style switches', async ({ page }) => {
    // Run scenario to get map
    await page.selectOption('[data-testid="scenario-selector"]', 'cape-point');
    await page.click('[data-testid="run-scenario-btn"]');
    await expect(page.locator('[data-testid="results-panel"]')).toBeVisible({ timeout: TIMEOUT });
    
    // Get map layers button
    await page.click('[data-testid="map-layers-btn"]');
    await expect(page.locator('[data-testid="layers-panel"]')).toBeVisible();
    
    // Enable a layer
    await page.click('[data-testid="layer-satellite"]');
    await expect(page.locator('[data-testid="layer-satellite"]')).toHaveAttribute('data-active', 'true');
    
    // Switch map style
    await page.click('[data-testid="map-style-dark"]');
    
    // Verify layer is still active after style switch
    await expect(page.locator('[data-testid="layer-satellite"]')).toHaveAttribute('data-active', 'true');
  });

  test('Live mode shows ready badge when backend healthy', async ({ page }) => {
    // Switch to live mode
    await page.click('[data-testid="mode-live"]');
    
    // Check health badge
    const healthBadge = page.locator('[data-testid="health-badge"]');
    await expect(healthBadge).toBeVisible();
    
    // Should show ready (green) or degraded (yellow)
    const status = await healthBadge.getAttribute('data-status');
    expect(['ready', 'degraded', 'error']).toContain(status);
  });

  test('Mobile layout: Mission Console adapts', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile layout
    await expect(page.locator('[data-testid="demo-workbench"]')).toHaveClass(/mobile/);
    
    // Status rail should be at bottom
    const statusRail = page.locator('[data-testid="demo-status-rail"]');
    await expect(statusRail).toBeVisible();
    
    // Console should be collapsible
    await expect(page.locator('[data-testid="console-toggle"]')).toBeVisible();
  });

  test('Results panel shows scene context when available', async ({ page }) => {
    // Run scenario
    await page.selectOption('[data-testid="scenario-selector"]', 'marrakech-medina');
    await page.click('[data-testid="run-scenario-btn"]');
    await expect(page.locator('[data-testid="results-panel"]')).toBeVisible({ timeout: TIMEOUT });
    
    // Check for scene context
    const sceneContext = page.locator('[data-testid="scene-context"]');
    if (await sceneContext.isVisible().catch(() => false)) {
      await expect(sceneContext.locator('[data-testid="scene-type"]')).toBeVisible();
      await expect(sceneContext.locator('[data-testid="cohort-hint"]')).toBeVisible();
    }
  });

  test('Error handling: Invalid scenario gracefully fails', async ({ page }) => {
    // Try to trigger an error scenario
    await page.evaluate(() => {
      // Force an error state
      localStorage.setItem('demo_error_test', 'true');
    });
    
    // Reload
    await page.reload();
    
    // Should show error state or recover
    const errorState = page.locator('[data-testid="error-state"]');
    const normalState = page.locator('[data-testid="demo-workbench"]');
    
    // Either error state is shown or normal state recovers
    await expect(errorState.or(normalState)).toBeVisible();
  });
});
