# GeoWraith E2E Tests

Playwright smoke tests for critical user flows.

## Quick Start

```bash
# Install browsers (one-time)
npx playwright install

# Run all tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run only demo tests
npm run test:e2e:demo

# Debug mode
npm run test:e2e:debug
```

## Test Coverage

### Demo Page (`demo.spec.ts`)
- ✅ Page loads with workbench
- ✅ Mode switching (Replay ↔ Live)
- ✅ Scenario preloading
- ✅ Run prediction end-to-end
- ✅ Report export (PNG download)
- ✅ Map layers persistence
- ✅ Live readiness badge
- ✅ Mobile layout adaptation
- ✅ Error handling

## Required data-testid Attributes

Components need these attributes for tests to work:

```tsx
// DemoWorkbench.tsx
data-testid="demo-workbench"

// DemoStatusRail.tsx
data-testid="demo-status-rail"

// Mode selector
data-testid="mode-replay"
data-testid="mode-live"
data-testid="mode-selector"

// Scenario selector
data-testid="scenario-selector"
data-testid="scenario-preview"
data-testid="run-scenario-btn"

// Results
data-testid="results-panel"
data-testid="prediction-coords"
data-testid="confidence-badge"
data-testid="map-result"
data-testid="export-report-btn"
data-testid="export-menu"
data-testid="download-png-btn"

// Processing
data-testid="processing-indicator"

// Health/Live
data-testid="live-badge"
data-testid="health-badge"

// Map layers
data-testid="map-layers-btn"
data-testid="layers-panel"
data-testid="layer-satellite"
data-testid="map-style-dark"

// Mobile
data-testid="console-toggle"
```

## CI/CD Integration

```yaml
# .github/workflows/e2e.yml
- name: Run E2E tests
  run: npx playwright test
  env:
    CI: true
```

## Troubleshooting

**Tests fail with timeout:**
```bash
# Increase timeout
npx playwright test --timeout 60000
```

**Backend not ready:**
Ensure backend is running on :8080 before running tests.

**Update snapshots:**
```bash
npx playwright test --update-snapshots
```
